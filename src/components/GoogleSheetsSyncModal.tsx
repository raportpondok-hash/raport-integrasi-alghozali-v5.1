import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  UploadCloud,
  DownloadCloud,
  HelpCircle,
  Settings,
  Sparkles,
  Table,
  Layers,
  LayoutDashboard,
  LogOut,
  FileSpreadsheet,
  PlusCircle,
  Link as LinkIcon,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  GOOGLE_APPS_SCRIPT_CODE,
  GOOGLE_APPS_SCRIPT_FULLDAY_CODE,
  testGoogleSheetsConnection,
  fetchAllScoresFromSheets,
  batchSyncAllToSheets,
  initAllClassSheetsInGoogleSheets,
} from '../services/googleSheetsService';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getCurrentGoogleUser,
  getAccessToken,
  SCOPES,
} from '../services/googleAuthService';
import {
  getStoredDirectSpreadsheetId,
  getStoredDirectSpreadsheetUrl,
  saveStoredDirectSpreadsheetId,
  extractSpreadsheetId,
  getSpreadsheetDetails,
  createSpreadsheetForClasses,
  syncAllScoresToSpreadsheet,
  pullScoresFromSpreadsheet,
} from '../services/googleSheetsDirectApi';
import { ClassItem, SchoolType } from '../types';
import { getSubjectsForClass } from '../data/curriculumSubjects';
import { findTeachersForSubjectAndClass } from '../data/teacherSubjectsDatabase';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveWebAppUrl: (url: string, schoolType?: SchoolType) => void;
  isAutoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  students: Array<{
    id: string;
    name: string;
    nisn: string;
    classId?: string;
    schoolType?: SchoolType;
    scores: Record<string, number>;
  }>;
  classes?: ClassItem[];
  onApplyScoresFromSheets: (studentsScores: Record<string, Record<string, number>>) => void;
  lastSyncTime?: string;
  adminAccess?: boolean;
  activeSchoolType?: SchoolType;
  onSelectSchoolType?: (type: SchoolType) => void;
  webAppUrlMukim?: string;
  webAppUrlFullDay?: string;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveWebAppUrl,
  isAutoSyncEnabled,
  onToggleAutoSync,
  students,
  classes = [],
  onApplyScoresFromSheets,
  lastSyncTime,
  adminAccess = false,
  activeSchoolType = 'mukim',
  onSelectSchoolType,
  webAppUrlMukim,
  webAppUrlFullDay,
}) => {
  const [modalSchoolType, setModalSchoolType] = useState<SchoolType>(activeSchoolType);
  const [selectedScriptType, setSelectedScriptType] = useState<SchoolType>(activeSchoolType);
  const [activeTab, setActiveTab] = useState<'google_oauth' | 'settings' | 'tutorial' | 'script'>(adminAccess ? 'script' : 'google_oauth');

  // Google OAuth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);
  const [oauthSpreadsheetInput, setOauthSpreadsheetInput] = useState('');
  const [oauthSpreadsheetTitle, setOauthSpreadsheetTitle] = useState('');
  const [isCheckingOauthSheet, setIsCheckingOauthSheet] = useState(false);
  const [isCreatingOauthSheet, setIsCreatingOauthSheet] = useState(false);
  const [isPushingOauth, setIsPushingOauth] = useState(false);
  const [isPullingOauth, setIsPullingOauth] = useState(false);
  const [oauthStatusMsg, setOauthStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Apps Script Web App State
  const [urlInput, setUrlInput] = useState(() => {
    if (activeSchoolType === 'fullday') return webAppUrlFullDay || webAppUrl || '';
    return webAppUrlMukim || webAppUrl || '';
  });
  const [testingStatus, setTestingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isInitializingSheets, setIsInitializingSheets] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; studentName: string; success: boolean } | null>(null);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setCachedToken(token);
      },
      () => {
        setGoogleUser(getCurrentGoogleUser());
        setCachedToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Admin tidak lagi mengatur URL Spreadsheet/Web App dari aplikasi.
  // Target spreadsheet dikelola server-side melalui Apps Script Script Properties.
  useEffect(() => {
    if (adminAccess && isOpen) setActiveTab('script');
  }, [adminAccess, isOpen]);

  // Update fields when activeSchoolType or isOpen changes
  useEffect(() => {
    if (activeSchoolType) {
      setModalSchoolType(activeSchoolType);
      setSelectedScriptType(activeSchoolType);
      if (activeSchoolType === 'fullday') {
        setUrlInput(webAppUrlFullDay || '');
      } else {
        setUrlInput(webAppUrlMukim || webAppUrl || '');
      }
      // Load saved direct spreadsheet URL/ID
      const directUrl = getStoredDirectSpreadsheetUrl(activeSchoolType);
      setOauthSpreadsheetInput(directUrl);
    }
  }, [activeSchoolType, webAppUrlMukim, webAppUrlFullDay, webAppUrl, isOpen]);

  const relevantClasses = (classes || []).filter((c) => {
    if (modalSchoolType === 'fullday') return c.schoolType === 'fullday';
    return c.schoolType !== 'fullday';
  });

  const relevantStudents = students.filter((s) => {
    if (modalSchoolType === 'fullday') {
      return s.schoolType === 'fullday' || relevantClasses.some((c) => c.id === s.classId);
    }
    return s.schoolType !== 'fullday';
  });

  if (!adminAccess || !isOpen) return null;

  const handleSwitchSchoolType = (type: SchoolType) => {
    setModalSchoolType(type);
    setSelectedScriptType(type);
    if (onSelectSchoolType) onSelectSchoolType(type);
    if (type === 'fullday') {
      setUrlInput(webAppUrlFullDay || '');
    } else {
      setUrlInput(webAppUrlMukim || webAppUrl || '');
    }
    setOauthSpreadsheetInput(getStoredDirectSpreadsheetUrl(type));
    setOauthSpreadsheetTitle('');
    setTestingStatus('idle');
    setStatusMessage('');
    setOauthStatusMsg(null);
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsLoggingInGoogle(true);
    setOauthStatusMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setCachedToken(result.accessToken);
        setOauthStatusMsg({
          type: 'success',
          text: `Berhasil terhubung dengan akun Google: ${result.user.email}`,
        });
      }
    } catch (err: any) {
      setOauthStatusMsg({
        type: 'error',
        text: err.message || 'Gagal masuk dengan akun Google. Periksa koneksi internet Anda.',
      });
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  // Google Sign-Out Handler
  const handleGoogleLogout = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setCachedToken(null);
      setOauthSpreadsheetTitle('');
      setOauthStatusMsg({
        type: 'info',
        text: 'Anda telah keluar dari akun Google.',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Check / Verify Google Sheet Access
  const handleVerifyGoogleSheet = async () => {
    let token = cachedToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      setOauthStatusMsg({
        type: 'error',
        text: 'Silakan login dengan akun Google terlebih dahulu untuk menghubungkan spreadsheet.',
      });
      return;
    }

    const sheetId = extractSpreadsheetId(oauthSpreadsheetInput);
    if (!sheetId) {
      setOauthStatusMsg({
        type: 'error',
        text: 'Format tautan atau ID Google Spreadsheet tidak valid. Masukkan URL docs.google.com/spreadsheets/d/...',
      });
      return;
    }

    setIsCheckingOauthSheet(true);
    setOauthStatusMsg(null);
    try {
      const details = await getSpreadsheetDetails(token, sheetId);
      setOauthSpreadsheetTitle(details.title);
      saveStoredDirectSpreadsheetId(sheetId, oauthSpreadsheetInput.trim(), modalSchoolType);
      setOauthStatusMsg({
        type: 'success',
        text: `Berhasil tersambung ke "${details.title}" (${details.sheets.length} sheet ditemukan).`,
      });
    } catch (err: any) {
      setOauthStatusMsg({
        type: 'error',
        text: `Gagal mengakses spreadsheet: ${err.message}. Pastikan akun Google Anda memiliki hak akses edit.`,
      });
    } finally {
      setIsCheckingOauthSheet(false);
    }
  };

  // Create new Google Sheet in user's Drive
  const handleCreateNewGoogleSheet = async () => {
    let token = cachedToken;
    if (!token) token = await getAccessToken();
    if (!token) {
      setOauthStatusMsg({
        type: 'error',
        text: 'Silakan login dengan akun Google Anda terlebih dahulu.',
      });
      return;
    }

    const typeLabel = modalSchoolType === 'fullday' ? 'Non-Mukim (Full Day)' : 'Pondok (Mukim)';
    const title = `Raport Pondok Modern Al-Ghozali - ${typeLabel}`;

    if (
      !confirm(
        `Buat Google Spreadsheet baru "${title}" di Google Drive Anda?\n\n` +
          `Aplikasi akan otomatis:\n` +
          `1. Membuat file spreadsheet baru di akun Google Anda.\n` +
          `2. Membuat tab sheet terpisah untuk setiap kelas ${typeLabel}.\n` +
          `3. Mengisi header kolom mata pelajaran & data ${relevantStudents.length} santri.\n` +
          `4. Menyimpan tautan spreadsheet secara otomatis.`
      )
    ) {
      return;
    }

    setIsCreatingOauthSheet(true);
    setOauthStatusMsg(null);
    try {
      const result = await createSpreadsheetForClasses(
        token,
        title,
        relevantClasses,
        relevantStudents
      );
      setOauthSpreadsheetInput(result.spreadsheetUrl);
      setOauthSpreadsheetTitle(title);
      saveStoredDirectSpreadsheetId(result.spreadsheetId, result.spreadsheetUrl, modalSchoolType);
      setOauthStatusMsg({
        type: 'success',
        text: `Spreadsheet baru "${title}" berhasil dibuat di Google Drive Anda!`,
      });
    } catch (err: any) {
      setOauthStatusMsg({
        type: 'error',
        text: `Gagal membuat spreadsheet: ${err.message}`,
      });
    } finally {
      setIsCreatingOauthSheet(false);
    }
  };

  // Push all grades to Google Sheets
  const handlePushGradesToGoogleSheets = async () => {
    let token = cachedToken;
    if (!token) token = await getAccessToken();
    if (!token) {
      alert('Silakan login dengan Google terlebih dahulu.');
      return;
    }

    const sheetId = extractSpreadsheetId(oauthSpreadsheetInput);
    if (!sheetId) {
      alert('Silakan masukkan atau sambungkan Google Spreadsheet terlebih dahulu.');
      return;
    }

    const typeLabel = modalSchoolType === 'fullday' ? 'Full Day' : 'Pondok (Mukim)';
    if (
      !confirm(
        `Kirim / Sinkronkan seluruh nilai dari ${relevantStudents.length} santri ${typeLabel} ke Google Sheets?\n\n` +
          `Data nilai akan ditulis rapi ke masing-masing tab kelas di Google Spreadsheet.`
      )
    ) {
      return;
    }

    setIsPushingOauth(true);
    setOauthStatusMsg(null);
    try {
      const res = await syncAllScoresToSpreadsheet(token, sheetId, relevantClasses, relevantStudents);
      setOauthStatusMsg({
        type: 'success',
        text: `Berhasil mengunggah nilai ke Google Sheets! (${res.updatedTabsCount} tab kelas diperbarui untuk ${res.updatedStudentsCount} santri).`,
      });
    } catch (err: any) {
      setOauthStatusMsg({
        type: 'error',
        text: `Gagal sinkronisasi: ${err.message}`,
      });
    } finally {
      setIsPushingOauth(false);
    }
  };

  // Pull grades from Google Sheets
  const handlePullGradesFromGoogleSheets = async () => {
    let token = cachedToken;
    if (!token) token = await getAccessToken();
    if (!token) {
      alert('Silakan login dengan Google terlebih dahulu.');
      return;
    }

    const sheetId = extractSpreadsheetId(oauthSpreadsheetInput);
    if (!sheetId) {
      alert('Silakan masukkan tautan Google Spreadsheet terlebih dahulu.');
      return;
    }

    setIsPullingOauth(true);
    setOauthStatusMsg(null);
    try {
      const res = await pullScoresFromSpreadsheet(token, sheetId, relevantClasses, relevantStudents);
      const studentCount = Object.keys(res.scoresMap).length;
      if (studentCount > 0) {
        onApplyScoresFromSheets(res.scoresMap);
        setOauthStatusMsg({
          type: 'success',
          text: `Berhasil menarik nilai dari Google Sheets! Nilai untuk ${studentCount} santri telah diperbarui ke aplikasi.`,
        });
      } else {
        setOauthStatusMsg({
          type: 'info',
          text: 'Tidak ditemukan perubahan nilai baru di sheet kelas. Pastikan nama tab sheet sesuai dengan nama kelas.',
        });
      }
    } catch (err: any) {
      setOauthStatusMsg({
        type: 'error',
        text: `Gagal menarik nilai: ${err.message}`,
      });
    } finally {
      setIsPullingOauth(false);
    }
  };

  // Apps Script Web App Handlers
  const handleTestConnection = async () => {
    if (!urlInput.trim()) {
      setTestingStatus('error');
      setStatusMessage('Silakan masukkan URL Web App Google Apps Script terlebih dahulu.');
      return;
    }

    setTestingStatus('loading');
    setStatusMessage('Menghubungkan ke Google Spreadsheet...');

    const res = await testGoogleSheetsConnection(urlInput);
    if (res.success) {
      setTestingStatus('success');
      setStatusMessage(res.message);
      onSaveWebAppUrl(urlInput.trim(), modalSchoolType);
    } else {
      setTestingStatus('error');
      setStatusMessage(res.message);
    }
  };

  const handlePullData = async () => {
    if (!urlInput.trim()) {
      alert('URL Web App Google Sheets belum diatur.');
      return;
    }

    setIsPulling(true);
    try {
      const res = await fetchAllScoresFromSheets(urlInput);
      if (res.success && res.studentsScores) {
        onApplyScoresFromSheets(res.studentsScores);
        alert(`Berhasil menarik nilai dari Google Spreadsheet! (${res.rowCount || 0} baris nilai dimuat)`);
      } else {
        alert(res.message || 'Gagal menarik data dari Google Spreadsheet');
      }
    } catch (e: any) {
      alert(`Error saat menarik data: ${e.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushData = async () => {
    if (!urlInput.trim()) {
      alert('URL Web App Google Sheets belum diatur.');
      return;
    }

    const typeLabel = modalSchoolType === 'fullday' ? 'Full Day' : 'Pondok (Mukim)';
    if (
      !confirm(
        `Apakah Anda yakin ingin mengunggah seluruh nilai dari ${relevantStudents.length} siswa ${typeLabel} ke Google Spreadsheet?\n\n` +
          `Data nilai akan dimasukkan ke masing-masing Sheet Rekap Kelas lengkap dengan nama siswa dan guru, serta memperbarui Sheet Dashboard_Monitoring.`
      )
    ) {
      return;
    }

    setIsPushing(true);
    setSyncProgress({ current: 0, total: relevantStudents.length, studentName: '', success: true });
    try {
      const payload = relevantClasses.map((cls) => {
        const classSubjects = getSubjectsForClass(cls.id).map((sub) => ({
          id: sub.id,
          nameId: sub.nameId,
          teacherName: findTeachersForSubjectAndClass(sub.nameId, cls.nameLatin).join(', ') || '-',
        }));

        const classStudents = relevantStudents
          .filter((s) => s.classId === cls.id)
          .map((s) => ({
            id: s.id,
            name: s.name,
            nisn: s.nisn || '',
            scores: s.scores,
          }));

        return {
          id: cls.id,
          nameLatin: cls.nameLatin,
          waliKelasName: cls.waliKelasName,
          students: classStudents,
          subjects: classSubjects,
        };
      });

      // Kelompokkan kelas berdasarkan target spreadsheet agar data tidak bercampur.
      const routeForClass = (classId: string) => {
        const routed = new URL(urlInput.trim());
        const normalized = String(classId || '').toLowerCase();
        routed.searchParams.set('schoolType', modalSchoolType);
        routed.searchParams.set(
          'unit',
          /^(x-|xi-|xii-)/.test(normalized) || /^(1int|2int|3int|4|5|6)/.test(normalized) ? 'SMA' : 'SMP'
        );
        routed.searchParams.set('classId', normalized);
        return routed.toString();
      };

      const groups = new Map<string, typeof payload>();
      for (const cls of payload) {
        const route = routeForClass(cls.id);
        if (!groups.has(route)) groups.set(route, []);
        groups.get(route)!.push(cls);
      }

      const initResults = [];
      for (const [route, group] of groups.entries()) {
        initResults.push(await initAllClassSheetsInGoogleSheets(route, group));
      }

      const syncRes = await batchSyncAllToSheets(urlInput, relevantStudents, (progress) => {
        setSyncProgress(progress);
      });

      const initSuccess = initResults.every((item) => item.success);
      if (initSuccess && syncRes.success) {
        alert('Berhasil mengunggah seluruh nilai siswa ' + typeLabel + ' ke Google Spreadsheet sesuai kelas/program!');
      } else {
        const failedInit = initResults.find((item) => !item.success);
        alert(failedInit?.message || syncRes.message || 'Gagal mengunggah nilai ke Google Spreadsheet');
      }
    } catch (e: any) {
      alert(`Error saat mengunggah data: ${e.message}`);
    } finally {
      setIsPushing(false);
      setTimeout(() => setSyncProgress(null), 1800);
    }
  };

  const handleInitAllSheets = async () => {
    if (!urlInput.trim()) {
      alert('URL Web App Google Sheets belum diatur.');
      return;
    }

    const classCount = relevantClasses.length;
    const typeLabel = modalSchoolType === 'fullday' ? 'Full Day' : 'Pondok (Mukim)';
    if (
      !confirm(
        `Apakah Anda ingin membuat ${classCount} Sheet Rekap Kelas ${typeLabel} beserta Sheet "Dashboard_Monitoring" di Google Spreadsheet?\n\n` +
          `• Setiap kelas akan dibuatkan sheet rapi lengkap dengan Kop Resmi, NISN, nama santri/siswa, kolom mata pelajaran, dan nama guru pengampu.\n` +
          `• Sheet "Dashboard_Monitoring" otomatis menampilkan seluruh mata pelajaran, guru pengampu, total siswa, dan status pengisian nilai.\n\n` +
          `Klik OK untuk melanjutkan proses inisialisasi.`
      )
    ) {
      return;
    }

    setIsInitializingSheets(true);
    try {
      const payload = relevantClasses.map((cls) => {
        const classSubjects = getSubjectsForClass(cls.id).map((sub) => ({
          id: sub.id,
          nameId: sub.nameId,
          teacherName: findTeachersForSubjectAndClass(sub.nameId, cls.nameLatin).join(', ') || '-',
        }));

        const classStudents = relevantStudents
          .filter((s) => s.classId === cls.id)
          .map((s) => ({
            id: s.id,
            name: s.name,
            nisn: s.nisn || '',
            scores: s.scores,
          }));

        return {
          id: cls.id,
          nameLatin: cls.nameLatin,
          waliKelasName: cls.waliKelasName,
          students: classStudents,
          subjects: classSubjects,
        };
      });

      const res = await initAllClassSheetsInGoogleSheets(urlInput, payload);
      if (res.success) {
        alert(
          `Berhasil! Seluruh ${classCount} sheet rekap kelas dan Dashboard_Monitoring telah berhasil dibuat di Google Spreadsheet ${typeLabel} Anda!`
        );
      } else {
        alert(res.message || 'Gagal menginisialisasi spreadsheet');
      }
    } catch (e: any) {
      alert(`Error saat inisialisasi: ${e.message || String(e)}`);
    } finally {
      setIsInitializingSheets(false);
    }
  };

  const handleCopyScript = () => {
    const codeToCopy = selectedScriptType === 'fullday' ? GOOGLE_APPS_SCRIPT_FULLDAY_CODE : GOOGLE_APPS_SCRIPT_CODE;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-stone-900">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Cloud size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Google Sheets & Drive Integration</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-full font-medium">
                  Resmi OAuth 2.0
                </span>
              </h2>
              <p className="text-xs text-emerald-200/80">
                Sinkronisasi nilai santri langsung dengan Google Spreadsheet di Google Drive Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-emerald-200/70 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-6 pt-2 shrink-0 gap-1 overflow-x-auto">
          {!adminAccess && (
            <>
                      <button
                        type="button"
                        onClick={() => setActiveTab('google_oauth')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                          activeTab === 'google_oauth'
                            ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                            : 'border-transparent text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        <span>Koneksi Akun Google (Direct API)</span>
                      </button>
            
                      <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                          activeTab === 'settings'
                            ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                            : 'border-transparent text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <Settings size={15} />
                        <span>Web App (Apps Script)</span>
                      </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('tutorial')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'tutorial'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <HelpCircle size={15} />
            <span>Panduan Penggunaan</span>
          </button>

          {adminAccess && (
            <button
              type="button"
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === 'script'
                  ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              <Table size={15} />
              <span>Kode Skrip (Opsional)</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {syncProgress && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm animate-fade-in">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <UploadCloud size={17} className={isPushing ? 'animate-pulse' : ''} />
                  <span>{isPushing ? 'Mengirim data siswa...' : 'Sinkronisasi selesai'}</span>
                </div>
                <span className="text-base font-extrabold text-emerald-800 tabular-nums">
                  {syncProgress.current}/{syncProgress.total}
                </span>
              </div>
              <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${syncProgress.total ? (syncProgress.current / syncProgress.total) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-emerald-800">
                {syncProgress.current > 0
                  ? `✓ ${syncProgress.studentName} sudah terkirim`
                  : 'Menyiapkan data siswa...'}
              </div>

              {syncProgress.current > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-white border border-emerald-100 p-2">
                  <div className="text-[10px] font-bold text-emerald-700 mb-1">Daftar siswa yang sudah terkirim</div>
                  <div className="space-y-1">
                    {relevantStudents.slice(0, syncProgress.current).map((student, index) => (
                      <div key={student.id} className="flex items-center gap-2 text-[11px] text-emerald-900">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{index + 1}. {student.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {syncProgress.current >= syncProgress.total && syncProgress.total > 0 && (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-white p-4 text-center animate-fade-in">
                  <div className="text-2xl mb-1 animate-pulse">🎉</div>
                  <div className="text-base font-extrabold text-emerald-800">
                    Alhamdulillah, sudah 100%
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">
                    Semua {syncProgress.total} siswa berhasil terkirim ke Google Sheets.
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Target School Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-stone-100 rounded-xl border border-stone-200">
            <div>
              <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>Target Database:</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    modalSchoolType === 'fullday'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {modalSchoolType === 'fullday' ? 'Non-Mukim (Full Day)' : 'Pondok (Mukim)'}
                </span>
              </div>
              <div className="text-[11px] text-stone-500">
                Data santri aktif: {relevantStudents.length} santri ({relevantClasses.length} kelas)
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-stone-300 shrink-0">
              <button
                type="button"
                onClick={() => handleSwitchSchoolType('mukim')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  modalSchoolType === 'mukim'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>🕌</span>
                <span>Pondok (Mukim)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchSchoolType('fullday')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  modalSchoolType === 'fullday'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>🏫</span>
                <span>Non-Mukim (Full Day)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: GOOGLE DIRECT OAUTH 2.0 (PRIMARY) */}
          {activeTab === 'google_oauth' && (
            <div className="space-y-6">
              {/* Status Alert Message */}
              {oauthStatusMsg && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    oauthStatusMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : oauthStatusMsg.type === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-blue-50 border-blue-300 text-blue-900'
                  }`}
                >
                  {oauthStatusMsg.type === 'success' ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : oauthStatusMsg.type === 'error' ? (
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Cloud size={16} className="text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 font-medium">{oauthStatusMsg.text}</div>
                </div>
              )}

              {/* 1. GOOGLE ACCOUNT SIGN IN SECTION */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-stone-800 flex items-center gap-2 text-sm">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span>Autentikasi Akun Google</span>
                  </div>
                  {googleUser && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Terhubung
                    </span>
                  )}
                </div>

                {!googleUser ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-stone-200">
                    <div>
                      <p className="text-xs text-stone-600">
                        Masuk dengan akun Google Anda untuk membaca dan menyimpan nilai langsung ke Google Sheets di Google Drive Anda.
                      </p>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Izin diperlukan: Google Sheets (membaca & memperbarui spreadsheet nilai) dan Google Drive.
                      </p>
                    </div>

                    {/* Official Sign In with Google Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoggingInGoogle}
                      className="inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs rounded-xl border border-stone-300 shadow-xs hover:shadow transition shrink-0 active:scale-98 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoggingInGoogle ? (
                        <RefreshCw size={18} className="animate-spin text-emerald-600" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                          />
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          />
                        </svg>
                      )}
                      <span>{isLoggingInGoogle ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-stone-200">
                    <div className="flex items-center gap-3">
                      {googleUser.photoURL ? (
                        <img
                          src={googleUser.photoURL}
                          alt={googleUser.displayName || 'Google User'}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-emerald-300 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          <UserIcon size={18} />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-stone-800 text-xs">
                          {googleUser.displayName || 'Pengguna Google'}
                        </div>
                        <div className="text-[11px] text-stone-500">{googleUser.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                    >
                      <LogOut size={14} />
                      <span>Keluar Akun Google</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. SPREADSHEET TARGET SELECTION & CREATION */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4">
                <div className="font-bold text-stone-800 flex items-center gap-2 text-sm">
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                  <span>File Google Spreadsheet Target</span>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-stone-700 text-xs">
                    Tautan (URL) atau ID Google Spreadsheet:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={oauthSpreadsheetInput}
                      onChange={(e) => setOauthSpreadsheetInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit..."
                      className="flex-1 bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyGoogleSheet}
                      disabled={isCheckingOauthSheet || !oauthSpreadsheetInput.trim()}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    >
                      {isCheckingOauthSheet ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      <span>Sambungkan</span>
                    </button>
                  </div>
                  {oauthSpreadsheetTitle && (
                    <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>Tersambung: <b>{oauthSpreadsheetTitle}</b></span>
                    </div>
                  )}
                </div>

                {/* Quick actions: Create new or Open in Sheets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCreateNewGoogleSheet}
                    disabled={isCreatingOauthSheet || !googleUser}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl transition text-xs disabled:opacity-50"
                  >
                    {isCreatingOauthSheet ? (
                      <RefreshCw size={14} className="animate-spin text-emerald-600" />
                    ) : (
                      <Sparkles size={14} className="text-emerald-600" />
                    )}
                    <span>✦ Buat Spreadsheet Baru di Google Drive Saya</span>
                  </button>

                  {oauthSpreadsheetInput && (
                    <a
                      href={oauthSpreadsheetInput.startsWith('http') ? oauthSpreadsheetInput : `https://docs.google.com/spreadsheets/d/${oauthSpreadsheetInput}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-medium rounded-xl transition text-xs"
                    >
                      <ExternalLink size={14} className="text-stone-500" />
                      <span>Buka Spreadsheet di Tab Baru</span>
                    </a>
                  )}
                </div>
              </div>

              {/* 3. SYNC ACTIONS (PUSH & PULL) */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-4">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span className="text-sm">Aksi Sinkronisasi Data Nilai</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-stone-700 cursor-pointer flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isAutoSyncEnabled}
                        onChange={(e) => onToggleAutoSync(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Auto-Sync saat Nilai Diisi</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Push Button */}
                  <button
                    type="button"
                    onClick={handlePushGradesToGoogleSheets}
                    disabled={isPushingOauth || !oauthSpreadsheetInput.trim()}
                    className="p-4 bg-white hover:bg-emerald-50/70 border border-emerald-300 rounded-xl shadow-xs hover:shadow transition text-left space-y-2 group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        {isPushingOauth ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <UploadCloud size={16} />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        Aplikasi → Sheets
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                        Kirim Seluruh Nilai ke Google Sheets
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                        Tuliskan seluruh nilai santri {modalSchoolType === 'fullday' ? 'Full Day' : 'Mukim'} ke masing-masing tab kelas di Google Spreadsheet.
                      </div>
                    </div>
                  </button>

                  {/* Pull Button */}
                  <button
                    type="button"
                    onClick={handlePullGradesFromGoogleSheets}
                    disabled={isPullingOauth || !oauthSpreadsheetInput.trim()}
                    className="p-4 bg-white hover:bg-blue-50/70 border border-blue-200 rounded-xl shadow-xs hover:shadow transition text-left space-y-2 group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {isPullingOauth ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <DownloadCloud size={16} />
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                        Sheets → Aplikasi
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 group-hover:text-blue-800 transition-colors">
                        Tarik Nilai dari Google Sheets
                      </div>
                      <div className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                        Perbarui nilai di aplikasi dengan membaca perubahan nilai dari Google Sheets secara langsung.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WEB APP APPS SCRIPT (ALTERNATIVE / FALLBACK) */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Status Koneksi Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  testingStatus === 'success' || (urlInput && testingStatus === 'idle')
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : testingStatus === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <div className="mt-0.5">
                  {testingStatus === 'loading' ? (
                    <RefreshCw size={18} className="animate-spin text-emerald-600" />
                  ) : testingStatus === 'success' || (urlInput && testingStatus === 'idle') ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : testingStatus === 'error' ? (
                    <AlertCircle size={18} className="text-rose-600" />
                  ) : (
                    <Cloud size={18} className="text-stone-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    {testingStatus === 'loading'
                      ? 'Sedang menguji koneksi...'
                      : testingStatus === 'success'
                      ? 'Tersambung ke Google Spreadsheet'
                      : testingStatus === 'error'
                      ? 'Gagal Terhubung ke Google Spreadsheet'
                      : urlInput
                      ? 'URL Tersimpan & Siap Digunakan'
                      : 'Koneksi Belum Diatur'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {statusMessage ||
                      (urlInput
                        ? 'Aplikasi telah memiliki URL sinkronisasi. Guru dapat langsung mengisi nilai.'
                        : 'Masukkan URL Web App Google Apps Script Anda untuk menghubungkan semua perangkat guru.')}
                  </div>
                </div>
              </div>

              {/* Input URL Web App */}
              <div className="space-y-2">
                <label className="block font-bold text-stone-800">
                  URL Web App Google Apps Script ({modalSchoolType === 'fullday' ? 'Full Day' : 'Pondok Mukim'}):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingStatus === 'loading' || !urlInput.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {testingStatus === 'loading' ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Uji Koneksi</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons for Web App */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleInitAllSheets}
                  disabled={isInitializingSheets || !urlInput.trim()}
                  className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl font-bold text-emerald-900 transition flex flex-col items-center justify-center gap-1 disabled:opacity-50 text-center"
                >
                  <Sparkles size={18} className="text-emerald-700" />
                  <span>Inisialisasi Sheet Kelas</span>
                  <span className="text-[10px] font-normal text-emerald-700">
                    Buat {relevantClasses.length} tab kelas otomatis
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePushData}
                  disabled={isPushing || !urlInput.trim()}
                  className="p-3 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl font-bold text-stone-800 transition flex flex-col items-center justify-center gap-1 disabled:opacity-50 text-center"
                >
                  <UploadCloud size={18} className="text-stone-700" />
                  <span>Kirim Nilai ke Sheets</span>
                  <span className="text-[10px] font-normal text-stone-500">
                    Unggah seluruh nilai {relevantStudents.length} santri
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handlePullData}
                  disabled={isPulling || !urlInput.trim()}
                  className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-blue-900 transition flex flex-col items-center justify-center gap-1 disabled:opacity-50 text-center"
                >
                  <DownloadCloud size={18} className="text-blue-700" />
                  <span>Tarik Nilai dari Sheets</span>
                  <span className="text-[10px] font-normal text-blue-600">
                    Muat nilai yang diedit di spreadsheet
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PANDUAN PENGGUNAAN */}
          {activeTab === 'tutorial' && (
            <div className="space-y-4 text-stone-700 leading-relaxed">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-700" />
                  <span>Metode 1: Koneksi Akun Google Resmi (Paling Mudah)</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-emerald-900">
                  <li>
                    Klik tombol <b>"Sign in with Google"</b> pada tab Koneksi Akun Google.
                  </li>
                  <li>
                    Beri izin akses Google Sheets dan Google Drive untuk membaca dan memperbarui spreadsheet nilai santri.
                  </li>
                  <li>
                    Klik tombol <b>"✦ Buat Spreadsheet Baru di Google Drive Saya"</b>, atau tempel tautan Google Spreadsheet yang sudah Anda miliki.
                  </li>
                  <li>
                    Gunakan tombol <b>"Kirim Seluruh Nilai"</b> untuk mengunggah nilai, atau <b>"Tarik Nilai"</b> untuk memperbarui nilai dari spreadsheet ke aplikasi.
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <Settings size={18} className="text-stone-700" />
                  <span>Metode 2: Google Apps Script Web App (Alternatif)</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-stone-600">
                  <li>Buat Google Spreadsheet baru di Google Drive Anda.</li>
                  <li>
                    Buka menu <b>Ekstensi &gt; Apps Script</b>.
                  </li>
                  <li>Salin kode skrip dari tab "Kode Skrip" dan tempel ke editor Apps Script.</li>
                  <li>
                    Klik <b>Deploy &gt; New deployment &gt; Pilih Web App</b>, lalu atur akses ke <b>Anyone</b>.
                  </li>
                  <li>Salin URL Web App yang dihasilkan dan tempelkan pada tab Web App di aplikasi ini.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: KODE SKRIP APPS SCRIPT */}
          {activeTab === 'script' && adminAccess && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-800">
                  Kode Google Apps Script ({selectedScriptType === 'fullday' ? 'Full Day' : 'Pondok Mukim'}):
                </div>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition text-xs"
                >
                  {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedScript ? 'Tersalin!' : 'Salin Semua Kode'}</span>
                </button>
              </div>

              <pre className="p-4 bg-stone-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-72 border border-stone-800">
                {selectedScriptType === 'fullday' ? GOOGLE_APPS_SCRIPT_FULLDAY_CODE : GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <Cloud size={14} className="text-emerald-600" />
            <span>
              {googleUser ? `Terhubung sebagai ${googleUser.email}` : 'Google Sheets & Drive Integration Ready'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-stone-200 text-stone-700 border border-stone-300 font-bold rounded-xl transition text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
