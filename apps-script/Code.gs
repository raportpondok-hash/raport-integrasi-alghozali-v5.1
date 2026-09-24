/**
 * =========================================================================
 * BACKEND SINKRONISASI RAPORT PONDOK PESANTREN AL-GHOZALI
 * =========================================================================
 * Skrip ini bertindak sebagai API server gratis di Google Drive Anda untuk
 * menghubungkan seluruh perangkat guru & admin ke Google Spreadsheet ini.
 * 
 * CARA DEPLOY:
 * 1. Klik menu "Deploy" di kanan atas -> "New deployment"
 * 2. Pilih type "Web app" (ikon globe/bola dunia)
 * 3. Description: "Raport Sync API"
 * 4. Execute as: "Me" (email Google Anda)
 * 5. Who has access: "Anyone" (Siapa saja)  <--- PENTING!
 * 6. Klik "Deploy" -> Beri izin ("Authorize access")
 * 7. Salin "Web app URL" dan tempel ke Aplikasi Raport Pondok.
 * =========================================================================
 */

function doGet(e) {
  // Root URL serves the V5 Web App shell; API GET requests keep using the same endpoint.
  var action = e && e.parameter ? String(e.parameter.action || '').trim() : '';
  if (!action) {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Raport Integrasi Al-Ghozali V5')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function getTargetSpreadsheet_(params) {
  var props = PropertiesService.getScriptProperties();
  var schoolType = String((params && (params.schoolType || params.school_type)) || 'mukim').toLowerCase();
  var unit = String((params && (params.unit || params.jenjang)) || 'SMP').toUpperCase();
  var classId = String((params && (params.classId || params.class_id)) || '').toLowerCase();

  var key;
  if (schoolType === 'fullday') {
    if (unit === 'SMP') {
      key = 'SPREADSHEET_SMP_FULL_DAY_ID';
    } else {
      // SMA Full Day dipisahkan berdasarkan program/tingkat.
      if (classId.indexOf('xi-ipa') === 0) key = 'SPREADSHEET_SMA_XI_IPA_FULL_DAY_ID';
      else if (classId.indexOf('xi-ips') === 0) key = 'SPREADSHEET_SMA_XI_IPS_FULL_DAY_ID';
      else if (classId.indexOf('xii-ipa') === 0) key = 'SPREADSHEET_SMA_XII_IPA_FULL_DAY_ID';
      else if (classId.indexOf('xii-ips') === 0) key = 'SPREADSHEET_SMA_XII_IPS_FULL_DAY_ID';
      else key = 'SPREADSHEET_SMA_X_FULL_DAY_ID';
    }
  } else if (unit === 'SMA') {
    key = 'SPREADSHEET_SMA_MUKIM_PONDOK_ID';
  } else {
    key = 'SPREADSHEET_SMP_PONDOK_ID';
  }

  var spreadsheetId = props.getProperty(key);
  if (!spreadsheetId) throw new Error('Spreadsheet belum dikonfigurasi untuk ' + schoolType + ' / ' + unit + ' / ' + classId + '. Set Script Property ' + key + '.');
  return SpreadsheetApp.openById(spreadsheetId);
}

function setRaportSpreadsheetProperties() {
  var props = PropertiesService.getScriptProperties();
  var required = ['SPREADSHEET_SMP_FULL_DAY_ID','SPREADSHEET_SMP_PONDOK_ID','SPREADSHEET_SMA_X_FULL_DAY_ID','SPREADSHEET_SMA_XI_IPA_FULL_DAY_ID','SPREADSHEET_SMA_XI_IPS_FULL_DAY_ID','SPREADSHEET_SMA_XII_IPA_FULL_DAY_ID','SPREADSHEET_SMA_XII_IPS_FULL_DAY_ID','SPREADSHEET_SMA_MUKIM_PONDOK_ID'];
  var missing = required.filter(function(key) { return !props.getProperty(key); });
  if (missing.length) throw new Error('Script Properties belum lengkap: ' + missing.join(', '));
  return 'Konfigurasi 8 spreadsheet lengkap.';
}

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  // Tunggu lock hingga 10 detik untuk mencegah race conditions saat banyak guru menyimpan bersamaan
  lock.tryLock(10000);
  
  try {
    var params = {};
    
    // Parse incoming JSON payload
    if (e && e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else if (e && e.parameter) {
      params = e.parameter;
    }
    
    var action = params.action || 'getAll';
    
    if (action === 'verifyAdmin') {
      var enteredPin = String(params.pin || '').trim();
      var configuredPin = PropertiesService.getScriptProperties().getProperty('ADMIN_PIN') || '';
      if (!configuredPin || !enteredPin) return jsonResponse({ status: 'error', success: false, message: 'PIN administrator belum dikonfigurasi.' });
      if (enteredPin !== configuredPin) {
        return jsonResponse({ status: 'success', success: false, timestamp: new Date().toISOString() });
      }
      var adminSessionToken = Utilities.getUuid();
      CacheService.getScriptCache().put('RAPORT_ADMIN_SESSION_' + adminSessionToken, '1', 21600);
      return jsonResponse({
        status: 'success',
        success: true,
        sessionToken: adminSessionToken,
        expiresInSeconds: 21600,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'aiAudit') return aiAuditData_(params);
    if (action === 'aiModels') return jsonResponse({status:'success',models:{fast:'openai/gpt-oss-20b',deep:'openai/gpt-oss-120b',safeguard:'openai/gpt-oss-safeguard-20b',speech:'whisper-large-v3',speechFast:'whisper-large-v3-turbo'}});

    // Semua operasi tulis ke Google Sheets wajib membawa sesi admin yang
    // diterbitkan setelah PIN diverifikasi di server. Guru/Wali tidak dapat
    // menulis hanya dengan memanipulasi tombol UI.
    var writeActions = ['initAllClasses'];
    if (writeActions.indexOf(action) >= 0) {
      var token = String(params.adminSessionToken || '').trim();
      var validSession = token && CacheService.getScriptCache().get('RAPORT_ADMIN_SESSION_' + token) === '1';
      if (!validSession) {
        return jsonResponse({
          status: 'error',
          code: 'ADMIN_SESSION_REQUIRED',
          message: 'Akses tulis Google Sheets hanya untuk Administrator yang telah login.'
        });
      }
    }

    var ss = getTargetSpreadsheet_(params);

    // 1. TES KONEKSI
    if (action === 'test') {
      return jsonResponse({
        status: 'success',
        message: 'Koneksi ke Google Spreadsheet berhasil!',
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        timestamp: new Date().toISOString()
      });
    }
    
    // 2. AMBIL SEMUA NILAI (PULL / GET ALL DARI SEMUA SHEET REKAP KELAS)
    if (action === 'getAll') {
      var allSheets = ss.getSheets();
      var studentsScores = {};
      var totalRowsRead = 0;
      var classSheetsRead = [];

      for (var s = 0; s < allSheets.length; s++) {
        var sh = allSheets[s];
        var shName = sh.getName();

        if (shName.toUpperCase() === 'REKAP NILAI') {
          var official = readRekapNilaiSheet_(sh);
          classSheetsRead.push(shName);
          totalRowsRead += official.rowCount || 0;
          Object.keys(official.studentsScores || {}).forEach(function(key) {
            if (!studentsScores[key]) studentsScores[key] = {};
            Object.keys(official.studentsScores[key]).forEach(function(subjectKey) {
              studentsScores[key][subjectKey] = official.studentsScores[key][subjectKey];
            });
          });
          continue;
        }

        if (shName.indexOf('Rekap_') !== 0) continue;
        var values = sh.getDataRange().getValues();
        if (values.length < 3) continue;
        classSheetsRead.push(shName);

        var mapelRowIndex = 1;
        var startDataRow = 2;
        var startCol = 5;
        if (values.length >= 6 && String(values[3][0] || '').trim().toUpperCase() === 'NO') {
          mapelRowIndex = 3;
          startDataRow = 5;
          startCol = 3;
        } else {
          for (var h = 0; h < Math.min(3, values.length); h++) {
            for (var c = 0; c < values[h].length; c++) {
              if (String(values[h][c] || '').trim().toUpperCase() === 'MATA PELAJARAN') {
                mapelRowIndex = h;
                startDataRow = h + 1;
                startCol = c + 1;
                break;
              }
            }
          }
        }

        var headerMapel = values[mapelRowIndex];
        var subjectCols = [];
        for (var col = startCol; col < headerMapel.length; col++) {
          var mapelName = String(headerMapel[col] || '').trim();
          if (mapelName && mapelName !== '-' && mapelName !== 'No' && mapelName !== 'NISN' && mapelName !== 'NAMA' && mapelName !== 'KELAS') {
            subjectCols.push({ colIndex: col, subjectName: mapelName });
          }
        }

        for (var r = startDataRow; r < values.length; r++) {
          var row = values[r];
          var nisn = String(row[1] || '').trim();
          var studentName = String(row[2] || '').trim();
          if (!studentName && !nisn) continue;

          var scoreMap = {};
          var hasAnyScore = false;
          for (var sc = 0; sc < subjectCols.length; sc++) {
            var info = subjectCols[sc];
            var rawVal = row[info.colIndex];
            if (rawVal !== '' && rawVal !== null && rawVal !== undefined && !isNaN(Number(rawVal))) {
              scoreMap[info.subjectName] = Number(rawVal);
              hasAnyScore = true;
            }
          }
          if (!hasAnyScore) continue;

          totalRowsRead++;
          if (nisn) {
            if (!studentsScores[nisn]) studentsScores[nisn] = {};
            Object.keys(scoreMap).forEach(function(k) { studentsScores[nisn][k] = scoreMap[k]; });
          }
          if (studentName) {
            var nk = studentName.toLowerCase();
            if (!studentsScores[nk]) studentsScores[nk] = {};
            Object.keys(scoreMap).forEach(function(k2) { studentsScores[nk][k2] = scoreMap[k2]; });
          }
        }
      }

      var rawSheet = ss.getSheetByName('Data_Nilai_Raport');
      if (rawSheet) {
        var rawData = rawSheet.getDataRange().getValues();
        for (var rw = 1; rw < rawData.length; rw++) {
          var rRow = rawData[rw];
          var sId = String(rRow[0] || '').trim();
          var sNisn = String(rRow[3] || '').trim();
          var sNameRaw = String(rRow[2] || '').trim().toLowerCase();
          var subId = String(rRow[4] || '').trim();
          var score = Number(rRow[5]);
          if (!isNaN(score) && sId && subId) {
            if (!studentsScores[sId]) studentsScores[sId] = {};
            if (studentsScores[sId][subId] === undefined) studentsScores[sId][subId] = score;
          }
          if (!isNaN(score) && sNisn && subId) {
            if (!studentsScores[sNisn]) studentsScores[sNisn] = {};
            if (studentsScores[sNisn][subId] === undefined) studentsScores[sNisn][subId] = score;
          }
          if (!isNaN(score) && sNameRaw && subId) {
            if (!studentsScores[sNameRaw]) studentsScores[sNameRaw] = {};
            if (studentsScores[sNameRaw][subId] === undefined) studentsScores[sNameRaw][subId] = score;
          }
        }
      }

      return jsonResponse({
        status: 'success',
        studentsScores: studentsScores,
        classSheetsCount: classSheetsRead.length,
        classSheets: classSheetsRead,
        rowCount: totalRowsRead,
        timestamp: new Date().toISOString()
      });
    }

    // 3. SIMPAN SATU NILAI REAL-TIME (LANGSUNG TERTULIS KE SHEET KELAS & MASTER)
    if (action === 'updateScore') {
      var studentId = String(params.studentId || '').trim();
      var subjectId = String(params.subjectId || '').trim();
      var subjectName = String(params.subjectName || subjectId).trim();
      var classId = String(params.classId || '').trim();
      var className = String(params.className || classId).trim();
      var studentName = String(params.studentName || '').trim();
      var teacherName = String(params.teacherName || '-').trim();
      var nisn = String(params.nisn || '').trim();
      var studentNo = Number(params.studentNo || 0);
      var score = Number(params.score || 0);
      var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

      var officialRekap = ss.getSheetByName('REKAP NILAI');
      if (officialRekap) {
        writeOfficialRekapNilai_(officialRekap, {
          studentId: studentId,
          studentNo: studentNo,
          classId: classId,
          className: className,
          studentName: studentName,
          nisn: nisn,
          subjectId: subjectId,
          subjectName: subjectName,
          score: score
        });
      } else if (className || classId) {
        updateClassRekapSheet(ss, classId, className, subjectId, subjectName, teacherName, '', [{
          studentId: studentId,
          classId: classId,
          studentName: studentName,
          nisn: nisn,
          subjectId: subjectId,
          score: score
        }], now);
      }

      // Backup ke database raw
      var sheet = getOrCreateScoresSheet(ss);
      var data = sheet.getDataRange().getValues();
      var foundIndex = -1;

      for (var j = 1; j < data.length; j++) {
        if (String(data[j][0]).trim() === studentId && String(data[j][4]).trim() === subjectId) {
          foundIndex = j + 1;
          break;
        }
      }

      if (foundIndex > 0) {
        sheet.getRange(foundIndex, 6).setValue(score);
        sheet.getRange(foundIndex, 7).setValue(now);
      } else if (studentId && subjectId) {
        sheet.appendRow([studentId, classId, studentName, nisn, subjectId, score, now]);
      }

      return jsonResponse({
        status: 'success',
        message: 'Nilai berhasil langsung disimpan ke Sheet Kelas & Spreadsheet',
        studentId: studentId,
        subjectId: subjectId,
        score: score,
        updatedAt: now
      });
    }
    
    // 4. SIMPAN NILAI SATU MAPEL (UPDATE SHEET REKAP KELAS, DASHBOARD MONITORING, & DATA RAW)
    if (action === 'saveSubjectScores') {
      var items = params.items || [];
      var classId = String(params.classId || (items[0] && items[0].classId) || '').trim();
      var className = String(params.className || classId);
      var subjectId = String(params.subjectId || (items[0] && items[0].subjectId) || '').trim();
      var subjectName = String(params.subjectName || subjectId);
      var teacherName = String(params.teacherName || '-');
      var waliKelas = String(params.waliKelas || '-');
      var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
      
      // A. Simpan ke database raw (Data_Nilai_Raport) untuk pembacaan aplikasi
      updateRawScoresSheet(ss, items, now);

      // B. Jika format resmi REKAP NILAI tersedia, tulis langsung ke kolom
      //    mapel resmi. Ini menjadi sumber tampilan rekap utama.
      var officialRekap = ss.getSheetByName('REKAP NILAI');
      if (officialRekap) {
        for (var oi = 0; oi < items.length; oi++) {
          var officialItem = items[oi] || {};
          writeOfficialRekapNilai_(officialRekap, {
            studentId: String(officialItem.studentId || '').trim(),
            studentNo: Number(officialItem.studentNo || 0),
            classId: String(officialItem.classId || classId).trim(),
            className: String(officialItem.className || className).trim(),
            studentName: String(officialItem.studentName || '').trim(),
            nisn: String(officialItem.nisn || '').trim(),
            subjectId: String(officialItem.subjectId || subjectId).trim(),
            subjectName: String(officialItem.subjectName || subjectName).trim(),
            score: Number(officialItem.score || 0)
          });
        }
      } else {
        // B. Fallback untuk spreadsheet lama yang masih memakai Rekap_<kelas>.
        updateClassRekapSheet(ss, classId, className, subjectId, subjectName, teacherName, waliKelas, items, now);
      }
      
      // C. Update Dashboard Monitoring Guru & Nilai (Dashboard_Monitoring)
      var gradedCount = 0;
      for (var g = 0; g < items.length; g++) {
        if (Number(items[g].score) > 0) gradedCount++;
      }
      updateDashboardMonitoring(ss, classId, className, subjectId, subjectName, teacherName, items.length, gradedCount, now);
      
      return jsonResponse({
        status: 'success',
        message: 'Berhasil menyimpan ' + items.length + ' nilai ke Sheet Rekap ' + className + ' & Dashboard Monitoring!',
        updatedCount: items.length,
        timestamp: new Date().toISOString()
      });
    }

    // 5. INISIALISASI MASSAL SELURUH SHEET REKAP KELAS & DASHBOARD (UNTUK ADMIN)
    if (action === 'initAllClasses') {
      var classesList = params.classes || [];
      initFullSpreadsheetStructure(ss, classesList);
      return jsonResponse({
        status: 'success',
        message: 'Berhasil membuat dan memformat seluruh Sheet Rekap Kelas dan Dashboard Monitoring!',
        timestamp: new Date().toISOString()
      });
    }

    // 6. SINKRONISASI MASSAL SEMUA NILAI (PUSH ALL)
    if (action === 'batchSync') {
      var sheet = getOrCreateScoresSheet(ss);
      var items = params.items || [];
      var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
      
      sheet.clearContents();
      sheet.appendRow(['ID Santri', 'ID Kelas', 'Nama Lengkap', 'NISN', 'ID Mapel', 'Nilai Angka', 'Terakhir Diperbarui']);
      
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setBackground('#174D3A');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setFontWeight('bold');
      
      var rowsToAppend = [];
      for (var k = 0; k < items.length; k++) {
        var it = items[k];
        rowsToAppend.push([
          String(it.studentId || ''),
          String(it.classId || ''),
          String(it.studentName || ''),
          String(it.nisn || ''),
          String(it.subjectId || ''),
          Number(it.score || 0),
          now
        ]);
      }
      
      if (rowsToAppend.length > 0) {
        sheet.getRange(2, 1, rowsToAppend.length, 7).setValues(rowsToAppend);
      }
      
      return jsonResponse({
        status: 'success',
        message: 'Berhasil menyinkronkan ' + rowsToAppend.length + ' data nilai ke Google Spreadsheet!',
        syncedCount: rowsToAppend.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // 6A. AMBIL DATA SIKAP
    if (action === 'getSikap') {
      var sikapSheet = ss.getSheetByName('Data_Sikap');
      var sikapData = {};
      if (sikapSheet) {
        var sikapValues = sikapSheet.getDataRange().getValues();
        for (var sr = 1; sr < sikapValues.length; sr++) {
          var sRow = sikapValues[sr];
          var sid = String(sRow[0] || '').trim();
          var sclass = String(sRow[1] || '').trim();
          var sval = String(sRow[4] || '').trim();
          if (sid) sikapData[sid] = { classId: sclass, sikap: sval };
        }
      }
      return jsonResponse({ status: 'success', sikap: sikapData, timestamp: new Date().toISOString() });
    }

    // 6B. SIMPAN SIKAP MASSAL
    if (action === 'saveSikap') {
      var sikapItems = params.items || [];
      var sikapSheet = ss.getSheetByName('Data_Sikap');
      if (!sikapSheet) {
        sikapSheet = ss.insertSheet('Data_Sikap');
        sikapSheet.appendRow(['ID Siswa', 'ID Kelas', 'Nama Lengkap', 'NISN', 'Sikap', 'Terakhir Diperbarui']);
        sikapSheet.getRange(1, 1, 1, 6).setBackground('#174D3A').setFontColor('#FFFFFF').setFontWeight('bold');
      }
      var sikapNow = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
      var sikapRows = sikapSheet.getDataRange().getValues();
      var sikapRowMap = {};
      for (var si = 1; si < sikapRows.length; si++) {
        sikapRowMap[String(sikapRows[si][0] || '').trim()] = si + 1;
      }
      for (var sj = 0; sj < sikapItems.length; sj++) {
        var item = sikapItems[sj];
        var itemId = String(item.studentId || '').trim();
        if (!itemId) continue;
        var rowData = [
          itemId,
          String(item.classId || '').trim(),
          String(item.studentName || '').trim(),
          String(item.nisn || '').trim(),
          String(item.sikap || '').trim(),
          sikapNow
        ];
        if (sikapRowMap[itemId]) {
          sikapSheet.getRange(sikapRowMap[itemId], 1, 1, 6).setValues([rowData]);
        } else {
          sikapSheet.appendRow(rowData);
        }
      }
      return jsonResponse({
        status: 'success',
        message: 'Sikap berhasil disimpan ke Google Spreadsheet',
        updatedCount: sikapItems.length,
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ status: 'error', message: 'Action tidak dikenal: ' + action });
    
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// =========================================================================
// FUNGSI-FUNGSI PENDUKUNG SHEET REKAP KELAS & DASHBOARD MONITORING
// =========================================================================

function sanitizeSheetName(name) {
  return String(name || 'Kelas').replace(/[\\/?*[\\]]/g, '_').substring(0, 30);
}

function normalizeRekapSubjectKey_(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function resolveRekapSubjectColumn_(headers, subjectId, subjectName) {
  var aliases = {};
  function addAlias(name, target) { aliases[normalizeRekapSubjectKey_(name)] = target; }

  addAlias('PAI', 'PAI');
  addAlias('Pendidikan Agama Islam', 'PAI');
  addAlias('PANCASILA', 'PANCASILA');
  addAlias('Pendidikan Pancasila', 'PANCASILA');
  addAlias('INDO', 'INDO');
  addAlias('Bahasa Indonesia', 'INDO');
  addAlias('MTK', 'MTK');
  addAlias('Matematika', 'MTK');
  addAlias('SEJ', 'SEJ');
  addAlias('Sejarah', 'SEJ');
  addAlias('INGGRIS', 'INGGRIS');
  addAlias('Bahasa Inggris', 'INGGRIS');
  addAlias('FISIKA', 'FISIKA');
  addAlias('KIMIA', 'KIMIA');
  addAlias('BIOLOGI', 'BIOLOGI');
  addAlias('EKO', 'EKO');
  addAlias('Ekonomi', 'EKO');
  addAlias('GEO', 'GEO');
  addAlias('Geografi', 'GEO');
  addAlias('SOSIO', 'SOSIO');
  addAlias('Sosiologi', 'SOSIO');
  addAlias('PJOK', 'PJOK');
  addAlias('SBY/PKWU', 'SBY/PKWU');
  addAlias('PKWU', 'SBY/PKWU');
  addAlias('Prakarya', 'SBY/PKWU');
  addAlias('SUNDA', 'SUNDA');
  addAlias('Bahasa Sunda', 'SUNDA');
  addAlias('INFORM', 'INFORM');
  addAlias('Informatika', 'INFORM');
  addAlias('AL-QURAN', 'AL-QURAN');
  addAlias('Al Quran', 'AL-QURAN');
  addAlias('Al-Quran', 'AL-QURAN');
  addAlias('HADIS', 'HADIS');
  addAlias('Hadits', 'HADIS');
  addAlias('FIKIH', 'FIKIH');
  addAlias('Fiqih', 'FIKIH');
  addAlias('B.ARAB', 'B.ARAB');
  addAlias('Bahasa Arab', 'B.ARAB');
  addAlias('TAHFIDZ', 'TAHFIDZ');

  var candidates = [subjectName, subjectId];
  for (var i = 0; i < candidates.length; i++) {
    var candidateKey = normalizeRekapSubjectKey_(candidates[i]);
    var canonical = aliases[candidateKey] || candidateKey;
    for (var c = 0; c < headers.length; c++) {
      var headerKey = normalizeRekapSubjectKey_(headers[c]);
      if (headerKey && (headerKey === candidateKey || headerKey === canonical)) return c + 1;
    }
  }
  return -1;
}

function findOfficialRekapStudentRow_(values, studentNo, studentName, nisn) {
  var wantedNo = Number(studentNo || 0);
  var wantedName = String(studentName || '').trim().toLowerCase();
  var wantedNisn = String(nisn || '').trim();

  for (var r = 10; r < values.length; r++) {
    var row = values[r];
    var rowName = String(row[1] || '').trim().toLowerCase();
    var rowNis = String(row[2] || '').trim();
    if (wantedNisn && rowNis && rowNis === wantedNisn) return r + 1;
    if (wantedName && rowName && rowName === wantedName) return r + 1;
  }

  if (wantedNo > 0) {
    for (var n = 10; n < values.length; n++) {
      if (Number(values[n][0]) === wantedNo) return n + 1;
    }
  }

  for (var e = 10; e < values.length; e++) {
    if (!String(values[e][1] || '').trim() && !String(values[e][2] || '').trim()) return e + 1;
  }
  return -1;
}

function ensureOfficialRekapNilaiStructure_(sheet, className) {
  var requiredHeaders = [
    'No','Nama Siswa','NIS',
    'PAI','PANCASILA','INDO','MTK','SEJ','INGGRIS','FISIKA','KIMIA','BIOLOGI',
    'EKO','GEO','SOSIO','PJOK','SBY/PKWU','SUNDA','INFORM','AL-QURAN','HADIS',
    'FIKIH','B.ARAB','TAHFIDZ',
    'Jumlah Nilai Total','Rata-Rata','Ranking',
    'Kerapihan','Kedisiplinan','Kejujuran','Sakit','Izin','Alpa'
  ];

  var values = sheet.getDataRange().getValues();
  var hasOfficialHeader = values.length >= 10 &&
    String(values[9][0] || '').trim().toLowerCase() === 'no' &&
    String(values[9][1] || '').trim().toLowerCase() === 'nama siswa';

  var trulyEmpty = values.length === 1 && values[0].length === 1 && String(values[0][0] || '').trim() === '';

  if (!hasOfficialHeader && !trulyEmpty) {
    throw new Error('Sheet REKAP NILAI memiliki format yang belum dikenali. Data tidak dihapus; periksa header pada baris 10.');
  }

  if (trulyEmpty) {
    sheet.clear();
    sheet.getRange(1, 1).setValue('REKAPITULASI NILAI PESERTA DIDIK');
    sheet.getRange(2, 1).setValue('ASESMEN TENGAH SEMESTER GANJIL');
    sheet.getRange(4, 1).setValue('Sekolah:');
    sheet.getRange(4, 2).setValue('SMA ISLAM AL-GHOZALI');
    sheet.getRange(5, 1).setValue('Kelas:');
    sheet.getRange(5, 2).setValue(className || '');
    sheet.getRange(6, 1).setValue('Tahun Pelajaran:');
    sheet.getRange(6, 2).setValue('2026-2027');
    sheet.getRange(10, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.getRange(10, 1, 1, requiredHeaders.length)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(10);
  }

  // Sediakan cukup baris data untuk roster yang akan dikirim.
  var lastRow = Math.max(sheet.getLastRow(), 10);
  if (lastRow < 40) {
    sheet.insertRowsAfter(lastRow, 40 - lastRow);
  }
  return sheet.getDataRange().getValues();
}

function writeOfficialRekapNilai_(sheet, item) {
  var values = ensureOfficialRekapNilaiStructure_(sheet, item.className || item.classId || '');
  if (values.length < 11) throw new Error('Sheet REKAP NILAI gagal disiapkan.');

  var headers = values[9];
  var subjectCol = resolveRekapSubjectColumn_(headers, item.subjectId, item.subjectName);
  if (subjectCol < 4 || subjectCol > 24) {
    throw new Error('Mapel "' + (item.subjectName || item.subjectId) + '" tidak ditemukan pada kolom mapel REKAP NILAI.');
  }

  var targetRow = findOfficialRekapStudentRow_(values, item.studentNo, item.studentName, item.nisn);
  if (targetRow < 11) throw new Error('Baris siswa untuk "' + item.studentName + '" tidak ditemukan di REKAP NILAI.');

  var currentName = String(sheet.getRange(targetRow, 2).getValue() || '').trim();
  var currentNis = String(sheet.getRange(targetRow, 3).getValue() || '').trim();
  if (!currentName && item.studentName) sheet.getRange(targetRow, 2).setValue(item.studentName);
  if (!currentNis && item.nisn) sheet.getRange(targetRow, 3).setValue(item.nisn);
  if (!currentName && !item.studentName && item.studentNo) {
    sheet.getRange(targetRow, 1).setValue(Number(item.studentNo));
  }
  if (item.studentNo) sheet.getRange(targetRow, 1).setValue(Number(item.studentNo));

  sheet.getRange(targetRow, subjectCol).setValue(Number(item.score));

  var scoreValues = sheet.getRange(targetRow, 4, 1, 21).getValues()[0];
  var numericScores = scoreValues.filter(function(v) {
    return v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
  }).map(function(v) { return Number(v); });

  var total = numericScores.reduce(function(sum, v) { return sum + v; }, 0);
  var average = numericScores.length ? total / numericScores.length : '';
  sheet.getRange(targetRow, 25).setValue(numericScores.length ? total : '');
  sheet.getRange(targetRow, 26).setValue(average === '' ? '' : Number(average.toFixed(2)));

  var allValues = sheet.getDataRange().getValues();
  var averages = [];
  for (var rr = 10; rr < allValues.length; rr++) {
    var rowScores = allValues[rr].slice(3, 24);
    var nums = rowScores.filter(function(v) {
      return v !== '' && v !== null && v !== undefined && !isNaN(Number(v));
    }).map(function(v) { return Number(v); });
    if (nums.length) {
      averages.push({ row: rr + 1, average: nums.reduce(function(a, b) { return a + b; }, 0) / nums.length });
    }
  }
  averages.sort(function(a, b) { return b.average - a.average; });
  for (var ri = 0; ri < averages.length; ri++) sheet.getRange(averages[ri].row, 27).setValue(ri + 1);

  SpreadsheetApp.flush();
}

function readRekapNilaiSheet_(sheet) {
  var values = sheet.getDataRange().getValues();
  var result = { studentsScores: {}, rowCount: 0, sheetName: sheet.getName() };
  if (values.length < 11) return result;

  var headers = values[9];
  var subjectColumns = {};
  for (var c = 3; c < Math.min(24, headers.length); c++) {
    var header = String(headers[c] || '').trim();
    if (header) subjectColumns[c] = header;
  }

  for (var r = 10; r < values.length; r++) {
    var row = values[r];
    var studentName = String(row[1] || '').trim();
    var nisn = String(row[2] || '').trim();
    if (!studentName && !nisn) continue;

    var scoreMap = {};
    var hasScore = false;
    Object.keys(subjectColumns).forEach(function(colKey) {
      var colIndex = Number(colKey);
      var raw = row[colIndex];
      if (raw !== '' && raw !== null && raw !== undefined && !isNaN(Number(raw))) {
        scoreMap[subjectColumns[colIndex]] = Number(raw);
        hasScore = true;
      }
    });
    if (!hasScore) continue;

    result.rowCount++;
    if (nisn) {
      if (!result.studentsScores[nisn]) result.studentsScores[nisn] = {};
      Object.keys(scoreMap).forEach(function(subject) { result.studentsScores[nisn][subject] = scoreMap[subject]; });
    }
    if (studentName) {
      var nameKey = studentName.toLowerCase();
      if (!result.studentsScores[nameKey]) result.studentsScores[nameKey] = {};
      Object.keys(scoreMap).forEach(function(subject2) { result.studentsScores[nameKey][subject2] = scoreMap[subject2]; });
    }
  }
  return result;
}

function updateRawScoresSheet(ss, items, now) {
  var sheet = getOrCreateScoresSheet(ss);
  var data = sheet.getDataRange().getValues();
  var rowIndexMap = {};
  for (var r = 1; r < data.length; r++) {
    var key = String(data[r][0]).trim() + '_' + String(data[r][4]).trim();
    rowIndexMap[key] = r + 1;
  }
  
  var toAppend = [];
  for (var m = 0; m < items.length; m++) {
    var itm = items[m];
    var sId = String(itm.studentId || '').trim();
    var subId = String(itm.subjectId || '').trim();
    var cId = String(itm.classId || '').trim();
    var sName = String(itm.studentName || '').trim();
    var sNisn = String(itm.nisn || '').trim();
    var sc = Number(itm.score || 0);
    var k = sId + '_' + subId;
    
    if (rowIndexMap[k]) {
      sheet.getRange(rowIndexMap[k], 6).setValue(sc);
      sheet.getRange(rowIndexMap[k], 7).setValue(now);
    } else if (sId && subId) {
      toAppend.push([sId, cId, sName, sNisn, subId, sc, now]);
    }
  }
  
  if (toAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, 7).setValues(toAppend);
  }
}

function updateClassRekapSheet(ss, classId, className, subjectId, subjectName, teacherName, waliKelas, items, now) {
  var cleanName = sanitizeSheetName(className || classId);
  var sheetName = 'Rekap_' + cleanName;
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    setupNewClassSheet(sheet, className, subjectName, teacherName, items);
  } else {
    updateSheetScoresByMapel(sheet, className, subjectName, teacherName, items);
  }
  
  // Juga update sheet master Rekap_Semua_Santri jika ada
  var masterSheet = ss.getSheetByName('Rekap_Semua_Santri');
  if (masterSheet) {
    updateSheetScoresByMapel(masterSheet, className, subjectName, teacherName, items);
  }
}

function updateSheetScoresByMapel(sheet, className, subjectName, teacherName, items) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    setupNewClassSheet(sheet, className, subjectName, teacherName, items);
    return;
  }
  
  // Baris 2 (index 1) adalah baris MATA PELAJARAN (mulai Kolom F / index 5)
  var row2 = data[1];
  var subCol = -1;
  for (var c = 5; c < row2.length; c++) {
    var colName = String(row2[c] || '').trim();
    var colNorm = colName.toLowerCase();
    var subjectNorm = subjectName.toLowerCase();
    if (colNorm === subjectNorm || colNorm.indexOf(subjectNorm) !== -1 || subjectNorm.indexOf(colNorm) !== -1) {
      subCol = c + 1; // 1-indexed
      break;
    }
  }
  
  // Jika kolom belum ada, tambahkan kolom baru di sebelah kolom terakhir
  if (subCol === -1) {
    subCol = Math.max(6, sheet.getLastColumn() + 1);
    sheet.getRange(1, subCol).setValue(teacherName || '-').setFontWeight('bold').setBackground('#F1F5F9').setFontColor('#0F172A').setHorizontalAlignment('center');
    sheet.getRange(2, subCol).setValue(subjectName).setFontWeight('bold').setBackground('#CBD5E1').setFontColor('#0F172A').setHorizontalAlignment('center');
    sheet.setColumnWidth(subCol, 120);
  } else {
    if (teacherName && teacherName !== '-') {
      sheet.getRange(1, subCol).setValue(teacherName).setFontWeight('bold').setBackground('#F1F5F9').setFontColor('#0F172A').setHorizontalAlignment('center');
    }
  }
  
  // Petakan baris santri: Kolom B (index 1) = NISN, Kolom C (index 2) = NAMA
  var studentRowMap = {};
  for (var r = 2; r < data.length; r++) { // baris 3 ke bawah
    var nisn = String(data[r][1] || '').trim();
    var name = String(data[r][2] || '').trim().toLowerCase();
    if (nisn) studentRowMap[nisn] = r + 1;
    if (name) studentRowMap[name] = r + 1;
  }
  
  // Update nilai
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var targetRow = studentRowMap[String(it.nisn).trim()] || studentRowMap[String(it.studentName).trim().toLowerCase()];
    if (targetRow) {
      sheet.getRange(targetRow, subCol).setValue(Number(it.score) || 0).setHorizontalAlignment('center').setFontWeight('bold');
    }
  }
}

function setupNewClassSheet(sheet, className, subjectName, teacherName, items) {
  sheet.clear();
  
  // Baris 1: Header Guru (Sesuai Contoh Format Pengguna)
  // [NO, NISN, NAMA, KELAS, NAMA GURU, Guru 1, Guru 2, ...]
  var row1 = ["NO", "NISN", "NAMA", "KELAS", "NAMA GURU", teacherName || "-"];
  // Baris 2: Header Mapel
  // [, , , , MATA PELAJARAN, Mapel 1, Mapel 2, ...]
  var row2 = ["", "", "", "", "MATA PELAJARAN", subjectName || "-"];
  
  sheet.getRange(1, 1, 1, row1.length).setValues([row1])
    .setFontWeight("bold").setBackground("#174D3A").setFontColor("#FFFFFF").setHorizontalAlignment("center");
  sheet.getRange(1, 5).setBackground("#1F6B4F").setFontColor("#FFFFFF");
  sheet.getRange(1, 6, 1, row1.length - 5).setBackground("#F1F5F9").setFontColor("#0F172A");
  
  sheet.getRange(2, 1, 1, row2.length).setValues([row2])
    .setFontWeight("bold").setBackground("#174D3A").setFontColor("#FFFFFF").setHorizontalAlignment("center");
  sheet.getRange(2, 5).setBackground("#1F6B4F").setFontColor("#FFFFFF");
  sheet.getRange(2, 6, 1, row2.length - 5).setBackground("#CBD5E1").setFontColor("#0F172A");
  
  // Baris 3+: Data Santri
  var rows = [];
  for (var i = 0; i < items.length; i++) {
    rows.push([
      i + 1,
      String(items[i].nisn || "-"),
      String(items[i].studentName || "-"),
      String(items[i].classId || className || "-"),
      "",
      Number(items[i].score || 0)
    ]);
  }
  
  if (rows.length > 0) {
    sheet.getRange(3, 1, rows.length, 6).setValues(rows);
    sheet.getRange(3, 1, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(3, 2, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(3, 4, rows.length, 1).setHorizontalAlignment("center");
    sheet.getRange(3, 6, rows.length, 1).setHorizontalAlignment("center").setFontWeight("bold");
  }
  
  sheet.setColumnWidth(1, 45);  // NO
  sheet.setColumnWidth(2, 120); // NISN
  sheet.setColumnWidth(3, 240); // NAMA
  sheet.setColumnWidth(4, 75);  // KELAS
  sheet.setColumnWidth(5, 140); // NAMA GURU / MATA PELAJARAN
  sheet.setColumnWidth(6, 120); // NILAI
  sheet.setFrozenRows(2);
}

function updateDashboardMonitoring(ss, classId, className, subjectId, subjectName, teacherName, totalStudents, gradedStudents, now) {
  var sheet = ss.getSheetByName('Dashboard_Monitoring');
  if (!sheet) {
    sheet = ss.insertSheet('Dashboard_Monitoring', 0);
    sheet.appendRow(['No', 'Kelas', 'Mata Pelajaran', 'Guru Pengampu', 'Total Santri', 'Santri Terisi', 'Status Nilai', 'Terakhir Disimpan']);
    var hRange = sheet.getRange(1, 1, 1, 8);
    hRange.setBackground('#174D3A').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
  
  var data = sheet.getDataRange().getValues();
  var foundRow = -1;
  
  for (var r = 1; r < data.length; r++) {
    var cName = String(data[r][1] || '').trim();
    var sName = String(data[r][2] || '').trim();
    if ((cName === className || cName === classId) && (sName === subjectName || sName === subjectId)) {
      foundRow = r + 1;
      break;
    }
  }
  
  var statusText = '🔴 Belum Diisi (0/' + totalStudents + ')';
  var statusBg = '#FEE2E2';
  var statusColor = '#991B1B';
  
  if (gradedStudents >= totalStudents && totalStudents > 0) {
    statusText = '🟢 Sudah Lengkap (' + gradedStudents + '/' + totalStudents + ')';
    statusBg = '#DCFCE7';
    statusColor = '#166534';
  } else if (gradedStudents > 0) {
    statusText = '🟡 Sebagian (' + gradedStudents + '/' + totalStudents + ')';
    statusBg = '#FEF3C7';
    statusColor = '#92400E';
  }
  
  if (foundRow > 0) {
    sheet.getRange(foundRow, 4).setValue(teacherName || '-');
    sheet.getRange(foundRow, 5).setValue(totalStudents);
    sheet.getRange(foundRow, 6).setValue(gradedStudents);
    sheet.getRange(foundRow, 7).setValue(statusText).setBackground(statusBg).setFontColor(statusColor).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(foundRow, 8).setValue(now).setHorizontalAlignment('center');
  } else {
    var nextNo = Math.max(1, data.length);
    sheet.appendRow([nextNo, className, subjectName, teacherName || '-', totalStudents, gradedStudents, statusText, now]);
    var newRow = sheet.getLastRow();
    sheet.getRange(newRow, 7).setBackground(statusBg).setFontColor(statusColor).setFontWeight('bold').setHorizontalAlignment('center');
    sheet.getRange(newRow, 8).setHorizontalAlignment('center');
  }
  
  sheet.setColumnWidth(1, 45);
  sheet.setColumnWidth(2, 130);
  sheet.setColumnWidth(3, 190);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(5, 95);
  sheet.setColumnWidth(6, 95);
  sheet.setColumnWidth(7, 190);
  sheet.setColumnWidth(8, 150);
}

function initFullSpreadsheetStructure(ss, classesList) {
  // 1. Dashboard_Monitoring
  var dashSheet = ss.getSheetByName('Dashboard_Monitoring');
  if (!dashSheet) {
    dashSheet = ss.insertSheet('Dashboard_Monitoring', 0);
  } else {
    dashSheet.clear();
  }
  
  dashSheet.appendRow(['No', 'Kelas', 'Mata Pelajaran', 'Guru Pengampu', 'Total Santri', 'Santri Terisi', 'Status Nilai', 'Terakhir Disimpan']);
  dashSheet.getRange(1, 1, 1, 8).setBackground('#174D3A').setFontColor('#FFFFFF').setFontWeight('bold').setHorizontalAlignment('center');
  dashSheet.setFrozenRows(1);
  
  var dashRows = [];
  var rowNo = 1;
  var now = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  
  // Kumpulkan semua mata pelajaran unik & guru untuk Sheet Master Rekap_Semua_Santri
  var allUniqueSubjects = [];
  var uniqueSubjectMap = {};
  
  for (var c0 = 0; c0 < classesList.length; c0++) {
    var cSubs = classesList[c0].subjects || [];
    for (var s0 = 0; s0 < cSubs.length; s0++) {
      var sItem = cSubs[s0];
      var sNameId = sItem.nameId || sItem.name;
      if (!uniqueSubjectMap[sNameId]) {
        uniqueSubjectMap[sNameId] = sItem.teacherName || '-';
        allUniqueSubjects.push({
          id: sItem.id,
          nameId: sNameId,
          teacherName: sItem.teacherName || '-'
        });
      }
    }
  }
  
  // 2. Buat Sheet Rekap per-Kelas (sesuai contoh format pengguna)
  for (var c = 0; c < classesList.length; c++) {
    var cls = classesList[c];
    var cName = cls.nameLatin || cls.id;
    var students = cls.students || [];
    var subjects = cls.subjects || [];
    
    var cleanSheetName = sanitizeSheetName(cName);
    var shName = 'Rekap_' + cleanSheetName;
    var cSheet = ss.getSheetByName(shName);
    if (!cSheet) {
      cSheet = ss.insertSheet(shName);
    } else {
      cSheet.clear();
    }
    
    // Baris 1: [NO, NISN, NAMA, KELAS, NAMA GURU, Guru 1, Guru 2, ...]
    var row1Vals = ["NO", "NISN", "NAMA", "KELAS", "NAMA GURU"];
    // Baris 2: [, , , , MATA PELAJARAN, Mapel 1, Mapel 2, ...]
    var row2Vals = ["", "", "", "", "MATA PELAJARAN"];
    
    var subjectGradedCounts = {};
    for (var s = 0; s < subjects.length; s++) {
      var sub = subjects[s];
      var sName = sub.nameId || sub.name;
      row1Vals.push(sub.teacherName || "-");
      row2Vals.push(sName);
      subjectGradedCounts[sub.id] = 0;
      if (sName !== sub.id) subjectGradedCounts[sName] = 0;
    }
    
    cSheet.getRange(1, 1, 1, row1Vals.length).setValues([row1Vals])
      .setFontWeight("bold").setBackground("#174D3A").setFontColor("#FFFFFF").setHorizontalAlignment("center");
    cSheet.getRange(1, 5).setBackground("#1F6B4F").setFontColor("#FFFFFF");
    if (row1Vals.length > 5) {
      cSheet.getRange(1, 6, 1, row1Vals.length - 5).setBackground("#F1F5F9").setFontColor("#0F172A");
    }
    
    cSheet.getRange(2, 1, 1, row2Vals.length).setValues([row2Vals])
      .setFontWeight("bold").setBackground("#174D3A").setFontColor("#FFFFFF").setHorizontalAlignment("center");
    cSheet.getRange(2, 5).setBackground("#1F6B4F").setFontColor("#FFFFFF");
    if (row2Vals.length > 5) {
      cSheet.getRange(2, 6, 1, row2Vals.length - 5).setBackground("#CBD5E1").setFontColor("#0F172A");
    }
    
    // Baris 3+: Data Santri
    var sRows = [];
    for (var st = 0; st < students.length; st++) {
      var sObj = students[st];
      var sRow = [st + 1, sObj.nisn || "-", sObj.name || "-", cName, ""];
      for (var sb = 0; sb < subjects.length; sb++) {
        var subId = subjects[sb].id;
        var subName = subjects[sb].nameId || subjects[sb].name;
        var sc = "";
        if (sObj.scores) {
          if (sObj.scores[subId] !== undefined && sObj.scores[subId] !== "" && !isNaN(Number(sObj.scores[subId]))) {
            sc = Number(sObj.scores[subId]);
          } else if (sObj.scores[subName] !== undefined && sObj.scores[subName] !== "" && !isNaN(Number(sObj.scores[subName]))) {
            sc = Number(sObj.scores[subName]);
          }
        }
        if (sc !== "" && Number(sc) > 0) {
          subjectGradedCounts[subId] = (subjectGradedCounts[subId] || 0) + 1;
        }
        sRow.push(sc);
      }
      sRows.push(sRow);
    }
    
    if (sRows.length > 0) {
      cSheet.getRange(3, 1, sRows.length, row1Vals.length).setValues(sRows);
      cSheet.getRange(3, 1, sRows.length, 1).setHorizontalAlignment("center");
      cSheet.getRange(3, 2, sRows.length, 1).setHorizontalAlignment("center");
      cSheet.getRange(3, 4, sRows.length, 1).setHorizontalAlignment("center");
      for (var cCol = 6; cCol <= row1Vals.length; cCol++) {
        cSheet.getRange(3, cCol, sRows.length, 1).setHorizontalAlignment("center").setFontWeight("bold");
      }
    }
    
    cSheet.setColumnWidth(1, 45);  // NO
    cSheet.setColumnWidth(2, 120); // NISN
    cSheet.setColumnWidth(3, 240); // NAMA
    cSheet.setColumnWidth(4, 75);  // KELAS
    cSheet.setColumnWidth(5, 140); // NAMA GURU / MATA PELAJARAN
    for (var colI = 6; colI <= row1Vals.length; colI++) {
      cSheet.setColumnWidth(colI, 120);
    }
    cSheet.setFrozenRows(2);
    
    // Masukkan entri ke Dashboard_Monitoring
    for (var s2 = 0; s2 < subjects.length; s2++) {
      var sub2 = subjects[s2];
      var sName2 = sub2.nameId || sub2.name;
      var gCount = subjectGradedCounts[sub2.id] || subjectGradedCounts[sName2] || 0;
      var totalS = students.length;
      
      var statusText = '🔴 Belum Diisi (0/' + totalS + ')';
      if (gCount >= totalS && totalS > 0) {
        statusText = '🟢 Sudah Lengkap (' + gCount + '/' + totalS + ')';
      } else if (gCount > 0) {
        statusText = '🟡 Sebagian (' + gCount + '/' + totalS + ')';
      }
      
      dashRows.push([
        rowNo++,
        cName,
        sName2,
        sub2.teacherName || "-",
        totalS,
        gCount,
        statusText,
        gCount > 0 ? now : "-"
      ]);
    }
  }
  
  // 3. Buat Sheet Master: Rekap_Semua_Santri (Menggabungkan Seluruh Kelas seperti Screenshot Pengguna)
  var masterSheet = ss.getSheetByName('Rekap_Semua_Santri');
  if (!masterSheet) {
    masterSheet = ss.insertSheet('Rekap_Semua_Santri');
  } else {
    masterSheet.clear();
  }
  
  var mRow1Vals = ["NO", "NISN", "NAMA", "KELAS", "NAMA GURU"];
  var mRow2Vals = ["", "", "", "", "MATA PELAJARAN"];
  
  for (var u = 0; u < allUniqueSubjects.length; u++) {
    mRow1Vals.push(allUniqueSubjects[u].teacherName || "-");
    mRow2Vals.push(allUniqueSubjects[u].nameId);
  }
  
  masterSheet.getRange(1, 1, 1, mRow1Vals.length).setValues([mRow1Vals])
    .setFontWeight("bold").setBackground("#174D3A").setFontColor("#FFFFFF").setHorizontalAlignment("center");
  masterSheet.getRange(1, 5).setBackground("#1F6B4F").setFontColor("#FFFFFF");
  if (mRow1Vals.length > 5) {
    masterSheet.getRange(1, 6, 1, mRow1Vals.length - 5).setBackground("#F1F5F9").setFontColor("#0F172A");
  }
  
  masterSheet.getRange(2, 1, 1, mRow2Vals.length).setValues([mRow2Vals])
    .setFontWeight("bold").setBackground("#174D3A").setFontColor("#FFFFFF").setHorizontalAlignment("center");
  masterSheet.getRange(2, 5).setBackground("#1F6B4F").setFontColor("#FFFFFF");
  if (mRow2Vals.length > 5) {
    masterSheet.getRange(2, 6, 1, mRow2Vals.length - 5).setBackground("#CBD5E1").setFontColor("#0F172A");
  }
  
  var masterStudentRows = [];
  var mIndex = 1;
  for (var mc = 0; mc < classesList.length; mc++) {
    var mCls = classesList[mc];
    var mCName = mCls.nameLatin || mCls.id;
    var mStudents = mCls.students || [];
    
    for (var ms = 0; ms < mStudents.length; ms++) {
      var mStd = mStudents[ms];
      var mRow = [mIndex++, mStd.nisn || "-", mStd.name || "-", mCName, ""];
      for (var mu = 0; mu < allUniqueSubjects.length; mu++) {
        var uSub = allUniqueSubjects[mu];
        var uSc = "";
        if (mStd.scores) {
          if (mStd.scores[uSub.id] !== undefined && mStd.scores[uSub.id] !== "" && !isNaN(Number(mStd.scores[uSub.id]))) {
            uSc = Number(mStd.scores[uSub.id]);
          } else if (mStd.scores[uSub.nameId] !== undefined && mStd.scores[uSub.nameId] !== "" && !isNaN(Number(mStd.scores[uSub.nameId]))) {
            uSc = Number(mStd.scores[uSub.nameId]);
          }
        }
        mRow.push(uSc);
      }
      masterStudentRows.push(mRow);
    }
  }
  
  if (masterStudentRows.length > 0) {
    masterSheet.getRange(3, 1, masterStudentRows.length, mRow1Vals.length).setValues(masterStudentRows);
    masterSheet.getRange(3, 1, masterStudentRows.length, 1).setHorizontalAlignment("center");
    masterSheet.getRange(3, 2, masterStudentRows.length, 1).setHorizontalAlignment("center");
    masterSheet.getRange(3, 4, masterStudentRows.length, 1).setHorizontalAlignment("center");
    for (var mCol = 6; mCol <= mRow1Vals.length; mCol++) {
      masterSheet.getRange(3, mCol, masterStudentRows.length, 1).setHorizontalAlignment("center").setFontWeight("bold");
    }
  }
  
  masterSheet.setColumnWidth(1, 45);
  masterSheet.setColumnWidth(2, 120);
  masterSheet.setColumnWidth(3, 240);
  masterSheet.setColumnWidth(4, 75);
  masterSheet.setColumnWidth(5, 140);
  for (var mci = 6; mci <= mRow1Vals.length; mci++) {
    masterSheet.setColumnWidth(mci, 120);
  }
  masterSheet.setFrozenRows(2);
  
  // Format Dashboard_Monitoring
  if (dashRows.length > 0) {
    dashSheet.getRange(2, 1, dashRows.length, 8).setValues(dashRows);
    for (var d = 0; d < dashRows.length; d++) {
      var stVal = String(dashRows[d][6]);
      var cell = dashSheet.getRange(d + 2, 7);
      if (stVal.indexOf('🟢') !== -1) {
        cell.setBackground("#DCFCE7").setFontColor("#166534").setFontWeight("bold");
      } else if (stVal.indexOf('🟡') !== -1) {
        cell.setBackground("#FEF3C7").setFontColor("#92400E").setFontWeight("bold");
      } else {
        cell.setBackground("#FEE2E2").setFontColor("#991B1B").setFontWeight("bold");
      }
    }
    dashSheet.getRange(2, 8, dashRows.length, 1).setHorizontalAlignment("center");
  }
  
  dashSheet.setColumnWidth(1, 45);
  dashSheet.setColumnWidth(2, 130);
  dashSheet.setColumnWidth(3, 190);
  dashSheet.setColumnWidth(4, 220);
  dashSheet.setColumnWidth(5, 95);
  dashSheet.setColumnWidth(6, 95);
  dashSheet.setColumnWidth(7, 190);
  dashSheet.setColumnWidth(8, 150);
}

function getOrCreateScoresSheet(ss) {
  var sheet = ss.getSheetByName('Data_Nilai_Raport');
  if (!sheet) {
    sheet = ss.insertSheet('Data_Nilai_Raport');
    sheet.appendRow(['ID Santri', 'ID Kelas', 'Nama Lengkap', 'NISN', 'ID Mapel', 'Nilai Angka', 'Terakhir Diperbarui']);
    var headerRange = sheet.getRange(1, 1, 1, 7);
    headerRange.setBackground('#174D3A');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * The Google Apps Script template specially designed and formatted for FULL DAY (SMP & SMA Islam Al-Ghozali).
 */
export const GOOGLE_APPS_SCRIPT_FULLDAY_CODE = `/**
 * =========================================================================
 * BACKEND SINKRONISASI RAPORT SMP & SMA ISLAM AL-GHOZALI (FULL DAY)
 * ASESMEN TENGAH SEMESTER GANJIL - TAHUN PELAJARAN 2026/2027
 * =========================================================================
 * Skrip ini bertindak sebagai API server gratis di Google Drive Anda untuk
 * menghubungkan seluruh perangkat guru & admin ke Google Spreadsheet Full Day.
 * 
 * PIMPINAN SEKOLAH RESMI:
 * - Kepala Sekolah SMP Islam Al-Ghozali : ISWAHYUDIN, SE
 * - Kepala Sekolah SMA Islam Al-Ghozali : Antoni Firdaus, M.Pd.
 * 
 * CARA DEPLOY (2 MENIT):
 * 1. Buat Spreadsheet baru di https://sheets.new dengan nama misal:
 *    "Raport Full Day SMP & SMA Al-Ghozali 2026/2027"
 * 2. Di menu atas Google Spreadsheet, klik: Ekstensi (Extensions) > Apps Script
 * 3. Hapus seluruh kode default yang ada di editor Apps Script
 * 4. Tempelkan (paste) seluruh kode ini ke sana
 * 5. Klik ikon Disket (Simpan project)
 * 6. Klik tombol "Deploy" di kanan atas -> "New deployment"
 * 7. Pilih type "Web app" (ikon globe / bola dunia)
 * 8. Description: "Raport Full Day Sync API"
 * 9. Execute as: "Me" (email Google akun Anda)
 * 10. Who has access: "Anyone" (Siapa saja)  <--- WAJIB PILIH INI!
 * 11. Klik "Deploy" -> Beri izin ("Authorize access" -> "Advanced" -> "Go to...")
 * 12. Salin "Web app URL" (berakhiran /exec) dan tempel ke Aplikasi Raport (Mode Full Day).
 * =========================================================================
 */

function getAppUrl_() {
  var url = PropertiesService.getScriptProperties().getProperty('APP_URL') || '';
  if (!url) throw new Error('APP_URL belum dikonfigurasi di Script Properties.');
  return url;
}
