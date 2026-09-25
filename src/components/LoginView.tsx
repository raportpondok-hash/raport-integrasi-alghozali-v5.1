import React, { useState, useMemo } from 'react';
import { AuthUser, ClassItem, JenjangUnit, UserRole } from '../types';
import { SchoolLogo } from './SchoolLogo';
import {
  getTeachersByJenjang,
  getWaliKelasByJenjang,
  getTeacherAssignmentDetails,
  verifyAdminPin,
  verifyTeacherPin,
  saveAuthUser,
} from '../utils/authHelpers';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  School,
  KeyRound,
  UserCheck,
  Search,
} from 'lucide-react';

interface LoginViewProps {
  classes?: ClassItem[];
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ classes = [], onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('guru');
  const [selectedUnit, setSelectedUnit] = useState<JenjangUnit>('SMP');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');
  const [teacherSearch, setTeacherSearch] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('');
  const [teacherPin, setTeacherPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const teachersList = useMemo(() => {
    try { return getTeachersByJenjang(selectedUnit) || []; } catch { return []; }
  }, [selectedUnit]);

  const waliKelasList = useMemo(() => {
    try { return getWaliKelasByJenjang(selectedUnit) || []; } catch { return []; }
  }, [selectedUnit]);

  const availableTeachers = useMemo(() => {
    if (selectedRole === 'wali_kelas') {
      const names = Array.from(new Set(
        (waliKelasList || [])
          .map((w) => (w && w.waliName ? w.waliName.trim() : ''))
          .filter((name): name is string => Boolean(name))
      )).sort();

      return names.map((name) => {
        const profile = (teachersList || []).find((t) => t && t.name && t.name.toLowerCase() === name.toLowerCase());
        const waliEntry = (waliKelasList || []).find((w) => w && w.waliName && w.waliName.toLowerCase() === name.toLowerCase());
        return {
          name,
          academicTitle: profile?.academicTitle || '',
          homeroomInfo: waliEntry ? `${waliEntry.className} (${waliEntry.levelLabel || waliEntry.unit})` : undefined,
          classesCount: profile?.totalClassesCount || 1,
        };
      });
    }

    return (teachersList || []).map((t) => ({
      name: t.name || '',
      academicTitle: t.academicTitle || '',
      homeroomInfo: undefined,
      classesCount: t.totalClassesCount || 0,
      subjectsCount: Array.isArray(t.subjects) ? t.subjects.length : 0,
    }));
  }, [selectedRole, teachersList, waliKelasList]);

  const filteredTeacherOptions = useMemo(() => {
    if (!teacherSearch.trim()) return availableTeachers;
    const q = teacherSearch.toLowerCase();
    return availableTeachers.filter((t) => (t.name || '').toLowerCase().includes(q));
  }, [availableTeachers, teacherSearch]);

  React.useEffect(() => {
    setErrorMessage('');
    if (selectedRole !== 'admin') {
      if (availableTeachers.length > 0) {
        const exists = availableTeachers.some((t) => t.name === selectedTeacherName);
        if (!exists) setSelectedTeacherName(availableTeachers[0].name);
      } else {
        setSelectedTeacherName('');
      }
    }
  }, [selectedRole, availableTeachers, selectedTeacherName]);

  const selectedTeacherDetails = useMemo(() => {
    if (selectedRole === 'admin' || !selectedTeacherName) return null;
    try { return getTeacherAssignmentDetails(selectedTeacherName, classes || []); } catch { return null; }
  }, [selectedRole, selectedTeacherName, classes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (selectedRole === 'admin') {
      if (!adminPin) {
        setErrorMessage('Silakan masukkan PIN Administrator.');
        setIsLoading(false);
        return;
      }
      if (adminPin.length < 6) {
        setErrorMessage('PIN Administrator minimal 6 digit.');
        setIsLoading(false);
        return;
      }

      const pinValid = await verifyAdminPin(adminPin);
      if (!pinValid) {
        setErrorMessage('PIN Administrator salah atau layanan autentikasi Apps Script belum tersedia.');
        setIsLoading(false);
        return;
      }

      const adminUser: AuthUser = {
        role: 'admin',
        name: 'Administrator Raport',
        unit: selectedUnit,
        availableUnits: ['SMP', 'SMA', 'TMMIA'],
      };
      saveAuthUser(adminUser);
      setIsLoading(false);
      onLoginSuccess(adminUser);
      return;
    }

    if (!selectedTeacherName) {
      setErrorMessage('Silakan pilih nama guru dari daftar Master Guru.');
      setIsLoading(false);
      return;
    }

    if (!teacherPin) {
      setErrorMessage('Silakan masukkan PIN Guru/Wali.');
      setIsLoading(false);
      return;
    }
    if (!/^\d{4,12}$/.test(teacherPin)) {
      setErrorMessage('PIN Guru/Wali harus 4-12 digit.');
      setIsLoading(false);
      return;
    }

    const pinValid = await verifyTeacherPin(selectedTeacherName, selectedUnit, selectedRole, teacherPin);
    if (!pinValid) {
      setErrorMessage('PIN Guru/Wali salah atau backend PIN belum dikonfigurasi.');
      setIsLoading(false);
      return;
    }

    const details = getTeacherAssignmentDetails(selectedTeacherName, classes);
    const authUser: AuthUser = {
      role: selectedRole,
      name: selectedTeacherName,
      unit: details.availableUnits.includes(selectedUnit) ? selectedUnit : details.availableUnits[0],
      availableUnits: details.availableUnits,
      assignedClassIds: details.assignedClassIds,
      assignedClassIdsByUnit: details.assignedClassIdsByUnit,
      assignedSubjectNames: details.assignedSubjectNames,
      homeroomClassId: details.homeroomClass?.id || details.homeroomEntry?.classId,
      homeroomClassName: details.homeroomClass?.nameLatin || details.homeroomEntry?.className,
    };
    saveAuthUser(authUser);
    setIsLoading(false);
    onLoginSuccess(authUser);
  };

  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/40 flex flex-col justify-between items-center p-2.5 sm:p-4 lg:p-3 font-sans text-stone-800 selection:bg-emerald-500 selection:text-white relative overflow-y-auto lg:overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] bg-teal-200/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -left-24 w-[380px] h-[380px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
        <svg className="w-full h-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="islamic-grid-light" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 0 L60 30 L30 60 L0 30 Z M30 8 L52 30 L30 52 L8 30 Z" fill="none" stroke="#059669" strokeWidth="1.2" />
            <circle cx="30" cy="30" r="2.5" fill="#d97706" fillOpacity="0.4" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#islamic-grid-light)" />
        </svg>
      </div>

      <header className="relative z-10 w-full max-w-xl text-center pt-0.5 sm:pt-1 shrink-0">
        <div className="inline-flex items-center justify-center p-1 mb-0"><SchoolLogo size={52} className="filter drop-shadow-md transition-transform hover:scale-105" /></div>
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#174D3A] flex items-center justify-center gap-2">RAPORT INTEGRASI</h1>
          <p className="text-[10px] sm:text-[11px] font-semibold text-stone-600">Pondok Modern Al-Ghozali</p>
          <div className="flex items-center justify-center gap-2 text-amber-500 my-1">
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-amber-400" /><span className="text-xs font-bold">✦</span><div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-amber-400" />
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold text-[#174D3A] tracking-wide uppercase">
            LOGIN
          </h2>
          <p className="text-[10px] sm:text-[11px] text-stone-500">Silakan pilih peran dan identitas untuk masuk</p>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-4xl flex-1 min-h-0 flex items-center justify-center py-1.5 sm:py-2">
        <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md border border-stone-200/90 rounded-3xl shadow-xl shadow-emerald-950/5 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600" />
          <div className="p-3 sm:p-4 lg:p-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[190px_minmax(0,1fr)] gap-3 lg:gap-5 items-stretch">
              <div className="space-y-1.5 lg:row-span-5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5"><UserCheck size={14} className="text-emerald-700" /><span>1. Pilih Peran Pengguna</span></label>
                <div className="grid grid-cols-1 gap-1.5">
                  <button type="button" onClick={() => { setSelectedRole('guru'); setErrorMessage(''); }} className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-200 ${selectedRole === 'guru' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-2 ring-emerald-400/40' : 'bg-stone-50/80 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 hover:border-stone-300'}`}>
                    <BookOpen size={18} className={selectedRole === 'guru' ? 'text-emerald-700' : 'text-stone-400'} /><span className="font-bold text-xs">Guru</span><span className="text-[10px] text-stone-500 mt-0.5">Mapel</span>
                  </button>
                  <button type="button" onClick={() => { setSelectedRole('wali_kelas'); setErrorMessage(''); }} className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 ${selectedRole === 'wali_kelas' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm ring-2 ring-emerald-400/40' : 'bg-stone-50/80 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 hover:border-stone-300'}`}>
                    <GraduationCap size={18} className={selectedRole === 'wali_kelas' ? 'text-emerald-700' : 'text-stone-400'} /><span className="font-bold text-xs">Wali Kelas</span><span className="text-[10px] text-stone-500 mt-0.5">Cetak & Nilai</span>
                  </button>
                  <button type="button" onClick={() => { setSelectedRole('admin'); setErrorMessage(''); }} className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 ${selectedRole === 'admin' ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-sm ring-2 ring-amber-400/40' : 'bg-stone-50/80 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 hover:border-stone-300'}`}>
                    <ShieldCheck size={18} className={selectedRole === 'admin' ? 'text-amber-600' : 'text-stone-400'} /><span className="font-bold text-xs">Administrator</span><span className="text-[10px] text-stone-500 mt-0.5">Akses Penuh</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-start-2 flex flex-col gap-2 min-w-0">
                {selectedRole !== 'admin' && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5"><School size={14} className="text-emerald-700" /><span>2. Pilih Jenjang Sekolah</span></label>
                    <span className="text-[11px] text-emerald-700 font-medium hidden sm:inline">Mapel Kepondokan: TMMIA</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['SMP', 'SMA'] as JenjangUnit[]).map((unit) => (
                      <button key={unit} type="button" onClick={() => setSelectedUnit(unit)} className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all duration-150 flex flex-col items-center justify-center ${selectedUnit === unit ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-400' : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'}`}>
                        <span className="font-bold text-sm">{unit === 'SMP' ? 'Tingkat SMP' : 'Tingkat SMA'}</span>
                        <span className={`text-[10px] mt-0.5 line-clamp-1 ${selectedUnit === unit ? 'text-emerald-100' : 'text-stone-500'}`}>{unit === 'SMP' ? 'Mukim 1-3 • Full Day VII-IX' : 'Mukim 1-3 Int & 4-6 • Full Day X-XII'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

                {selectedRole !== 'admin' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5"><Users size={14} className="text-emerald-700" /><span>Nama Guru</span></label>
                    <span className="text-[11px] text-stone-500 font-medium">{availableTeachers.length} Guru di {selectedUnit}</span>
                  </div>
                  {availableTeachers.length > 8 && (
                    <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-stone-400" /><input type="text" value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} placeholder={`Cari nama guru ${selectedUnit}...`} className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white" /></div>
                  )}
                  <div className="relative">
                    <select value={selectedTeacherName} onChange={(e) => setSelectedTeacherName(e.target.value)} className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-xl text-stone-800 font-bold text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm cursor-pointer">
                      {filteredTeacherOptions.map((t, idx) => <option key={`${t.name}-${idx}`} value={t.name} className="py-1">{t.name} {t.homeroomInfo ? `— [${t.homeroomInfo}]` : ''}</option>)}
                    </select>
                  </div>
                  {selectedTeacherDetails && (
                    <div className="flex items-center justify-between gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-[10px] text-emerald-900 animate-fadeIn">
                      <span className="font-semibold truncate">Penugasan Terdaftar</span>
                      <span className="shrink-0 text-stone-600">{selectedTeacherDetails.assignedSubjectNames.length} Mapel • {selectedTeacherDetails.totalClassesCount} Kelas</span>
                    </div>
                  )}
                </div>
              )}

                {selectedRole !== 'admin' && (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound size={14} className="text-emerald-700" />
                    <span>PIN Guru / Wali Kelas</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={teacherPin}
                      onChange={(e) => setTeacherPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="Masukkan PIN 4-12 digit"
                      inputMode="numeric"
                      autoComplete="off"
                      className="w-full pl-4 pr-12 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 font-mono text-base font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm"
                    />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 transition">
                      {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500 px-1">
                    <Lock size={12} className="text-emerald-600" />
                    PIN diverifikasi di server dan tidak disimpan di frontend.
                  </div>
                </div>
              )}

                {selectedRole === 'admin' && (
                <div className="space-y-2 pt-1 animate-fadeIn lg:col-start-2">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5"><KeyRound size={14} className="text-amber-600" /><span>PIN</span></label>
                  <div className="relative">
                    <input type={showPin ? 'text' : 'password'} value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="Minimal 6 digit" autoComplete="current-password" className="w-full pl-4 pr-12 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 font-mono text-base font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm" />
                    <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 transition" title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}>{showPin ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 px-1"><span className="flex items-center gap-1"><Lock size={12} className="text-amber-600" />PIN Keamanan Sistem (Khusus Administrator)</span></div>
                </div>
                )}
                  {errorMessage && <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs animate-shake"><AlertCircle size={16} className="text-rose-600 shrink-0" /><span>{errorMessage}</span></div>}

                <button type="submit" disabled={isLoading} className="w-full py-2.5 px-6 rounded-xl bg-[#174D3A] hover:bg-[#123c2d] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-70">
                  {isLoading ? <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} className="text-amber-300" /><span>MASUK</span></>}
                </button>
                <div className="text-center pt-0"><span className="text-[11px] text-stone-500 inline-flex items-center gap-1">ⓘ Butuh bantuan? Hubungi Admin IT</span></div>
              </div>
            </form>
          </div>
          <div className="px-6 py-3 bg-stone-50/80 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500"><span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /><span>Otorisasi Penugasan Resmi</span></span><span className="font-medium text-stone-600">T.A. 2026/2027</span></div>
        </div>
      </main>

      <footer className="relative z-10 w-full max-w-xl text-center pb-0 pt-0.5 text-[9px] text-stone-500 space-y-0.5 shrink-0">
        <p>© 2026 Pondok Modern Al-Ghozali • Gunung Sindur, Bogor, Jawa Barat</p>
        <p className="font-arabic text-xs text-stone-600" dir="rtl">المعهد العصري الغزالي للتربية الإسلامية</p>
      </footer>
    </div>
  );
};
