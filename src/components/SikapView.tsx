import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardPaste, Save, Loader2, CheckCircle2 } from 'lucide-react';
import type { CalculatedStudent, ClassItem, AuthUser } from '../types';
import { fetchAllSikapFromSheets, saveMultipleSikapToSheets } from '../services/googleSheetsService';

const SIKAP_OPTIONS = ['Sangat Baik', 'Baik', 'Cukup', 'Perlu Bimbingan'];

interface SikapViewProps {
  studentsInClass: CalculatedStudent[];
  selectedClassId: string;
  classes: ClassItem[];
  onSelectClassId: (classId: string) => void;
  onUpdateSikap: (studentId: string, value: string) => void;
  currentUser: AuthUser | null;
  sheetsUrl: string;
}

export function SikapView({
  studentsInClass,
  selectedClassId,
  classes,
  onSelectClassId,
  onUpdateSikap,
  currentUser,
  sheetsUrl,
}: SikapViewProps) {
  const [pasteText, setPasteText] = useState('');
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isWali = currentUser?.role === 'wali_kelas';
  const canEdit = isAdmin || isWali;
  const availableClasses = useMemo(() => classes.filter((c) => c.id !== 'all'), [classes]);

  useEffect(() => {
    if (!canEdit || !sheetsUrl || !selectedClassId) return;
    let cancelled = false;
    setLoading(true);
    fetchAllSikapFromSheets(sheetsUrl)
      .then((res) => {
        if (cancelled || !res.success || !res.sikap) return;
        Object.entries(res.sikap).forEach(([studentId, data]) => {
          if (data.classId === selectedClassId && data.sikap) onUpdateSikap(studentId, data.sikap);
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedClassId, sheetsUrl, canEdit]);

  const applyPastedSikap = (raw: string) => {
    const values = raw
      .split(/\r?\n|\t|,|;|\|/)
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length !== studentsInClass.length) {
      setNotice(`Jumlah sikap harus tepat ${studentsInClass.length} baris, sekarang ${values.length}.`);
      return;
    }

    const normalized = values.map((value) =>
      SIKAP_OPTIONS.find((option) => option.toLowerCase() === value.toLowerCase()) || ''
    );
    const invalid = normalized.findIndex((value) => !value);
    if (invalid !== -1) {
      setNotice(`Baris ${invalid + 1} tidak dikenali. Pilihan: ${SIKAP_OPTIONS.join(', ')}.`);
      return;
    }

    studentsInClass.forEach((student, index) => onUpdateSikap(student.id, normalized[index]));
    setPasteText('');
    setIsPasteOpen(false);
    setNotice(`✓ ${values.length} sikap berhasil diterapkan sesuai urutan siswa.`);
  };

  const handleSave = async () => {
    if (!studentsInClass.length) return;
    setSaving(true);
    setNotice('');
    const items = studentsInClass.map((student) => ({
      studentId: student.id,
      classId: student.classId,
      studentName: student.name,
      nisn: student.nisn || '',
      sikap: student.sikap || '',
    }));
    const res = await saveMultipleSikapToSheets(sheetsUrl, items);
    setSaving(false);
    setNotice(res.success ? `✓ ${items.length} sikap tersimpan ke Google Sheets.` : res.message);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-stone-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Pengisian Sikap</h2>
            <p className="text-[11px] sm:text-xs text-stone-300 mt-0.5">Dropdown per siswa • Isi cepat dengan copy-paste</p>
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => onSelectClassId(e.target.value)}
            className="bg-stone-800 border border-stone-700 text-white rounded-lg px-3 py-2 text-xs font-bold outline-none"
          >
            {availableClasses.map((cls) => <option key={cls.id} value={cls.id}>{cls.nameLatin}</option>)}
          </select>
        </div>

        <div className="px-4 sm:px-6 py-3 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-stone-600 font-semibold">
            {studentsInClass.length} siswa • {loading ? 'Memuat sikap...' : 'Siap diisi'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPasteOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
            >
              <ClipboardPaste size={14} />
              Tempel Sikap
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !studentsInClass.length}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan Sikap
            </button>
          </div>
        </div>

        {notice && (
          <div className="mx-4 sm:mx-6 mt-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{notice}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-stone-500 w-16">NO</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-stone-500">NAMA SISWA</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-stone-500 w-64">SIKAP</th>
              </tr>
            </thead>
            <tbody>
              {studentsInClass.map((student, index) => (
                <tr key={student.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-2.5 text-xs text-stone-500">{index + 1}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-stone-800">{student.name}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={student.sikap || ''}
                      onChange={(e) => onUpdateSikap(student.id, e.target.value)}
                      className="w-full max-w-xs border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                    >
                      <option value="">Pilih sikap...</option>
                      {SIKAP_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {!studentsInClass.length && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-stone-500">Belum ada siswa di kelas ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPasteOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 p-5">
            <h3 className="text-base font-bold text-stone-900">📋 Isi Cepat Sikap</h3>
            <p className="text-xs text-stone-500 mt-1">Copy satu kolom dari Excel/Google Sheets sesuai urutan siswa, lalu paste di bawah.</p>
            <textarea
              autoFocus
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={10}
              className="mt-4 w-full border border-stone-300 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-500"
              placeholder={'Baik\nBaik\nSangat Baik\nBaik\n...'}
            />
            <div className="mt-3 text-[11px] text-stone-500">Pilihan: {SIKAP_OPTIONS.join(' • ')}</div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => { setIsPasteOpen(false); setPasteText(''); }} className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-bold text-stone-700">Batal</button>
              <button type="button" onClick={() => applyPastedSikap(pasteText)} className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold">Terapkan ke {studentsInClass.length} Siswa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
