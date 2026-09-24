import React, { useState, useEffect } from 'react';
import { Subject, CalculatedStudent, ClassItem } from '../types';
import { getSubjectsForClass, ensureStudentScoresForClass } from '../data/curriculumSubjects';
import { X, Save, User } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: CalculatedStudent | null;
  subjects: Subject[];
  classes: ClassItem[];
  defaultClassId?: string;
  onSave: (data: { id?: string; classId: string; name: string; nisn: string; scores: Record<string, number>; keterangan?: string }) => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  student,
  subjects,
  classes,
  defaultClassId = '1-int-a',
  onSave,
}) => {
  const [name, setName] = useState('');
  const [nisn, setNisn] = useState('');
  const [classId, setClassId] = useState(defaultClassId);
  const [keterangan, setKeterangan] = useState('Tuntas');
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    const targetClass = student ? (student.classId || defaultClassId) : defaultClassId;
    if (student) {
      setName(student.name);
      setNisn(student.nisn);
      setClassId(targetClass);
      setKeterangan(student.keterangan || 'Tuntas');
      setScores(ensureStudentScoresForClass(student.scores, targetClass, student.nisn || student.id));
    } else {
      setName('');
      setNisn('');
      setClassId(defaultClassId);
      setKeterangan('Tuntas');
      const classSubjects = getSubjectsForClass(defaultClassId);
      const initial: Record<string, number> = {};
      classSubjects.forEach((s) => {
        initial[s.id] = 75;
      });
      setScores(initial);
    }
  }, [student, isOpen, defaultClassId]);

  if (!isOpen) return null;

  const handleScoreChange = (subjectId: string, val: string) => {
    const num = Math.max(0, Math.min(100, parseInt(val, 10) || 0));
    setScores((prev) => ({ ...prev, [subjectId]: num }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      id: student?.id,
      classId,
      name: name.trim().toUpperCase(),
      nisn: nisn.trim(),
      scores,
      keterangan,
    });
    onClose();
  };

  const currentSubjects = getSubjectsForClass(classId);
  const pondok = currentSubjects.filter((s) => s.category === 'pondok');
  const umum = currentSubjects.filter((s) => s.category === 'umum');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={20} />
            <h3 className="font-bold text-base">
              {student ? 'Edit Data & Nilai Santri' : 'Tambah Santri Baru'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-emerald-100 hover:text-white rounded-lg hover:bg-emerald-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Nama Lengkap Santri *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: HAIKAL ADNAN FADHILLAH"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Kelas
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold bg-white"
              >
                <optgroup label="Kelas 1 SMP">
                  {classes.filter(c => c.id.startsWith('1') && c.id !== '1int').map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 2 SMP">
                  {classes.filter(c => c.id.startsWith('2') && !c.id.startsWith('2int')).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 3 SMP">
                  {classes.filter(c => c.id.startsWith('3') && !c.id.startsWith('3int')).map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 1 Intensif / 1 SMA">
                  {classes.filter(c => c.id === '1int' || c.level === '1int').map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 2 Intensif / 2 SMA">
                  {classes.filter(c => c.id.startsWith('2int') || c.level === '2int').map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 4 / 1 SMA">
                  {classes.filter(c => c.id.startsWith('4') || c.level === '4').map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 3 Intensif / 3 SMA">
                  {classes.filter(c => c.id.startsWith('3int') || c.level === '3int').map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 5 / 2 SMA">
                  {classes.filter(c => c.id.startsWith('5') || c.level === '5').map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Kelas 6 / 3 SMA">
                  {classes.filter(c => c.id.startsWith('6') || c.level === '6').map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nameLatin} ({cls.nameAr})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                NISN / No. Induk
              </label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="0095788645"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>


          {/* Scores - Pondok */}
          {pondok.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 bg-stone-100 px-3 py-1.5 rounded-md flex justify-between">
                <span>1. Mata Pelajaran Pondok ({pondok.length} Mapel)</span>
                <span className="font-arabic text-sm text-stone-600">مواد المعهد</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {pondok.map((sub) => (
                  <div key={sub.id} className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                    <span className="block text-[11px] font-medium text-stone-600 truncate" title={sub.nameId}>
                      {sub.order}. {sub.nameId}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scores[sub.id] ?? ''}
                      onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                      className="mt-1 w-full text-center font-bold text-sm bg-white border border-stone-300 rounded p-1 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scores - Umum */}
          {umum.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 bg-stone-100 px-3 py-1.5 rounded-md flex justify-between">
                <span>2. Mata Pelajaran Umum ({umum.length} Mapel)</span>
                <span className="font-arabic text-sm text-stone-600">المواد العامة</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {umum.map((sub) => (
                  <div key={sub.id} className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                    <span className="block text-[11px] font-medium text-stone-600 truncate" title={sub.nameId}>
                      {sub.order}. {sub.nameId}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scores[sub.id] ?? ''}
                      onChange={(e) => handleScoreChange(sub.id, e.target.value)}
                      className="mt-1 w-full text-center font-bold text-sm bg-white border border-stone-300 rounded p-1 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
            >
              <Save size={15} />
              Simpan Data Santri
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
