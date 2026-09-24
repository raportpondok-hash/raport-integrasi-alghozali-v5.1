/**
 * AI AUDITOR V5
 * Groq API is called only from Apps Script. Never expose GROQ_API_KEY to frontend.
 */

function setupAIAuditorProperties() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    GROQ_MODEL_FAST: 'openai/gpt-oss-20b',
    GROQ_MODEL_DEEP: 'openai/gpt-oss-120b',
    GROQ_MODEL_SAFEGUARD: 'openai/gpt-oss-safeguard-20b',
    GROQ_MODEL_WHISPER: 'whisper-large-v3',
    GROQ_MODEL_WHISPER_FAST: 'whisper-large-v3-turbo'
  }, false);
  return 'Model AI V5 berhasil dikonfigurasi. Isi GROQ_API_KEY secara manual di Script Properties.';
}

function sanitizeAIAudit_(audit, dataset) {
  audit = audit && typeof audit === 'object' ? audit : {};
  var issues = Array.isArray(audit.issues) ? audit.issues : [];
  var students = Array.isArray(dataset && dataset.students) ? dataset.students : [];
  var namedStudents = students.filter(function(s) { return String((s && s.name) || '').trim() !== ''; });
  var hasClasses = Array.isArray(dataset && dataset.classes) && dataset.classes.length > 0;
  var seen = {};

  issues = issues.filter(function(issue) {
    if (!issue || typeof issue !== 'object') return false;
    var title = String(issue.title || '').toLowerCase();
    var category = String(issue.category || '').toLowerCase();
    var evidence = String(issue.evidence || '').toLowerCase();

    // A missing classes array is not evidence of a missing class definition.
    if (!hasClasses && (title.indexOf('class definition missing') >= 0 || category.indexOf('class definition') >= 0 || evidence.indexOf('classes array is empty') >= 0)) {
      return false;
    }

    // Missing NIS is meaningful only for a real student record with a name.
    if (title.indexOf('missing nis') >= 0 || category.indexOf('missing nis') >= 0) {
      if (namedStudents.length === 0) return false;
    }

    // Avoid identical repeated AI findings.
    var key = [issue.severity, issue.category, issue.title, issue.evidence, issue.recommendation].join('|').toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });

  audit.issues = issues;
  var totals = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach(function(issue) {
    var severity = String(issue.severity || 'low').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(totals, severity)) totals[severity]++;
  });
  audit.totals = totals;
  audit.summary = String(audit.summary || ('Audit selesai dengan ' + issues.length + ' temuan yang didukung data.'));
  return audit;
}

function getAIModel_(mode) {
  var props = PropertiesService.getScriptProperties();
  var key = String(mode || 'fast').toLowerCase() === 'deep' ? 'GROQ_MODEL_DEEP' : 'GROQ_MODEL_FAST';
  return props.getProperty(key) || (key === 'GROQ_MODEL_DEEP' ? 'openai/gpt-oss-120b' : 'openai/gpt-oss-20b');
}

function aiAuditData_(params) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY') || '';
  if (!apiKey) {
    return jsonResponse({
      status: 'error',
      code: 'GROQ_API_KEY_MISSING',
      message: 'GROQ_API_KEY belum diisi di Script Properties.'
    });
  }

  var rawDataset = params && params.dataset;
  if (typeof rawDataset === 'string') {
    try { rawDataset = JSON.parse(rawDataset); } catch (e) {}
  }
  if (!rawDataset || typeof rawDataset !== 'object') {
    return jsonResponse({ status: 'error', message: 'Dataset audit tidak ditemukan.' });
  }

  var mode = String((params && params.mode) || 'fast').toLowerCase() === 'deep' ? 'deep' : 'fast';
  var model = getAIModel_(mode);

  // Keep the prompt bounded. The frontend should send only the relevant class/school scope.
  var datasetText = JSON.stringify(rawDataset);
  if (datasetText.length > 120000) {
    datasetText = datasetText.substring(0, 120000);
  }

  var systemPrompt = [
    'Anda adalah AI Auditor Data untuk aplikasi Raport Integrasi Al-Ghozali V5.',
    'Tugas Anda adalah menemukan anomali data, bukan mengarang data.',
    'Jangan mengubah atau menghapus data.',
    'Periksa konsistensi siswa, NIS/NISN, kelas, jenjang, program IPA/IPS, guru, mapel, nilai, dan pemetaan REKAP NILAI. Gunakan classId/className/programStudi dari scope sebagai konteks utama.',
    'Gunakan hanya data yang diberikan.',
    'Jangan menganggap field yang tidak dikirim sebagai kosong atau salah; bedakan field tidak tersedia dari field tersedia tetapi kosong.',
    'Jika array classes tidak ada atau kosong, JANGAN membuat temuan Class Definition missing kecuali dataset secara eksplisit menyatakan bahwa daftar kelas wajib tersedia dan ada bukti konfigurasi kelas memang hilang.',
    'Untuk pemeriksaan NIS/NISN, hanya periksa objek students yang memiliki nama siswa non-kosong. Baris tanpa nama bukan siswa dan tidak boleh dilaporkan sebagai missing NIS.',
    'Jika banyak siswa memiliki NIS kosong, laporkan masing-masing hanya bila identitas siswa jelas; jangan membuat temuan duplikat untuk siswa yang sama.',
    'Jangan mengarang nilai NIS, nama kelas, mapel, guru, atau identitas lain.',
    'Jika bukti tidak cukup, tandai sebagai perlu pemeriksaan manual.',
    'Jangan menyimpulkan identitas siswa hanya berdasarkan kemiripan nama jika NIS/NISN tersedia.',
    'Untuk setiap masalah, berikan bukti konkret dan rekomendasi yang dapat diverifikasi.',
    'Prioritas: critical, high, medium, low.',
    'Keluarkan JSON valid saja.'
  ].join(' ');

  var schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            severity: { type: 'string', enum: ['critical','high','medium','low'] },
            category: { type: 'string' },
            title: { type: 'string' },
            evidence: { type: 'string' },
            recommendation: { type: 'string' },
            confidence: { type: 'number' },
            action: { type: 'string', enum: ['NONE','REVIEW','MOVE_STUDENT','FIX_SUBJECT_MAPPING','FIX_SCORE','MERGE_DUPLICATE'] }
          },
          required: ['severity','category','title','evidence','recommendation','confidence','action']
        }
      },
      totals: {
        type: 'object',
        additionalProperties: false,
        properties: {
          critical: { type: 'integer' },
          high: { type: 'integer' },
          medium: { type: 'integer' },
          low: { type: 'integer' }
        },
        required: ['critical','high','medium','low']
      }
    },
    required: ['summary','issues','totals']
  };

  var payload = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Audit dataset berikut dan laporkan hanya masalah yang didukung bukti.\n\n' + datasetText }
    ],
    temperature: 0.1,
    max_completion_tokens: 4096,
    include_reasoning: false,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'raport_ai_audit',
        strict: true,
        schema: schema
      }
    }
  };

  var started = new Date().getTime();
  try {
    var response = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + apiKey },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    var elapsed = new Date().getTime() - started;
    var statusCode = response.getResponseCode();
    var body = response.getContentText();
    var parsed;
    try { parsed = JSON.parse(body); } catch (e) { parsed = null; }

    if (statusCode < 200 || statusCode >= 300) {
      return jsonResponse({
        status: 'error',
        code: 'GROQ_HTTP_' + statusCode,
        message: parsed && parsed.error && parsed.error.message ? parsed.error.message : body.substring(0, 500),
        model: model
      });
    }

    var content = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message
      ? parsed.choices[0].message.content
      : '';
    var audit;
    try {
      audit = JSON.parse(content || '{}');
      audit = sanitizeAIAudit_(audit, rawDataset);

    } catch (e) {
      return jsonResponse({ status: 'error', code: 'AI_INVALID_JSON', message: 'Model mengembalikan JSON yang tidak valid.', model: model });
    }

    return jsonResponse({
      status: 'success',
      model: model,
      mode: mode,
      latencyMs: elapsed,
      audit: audit,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse({
      status: 'error',
      code: 'GROQ_REQUEST_FAILED',
      message: String(error),
      model: model
    });
  }
}
