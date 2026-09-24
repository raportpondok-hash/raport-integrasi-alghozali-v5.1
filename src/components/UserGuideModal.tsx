import React from 'react';
import { BookOpen, CheckCircle2, X } from 'lucide-react';
import { AuthUser } from '../types';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
}

const roleContent = {
  guru: {
    title: 'Panduan Guru',
    intro: 'Alur singkat untuk mengisi nilai kelas dan mata pelajaran yang Anda ampu.',
    steps: [
      ['Pilih kelas', 'Pilih kelas yang memang Anda ajar.'],
      ['Pilih mata pelajaran', 'Mata pelajaran yang tampil sudah disesuaikan dengan tugas mengajar Anda.'],
      ['Isi nilai', 'Masukkan nilai siswa dengan teliti. Anda dapat menggunakan input manual atau Excel.'],
      ['Simpan Nilai', 'Simpan hasil pengisian dan periksa status kelengkapannya. Jika ada kendala, hubungi Admin.'],
    ],
  },
  wali_kelas: {
    title: 'Panduan Wali Kelas',
    intro: 'Alur singkat untuk memeriksa kelengkapan data kelas dan raport.',
    steps: [
      ['Pilih kelas', 'Buka kelas yang menjadi tanggung jawab Anda.'],
      ['Periksa nilai', 'Periksa kelengkapan nilai dari mata pelajaran yang tersedia.'],
      ['Periksa rekap', 'Pastikan data siswa, nilai, dan rekap kelas sudah sesuai.'],
      ['Periksa raport', 'Gunakan tampilan raport untuk pemeriksaan akhir sebelum pelaporan.'],
    ],
  },
  admin: {
    title: 'Panduan Administrator',
    intro: 'Alur singkat pengelolaan dan pemeriksaan sistem.',
    steps: [
      ['Periksa data', 'Pastikan data siswa, kelas, guru, dan mata pelajaran sesuai.'],
      ['Pantau progres', 'Periksa kelengkapan nilai dari guru dan wali kelas.'],
      ['Sinkronisasi', 'Gunakan menu pengelolaan data untuk meneruskan data ke penyimpanan resmi.'],
      ['Audit & verifikasi', 'Periksa hasil sinkronisasi dan selesaikan data yang memerlukan pemeriksaan.'],
    ],
  },
} as const;

export function UserGuideModal({ isOpen, onClose, currentUser }: UserGuideModalProps) {
  if (!isOpen) return null;
  const content = roleContent[currentUser.role];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <BookOpen size={18} className="text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold">{content.title}</h2>
            <p className="text-[11px] text-stone-400 mt-0.5">Panduan singkat penggunaan</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup panduan" className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs leading-relaxed text-stone-600 mb-4">{content.intro}</p>
          <div className="space-y-2.5">
            {content.steps.map(([title, description], index) => (
              <div key={title} className="flex gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 text-xs font-extrabold">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    {title}
                  </div>
                  <p className="text-[11px] leading-relaxed text-stone-500 mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[10px] text-stone-400">Pengguna: {currentUser.name}</span>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition">
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
