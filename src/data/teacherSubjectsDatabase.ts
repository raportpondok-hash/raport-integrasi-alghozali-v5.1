import { MASTER_TEACHING_SCHEDULE } from './masterTeachingSchedule';
import { TEACHER_ASSIGNMENTS_REKAP, TeacherAssignmentRecord } from './teacherAssignmentsRekap';
import { TEACHER_ASSIGNMENTS_SMA_REKAP } from './teacherAssignmentsSMARekap';

export { MASTER_TEACHING_SCHEDULE };
export const ALL_TEACHER_ASSIGNMENTS: TeacherAssignmentRecord[] = MASTER_TEACHING_SCHEDULE;

export interface RawTeacherSubjectJSON {
  'Kode Mata Pelajaran': string;
  'Nama Mata Pelajaran': string;
  'Guru Pengampu': string;
  Unit: 'SMA' | 'SMP' | 'TMMIA';
  'Daftar Kelas': string;
}

export interface TeacherSubjectEntry {
  kode: string;
  namaMapel: string;
  guruPengampu: string[];
  guruPengampuRaw: string;
  unit: 'SMA' | 'SMP' | 'TMMIA';
  daftarKelas: string[];
  daftarKelasRaw: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  academicTitle: string;
  units: ('SMA' | 'SMP' | 'TMMIA')[];
  subjects: {
    kode: string;
    namaMapel: string;
    unit: 'SMA' | 'SMP' | 'TMMIA';
    daftarKelas: string[];
  }[];
  classesTaught: string[];
  totalClassesCount: number;
}

export const RAW_TEACHER_SUBJECTS_DATA: RawTeacherSubjectJSON[] = [
  {
    "Kode Mata Pelajaran": "SMA01",
    "Nama Mata Pelajaran": "ALQUR'AN SMA",
    "Guru Pengampu": "MURSYID ANWAR, S.Pd., M.Pd.; NAMIN, S.Pd.I.",
    "Unit": "SMA",
    "Daftar Kelas": "X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA02",
    "Nama Mata Pelajaran": "ANTROPOLOGI SMA",
    "Guru Pengampu": "M. HIDAYATU RUSYDI, SH; SALEHA MUFIDA, S.Sos., M.Han.",
    "Unit": "SMA",
    "Daftar Kelas": "2 INT IPS; 3 INT IPS; 5 B IPS Putri; 5 D IPS Putra; 6 B IPS Putri; 6 D IPS Putra; XI-IPS Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA03",
    "Nama Mata Pelajaran": "B. INDONESIA SMA",
    "Guru Pengampu": "BARIROTUL CHOIRIYAH, S.E.I.; EDI SANJAYA, S.Pd.; FADILLAH ABIDANA, S.S., M.Pd.,; H. ASEP SAEPUDIN, M.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA04",
    "Nama Mata Pelajaran": "B. INGGRIS SMA",
    "Guru Pengampu": "AHMAD FIRDAUS, S.Ag.; FADILLAH ABIDANA, S.S., M.Pd.,; LULU ZAHROTUN NISA, S.Pd.; MUSLICH ANWAR, M.Pd.; ZAINI FIKRI, S.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA05",
    "Nama Mata Pelajaran": "B. SUNDA SMA",
    "Guru Pengampu": "DIDAH ROSIDAH, S.Pd.; SITI NURZULFIAH, S.Pd.I",
    "Unit": "SMA",
    "Daftar Kelas": "2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA06",
    "Nama Mata Pelajaran": "BAHASA ARAB SMA",
    "Guru Pengampu": "M. ALIEF NUGRAHA ATFA, S.H.; SOPIAN HADI, S.Pd.I.",
    "Unit": "SMA",
    "Daftar Kelas": "X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA07",
    "Nama Mata Pelajaran": "BIOLOGI SMA",
    "Guru Pengampu": "KHAIRIL FAHMI, S.Pd.; PADLIN, M.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 3 INT IPA; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 C IPA Putra; 6 A IPA Putri; 6 C IPA Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XII-IPA Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA08",
    "Nama Mata Pelajaran": "EKONOMI SMA",
    "Guru Pengampu": "BARIROTUL CHOIRIYAH, S.E.I.; DONI SUBIYANTO, S.E.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPS; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 B IPS Putri; 5 D IPS Putra; 6 B IPS Putri; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPS Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA09",
    "Nama Mata Pelajaran": "FIQIH SMA",
    "Guru Pengampu": "MUHAMMAD SUHAIL, S.Pd.I.; NURLAILA, S.Ag.",
    "Unit": "SMA",
    "Daftar Kelas": "X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA10",
    "Nama Mata Pelajaran": "FISIKA SMA",
    "Guru Pengampu": "RIZKI KAROMAH, S.Si.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 3 INT IPA; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 C IPA Putra; 6 A IPA Putri; 6 C IPA Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XII-IPA Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA11",
    "Nama Mata Pelajaran": "GEOGRAFI SMA",
    "Guru Pengampu": "BARIROTUL CHOIRIYAH, S.E.I.; DONI SUBIYANTO, S.E.; KHAIRIL FAHMI, S.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPS; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 B IPS Putri; 5 D IPS Putra; 6 B IPS Putri; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPS Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA12",
    "Nama Mata Pelajaran": "HADIS SMA",
    "Guru Pengampu": "SARONI",
    "Unit": "SMA",
    "Daftar Kelas": "X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA13",
    "Nama Mata Pelajaran": "INFORMATIKA SMA",
    "Guru Pengampu": "AHMAD LUJAENILMA, S.Kom.; FADHILLAH, S.Pd.; MUHAMAD RAHUL SAYYID, S.Kom.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA14",
    "Nama Mata Pelajaran": "KIMIA SMA",
    "Guru Pengampu": "Ir. RAHMAWATI, M.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 3 INT IPA; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 C IPA Putra; 6 A IPA Putri; 6 C IPA Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XII-IPA Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA15",
    "Nama Mata Pelajaran": "LIFE SKILL SMA",
    "Guru Pengampu": "FADHILLAH, S.Pd.; HAFIZD HIDAYAT, S.Pd., Gr.",
    "Unit": "SMA",
    "Daftar Kelas": "2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA16",
    "Nama Mata Pelajaran": "MATEMATIKA SMA",
    "Guru Pengampu": "ISNAN APRIZAL HAFIZH; ISWAHYUDIN, S.E.; NURACHMAN, M.Pd.; PADLIN, M.Pd.; PUTRI DINAH OKTAVIA, S.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA17",
    "Nama Mata Pelajaran": "MTK TINGKAT LANJUT SMA",
    "Guru Pengampu": "PUTRI DINAH OKTAVIA, S.Pd.; RIZKI KAROMAH, S.Si.",
    "Unit": "SMA",
    "Daftar Kelas": "2 INT IPA; 3 INT IPA; 5 A IPA Putri; 5 C IPA Putra; 6 A IPA Putri; 6 C IPA Putra; XI-IPA Full Day; XII-IPA Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA18",
    "Nama Mata Pelajaran": "P A I SMA",
    "Guru Pengampu": "MUHAMMAD SUHAIL, S.Pd.I.; NURLAILA, S.Ag.; SADAM HAMZAH, S.H.I.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA19",
    "Nama Mata Pelajaran": "PEND. PANCASILA SMA",
    "Guru Pengampu": "ANTONI FIRDAUS, S.H.I., M.Pd.; RENDI RAMADHAN, S.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA20",
    "Nama Mata Pelajaran": "PENJAS SMA",
    "Guru Pengampu": "AHMAD FATHURACHMAN, S.Pd.; WINTARSA, S.Pd.I.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA21",
    "Nama Mata Pelajaran": "SEJARAH SMA",
    "Guru Pengampu": "M. HIDAYATU RUSYDI, SH; RISMAWATI, S.Sos.; SALEHA MUFIDA, S.Sos., M.Han.; SUBHAN, S.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA22",
    "Nama Mata Pelajaran": "SOSIOLOGI SMA",
    "Guru Pengampu": "LIYAS SYARIFUDIN, M.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "1 Intensif; 2 INT IPS; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 B IPS Putri; 5 D IPS Putra; 6 B IPS Putri; 6 D IPS Putra; X-A Full Day Putri; X-B Full Day Putra; XI-IPS Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMA23",
    "Nama Mata Pelajaran": "TAHFIZ SMA",
    "Guru Pengampu": "FADHILLAH, S.Pd.; KHAIRIL FAHMI, S.Pd.; LULU ZAHROTUN NISA, S.Pd.",
    "Unit": "SMA",
    "Daftar Kelas": "X-A Full Day Putri; X-B Full Day Putra; XI-IPA Full Day; XI-IPS Full Day; XII-IPA Full Day; XII-IPS Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP01",
    "Nama Mata Pelajaran": "B. INDONESIA SMP",
    "Guru Pengampu": "AINI SYIFA, S.S.; EDI SANJAYA, S.Pd.; YAYAT FITRIYAH, M.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP02",
    "Nama Mata Pelajaran": "B. INGGRIS SMP",
    "Guru Pengampu": "ASEP SAEPUL MILLAH, M.Pd.; HAFIZD HIDAYAT, S.Pd., Gr.; LULU ZAHROTUN NISA, S.Pd.; MARIA ULFA, S.S; MURSYID ANWAR, S.Pd., M.Pd.; PRITA FATHIMAH ASRA; RAHMATI KURRATA'AINI, S.S.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP03",
    "Nama Mata Pelajaran": "B. SUNDA SMP",
    "Guru Pengampu": "DIDAH ROSIDAH, S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 B Putri; 1 E Putra; 2 B Putri; 2 C Putri; 2 E Putra; 2 F Putra; 3 B Putri; 3 C Putri; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP04",
    "Nama Mata Pelajaran": "BAHASA ARAB SMP",
    "Guru Pengampu": "BAYU NIRPANA, M.H.; ICHSANUL AFIEF, S.Sos.",
    "Unit": "SMP",
    "Daftar Kelas": "IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP05",
    "Nama Mata Pelajaran": "BTQ SMP",
    "Guru Pengampu": "M. ALIEF NUGRAHA ATFA, S.H.; SATRIA NUR OKTAVIANTO; SOPIAN HADI, S.Pd.I.",
    "Unit": "SMP",
    "Daftar Kelas": "IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP06",
    "Nama Mata Pelajaran": "FIQIH SMP",
    "Guru Pengampu": "AHMAD SUKANTA, S.Pd.I.; PUTRI ENJELIKAL FALAH, S.E.; SATRIA NUR OKTAVIANTO; SOPIAN HADI, S.Pd.I.",
    "Unit": "SMP",
    "Daftar Kelas": "IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP07",
    "Nama Mata Pelajaran": "HADIS SMP",
    "Guru Pengampu": "AHMAD SUKANTA, S.Pd.I.; DINDA NAAFIDA ARIFIN, S.S.",
    "Unit": "SMP",
    "Daftar Kelas": "IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP08",
    "Nama Mata Pelajaran": "I P A SMP",
    "Guru Pengampu": "FIQIH KARTIKA MURNI, S.Pd.; ROMLI RIAN, M.Pd.; SITI HALIMAH, S.Si., S.Pd.; SUMARTIN, S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP09",
    "Nama Mata Pelajaran": "I P S SMP",
    "Guru Pengampu": "AHAMD YANI, S.Pd.; ISWAHYUDIN, S.E.; SUBHAN, S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP10",
    "Nama Mata Pelajaran": "INFORMATIKA SMP",
    "Guru Pengampu": "AHMAD LUJAENILMA, S.Kom.; AHMAD SUKANTA, S.Pd.I.; MUHAMAD JAELANI BASRI, S.Pd.; RIFQI RAHMATULOH",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP11",
    "Nama Mata Pelajaran": "METEMATIKA SMP",
    "Guru Pengampu": "ALFI NURFADILAH; IRMAYANTI, M.Pd.; LULU ZAHROTUN NISA, S.Pd.; PUTRI DINAH OKTAVIA, S.Pd.; SITI HALIMAH, S.Si., S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP12",
    "Nama Mata Pelajaran": "P A I SMP",
    "Guru Pengampu": "NAMIN, S.Pd.I.; NUR AZIZAH, S.Pd.I.; SOPIAN HADI, S.Pd.I.; ZAINI FIKRI, S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP13",
    "Nama Mata Pelajaran": "PEND. PANCASILA SMP",
    "Guru Pengampu": "ANISA SITI NABILAH, S.Pd.; VENTI RAKHMAWATI, M.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP14",
    "Nama Mata Pelajaran": "PENJAS SMP",
    "Guru Pengampu": "M. WILDAN MAULANA, S.Pd.; MUHAMMAD MASYHUR; TONI, S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 B Putri; 1 E Putra; 2 B Putri; 2 C Putri; 2 E Putra; 2 F Putra; 3 B Putri; 3 C Putri; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP15",
    "Nama Mata Pelajaran": "PENJAS TAHFIZ SMP",
    "Guru Pengampu": "M. WILDAN MAULANA, S.Pd.; TONI, S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 D Tahfiz Putra; 2 A Tahfiz Putri; 2 D Tahfiz Putra; 3 A Tahfiz Putri; 3 D Tahfiz Putra"
  },
  {
    "Kode Mata Pelajaran": "SMP16",
    "Nama Mata Pelajaran": "S K I SMP",
    "Guru Pengampu": "NURLELA, S.Ag., M.M.; PUTRI ENJELIKAL FALAH, S.E.; SATRIA NUR OKTAVIANTO",
    "Unit": "SMP",
    "Daftar Kelas": "IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP17",
    "Nama Mata Pelajaran": "SENI BUDAYA SMP",
    "Guru Pengampu": "MUHAMMAD JAUHAR HAECKAL, S.HI.; RIZKA SYAFFITRI AMENDA, S.Hum",
    "Unit": "SMP",
    "Daftar Kelas": "1 B Putri; 1 E Putra; 2 B Putri; 2 C Putri; 2 E Putra; 2 F Putra; 3 B Putri; 3 C Putri; 3 E Putra; 3 F Putra; IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "SMP18",
    "Nama Mata Pelajaran": "TAHFIZ SMP",
    "Guru Pengampu": "SATRIA NUR OKTAVIANTO; SUBHAN, S.Pd.",
    "Unit": "SMP",
    "Daftar Kelas": "IX.4 Full Day Putri; IX.8 Full Day Putra; VII.3 Full Day Putri; VII.6 Full Day Putra; VIII.4 Full Day"
  },
  {
    "Kode Mata Pelajaran": "TMMIA01",
    "Nama Mata Pelajaran": "AQIDAH TMMIA",
    "Guru Pengampu": "ABDUL HARIZ NAUFAL, S.Ag.; ADE IHSAN FIRDAUS; ALMAAS JHOUNG ASRI, S.Sos.; NADRA, S.Ag.; NURIZAL MUZAKI; PUTRA NAHDI ABIYYU, Lc., S.Pd.; SITI FATIMAH ZAHRA; WALDA FAUZIAH",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA02",
    "Nama Mata Pelajaran": "BALAGHAH TMMIA",
    "Guru Pengampu": "MUHAMMAD HANIF FAUZI, S.Ag., M.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA03",
    "Nama Mata Pelajaran": "FAROID TMMIA",
    "Guru Pengampu": "PUTRA NAHDI ABIYYU, Lc., S.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA04",
    "Nama Mata Pelajaran": "FIQIH TMMIA",
    "Guru Pengampu": "ABDUL HARIZ NAUFAL, S.Ag.; ANTONI FIRDAUS, S.H.I., M.Pd.; FADHILLAH, S.Pd.; HAMZAH ROBBANI; MUHAMMAD ANWAR ALIF; MUHAMMAD IHSAN; NADRA, S.Ag.; NAZWA YUNITA; NURLAILA, S.Ag.; PUTRI ENJELIKAL FALAH, S.E.; RIZAL FIRDAUS; RIZKI ABDUL KHOTIB, S.Pd.I.; SISKA INDRIYANI, S.Sos.; SISKA YUNITA DEWI; SUMARTIN, S.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA05",
    "Nama Mata Pelajaran": "HADIS TMMIA",
    "Guru Pengampu": "AHDINI RAHMATILLAH, Lc., S.S.I.; AHMAD FAUZI RAHMAN; DINDA NAAFIDA ARIFIN, S.S.; FAHRU ROJI MALIK, S.M.; ILMI MIFTAHUL JANNAH; MUHAMMAD SUHAIL, S.Pd.I.; QASIM IKHSAN, S.Ag.; SILMI SABILA; SYAFON OKTAVIA RAHMA; YUSUP KURNIAWAN, S.Ag.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA06",
    "Nama Mata Pelajaran": "IMLA TMMIA",
    "Guru Pengampu": "ABDUL FATTAH AZZAM; ALMAAS JHOUNG ASRI, S.Sos.; ILMI MIFTAHUL JANNAH; M. WILDAN MAULANA, S.Pd.; MUHAMAD JAELANI BASRI, S.Pd.; MUHAMMAD AKBAR AL-GHIFARI; MUHAMMAD FIKRI AL ANSHORY; RIDWAN YULIANTO; SILMI SABILA; SYAFON OKTAVIA RAHMA; TIA RAHMAWATI, S.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA07",
    "Nama Mata Pelajaran": "INSYA TMMIA",
    "Guru Pengampu": "AHDINI RAHMATILLAH, Lc., S.S.I.; BAYU NIRPANA, M.H.; DAVA NUR PEBRIANTO, S.Pd.; HAMZAH ROBBANI; MUHAMMAD HANIF FAUZI, S.Ag., M.Pd.; SATRIA NUR OKTAVIANTO",
    "Unit": "TMMIA",
    "Daftar Kelas": "2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA08",
    "Nama Mata Pelajaran": "KHOT TMMIA",
    "Guru Pengampu": "NOOR FAIZ, S.Pd.; RIZKI ABDUL KHOTIB, S.Pd.I.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA09",
    "Nama Mata Pelajaran": "MAHFUDZAT TMMIA",
    "Guru Pengampu": "ADE IHSAN FIRDAUS; ASEP TARUNA JAYA; AULIA SABILA MUFIDA; HILDA MAULIDA NUR HIDAYATI; MUHAMMAD FIKRI AL ANSHORY; MUHAMMAD ZAKI; NAZWA YUNITA; RIDWAN YULIANTO; SALWA BINTA TSANIA; SOFIYAH AL WIDAD",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA10",
    "Nama Mata Pelajaran": "MUSTHOLAH HADIS TMMIA",
    "Guru Pengampu": "QASIM IKHSAN, S.Ag.",
    "Unit": "TMMIA",
    "Daftar Kelas": "3 INT IPA; 3 INT IPS; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA11",
    "Nama Mata Pelajaran": "MUTHOLA'AH TMMIA",
    "Guru Pengampu": "ABDUL FATTAH AZZAM; AHMAD HASAN MUNJAJI; ALFI NURFADILAH; DAVA NUR PEBRIANTO, S.Pd.; ICHSANUL AFIEF, S.Sos.; M. IRHAM AL-BAIHAQI; MUHAMMAD FIKRI AMRULLAH; MUHAMMAD HANIF FAUZI, S.Ag., M.Pd.; MUHAMMAD ZUHDI FAUZI, S.Ag.; RISMAWATI, S.Sos.; ROMLI RIAN, M.Pd.; SALWA BINTA TSANIA; SOPIAN HADI, S.Pd.I.; TONI, S.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA12",
    "Nama Mata Pelajaran": "NAHWU TMMIA",
    "Guru Pengampu": "AHMAD HASAN MUNJAJI; AHMAD SATIBI, S.Pd.; AINI SYIFA, S.S.; DAVA NUR PEBRIANTO, S.Pd.; ENDANG DARMAWAN PANDAWA AGUNG, S.Pd.; M. IRHAM AL-BAIHAQI; MUHAMMAD AKBAR AL-GHIFARI; SADAM HAMZAH, S.H.I.",
    "Unit": "TMMIA",
    "Daftar Kelas": "2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA13",
    "Nama Mata Pelajaran": "READING & GRAMMAR TMMIA",
    "Guru Pengampu": "AHMAD FIRDAUS, S.Ag.; FADILLAH ABIDANA, S.S., M.Pd.,; MURSYID ANWAR, S.Pd., M.Pd.; ZAINI FIKRI, S.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA14",
    "Nama Mata Pelajaran": "SHOROF TMMIA",
    "Guru Pengampu": "ADE HOLIDIN, S.Ag.; ASEP SAEPUL MILLAH, M.Pd.; ICHSANUL AFIEF, S.Sos.; MUSLICH ANWAR, M.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA15",
    "Nama Mata Pelajaran": "TAFSIR TMMIA",
    "Guru Pengampu": "AHDINI RAHMATILLAH, Lc., S.S.I.; DAVA NUR PEBRIANTO, S.Pd.; HAMZAH ROBBANI; MUHAMMAD YAQUB UNANG, S.Ag.; PUTRA NAHDI ABIYYU, Lc., S.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA16",
    "Nama Mata Pelajaran": "TAHFIZ TMMIA",
    "Guru Pengampu": "AHMAD HASAN MUNJAJI; AMALIA NUR FARIHA, S.Pd.; HAMMAD IYAD FAIJI; NADRA, S.Ag.; PUTRA NAHDI ABIYYU, Lc., S.Pd.; SITI FATIMAH ZAHRA",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 D Tahfiz Putra; 2 A Tahfiz Putri; 2 D Tahfiz Putra; 3 A Tahfiz Putri; 3 D Tahfiz Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA17",
    "Nama Mata Pelajaran": "TAJWID TMMIA",
    "Guru Pengampu": "ABDUL HARIZ NAUFAL, S.Ag.; AHMAD HASAN MUNJAJI; MUHAMMAD IHSAN; NADRA, S.Ag.; RIDWAN YULIANTO; SISKA YUNITA DEWI; SITI FATIMAH ZAHRA; TIA RAHMAWATI, S.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA18",
    "Nama Mata Pelajaran": "TAMRIN LUGHOH TMMIA",
    "Guru Pengampu": "ABDUL FATTAH AZZAM; AHDINI RAHMATILLAH, Lc., S.S.I.; DAVA NUR PEBRIANTO, S.Pd.; ENDANG DARMAWAN PANDAWA AGUNG, S.Pd.; HAMMAD IYAD FAIJI; M. ALIEF NUGRAHA ATFA, S.H.; M. IRHAM AL-BAIHAQI; MOHAMAD FARID, S.Pd.I.; MUHAMMAD HANIF FAUZI, S.Ag., M.Pd.; MUHAMMAD HASBY PUTRA; MUHAMMAD ZUHDI FAUZI, S.Ag.; RIDWAN YULIANTO; RISMAWATI, S.Sos.; SALEHA MUFIDA, S.Sos., M.Han.; SATRIA NUR OKTAVIANTO; SOPIAN HADI, S.Pd.I.; VERARY PRATAMA PUTRI, S.E.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra; 2 INT IPA; 2 INT IPS; 3 A Tahfiz Putri; 3 B Putri; 3 C Putri; 3 D Tahfiz Putra; 3 E Putra; 3 F Putra; 4 A Putri; 4 B Putra; 4 C Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA19",
    "Nama Mata Pelajaran": "TARBIYAH TMMIA",
    "Guru Pengampu": "MUHAMMAD ZUHDI FAUZI, S.Ag.; NAILUL KUNNI FUROIDA, S.Gz.; VERARY PRATAMA PUTRI, S.E.",
    "Unit": "TMMIA",
    "Daftar Kelas": "2 INT IPA; 2 INT IPS; 3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA20",
    "Nama Mata Pelajaran": "TARIKH ISLAM TMMIA",
    "Guru Pengampu": "ANISA SITI NABILAH, S.Pd.; DEA AMANDA PUTRI; KHAIRIL FAHMI, S.Pd.; MOH AFRIZA TRIWARDANA; PUTRI ENJELIKAL FALAH, S.E.; VENTI RAKHMAWATI, M.Pd.",
    "Unit": "TMMIA",
    "Daftar Kelas": "1 A Tahfiz Putri; 1 B Putri; 1 D Tahfiz Putra; 1 E Putra; 1 Intensif; 2 A Tahfiz Putri; 2 B Putri; 2 C Putri; 2 D Tahfiz Putra; 2 E Putra; 2 F Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA21",
    "Nama Mata Pelajaran": "ULUMUL QUR'AN TMMIA",
    "Guru Pengampu": "PUTRA NAHDI ABIYYU, Lc., S.Pd.; QASIM IKHSAN, S.Ag.",
    "Unit": "TMMIA",
    "Daftar Kelas": "3 INT IPA; 3 INT IPS; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  },
  {
    "Kode Mata Pelajaran": "TMMIA22",
    "Nama Mata Pelajaran": "USHUL FIQH TMMIA",
    "Guru Pengampu": "BAYU NIRPANA, M.H.; SADAM HAMZAH, S.H.I.",
    "Unit": "TMMIA",
    "Daftar Kelas": "3 INT IPA; 3 INT IPS; 4 A Putri; 4 B Putra; 4 C Putra; 5 A IPA Putri; 5 B IPS Putri; 5 C IPA Putra; 5 D IPS Putra; 6 A IPA Putri; 6 B IPS Putri; 6 C IPA Putra; 6 D IPS Putra"
  }
];

// Helper to parse comma/semicolon separated strings
function splitClean(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Full parsed list
export const TEACHER_SUBJECTS_ENTRIES: TeacherSubjectEntry[] = RAW_TEACHER_SUBJECTS_DATA.map((item) => ({
  kode: item['Kode Mata Pelajaran'],
  namaMapel: item['Nama Mata Pelajaran'],
  guruPengampu: splitClean(item['Guru Pengampu']),
  guruPengampuRaw: item['Guru Pengampu'],
  unit: item.Unit,
  daftarKelas: splitClean(item['Daftar Kelas']),
  daftarKelasRaw: item['Daftar Kelas'],
}));

// Build unique teacher directory with accurate class & subject breakdown
export function getTeacherProfiles(): TeacherProfile[] {
  const teacherMap = new Map<string, {
    canonicalName: string;
    units: Set<'SMA' | 'SMP' | 'TMMIA'>;
    subjectsMap: Map<string, {
      kode: string;
      namaMapel: string;
      unit: 'SMA' | 'SMP' | 'TMMIA';
      daftarKelas: Set<string>;
    }>;
    classes: Set<string>;
  }>();

  function getOrCreateTeacher(name: string) {
    for (const [existingName, data] of teacherMap.entries()) {
      if (isTeacherNameMatch(existingName, name)) {
        return data;
      }
    }
    const data = {
      canonicalName: name,
      units: new Set<'SMA' | 'SMP' | 'TMMIA'>(),
      subjectsMap: new Map<string, {
        kode: string;
        namaMapel: string;
        unit: 'SMA' | 'SMP' | 'TMMIA';
        daftarKelas: Set<string>;
      }>(),
      classes: new Set<string>(),
    };
    teacherMap.set(name, data);
    return data;
  }

  // 1. Process teachers from ALL_TEACHER_ASSIGNMENTS (SMP, SMA, TMMIA, & Full Day)
  ALL_TEACHER_ASSIGNMENTS.forEach((rec) => {
    const t = getOrCreateTeacher(rec.teacherName);
    t.units.add(rec.unit);
    t.classes.add(rec.className);

    const subKey = rec.subjectName;
    if (!t.subjectsMap.has(subKey)) {
      const matchEntry = TEACHER_SUBJECTS_ENTRIES.find(
        (e) => normalizeSubjectKey(e.namaMapel, rec.className) === normalizeSubjectKey(rec.subjectName, rec.className)
      );
      t.subjectsMap.set(subKey, {
        kode: matchEntry ? matchEntry.kode : `${rec.unit}-${rec.no}`,
        namaMapel: rec.subjectName,
        unit: rec.unit,
        daftarKelas: new Set([rec.className]),
      });
    } else {
      t.subjectsMap.get(subKey)!.daftarKelas.add(rec.className);
    }
  });

  // 2. Fallback: only add entries from TEACHER_SUBJECTS_ENTRIES for any teacher not present in the official rekap
  TEACHER_SUBJECTS_ENTRIES.forEach((entry) => {
    entry.guruPengampu.forEach((teacherName) => {
      const isAlreadyInRekap = Array.from(teacherMap.keys()).some((k) => isTeacherNameMatch(k, teacherName));
      if (!isAlreadyInRekap) {
        const t = getOrCreateTeacher(teacherName);
        t.units.add(entry.unit);
        entry.daftarKelas.forEach((k) => t.classes.add(k));

        const subKey = entry.namaMapel;
        if (!t.subjectsMap.has(subKey)) {
          t.subjectsMap.set(subKey, {
            kode: entry.kode,
            namaMapel: entry.namaMapel,
            unit: entry.unit,
            daftarKelas: new Set(entry.daftarKelas),
          });
        } else {
          entry.daftarKelas.forEach((k) => t.subjectsMap.get(subKey)!.daftarKelas.add(k));
        }
      }
    });
  });

  const profiles: TeacherProfile[] = [];
  teacherMap.forEach((data) => {
    const name = data.canonicalName;
    const parts = name.split(',');
    const academicTitle = parts.length > 1 ? parts.slice(1).join(',').trim() : '';

    const subjects = Array.from(data.subjectsMap.values()).map((s) => ({
      kode: s.kode,
      namaMapel: s.namaMapel,
      unit: s.unit,
      daftarKelas: Array.from(s.daftarKelas).sort(),
    }));

    profiles.push({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      academicTitle,
      units: Array.from(data.units),
      subjects,
      classesTaught: Array.from(data.classes).sort(),
      totalClassesCount: data.classes.size,
    });
  });

  // Sort alphabetically by teacher name
  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

// Subject name key normalizer
export function normalizeSubjectKey(name: string, classNameOrId: string = ''): string {
  if (!name) return '';

  const raw = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Canonical aliases from the official 2026/2027 teaching recap.
  // Unit suffixes are handled separately from subject identity; class context
  // remains part of authorization, so SMP/SMA/IPA/IPS cannot leak across classes.
  const semanticRaw = raw.replace(/\b(?:sma|smp|tmmia)\b/g, ' ').replace(/\s+/g, ' ').trim();
  let key = semanticRaw;
  const aliases: Array<[RegExp, string]> = [
    [/^(b|bahasa) indonesia(?: sma| smp)?$/, 'bahasa_indonesia'],
    [/^(b|bahasa) inggris(?: sma| smp)?$/, 'bahasa_inggris'],
    [/^(b|basa|bahasa) sunda(?: sma| smp)?(?: muatan lokal)?$/, 'bahasa_sunda'],
    [/^p a i(?: sma| smp)?$/, 'pai'],
    [/^pendidikan agama islam(?: dan budi pekerti)?(?: pai)?$/, 'pai'],
    [/^pendidikan agama dan budi pekerti(?: pai)?$/, 'pai'],
    [/^pend(?:idikan)? pancasila(?: sma| smp)?(?: dan kewarganegaraan)?$/, 'pancasila'],
    [/^pendidikan pancasila(?: dan kewarganegaraan)?$/, 'pancasila'],
    [/^(penjas|pjok)(?: sma| smp)?$/, 'penjas'],
    [/^pendidikan jasmani(?: olahraga| olahragaa)?(?: dan kesehatan)?(?: pjok)?$/, 'penjas'],
    [/^matematika(?: sma| smp)?$/, 'matematika'],
    [/^metematika(?: sma| smp)?$/, 'matematika'],
    [/^mtk(?: sma| smp)?$/, 'matematika'],
    [/^(mtk tingkat lanjut|matematika tingkat lanjut)(?: sma)?(?: mtk tl)?$/, 'matematika_lanjut_ipa'],
    [/^fisika(?: sma)?$/, 'fisika'],
    [/^fisika ipa$/, 'fisika'],
    [/^fiqih(?: sma| smp| tmmia)?$/, 'fiqih'],
    [/^fikih(?: sma| smp| tmmia)?$/, 'fiqih'],
    [/^hadis(?: sma| smp| tmmia)?$/, 'hadis'],
    [/^hadist(?: sma| smp| tmmia)?$/, 'hadis'],
    [/^aqidah$/, 'aqidah'],
    [/^imla$/, 'imla'],
    [/^khot$/, 'khot'],
    [/^nahwu$/, 'nahwu'],
    [/^shorof$/, 'shorof'],
    [/^insya$/, 'insya'],
    [/^faroid$/, 'faroid'],
    [/^tafsir$/, 'tafsir'],
    [/^tarbiyah$/, 'tarbiyah'],
    [/^ushul fiqh$/, 'ushul_fiqh'],
    [/^tajwid$/, 'tajwid'],
    [/^balaghah$/, 'balagoh'],
    [/^balagoh$/, 'balagoh'],
    [/^ulumul qur an$/, 'ulumul_quran'],
    [/^mustholah hadis$/, 'mustholahul_hadist'],
    [/^mustholahul hadist$/, 'mustholahul_hadist'],
    [/^mutholaah(?: tmmia)?$/, 'mutholaah'],
    [/^muthola ah(?: tmmia)?$/, 'mutholaah'],
    [/^mahfudzot(?: tmmia)?$/, 'mahfudzot'],
    [/^mahfudzat(?: tmmia)?$/, 'mahfudzot'],
    [/^tarikh islam(?: tmmia)?$/, 'tarikh_islam'],
    [/^tamrin lughoh(?: tmmia)?$/, 'tamrin_lughoh'],
    [/^reading grammar(?: tmmia)?$/, 'grammar'],
    [/^grammar$/, 'grammar'],
    [/^life skill(?: sma)?$/, 'life_skill'],
    [/^sby pkwu life skill$/, 'life_skill'],
    [/^sejarah(?: sma)?$/, 'sejarah'],
    [/^sejarah indonesia$/, 'sejarah'],
    [/^tahfiz(?: sma| smp| tmmia)?$/, 'tahfiz'],
    [/^tahfidz(?: sma| smp| tmmia)?$/, 'tahfiz'],
    [/^al quran(?: sma)?$/, 'al_quran'],
    [/^alquran(?: sma)?$/, 'al_quran'],
    [/^bahasa arab(?: sma| smp)?$/, 'bahasa_arab'],
    [/^biologi(?: sma)?$/, 'biologi'],
    [/^kimia(?: sma)?$/, 'kimia'],
    [/^ekonomi(?: sma)?$/, 'ekonomi'],
    [/^geografi(?: sma)?$/, 'geografi'],
    [/^sosiologi(?: sma)?$/, 'sosiologi'],
    [/^antropologi(?: sma)?$/, 'antropologi'],
    [/^informatika(?: sma| smp)?$/, 'informatika'],
    [/^p a i$/, 'pai'],
    [/^btq(?: smp)?$/, 'btq_smp'],
    [/^s k i(?: smp)?$/, 'ski_smp'],
    [/^penjas tahfiz smp$/, 'penjas_tahfiz_smp'],
    [/^seni budaya(?: smp)?$/, 'seni_budaya'],
    [/^i p a smp$/, 'ipa'],
    [/^ilmu pengetahuan alam$/, 'ipa'],
    [/^i p s smp$/, 'ips'],
    [/^ilmu pengetahuan sosial$/, 'ips'],
  ];
  for (const [pattern, value] of aliases) {
    if (pattern.test(semanticRaw)) {
      key = value;
      break;
    }
  }

  // Fisika is context-sensitive: SMP Fisika, SMA Fisika, and SMA IPA Fisika
  // are separate identities. The schedule uses FISIKA SMA while the IPA
  // curriculum may display Fisika (IPA); class context resolves that alias.
  const classIds = classNameOrId ? normalizeClassToIds(classNameOrId) : [];
  const cid = classIds[0] || String(classNameOrId).toLowerCase();
  const isIpaClass = /(?:5a|5c|6a|6c|2int-a|3int-a|xi-ipa-fd|xii-ipa-fd)/i.test(cid);
  const isSmpClass = /^(?:1a|1b|1d|1e|2a|2b|2c|2d|2e|2f|3a|3b|3c|3d|3e|3f|vii-|viii-|ix-)/i.test(cid);
  const isSmaClass = /^(?:4a|4b|4c|5a|5b|5c|5d|6a|6b|6c|6d|2int-|3int-|x-|xi-|xii-)/i.test(cid);

  if (key === 'fisika') {
    // Explicit '(IPA)' is never allowed to collapse into ordinary Fisika.
    if (semanticRaw === 'fisika ipa') return 'fisika_sma_ipa';
    if (isSmpClass) return 'fisika_smp';
    if (isIpaClass) return 'fisika_sma_ipa';
    if (isSmaClass) return 'fisika_sma';
    return 'fisika';
  }
  if (key === 'matematika_lanjut_ipa') return 'matematika_lanjut_ipa';
  return key.replace(/\s+/g, '').trim();
}

// Normalize raw class string from database to matching ClassItem IDs
export function normalizeClassToIds(rawClassStr: string): string[] {
  if (!rawClassStr) return [];
  const raw = rawClassStr.toLowerCase().trim();

  // Exact ID match check first
  const knownIds = [
    '1a', '1b', '1d', '1e',
    '2a', '2b', '2c', '2d', '2e', '2f',
    '3a', '3b', '3c', '3d', '3e', '3f',
    '1int', '2int-a', '2int-b', '3int-a', '3int-b',
    '4a', '4b', '4c',
    '5a', '5b', '5c', '5d',
    '6a', '6b', '6c', '6d',
    'vii-3-fd-pi', 'vii-5-fd-pa', 'vii-6-fd-pa', 'ix-4-fd-pi', 'ix-8-fd-pa', 'viii-4-fd', 'x-a-fd', 'x-b-fd',
    'xi-ipa-fd', 'xi-ips-fd', 'xii-ipa-fd', 'xii-ips-fd'
  ];
  if (raw === 'vii-6-fd-pa') return ['vii-6-fd-pa'];
  if (knownIds.includes(raw)) {
    return [raw];
  }

  // Insert space between numbers and letters (e.g. "1a" -> "1 a", "2int" -> "2 int")
  const spaced = raw.replace(/([0-9]+)([a-z]+)/gi, '$1 $2').replace(/([a-z]+)([0-9]+)/gi, '$1 $2');
  const s = spaced.replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  // TMMIA / Intensif
  if (s.includes('1 int') || s === '1 intensif') return ['1int'];
  if (s.includes('2 int ipa') || s.includes('2 int a')) return ['2int-a'];
  if (s.includes('2 int ips') || s.includes('2 int b')) return ['2int-b'];
  if (s.includes('2 int') || s === '2 intensif') return ['2int-a', '2int-b'];
  if (s.includes('3 int ipa') || s.includes('3 int a')) return ['3int-a'];
  if (s.includes('3 int ips') || s.includes('3 int b')) return ['3int-b'];
  if (s.includes('3 int') || s === '3 intensif') return ['3int-a', '3int-b'];

  // Full Day / Non Mukim
  if (s.includes('vii 3') || s.includes('7 3')) return ['vii-3-fd-pi'];
  if (s.includes('vii 5') || s.includes('7 5')) return ['vii-5-fd-pa'];
  if (s.includes('vii 6') || s.includes('7 6')) return ['vii-6-fd-pa'];
  if (s.includes('viii 4') || s.includes('8 4')) return ['viii-4-fd'];
  if (s.includes('ix 4') || s.includes('9 4')) return ['ix-4-fd-pi'];
  if (s.includes('ix 8') || s.includes('9 8')) return ['ix-8-fd-pa'];
  if (s.includes('x a non mukim') || s.includes('x a full') || s === 'x a') return ['x-a-fd'];
  if (s.includes('x b non mukim') || s.includes('x b full') || s === 'x b') return ['x-b-fd'];
  if (s.includes('xi ipa') && (s.includes('non mukim') || s.includes('full') || s.includes('fd') || s.includes('nm'))) return ['xi-ipa-fd'];
  if (s.includes('xi ips') && (s.includes('non mukim') || s.includes('full') || s.includes('fd') || s.includes('nm'))) return ['xi-ips-fd'];
  if (s.includes('xii ipa') && (s.includes('non mukim') || s.includes('full') || s.includes('fd') || s.includes('nm'))) return ['xii-ipa-fd'];
  if (s.includes('xii ips') && (s.includes('non mukim') || s.includes('full') || s.includes('fd') || s.includes('nm'))) return ['xii-ips-fd'];
  if (s === 'xi ipa' || s === 'kelas xi ipa' || s === 'xi-ipa') return ['xi-ipa-fd'];
  if (s === 'xi ips' || s === 'kelas xi ips' || s === 'xi-ips') return ['xi-ips-fd'];
  if (s === 'xii ipa' || s === 'kelas xii ipa' || s === 'xii-ipa') return ['xii-ipa-fd'];
  if (s === 'xii ips' || s === 'kelas xii ips' || s === 'xii-ips') return ['xii-ips-fd'];
  if (s.includes('xi ipa')) return ['5a', '5c', 'xi-ipa-fd'];
  if (s.includes('xi ips')) return ['5b', '5d', 'xi-ips-fd'];
  if (s.includes('xii ipa')) return ['6a', '6c', 'xii-ipa-fd'];
  if (s.includes('xii ips')) return ['6b', '6d', 'xii-ips-fd'];

  // SMA (4, 5, 6)
  if (s.includes('4 a')) return ['4a'];
  if (s.includes('4 b')) return ['4b'];
  if (s.includes('4 c')) return ['4c'];
  if (s.includes('5 a')) return ['5a'];
  if (s.includes('5 b')) return ['5b'];
  if (s.includes('5 c')) return ['5c'];
  if (s.includes('5 d')) return ['5d'];
  if (s.includes('6 a')) return ['6a'];
  if (s.includes('6 b')) return ['6b'];
  if (s.includes('6 c')) return ['6c'];
  if (s.includes('6 d')) return ['6d'];

  // SMP (1, 2, 3)
  if (s.includes('1 a')) return ['1a'];
  if (s.includes('1 b')) return ['1b'];
  if (s.includes('1 d')) return ['1d'];
  if (s.includes('1 e')) return ['1e'];
  if (s.includes('2 a')) return ['2a'];
  if (s.includes('2 b')) return ['2b'];
  if (s.includes('2 c')) return ['2c'];
  if (s.includes('2 d')) return ['2d'];
  if (s.includes('2 e')) return ['2e'];
  if (s.includes('2 f')) return ['2f'];
  if (s.includes('3 a')) return ['3a'];
  if (s.includes('3 b')) return ['3b'];
  if (s.includes('3 c')) return ['3c'];
  if (s.includes('3 d')) return ['3d'];
  if (s.includes('3 e')) return ['3e'];
  if (s.includes('3 f')) return ['3f'];

  return [];
}

// Teacher Name Normalizer for robust comparisons
export function normalizeTeacherName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/(s\.pd|m\.pd|s\.ag|m\.ag|lc|s\.s|s\.e|s\.si|m\.si|s\.e\.i|m\.han|s\.h|s\.h\.i|s\.sos|s\.gz|s\.kom|s\.hum|m\.m|gr|\.|\,|\')/gi, ' ')
    .replace(/ahamd/gi, 'ahmad')
    .replace(/farhifa/gi, 'fariha')
    .replace(/azzam/gi, 'azam')
    .replace(/choeiriyah/gi, 'choiriyah')
    .replace(/fathurrahman/gi, 'fathurachman')
    .replace(/fathurachman/gi, 'fathurachman')
    .replace(/febrianto/gi, 'pebrianto')
    .replace(/afief/gi, 'afif')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isTeacherNameMatch(nameA: string, nameB: string): boolean {
  const normA = normalizeTeacherName(nameA);
  const normB = normalizeTeacherName(nameB);
  if (!normA || !normB) return false;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
}

// Get all unique classes mentioned across the database
export function getAllUniqueClasses(): string[] {
  const classSet = new Set<string>();
  ALL_TEACHER_ASSIGNMENTS.forEach((r) => classSet.add(r.className));
  TEACHER_SUBJECTS_ENTRIES.forEach((e) => {
    e.daftarKelas.forEach((c) => classSet.add(c));
  });
  return Array.from(classSet).sort();
}

// Find teachers teaching a subject in a specific class
export function findTeachersForSubjectAndClass(
  subjectNameOrId: string,
  classNameOrId: string
): string[] {
  const targetSubKey = normalizeSubjectKey(subjectNameOrId, classNameOrId);
  const targetClassIds = normalizeClassToIds(classNameOrId);
  const normClassStr = classNameOrId.toLowerCase().trim();

  // Critical authorization lookup: exact canonical subject AND exact class identity.
  const classMatches = (candidate: string): boolean => {
    const candidateIds = normalizeClassToIds(candidate);
    if (targetClassIds.length > 0) {
      return candidateIds.some((id) => targetClassIds.includes(id));
    }
    return candidate.toLowerCase().trim() === normClassStr;
  };

  const rekapMatches: string[] = [];
  for (const rec of ALL_TEACHER_ASSIGNMENTS) {
    if (normalizeSubjectKey(rec.subjectName, classNameOrId) !== targetSubKey) continue;
    if (!classMatches(rec.className)) continue;
    if (rec.teacherName && !rekapMatches.includes(rec.teacherName)) {
      rekapMatches.push(rec.teacherName);
    }
  }

  if (rekapMatches.length > 0) return rekapMatches;

  for (const entry of TEACHER_SUBJECTS_ENTRIES) {
    if (normalizeSubjectKey(entry.namaMapel, classNameOrId) !== targetSubKey) continue;
    if ((entry.daftarKelas || []).some(classMatches)) {
      return entry.guruPengampu || [];
    }
  }

  // Never authorize from a subject-only fallback; the teacher must be assigned to this class.
  return [];
}

// Get all subjects & teachers for a specific class
export function getSubjectTeachersForClass(classNameOrId: string): {
  subject: TeacherSubjectEntry;
  teachers: string[];
}[] {
  const targetClassIds = normalizeClassToIds(classNameOrId);
  const normClassStr = classNameOrId.toLowerCase().trim();
  const resultMap = new Map<string, { subject: TeacherSubjectEntry; teachers: Set<string> }>();

  // 1. Collect from ALL_TEACHER_ASSIGNMENTS
  ALL_TEACHER_ASSIGNMENTS.forEach((rec) => {
    const recClassIds = normalizeClassToIds(rec.className);
    const isClassMatch =
      (targetClassIds.length > 0 && recClassIds.some((id) => targetClassIds.includes(id))) ||
      rec.className.toLowerCase().trim() === normClassStr ||
      normClassStr.includes(rec.className.toLowerCase().trim()) ||
      rec.className.toLowerCase().trim().includes(normClassStr);

    if (isClassMatch) {
      const subKey = normalizeSubjectKey(rec.subjectName, classNameOrId);
      if (!resultMap.has(subKey)) {
        const existingEntry = TEACHER_SUBJECTS_ENTRIES.find(
          (e) => normalizeSubjectKey(e.namaMapel, classNameOrId) === subKey
        );
        resultMap.set(subKey, {
          subject: existingEntry || {
            kode: rec.unit + '-' + subKey.toUpperCase().slice(0, 4),
            namaMapel: rec.subjectName,
            guruPengampu: [rec.teacherName],
            guruPengampuRaw: rec.teacherName,
            unit: rec.unit,
            daftarKelas: [rec.className],
            daftarKelasRaw: rec.className,
          },
          teachers: new Set([rec.teacherName]),
        });
      } else {
        resultMap.get(subKey)!.teachers.add(rec.teacherName);
      }
    }
  });

  // 2. Also check TEACHER_SUBJECTS_ENTRIES (for SMA classes or additional subjects)
  TEACHER_SUBJECTS_ENTRIES.forEach((entry) => {
    const isEnrolled = entry.daftarKelas.some((clsStr) => {
      const entryClassIds = normalizeClassToIds(clsStr);
      if (targetClassIds.length > 0 && entryClassIds.some((id) => targetClassIds.includes(id))) {
        return true;
      }
      const cLower = clsStr.toLowerCase().trim();
      return cLower === normClassStr || normClassStr.includes(cLower) || cLower.includes(normClassStr);
    });

    if (isEnrolled) {
      const subKey = normalizeSubjectKey(entry.namaMapel, classNameOrId);
      if (!resultMap.has(subKey)) {
        resultMap.set(subKey, {
          subject: entry,
          teachers: new Set(entry.guruPengampu),
        });
      }
    }
  });

  return Array.from(resultMap.values()).map((item) => ({
    subject: item.subject,
    teachers: Array.from(item.teachers),
  }));
}
