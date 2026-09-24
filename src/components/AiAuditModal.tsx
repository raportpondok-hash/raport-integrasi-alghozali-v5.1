import React from 'react';
import { Brain, Loader2, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

type AuditIssue = {
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  category: string;
  title: string;
  evidence: string;
  recommendation: string;
  confidence: number;
  action: string;
};

type AuditResult = {
  summary?: string;
  issues?: AuditIssue[];
  totals?: Record<string, number>;
};

export function AiAuditModal({
  isOpen,
  onClose,
  onRun,
  loading,
  result,
  mode,
  onModeChange,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRun: () => void;
  loading: boolean;
  result: AuditResult | null;
  mode: 'fast' | 'deep';
  onModeChange: (mode: 'fast' | 'deep') => void;
  error: string;
}) {
  if (!isOpen) return null;

  const issues = result?.issues || [];

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
              <Brain size={19} />
            </div>
            <div>
              <div className="font-bold text-sm">AI Auditor Data</div>
              <div className="text-[10px] text-stone-400">Groq • GPT-OSS • tidak mengubah data saat audit</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-stone-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-stone-800">Pemeriksaan data</div>
              <div className="text-xs text-stone-500">AI membaca data kelas yang sedang aktif dan mencari konflik yang didukung bukti.</div>
            </div>
            <div className="flex gap-1 bg-stone-100 p-1 rounded-xl">
              <button type="button" onClick={() => onModeChange('fast')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === 'fast' ? 'bg-white shadow text-emerald-700' : 'text-stone-500'}`}>
                20B • Cepat
              </button>
              <button type="button" onClick={() => onModeChange('deep')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === 'deep' ? 'bg-white shadow text-emerald-700' : 'text-stone-500'}`}>
                120B • Mendalam
              </button>
            </div>
          </div>

          <button type="button" onClick={onRun} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold text-sm px-4 py-3 rounded-xl shadow">
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Brain size={17} />}
            {loading ? 'AI sedang memeriksa data...' : '🔍 Jalankan Audit AI'}
          </button>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-xs font-medium">{error}</div>
          )}

          {result && (
            <>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={17} className="text-emerald-700 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">{result.summary || 'Audit selesai.'}</div>
                    <div className="text-[11px] text-emerald-800 mt-1">
                      Temuan: {issues.length} • Critical {result.totals?.critical || 0} • High {result.totals?.high || 0} • Medium {result.totals?.medium || 0} • Low {result.totals?.low || 0}
                    </div>
                  </div>
                </div>
              </div>

              {issues.length === 0 ? (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 text-center text-sm font-semibold text-stone-600">
                  <CheckCircle2 className="mx-auto mb-2 text-emerald-600" size={28} />
                  Tidak ditemukan anomali berdasarkan data yang diberikan.
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue, index) => (
                    <div key={index} className="rounded-xl border border-stone-200 p-4 bg-white shadow-sm">
                      <div className="flex items-start gap-3">
                        <ShieldAlert size={18} className="text-amber-600 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-2 items-center">
                            <div className="text-sm font-bold text-stone-900">{issue.title}</div>
                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-600">{issue.severity}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">{issue.category}</span>
                          </div>
                          <div className="mt-2 text-xs text-stone-600"><b>Bukti:</b> {issue.evidence}</div>
                          <div className="mt-1 text-xs text-stone-700"><b>Saran:</b> {issue.recommendation}</div>
                          <div className="mt-2 text-[10px] text-stone-400">Confidence {Math.round((issue.confidence || 0) * 100)}% • Action {issue.action}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
