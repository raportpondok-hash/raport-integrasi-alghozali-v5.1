import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  ComposedChart,
} from 'recharts';
import { Subject, CalculatedStudent, ClassItem, SchoolType } from '../types';
import {
  TrendingUp,
  BarChart3,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  GraduationCap,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';

interface RekapitulasiAnalyticsChartProps {
  allStudents: CalculatedStudent[];
  currentClassStudents: CalculatedStudent[];
  classes: ClassItem[];
  selectedClassId?: string;
  onSelectClassId?: (classId: string) => void;
  subjects: Subject[];
  schoolType?: SchoolType;
}

type ChartViewMode = 'class-trend' | 'subject-avg' | 'grade-distribution';

export const RekapitulasiAnalyticsChart: React.FC<RekapitulasiAnalyticsChartProps> = ({
  allStudents,
  currentClassStudents,
  classes,
  selectedClassId,
  onSelectClassId,
  subjects,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ChartViewMode>('class-trend');
  const [sortClassBy, setSortClassBy] = useState<'default' | 'avg-desc' | 'avg-asc'>('default');

  const KKM_STANDAR = 70;

  // 1. Compute summary and averages for each class
  const classAnalyticsData = useMemo(() => {
    const data = classes.map((cls) => {
      const clsStudents = allStudents.filter((s) => (s.classId || '1a') === cls.id);
      const totalStudents = clsStudents.length;

      if (totalStudents === 0) {
        return {
          id: cls.id,
          name: cls.nameLatin,
          shortName: cls.nameLatin.replace(/Kelas\s*/i, '').trim(),
          waliKelas: cls.waliKelasName || '-',
          studentCount: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          passCount: 0,
          passRate: 0,
          isSelected: cls.id === selectedClassId,
        };
      }

      const totalAvgSum = clsStudents.reduce((sum, s) => sum + (s.averageScore || 0), 0);
      const avg = Math.round((totalAvgSum / totalStudents) * 10) / 10;
      const scores = clsStudents.map((s) => s.averageScore || 0);
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      const passCount = clsStudents.filter((s) => (s.averageScore || 0) >= KKM_STANDAR).length;
      const passRate = Math.round((passCount / totalStudents) * 100);

      return {
        id: cls.id,
        name: cls.nameLatin,
        shortName: cls.nameLatin.replace(/Kelas\s*/i, '').trim(),
        waliKelas: cls.waliKelasName || '-',
        studentCount: totalStudents,
        averageScore: avg,
        highestScore: max,
        lowestScore: min,
        passCount,
        passRate,
        isSelected: cls.id === selectedClassId,
      };
    }).filter((c) => c.studentCount > 0);

    if (sortClassBy === 'avg-desc') {
      return [...data].sort((a, b) => b.averageScore - a.averageScore);
    }
    if (sortClassBy === 'avg-asc') {
      return [...data].sort((a, b) => a.averageScore - b.averageScore);
    }
    return data;
  }, [classes, allStudents, selectedClassId, sortClassBy]);

  // Overall school-wide average across all classes in this view
  const overallSchoolAverage = useMemo(() => {
    if (classAnalyticsData.length === 0) return 0;
    const totalSum = classAnalyticsData.reduce((sum, c) => sum + c.averageScore, 0);
    return Math.round((totalSum / classAnalyticsData.length) * 10) / 10;
  }, [classAnalyticsData]);

  // 2. Compute Subject Averages for current class
  const subjectAnalyticsData = useMemo(() => {
    if (!currentClassStudents.length || !subjects.length) return [];

    return subjects.map((sub) => {
      const validScores = currentClassStudents
        .map((s) => s.scores?.[sub.id])
        .filter((val): val is number => typeof val === 'number' && !isNaN(val));

      if (validScores.length === 0) {
        return {
          id: sub.id,
          name: sub.nameId,
          nameAr: sub.nameAr,
          category: sub.category,
          avg: 0,
          min: 0,
          max: 0,
          kkm: sub.kkm || KKM_STANDAR,
          belowKkmCount: 0,
        };
      }

      const total = validScores.reduce((sum, v) => sum + v, 0);
      const avg = Math.round((total / validScores.length) * 10) / 10;
      const min = Math.min(...validScores);
      const max = Math.max(...validScores);
      const kkm = sub.kkm || KKM_STANDAR;
      const belowKkmCount = validScores.filter((v) => v < kkm).length;

      return {
        id: sub.id,
        name: sub.nameId,
        nameAr: sub.nameAr,
        category: sub.category,
        avg,
        min,
        max,
        kkm,
        belowKkmCount,
      };
    });
  }, [currentClassStudents, subjects]);

  // 3. Compute Grade Distribution for current class
  const gradeDistributionData = useMemo(() => {
    if (!currentClassStudents.length) return [];

    const buckets = [
      { key: 'mumtaz', label: 'Mumtaz (≥ 90)', count: 0, color: '#059669', desc: 'Sangat Baik' },
      { key: 'jayyidJiddan', label: 'Jayyid Jiddan (80-89)', count: 0, color: '#10b981', desc: 'Baik' },
      { key: 'jayyid', label: 'Jayyid (70-79)', count: 0, color: '#3b82f6', desc: 'Cukup' },
      { key: 'maqbul', label: 'Maqbul (60-69)', count: 0, color: '#f59e0b', desc: 'Sedang' },
      { key: 'rasib', label: 'Rasib (< 60)', count: 0, color: '#ef4444', desc: 'Perlu Bimbingan' },
    ];

    currentClassStudents.forEach((student) => {
      const avg = student.averageScore || 0;
      if (avg >= 90) buckets[0].count++;
      else if (avg >= 80) buckets[1].count++;
      else if (avg >= 70) buckets[2].count++;
      else if (avg >= 60) buckets[3].count++;
      else buckets[4].count++;
    });

    const total = currentClassStudents.length;
    return buckets.map((b) => ({
      ...b,
      percentage: total > 0 ? Math.round((b.count / total) * 100) : 0,
    }));
  }, [currentClassStudents]);

  // Current class KPI summary
  const currentClassData = useMemo(() => {
    return classAnalyticsData.find((c) => c.id === selectedClassId);
  }, [classAnalyticsData, selectedClassId]);

  return (
    <div className="no-print w-full bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden mb-6 transition-all duration-200">
      {/* Visual Header with Toggle */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-stone-50 via-white to-emerald-50/40 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white shadow-xs">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                Visualisasi & Analisis Tren Nilai Akademik
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <Sparkles size={10} />
                Analitik Wali Kelas
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Pantau progres rata-rata per kelas, komparasi antarkelas, dan ketuntasan santri secara visual
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <div className="inline-flex p-1 bg-stone-100 rounded-lg text-xs font-medium border border-stone-200/80">
              <button
                type="button"
                id="btn-tab-class-trend"
                onClick={() => setActiveTab('class-trend')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                  activeTab === 'class-trend'
                    ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BarChart3 size={13} />
                <span>Tren Antar Kelas</span>
              </button>
              <button
                type="button"
                id="btn-tab-subject-avg"
                onClick={() => setActiveTab('subject-avg')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                  activeTab === 'subject-avg'
                    ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <BookOpen size={13} />
                <span>Rata-rata Mapel</span>
              </button>
              <button
                type="button"
                id="btn-tab-grade-distribution"
                onClick={() => setActiveTab('grade-distribution')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                  activeTab === 'grade-distribution'
                    ? 'bg-white text-emerald-800 font-semibold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Award size={13} />
                <span>Distribusi Predikat</span>
              </button>
            </div>
          )}

          <button
            type="button"
            id="btn-toggle-analytics"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 transition"
            title={isOpen ? 'Ciutkan panel grafik' : 'Bentangkan panel grafik'}
          >
            {isOpen ? (
              <>
                <span>Sembunyikan</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Lihat Grafik</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5">
          {/* Quick Metric KPI Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/90">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
                <span>Rata-rata Kelas Ini</span>
                <GraduationCap size={15} className="text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-stone-900">
                  {currentClassData ? currentClassData.averageScore : '-'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  / 100
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                {currentClassData?.name || 'Pilih kelas'}
              </p>
            </div>

            <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/90">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
                <span>Rata-rata Semua Kelas</span>
                <TrendingUp size={15} className="text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-stone-900">
                  {overallSchoolAverage}
                </span>
                <span className="text-[11px] font-medium text-stone-500">
                  Semua Jenjang
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {classAnalyticsData.length} kelas aktif terdata
              </p>
            </div>

            <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/90">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
                <span>Ketuntasan Belajar</span>
                <Award size={15} className="text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-stone-900">
                  {currentClassData ? `${currentClassData.passRate}%` : '-'}
                </span>
                <span className="text-[11px] text-stone-500">
                  ≥ KKM {KKM_STANDAR}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {currentClassData ? `${currentClassData.passCount} dari ${currentClassData.studentCount} santri` : '-'}
              </p>
            </div>

            <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/90">
              <div className="flex items-center justify-between text-xs text-stone-500 font-medium mb-1">
                <span>Rentang Nilai Santri</span>
                <Users size={15} className="text-purple-600" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-emerald-700">
                  Max: {currentClassData?.highestScore || 0}
                </span>
                <span className="text-stone-300">|</span>
                <span className="text-sm font-bold text-rose-600">
                  Min: {currentClassData?.lowestScore || 0}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Total {currentClassStudents.length} santri terdaftar
              </p>
            </div>
          </div>

          {/* TAB 1: Tren Nilai Antar Kelas */}
          {activeTab === 'class-trend' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-stone-800">
                    Grafik Perbandingan Rata-rata Nilai Antar Kelas
                  </span>
                  <span className="text-stone-500 ml-2">
                    (Klik pada batang kelas untuk beralih kelas secara langsung)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500">Urutkan:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (sortClassBy === 'default') setSortClassBy('avg-desc');
                      else if (sortClassBy === 'avg-desc') setSortClassBy('avg-asc');
                      else setSortClassBy('default');
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-medium text-xs transition"
                  >
                    <ArrowUpDown size={12} />
                    {sortClassBy === 'default' && 'Urutan Kurikulum'}
                    {sortClassBy === 'avg-desc' && 'Tertinggi ke Terendah'}
                    {sortClassBy === 'avg-asc' && 'Terendah ke Tertinggi'}
                  </button>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={classAnalyticsData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        const clickedId = state.activePayload[0].payload?.id;
                        if (clickedId && onSelectClassId) {
                          onSelectClassId(clickedId);
                        }
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="shortName"
                      tick={{ fontSize: 10.5, fill: '#4b5563' }}
                      angle={-25}
                      textAnchor="end"
                      height={40}
                      interval={0}
                    />
                    <YAxis
                      domain={[50, 100]}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickCount={6}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-stone-200 text-xs space-y-1.5 min-w-[200px]">
                              <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                                <span className="font-bold text-stone-900 text-sm">
                                  {item.name}
                                </span>
                                {item.isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                    Kelas Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-600">
                                Wali Kelas: <span className="font-semibold text-stone-800">{item.waliKelas}</span>
                              </p>
                              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                                <p>Rata-rata: <b className="text-emerald-700 text-xs">{item.averageScore}</b></p>
                                <p>Santri: <b>{item.studentCount}</b></p>
                                <p>Tertinggi: <b className="text-blue-700">{item.highestScore}</b></p>
                                <p>Terendah: <b className="text-rose-600">{item.lowestScore}</b></p>
                              </div>
                              <div className="pt-1 border-t border-stone-100 text-[10px] text-stone-500">
                                Ketuntasan: <b>{item.passRate}%</b> ({item.passCount}/{item.studentCount})
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      content={() => (
                        <div className="flex items-center justify-center gap-5 text-xs text-stone-600 pb-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
                            Rata-rata Kelas
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
                            Kelas Terpilih ({currentClassData?.shortName || '-'})
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                            Garis KKM ({KKM_STANDAR})
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-0.5 border-t-2 border-emerald-500 inline-block" />
                            Rata-rata Total ({overallSchoolAverage})
                          </span>
                        </div>
                      )}
                    />
                    <ReferenceLine
                      y={KKM_STANDAR}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `KKM: ${KKM_STANDAR}`, position: 'right', fill: '#ef4444', fontSize: 10 }}
                    />
                    <ReferenceLine
                      y={overallSchoolAverage}
                      stroke="#10b981"
                      strokeDasharray="2 2"
                      label={{ value: `Rata-rata: ${overallSchoolAverage}`, position: 'left', fill: '#059669', fontSize: 10 }}
                    />
                    <Bar
                      dataKey="averageScore"
                      name="Rata-rata Kelas"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {classAnalyticsData.map((entry) => (
                        <Cell
                          key={`cell-${entry.id}`}
                          fill={entry.isSelected ? '#f59e0b' : '#059669'}
                        />
                      ))}
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="averageScore"
                      stroke="#047857"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#047857' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 2: Rata-rata Per Mapel di Kelas Ini */}
          {activeTab === 'subject-avg' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-800">
                    Rata-rata Mata Pelajaran di {currentClassData?.name || 'Kelas Ini'}
                  </span>
                  <span className="text-stone-500 ml-2">
                    (Total {subjectAnalyticsData.length} mapel terdaftar)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    ≥ 75 (Unggul)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    70-74 (Tuntas)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    &lt; 70 (Remedial)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectAnalyticsData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9.5, fill: '#4b5563' }}
                      angle={-35}
                      textAnchor="end"
                      height={65}
                      interval={0}
                    />
                    <YAxis
                      domain={[50, 100]}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickCount={6}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const isBelow = item.avg < item.kkm;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border border-stone-200 text-xs space-y-1.5 min-w-[210px]">
                              <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                                <span className="font-bold text-stone-900 text-sm">
                                  {item.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-100 text-stone-700">
                                  {item.category}
                                </span>
                              </div>
                              {item.nameAr && (
                                <p className="text-ar text-stone-600 text-sm font-arabic">
                                  {item.nameAr}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
                                <p>Rata-rata: <b className={isBelow ? 'text-rose-600' : 'text-emerald-700'}>{item.avg}</b></p>
                                <p>KKM: <b>{item.kkm}</b></p>
                                <p>Tertinggi: <b className="text-blue-700">{item.max}</b></p>
                                <p>Terendah: <b className="text-rose-600">{item.min}</b></p>
                              </div>
                              {item.belowKkmCount > 0 && (
                                <p className="text-[10.5px] text-rose-600 font-medium pt-1 border-t border-stone-100">
                                  ⚠️ {item.belowKkmCount} santri di bawah KKM
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine
                      y={KKM_STANDAR}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: `KKM: ${KKM_STANDAR}`, position: 'right', fill: '#ef4444', fontSize: 10 }}
                    />
                    <Bar
                      dataKey="avg"
                      name="Rata-rata Mapel"
                      radius={[4, 4, 0, 0]}
                    >
                      {subjectAnalyticsData.map((entry) => {
                        let color = '#059669';
                        if (entry.avg < (entry.kkm || KKM_STANDAR)) color = '#ef4444';
                        else if (entry.avg < 75) color = '#3b82f6';
                        return <Cell key={`cell-sub-${entry.id}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: Distribusi Predikat / Tingkat Kelulusan */}
          {activeTab === 'grade-distribution' && (
            <div className="space-y-4">
              <div className="text-xs">
                <span className="font-bold text-stone-800">
                  Sebaran Predikat Akademik Santri ({currentClassData?.name || 'Kelas Ini'})
                </span>
                <span className="text-stone-500 ml-2">
                  (Berdasarkan rata-rata nilai akhir santri)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Histogram Bar Chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={gradeDistributionData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 35, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fontSize: 10.5, fill: '#374151' }}
                        width={125}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-white p-2.5 rounded-lg shadow-md border border-stone-200 text-xs">
                                <p className="font-bold text-stone-900">{item.label}</p>
                                <p className="text-stone-600">{item.desc}</p>
                                <p className="text-emerald-700 font-semibold mt-1">
                                  Jumlah: {item.count} santri ({item.percentage}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {gradeDistributionData.map((entry) => (
                          <Cell key={`cell-grade-${entry.key}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Breakdown List Cards */}
                <div className="space-y-2">
                  {gradeDistributionData.map((grade) => (
                    <div
                      key={grade.key}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: grade.color }}
                        />
                        <div>
                          <p className="text-xs font-bold text-stone-900">
                            {grade.label}
                          </p>
                          <p className="text-[11px] text-stone-500">
                            Kategori: {grade.desc}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-stone-900">
                          {grade.count}
                        </span>
                        <span className="text-xs text-stone-500 ml-1">
                          santri ({grade.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Helper Tip */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-xs text-emerald-900">
            <HelpCircle size={14} className="text-emerald-700 shrink-0" />
            <p>
              <b>Tips Wali Kelas:</b> Data visualisasi ini tersinkronisasi secara langsung (real-time) dengan seluruh perubahan nilai pada tabel rekapitulasi di bawah.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
