export type SchoolType = 'mukim' | 'fullday';

export interface ClassItem {
  id: string;
  nameLatin: string;
  nameAr: string;
  waliKelasName?: string;
  level?: '1' | '2' | '3' | '1int' | '2int' | '4' | '3int' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | string;
  schoolType?: SchoolType;
  jurusan?: 'UMUM' | 'IPA' | 'IPS' | string;
}

export interface Subject {
  id: string;
  order: number;
  nameId: string;
  nameAr: string;
  category: 'pondok' | 'umum' | 'lisan' | string;
  kkm?: number;
}

export interface StudentRecord {
  id: string;
  no: number;
  classId: string; // ID of the class e.g. '1-int-a' or 'vii-3-fd-pi'
  name: string;
  nisn: string;
  nis?: string;
  schoolType?: SchoolType;
  jurusan?: string;
  scores: Record<string, number>; // subject id -> score (0-100)
  afektif?: Record<string, string>; // subject id -> 'A' | 'B' | 'C'
  sikap?: string; // kategori sikap umum siswa
  keterangan?: string;
  kepribadian?: {
    kerapihan?: string;
    kedisiplinan?: string;
    kejujuran?: string;
    [key: string]: string | undefined;
  };
  absensi?: {
    sakit?: number;
    izin?: number;
    alpa?: number;
    [key: string]: number | undefined;
  };
}

export interface CalculatedStudent extends StudentRecord {
  totalScore: number;
  averageScore: number;
  rank: number;
}

export type UserRole = 'guru' | 'wali_kelas' | 'admin';

/**
 * 2 Jenjang Utama di Pondok Modern Al-Ghozali:
 * - SMP: Tingkat SMP Mukim (Kelas 1-3 SMP) & Full Day (Kelas VII-3, VII-5, VIII-4, IX-4, IX-8)
 * - SMA: Tingkat SMA Mukim (1-3 Intensif, Kelas 4-6) & Full Day (Kelas X, XI IPA, XI IPS, XII IPA, XII IPS)
 * - TMMIA: Muatan Kurikulum Kepondokan (Tarbiyatul Mu'allimin/Mu'allimat Al-Islamiyyah) yang diajarkan di SMP & SMA
 */
export type JenjangUnit = 'SMP' | 'SMA' | 'TMMIA';

export interface AuthUser {
  role: UserRole;
  name: string;
  unit?: JenjangUnit;
  schoolType?: SchoolType;
  availableUnits?: JenjangUnit[];
  teacherId?: string;
  academicTitle?: string;
  assignedClassIds?: string[];
  assignedClassIdsByUnit?: Record<JenjangUnit, string[]>;
  assignedSubjectNames?: string[];
  homeroomClassId?: string;
  homeroomClassName?: string;
}

export interface SchoolConfig {
  institutionName: string;
  schoolName: string;
  subTitleId: string;
  titleAr: string;
  subTitleAr: string;
  classLatin: string;
  classAr: string;
  academicYearLatin: string;
  academicYearAr: string;
  semesterLatin: string;
  semesterAr: string;
  placeNameAr: string;
  placeNameLatin: string;
  dateMasehi: string;
  dateHijri: string;
  dateTextAr: string;
  waliKelasName: string;
  waliKelasTitle: string;
  direkturName: string;
  direkturTitle: string;
  waliSantriLabelAr: string;
  waliKelasLabelAr: string;
  direkturLabelAr: string;
  // Full Day additions
  schoolType?: SchoolType;
  schoolAddress?: string;
  schoolPhone?: string;
  kepalaSekolahName?: string;
  kepalaSekolahSmpName?: string;
  kepalaSekolahTitle?: string;
  programStudi?: string;
}
