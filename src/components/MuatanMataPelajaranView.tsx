import React, { useState } from 'react';
import {
  CURRICULUM_COLUMNS,
  MASTER_SUBJECTS_CATALOG,
  CurriculumDefinition,
} from '../data/curriculumSubjects';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Printer,
  Download,
  GraduationCap,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MuatanMataPelajaranViewProps {
  onNavigateToGrading?: (classId: string) => void;
}

export const MuatanMataPelajaranView: React.FC<MuatanMataPelajaranViewProps> = ({
  onNavigateToGrading,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'cards'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'pondok' | 'umum'>('all');
  const [selectedColumnKey, setSelectedColumnKey] = useState<string>('all');

  // Maximum rows across all columns is 26 (Kelas 4 has 26 subjects)
  const maxRows = 26;
  const rowNumbers = Array.from({ length: maxRows }, (_, i) => i + 1);

  const filteredColumns = CURRICULUM_COLUMNS.filter(
    (col) => selectedColumnKey === 'all' || col.key === selectedColumnKey
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['NO', ...CURRICULUM_COLUMNS.map((c) => c.name)];
    const rows = rowNumbers.map((rowNum) => {
      const rowData: (string | number)[] = [rowNum];
      CURRICULUM_COLUMNS.forEach((col) => {
        const subName = col.subjectNames[rowNum - 1] || '';
        rowData.push(subName ? `"${subName}"` : '""');
      });
      return rowData.join(',');
    });

    // Add totals row
    const totalsRow = [
      'TOTAL',
      ...CURRICULUM_COLUMNS.map((c) => c.subjectNames.length),
    ].join(',');

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows, totalsRow].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Muatan_Mata_Pelajaran_Al_Ghozali.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to map curriculum key to a sample class ID
  const getRepresentativeClassId = (currKey: string): string => {
    switch (currKey) {
      case '1': return '1a';
      case '2': return '2a';
      case '3': return '3a';
      case '4': return '4a';
      case '5-ipa': return '5a';
      case '5-ips': return '5b';
      case '6-ipa': return '6a';
      case '6-ips': return '6b';
      case '1int': return '1int';
      case '2int-ipa': return '2int-a';
      case '2int-ips': return '2int-b';
      case '3int-ipa': return '3int-a';
      case '3int-ips': return '3int-b';
      default: return '1a';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700/80 text-emerald-200 border border-emerald-600/50 flex items-center gap-1.5">
                <BookOpen size={13} />
                Kurikulum Resmi Pesantren & Sekolah
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                13 Jenjang / Matriks
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>MUATAN MATA PELAJARAN</span>
              <span className="font-arabic text-xl sm:text-2xl text-emerald-300 font-normal">
                (المَوَادُ الدِّرَاسِيَّةُ)
              </span>
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              Struktur distribusi mata pelajaran Kepondokan (Dirasah Islamiyah) & Umum (Diknas)
              untuk seluruh jenjang SMP, SMA, dan Kelas Intensif di Pondok Modern Al-Ghozali.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition active:scale-95"
            >
              <Printer size={14} />
              <span>Cetak Dokumen</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-900 shadow-sm transition active:scale-95"
            >
              <Download size={14} />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="no-print bg-white rounded-xl shadow-sm border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-4">
        {/* View Toggle */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'matrix'
                ? 'bg-white text-emerald-900 shadow font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers size={14} className={activeTab === 'matrix' ? 'text-emerald-600' : ''} />
            <span>Tabel Matriks Lengkap (13 Kolom)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'cards'
                ? 'bg-white text-emerald-900 shadow font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap size={14} className={activeTab === 'cards' ? 'text-emerald-600' : ''} />
            <span>Kartu Rincian Per Jenjang</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua Mapel
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('pondok')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedCategory === 'pondok'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Kepondokan
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('umum')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                selectedCategory === 'umum'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Umum (Diknas)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari mata pelajaran..."
              className="pl-9 pr-3 py-1.5 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-52"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: MATRIX TABLE (COMPREHENSIVE 13 COLUMNS) */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl shadow-md border border-stone-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              {/* Table Header with 13 Curriculum Columns */}
              <thead>
                <tr className="bg-stone-800 text-white font-bold text-center border-b border-stone-700">
                  <th className="py-3 px-2 border-r border-stone-700 w-12 sticky left-0 z-20 bg-stone-800">
                    NO
                  </th>
                  {CURRICULUM_COLUMNS.map((col) => {
                    const isInt = col.name.includes('INT');
                    const isSMA = col.name.includes('4') || col.name.includes('5') || col.name.includes('6');

                    return (
                      <th
                        key={col.key}
                        className={`py-3 px-2.5 border-r border-stone-700 min-w-[145px] text-center transition-colors ${
                          isInt
                            ? 'bg-purple-950/80 hover:bg-purple-900'
                            : isSMA
                            ? 'bg-stone-800 hover:bg-stone-700'
                            : 'bg-emerald-950/80 hover:bg-emerald-900'
                        }`}
                      >
                        <div className="font-extrabold text-[12px] uppercase tracking-wider text-white">
                          {col.name}
                        </div>
                        <div className="text-[10px] font-medium text-stone-300 mt-0.5">
                          {col.levelLabel}
                        </div>
                        {onNavigateToGrading && (
                          <button
                            type="button"
                            onClick={() => onNavigateToGrading(getRepresentativeClassId(col.key))}
                            className="no-print mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white transition active:scale-95"
                          >
                            <span>Input Nilai</span>
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body (Rows 1 to 26) */}
              <tbody className="divide-y divide-stone-200">
                {rowNumbers.map((rowNum) => {
                  return (
                    <tr
                      key={rowNum}
                      className={
                        rowNum % 2 === 0
                          ? 'bg-stone-50/70 hover:bg-amber-50/50'
                          : 'bg-white hover:bg-amber-50/50'
                      }
                    >
                      {/* Row Index */}
                      <td className="py-2 px-2 text-center font-mono font-bold text-stone-600 border-r border-stone-200 sticky left-0 z-10 bg-inherit text-[11px]">
                        {rowNum}
                      </td>

                      {/* 13 Curriculum Subject Columns */}
                      {CURRICULUM_COLUMNS.map((col) => {
                        const subName = col.subjectNames[rowNum - 1];
                        if (!subName) {
                          return (
                            <td
                              key={col.key}
                              className="py-2 px-2.5 border-r border-stone-200 text-center text-stone-300 font-mono text-[11px]"
                            >
                              —
                            </td>
                          );
                        }

                        const info = MASTER_SUBJECTS_CATALOG[subName];
                        const isPondok = info?.category === 'pondok';
                        const isMatchSearch =
                          searchTerm.trim() !== '' &&
                          (subName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (info?.nameAr && info.nameAr.includes(searchTerm)));

                        const matchesCategory =
                          selectedCategory === 'all' ||
                          (selectedCategory === 'pondok' && isPondok) ||
                          (selectedCategory === 'umum' && !isPondok);

                        const isHighlighted = isMatchSearch && matchesCategory;
                        const isDimmed =
                          (searchTerm.trim() !== '' && !isMatchSearch) ||
                          !matchesCategory;

                        return (
                          <td
                            key={col.key}
                            className={`py-2 px-2.5 border-r border-stone-200 transition-colors ${
                              isHighlighted
                                ? 'bg-amber-200/90 font-bold text-stone-900 ring-2 ring-amber-400'
                                : isDimmed
                                ? 'opacity-30'
                                : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span
                                className={`text-[11.5px] leading-tight font-medium ${
                                  isHighlighted
                                    ? 'text-amber-950 font-bold'
                                    : 'text-stone-800'
                                }`}
                              >
                                {subName}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1 rounded shrink-0 ${
                                  isPondok
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                                title={isPondok ? 'Mata Pelajaran Kepondokan' : 'Mata Pelajaran Umum (Diknas)'}
                              >
                                {isPondok ? 'Pnd' : 'Umm'}
                              </span>
                            </div>
                            {info?.nameAr && (
                              <div
                                className="font-arabic text-[11px] text-stone-500 font-semibold text-right leading-none mt-0.5"
                                dir="rtl"
                              >
                                {info.nameAr}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer: Total Count Per Column */}
              <tfoot>
                <tr className="bg-stone-800 text-white font-extrabold text-center border-t-2 border-stone-900">
                  <td className="py-3 px-2 border-r border-stone-700 sticky left-0 z-20 bg-stone-800 font-mono text-xs">
                    TOTAL
                  </td>
                  {CURRICULUM_COLUMNS.map((col) => {
                    const count = col.subjectNames.length;
                    return (
                      <td
                        key={col.key}
                        className="py-3 px-2 border-r border-stone-700 text-center font-mono text-sm font-black text-amber-300"
                      >
                        {count} Mapel
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: DETAILED CARDS PER JENJANG */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColumns.map((col) => {
            const pondokList = col.subjectNames.filter(
              (name) => MASTER_SUBJECTS_CATALOG[name]?.category === 'pondok'
            );
            const umumList = col.subjectNames.filter(
              (name) => MASTER_SUBJECTS_CATALOG[name]?.category !== 'pondok'
            );

            return (
              <div
                key={col.key}
                className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-stone-900 tracking-tight">
                        {col.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {col.subjectNames.length} Mapel
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-medium">{col.levelLabel}</p>
                  </div>

                  {onNavigateToGrading && (
                    <button
                      type="button"
                      onClick={() => onNavigateToGrading(getRepresentativeClassId(col.key))}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      <span>Input Nilai</span>
                      <CheckCircle2 size={13} />
                    </button>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-4 flex-1">
                  {/* Pondok Section */}
                  {pondokList.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-1 rounded mb-2 flex items-center justify-between">
                        <span>Kepondokan / Dirasah Islamiyah</span>
                        <span className="font-mono text-[10px]">{pondokList.length} Mapel</span>
                      </h4>
                      <ol className="space-y-1.5 pl-1">
                        {pondokList.map((name) => {
                          const idx = col.subjectNames.indexOf(name) + 1;
                          const info = MASTER_SUBJECTS_CATALOG[name];
                          return (
                            <li
                              key={name}
                              className="text-xs flex items-center justify-between text-stone-700 hover:text-stone-900"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-stone-400 w-4">
                                  {idx}.
                                </span>
                                <span className="font-semibold">{name}</span>
                              </div>
                              <span
                                className="font-arabic text-xs text-stone-500 font-bold"
                                dir="rtl"
                              >
                                {info?.nameAr}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}

                  {/* Umum Section */}
                  {umumList.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-1 rounded mb-2 flex items-center justify-between">
                        <span>Mata Pelajaran Umum (Diknas)</span>
                        <span className="font-mono text-[10px]">{umumList.length} Mapel</span>
                      </h4>
                      <ol className="space-y-1.5 pl-1">
                        {umumList.map((name) => {
                          const idx = col.subjectNames.indexOf(name) + 1;
                          const info = MASTER_SUBJECTS_CATALOG[name];
                          return (
                            <li
                              key={name}
                              className="text-xs flex items-center justify-between text-stone-700 hover:text-stone-900"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-stone-400 w-4">
                                  {idx}.
                                </span>
                                <span className="font-semibold">{name}</span>
                              </div>
                              <span
                                className="font-arabic text-xs text-stone-500 font-bold"
                                dir="rtl"
                              >
                                {info?.nameAr}
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Notes */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-stone-600 flex items-start gap-3">
        <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-stone-800">
            Keterangan Muatan Kurikulum Terpadu Al-Ghozali:
          </p>
          <p className="mt-0.5 leading-relaxed">
            Mata pelajaran diatur secara dinamis dan spesifik untuk masing-masing kelas. Setiap kali guru menginput nilai
            atau mencetak raport santri (Kasyfud Darajat), sistem secara otomatis menerapkan muatan mata pelajaran, urutan,
            dan teks bahasa Arab resmi sesuai kelas santri yang bersangkutan.
          </p>
        </div>
      </div>
    </div>
  );
};
