import React, { useState } from 'react';
import { CalculatedStudent, ClassItem, SchoolType } from '../types';
import { Search, Users, Printer, Download, PenTool, FileText, Plus, CheckCircle2, GraduationCap, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataMasterViewProps {
  students: CalculatedStudent[];
  classes: ClassItem[];
  selectedClassId: string;
  onSelectClassId: (classId: string) => void;
  onAddStudent: () => void;
  onEditStudent: (student: CalculatedStudent) => void;
  onDeleteStudent: (studentId: string) => void;
  onNavigateToGrading: (classId: string) => void;
  onNavigateToRaport: (studentId: string) => void;
  schoolType?: SchoolType;
}

export const DataMasterView: React.FC<DataMasterViewProps> = ({
  students,
  classes,
  selectedClassId,
  onSelectClassId,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onNavigateToGrading,
  onNavigateToRaport,
  schoolType = 'mukim',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');

  const isFullDay = schoolType === 'fullday';

  // Mukim class helpers
  const isClassLevel1 = (cId: string) => cId === '1a' || cId === '1b' || cId === '1d' || cId === '1e';
  const isClassLevel2 = (cId: string) => cId.startsWith('2') && !cId.startsWith('2int');
  const isClassLevel3 = (cId: string) => cId.startsWith('3') && !cId.startsWith('3int');
  const isClassLevel1Int = (cId: string) => cId === '1int' || cId.startsWith('1-int');
  const isClassLevel2Int = (cId: string) => cId.startsWith('2int');
  const isClassLevel4 = (cId: string) => cId.startsWith('4');
  const isClassLevel3Int = (cId: string) => cId.startsWith('3int');
  const isClassLevel5 = (cId: string) => cId.startsWith('5');
  const isClassLevel6 = (cId: string) => cId.startsWith('6');

  // Full Day class helpers
  const isClassFD_VII = (cId: string) => cId.startsWith('vii-');
  const isClassFD_VIII = (cId: string) => cId.startsWith('viii-');
  const isClassFD_IX = (cId: string) => cId.startsWith('ix-');
  const isClassFD_X = (cId: string) => cId.startsWith('x-');
  const isClassFD_XI = (cId: string) => cId.startsWith('xi-');
  const isClassFD_XII = (cId: string) => cId.startsWith('xii-');

  // Filter classes shown in selector cards based on selected level
  const displayedClasses = classes.filter((c) => {
    if (selectedLevel === 'all') return true;
    if (isFullDay) {
      if (selectedLevel === 'vii') return isClassFD_VII(c.id);
      if (selectedLevel === 'viii') return isClassFD_VIII(c.id);
      if (selectedLevel === 'ix') return isClassFD_IX(c.id);
      if (selectedLevel === 'x') return isClassFD_X(c.id);
      if (selectedLevel === 'xi') return isClassFD_XI(c.id);
      if (selectedLevel === 'xii') return isClassFD_XII(c.id);
      return true;
    }
    if (selectedLevel === '1') return isClassLevel1(c.id);
    if (selectedLevel === '2') return isClassLevel2(c.id);
    if (selectedLevel === '3') return isClassLevel3(c.id);
    if (selectedLevel === '1int') return isClassLevel1Int(c.id);
    if (selectedLevel === '2int') return isClassLevel2Int(c.id);
    if (selectedLevel === '4') return isClassLevel4(c.id);
    if (selectedLevel === '3int') return isClassLevel3Int(c.id);
    if (selectedLevel === '5') return isClassLevel5(c.id);
    if (selectedLevel === '6') return isClassLevel6(c.id);
    return true;
  });

  // Filter students based on level, class, and search term
  const filteredStudents = students.filter((s) => {
    const cId = s.classId || '1a';
    let matchesLevel = selectedLevel === 'all';
    if (!matchesLevel) {
      if (isFullDay) {
        if (selectedLevel === 'vii') matchesLevel = isClassFD_VII(cId);
        else if (selectedLevel === 'viii') matchesLevel = isClassFD_VIII(cId);
        else if (selectedLevel === 'ix') matchesLevel = isClassFD_IX(cId);
        else if (selectedLevel === 'x') matchesLevel = isClassFD_X(cId);
        else if (selectedLevel === 'xi') matchesLevel = isClassFD_XI(cId);
        else if (selectedLevel === 'xii') matchesLevel = isClassFD_XII(cId);
      } else {
        if (selectedLevel === '1') matchesLevel = isClassLevel1(cId);
        else if (selectedLevel === '2') matchesLevel = isClassLevel2(cId);
        else if (selectedLevel === '3') matchesLevel = isClassLevel3(cId);
        else if (selectedLevel === '1int') matchesLevel = isClassLevel1Int(cId);
        else if (selectedLevel === '2int') matchesLevel = isClassLevel2Int(cId);
        else if (selectedLevel === '4') matchesLevel = isClassLevel4(cId);
        else if (selectedLevel === '3int') matchesLevel = isClassLevel3Int(cId);
        else if (selectedLevel === '5') matchesLevel = isClassLevel5(cId);
        else if (selectedLevel === '6') matchesLevel = isClassLevel6(cId);
      }
    }

    const matchesClass = filterClass === 'all' || cId === filterClass;

    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm);

    return matchesLevel && matchesClass && matchesSearch;
  });

  // Mukim Counts
  const countLevel1 = students.filter((s) => isClassLevel1(s.classId || '1a')).length;
  const countLevel2 = students.filter((s) => isClassLevel2(s.classId || '1a')).length;
  const countLevel3 = students.filter((s) => isClassLevel3(s.classId || '1a')).length;
  const countLevel1Int = students.filter((s) => isClassLevel1Int(s.classId || '1a')).length;
  const countLevel2Int = students.filter((s) => isClassLevel2Int(s.classId || '1a')).length;
  const countLevel4 = students.filter((s) => isClassLevel4(s.classId || '1a')).length;
  const countLevel3Int = students.filter((s) => isClassLevel3Int(s.classId || '1a')).length;
  const countLevel5 = students.filter((s) => isClassLevel5(s.classId || '1a')).length;
  const countLevel6 = students.filter((s) => isClassLevel6(s.classId || '1a')).length;

  // Full Day Counts
  const countFD_VII = students.filter((s) => isClassFD_VII(s.classId || '')).length;
  const countFD_VIII = students.filter((s) => isClassFD_VIII(s.classId || '')).length;
  const countFD_IX = students.filter((s) => isClassFD_IX(s.classId || '')).length;
  const countFD_X = students.filter((s) => isClassFD_X(s.classId || '')).length;
  const countFD_XI = students.filter((s) => isClassFD_XI(s.classId || '')).length;
  const countFD_XII = students.filter((s) => isClassFD_XII(s.classId || '')).length;

  const classCountMap: Record<string, number> = {};
  classes.forEach((c) => {
    classCountMap[c.id] = students.filter((s) => (s.classId || '1a') === c.id).length;
  });

  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);
    setFilterClass('all');
  };

  const handleExportExcel = () => {
    const headerInfo = [
      ['DATA MASTER SANTRI PESANTREN AL-GHOZALI GUNUNG SINDUR'],
      [`Tingkat / Filter: ${selectedLevel.toUpperCase()}`, `Kelas: ${filterClass}`],
      [`Jumlah Santri: ${filteredStudents.length}`, `Tanggal: ${new Date().toLocaleDateString('id-ID')}`],
      [],
      ['NO', 'NISN', 'NAMA LENGKAP', 'KELAS', 'JENJANG', 'TOTAL NILAI', 'RATA-RATA', 'PERINGKAT', 'STATUS'],
    ];

    const dataRows = filteredStudents.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.classId)?.nameLatin || s.classId || '-';
      const jenjang = (s.classId || '').startsWith('4') || (s.classId || '').startsWith('5') || (s.classId || '').startsWith('6') || (s.classId || '').startsWith('3int') ? 'SMA' : 'SMP';
      return [
        idx + 1,
        s.nisn,
        s.name,
        cls,
        jenjang,
        s.totalScore,
        s.averageScore,
        s.rank,
        s.keterangan || 'Tuntas',
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([...headerInfo, ...dataRows]);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 16 },
      { wch: 32 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Santri');
    const levelLabel = selectedLevel === 'all' ? 'Semua' : `Kelas_${selectedLevel}`;
    XLSX.writeFile(workbook, `Data_Master_Santri_${levelLabel}_${filterClass}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = ['NO', 'NISN', 'NAMA LENGKAP', 'KELAS', 'TOTAL NILAI', 'RATA-RATA', 'PERINGKAT', 'STATUS'];
    const rows = filteredStudents.map((s, idx) => {
      const cls = classes.find((c) => c.id === s.classId)?.nameLatin || s.classId || '-';
      return [
        idx + 1,
        `'${s.nisn}`,
        `"${s.name}"`,
        `"${cls}"`,
        s.totalScore,
        s.averageScore,
        s.rank,
        s.keterangan || 'Tuntas',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const levelLabel = selectedLevel === 'all' ? 'Semua_Jenjang' : `Kelas_${selectedLevel}_SMP`;
    link.download = `Data_Master_Siswa_${levelLabel}_${filterClass}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const isGirlStudent = (classId: string, nisn?: string) => {
    if (classId === '1int') {
      const putriNisns = new Set([
        '3114863309',
        '3119640430',
        '0107709853',
        '0115850447',
        '3094791920',
        '3119922193',
        '3111516654',
        '3111110408',
      ]);
      return nisn ? putriNisns.has(nisn) : false;
    }
    if (classId.startsWith('2int')) {
      const putriNisns2Int = new Set([
        '0103255017',
        '0095965349',
        '0104195595',
        '3098541367',
        '0091056538',
        '0105906811',
        '0099177353',
        '0103142617',
        '0105821200',
      ]);
      return nisn ? putriNisns2Int.has(nisn) : false;
    }
    if (classId?.startsWith('3int')) {
      const putriNisns3Int = new Set([
        '0085039026',
        '3089912917',
        '0097895365',
        '0096200281',
        '0089266284',
        '0089172498',
        '0082188432',
        '0097122723',
        '0087581911',
        '0094678715',
        '0076764420',
        '3097728311',
        '0091344448',
        '0061177019',
        '3073603106',
        '3086240194',
        '0094070304',
        '0097971201',
      ]);
      return nisn ? putriNisns3Int.has(nisn) : false;
    }
    if (classId === '5a' || classId === '5b') {
      return true; // 5A IPA Putri & 5B IPS Putri
    }
    if (classId === '5c' || classId === '5d') {
      return false; // 5C IPA Putra & 5D IPS Putra
    }
    if (classId === '6a' || classId === '6b') {
      return true; // 6A IPA Putri & 6B IPS Putri
    }
    if (classId === '6c' || classId === '6d') {
      return false; // 6C IPA Putra & 6D IPS Putra
    }
    return (
      classId === '1a' ||
      classId === '1b' ||
      classId === '2a' ||
      classId === '2b' ||
      classId === '2c' ||
      classId === '3a' ||
      classId === '3b' ||
      classId === '3c' ||
      classId === '4a'
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-inner">
              <Users size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-stone-900 tracking-tight">
                  {isFullDay ? 'Data Master Siswa Full Day (Non-Mukim)' : 'Data Master Siswa SMP & SMA'}
                </h2>
                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                  isFullDay ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {students.length} Siswa Terdaftar
                </span>
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  {isFullDay
                    ? `VII: ${countFD_VII} | VIII: ${countFD_VIII} | IX: ${countFD_IX} | X: ${countFD_X} | XI: ${countFD_XI} | XII: ${countFD_XII}`
                    : `1 SMP: ${countLevel1} | 2 SMP: ${countLevel2} | 3 SMP: ${countLevel3} | 1 INT: ${countLevel1Int} | 2 INT: ${countLevel2Int} | 4 SMA: ${countLevel4} | 3 INT: ${countLevel3Int} | 5 SMA: ${countLevel5} | 6 SMA: ${countLevel6}`}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                {isFullDay
                  ? 'SMP & SMA Islam Al-Ghozali • Program Full Day (Non-Mukim) • Kurikulum Nasional & Kemenag'
                  : 'Pondok Modern Al-Ghozali • Tahun Ajaran 2026/2027 • Kurikulum Terpadu Pesantren & Nasional'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg shadow-sm transition"
              title="Download Data Master Format Excel (.xlsx)"
            >
              <FileSpreadsheet size={14} />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
            >
              <Printer size={14} />
              <span>Cetak Daftar</span>
            </button>
            <button
              type="button"
              onClick={onAddStudent}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
            >
              <Plus size={15} />
              <span>Tambah Siswa</span>
            </button>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-stone-100 overflow-x-auto">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <GraduationCap size={15} className={isFullDay ? 'text-amber-600' : 'text-emerald-600'} />
            Tingkat:
          </span>
          <button
            type="button"
            onClick={() => handleLevelChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedLevel === 'all'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Semua Tingkat ({students.length})
          </button>
          {isFullDay ? (
            <>
              <button
                type="button"
                onClick={() => handleLevelChange('vii')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === 'vii'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas VII SMP ({countFD_VII})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('viii')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === 'viii'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas VIII SMP ({countFD_VIII})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('ix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === 'ix'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas IX SMP ({countFD_IX})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('x')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === 'x'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas X SMA ({countFD_X})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('xi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === 'xi'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas XI SMA ({countFD_XI})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('xii')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === 'xii'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas XII SMA ({countFD_XII})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleLevelChange('1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '1'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas 1 SMP ({countLevel1})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '2'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas 2 SMP ({countLevel2})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('3')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '3'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas 3 SMP ({countLevel3})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('1int')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '1int'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                1 Intensif / 1 SMA ({countLevel1Int})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('2int')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '2int'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                2 Intensif / 2 SMA ({countLevel2Int})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '4'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas 4 / 1 SMA ({countLevel4})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('3int')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '3int'
                    ? 'bg-rose-700 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                3 Intensif / 3 SMA ({countLevel3Int})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('5')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '5'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas 5 / 2 SMA ({countLevel5})
              </button>
              <button
                type="button"
                onClick={() => handleLevelChange('6')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedLevel === '6'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Kelas 6 / 3 SMA ({countLevel6})
              </button>
            </>
          )}
        </div>

        {/* Quick Class Selector Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mt-4">
          <button
            type="button"
            onClick={() => setFilterClass('all')}
            className={`p-2.5 rounded-xl border text-left transition ${
              filterClass === 'all'
                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
            }`}
          >
            <div className="text-[10px] font-bold text-stone-500 uppercase">Semua Kelas</div>
            <div className="text-base font-black text-stone-800 mt-0.5">
              {selectedLevel === 'all'
                ? students.length
                : selectedLevel === '1'
                ? countLevel1
                : selectedLevel === '2'
                ? countLevel2
                : selectedLevel === '3'
                ? countLevel3
                : selectedLevel === '1int'
                ? countLevel1Int
                : selectedLevel === '2int'
                ? countLevel2Int
                : selectedLevel === '4'
                ? countLevel4
                : selectedLevel === '3int'
                ? countLevel3Int
                : selectedLevel === '5'
                ? countLevel5
                : countLevel6}{' '}
              Siswa
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">Tampilkan Semua</div>
          </button>

          {displayedClasses.map((c) => {
            const count = classCountMap[c.id] || 0;
            const isSelected = filterClass === c.id;
            const isPutri = isGirlStudent(c.id);
            const is1Int = c.id === '1int';
            const is2IntA = c.id === '2int-a';
            const is2IntB = c.id === '2int-b';
            const is3IntA = c.id === '3int-a';
            const is3IntB = c.id === '3int-b';

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setFilterClass(c.id);
                  onSelectClassId(c.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-stone-700">
                    {c.id === '1int' ? '1 INT' : c.id === '2int-a' ? '2INT.A IPA' : c.id === '2int-b' ? '2INT.B IPS' : c.id === '3int-a' ? '3INT.A IPA' : c.id === '3int-b' ? '3INT.B IPS' : c.id === '4a' ? '4A' : c.id === '4b' ? '4B' : c.id === '4c' ? '4C' : c.id === '5a' ? '5A IPA' : c.id === '5b' ? '5B IPS' : c.id === '5c' ? '5C IPA' : c.id === '5d' ? '5D IPS' : c.id === '6a' ? '6A IPA' : c.id === '6b' ? '6B IPS' : c.id === '6c' ? '6C IPA' : c.id === '6d' ? '6D IPS' : c.nameLatin.split(' ')[0]}
                  </span>
                  <span className="font-arabic text-xs text-emerald-700 font-bold">{c.nameAr}</span>
                </div>
                <div className="text-base font-black text-stone-800 mt-0.5">{count} Siswa</div>
                <div className="text-[10px] font-medium text-stone-400 truncate mt-0.5">
                  {is1Int ? (
                    <span className="text-purple-600 font-semibold">8 Putri • 11 Putra</span>
                  ) : is2IntA ? (
                    <span className="text-purple-600 font-semibold">4 Pi • 4 Pa (IPA)</span>
                  ) : is2IntB ? (
                    <span className="text-purple-600 font-semibold">5 Pi • 4 Pa (IPS)</span>
                  ) : is3IntA ? (
                    <span className="text-rose-600 font-semibold">9 Pi • 9 Pa (IPA)</span>
                  ) : is3IntB ? (
                    <span className="text-rose-600 font-semibold">9 Pi • 7 Pa (IPS)</span>
                  ) : c.id === '5a' || c.id === '6a' ? (
                    <span className="text-pink-600 font-semibold">Putri (IPA)</span>
                  ) : c.id === '5b' || c.id === '6b' ? (
                    <span className="text-pink-600 font-semibold">Putri (IPS)</span>
                  ) : c.id === '5c' || c.id === '6c' ? (
                    <span className="text-blue-600 font-semibold">Putra (IPA)</span>
                  ) : c.id === '5d' || c.id === '6d' ? (
                    <span className="text-blue-600 font-semibold">Putra (IPS)</span>
                  ) : (
                    <span className={isPutri ? 'text-pink-600 font-semibold' : 'text-blue-600 font-semibold'}>
                      {isPutri ? 'Putri' : 'Putra'}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Search & Action Bar */}
        <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama santri / NISN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 shadow-xs"
              />
            </div>
            <span className="text-xs text-stone-500">
              Menampilkan <strong>{filteredStudents.length}</strong> dari {students.length} santri
            </span>
          </div>

          {filterClass !== 'all' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateToGrading(filterClass)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-xs"
              >
                <PenTool size={13} />
                <span>Input Nilai Kelas Ini</span>
              </button>
            </div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                <th className="py-3 px-3 text-center w-12">NO</th>
                <th className="py-3 px-3 text-center w-32 font-mono">NISN</th>
                <th className="py-3 px-4">NAMA SANTRI</th>
                <th className="py-3 px-3 text-center w-28">KELAS</th>
                <th className="py-3 px-3 text-center w-24">TOTAL NILAI</th>
                <th className="py-3 px-3 text-center w-24">RATA-RATA</th>
                <th className="py-3 px-3 text-center w-20">RANK</th>
                <th className="py-3 px-3 text-center w-24">STATUS</th>
                <th className="py-3 px-3 text-center w-36 no-print">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium text-stone-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-stone-400">
                    Tidak ditemukan data santri yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, index) => {
                  const studentClass = classes.find((c) => c.id === std.classId);
                  const isFemale = isGirlStudent(std.classId || '1a', std.nisn);

                  return (
                    <tr key={std.id} className="hover:bg-emerald-50/40 transition">
                      <td className="py-2.5 px-3 text-center font-mono text-stone-500">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-stone-700">
                        {std.nisn}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-stone-900">
                        <div className="flex items-center gap-2">
                          <span>{std.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                              isFemale
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isFemale ? 'Putri' : 'Putra'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                          {std.classId === '1int' ? '1 INT' : std.classId === '2int-a' ? '2INT.A IPA' : std.classId === '2int-b' ? '2INT.B IPS' : std.classId === '3int-a' ? '3INT.A IPA' : std.classId === '3int-b' ? '3INT.B IPS' : std.classId === '4a' ? '4A' : std.classId === '4b' ? '4B' : std.classId === '4c' ? '4C' : std.classId === '5a' ? '5A IPA' : std.classId === '5b' ? '5B IPS' : std.classId === '5c' ? '5C IPA' : std.classId === '5d' ? '5D IPS' : std.classId === '6a' ? '6A IPA' : std.classId === '6b' ? '6B IPS' : std.classId === '6c' ? '6C IPA' : std.classId === '6d' ? '6D IPS' : (studentClass?.nameLatin.split(' ')[0] || std.classId?.toUpperCase() || '1A')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-800">
                        {std.totalScore}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                        {std.averageScore}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-stone-700">
                        #{std.rank}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>{std.keterangan || 'Tuntas'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigateToRaport(std.id)}
                            title="Buka Lembar Raport Kasyfud Darajat"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded transition"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditStudent(std)}
                            title="Edit Data Santri"
                            className="text-[11px] px-2 py-1 font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStudent(std.id)}
                            title="Hapus"
                            className="text-[11px] px-2 py-1 font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
