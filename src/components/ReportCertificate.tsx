import React from 'react';
import { CertificateBorder } from './CertificateBorder';
import { ReportHeader } from './ReportHeader';
import { ReportTable } from './ReportTable';
import { ReportSignatures } from './ReportSignatures';
import { ReportCertificateFullDay } from './ReportCertificateFullDay';
import { Subject, CalculatedStudent, SchoolConfig, ClassItem } from '../types';
import { ReportDesignConfig } from '../data/reportDesign';
import { getSubjectsForClass } from '../data/curriculumSubjects';
import { INITIAL_CLASSES } from '../data/initialData';
import { getWaliKelasForClass } from '../data/waliKelasDatabase';

import { SelectedColumnKey } from './ExcelTableToolbar';

interface ReportCertificateProps {
  student: CalculatedStudent;
  subjects: Subject[];
  config: SchoolConfig;
  classes?: ClassItem[];
  className?: string;
  isPrintOnly?: boolean;
  isEditingMode?: boolean;
  selectedCol?: SelectedColumnKey;
  onSelectCol?: (col: SelectedColumnKey) => void;
  onOpenDateSettings?: () => void;
  designConfig?: ReportDesignConfig;
  onUpdateDesignConfig?: (newConfig: ReportDesignConfig) => void;
  onUpdateScore?: (studentId: string, subjectId: string, score: number) => void;
  customSubjectOverrides?: Record<string, { nameAr?: string; nameId?: string; customTerbilang?: string }>;
  onUpdateSubjectName?: (subjectId: string, overrides: { nameAr?: string; nameId?: string; customTerbilang?: string }) => void;
  onActiveCellChange?: (label: string, value: string, coord?: { row: number; col: number }) => void;
  formulaBarValue?: string;
  onUpdateStudentName?: (studentId: string, newName: string) => void;
  onUpdateNisn?: (studentId: string, newNisn: string) => void;
  onAddSubject?: () => void;
  onDeleteSubject?: (subjectId: string) => void;
  paperSize?: 'F4' | 'A4';
  id?: string;
}

export const ReportCertificate: React.FC<ReportCertificateProps> = ({
  student,
  subjects,
  config,
  classes,
  className = '',
  isPrintOnly = false,
  isEditingMode = false,
  paperSize = 'F4',
  selectedCol,
  onSelectCol,
  onOpenDateSettings,
  designConfig,
  onUpdateDesignConfig,
  onUpdateScore,
  customSubjectOverrides,
  onUpdateSubjectName,
  onActiveCellChange,
  formulaBarValue,
  onUpdateStudentName,
  onUpdateNisn,
  onAddSubject,
  onDeleteSubject,
  id = 'raport-certificate-container',
}) => {
  const effectiveSubjects = subjects && subjects.length > 0
    ? subjects
    : (student.classId ? getSubjectsForClass(student.classId) : []);

  // Resolve official class information and homeroom teacher name & academic title
  const classInfo = student.classId
    ? ((classes || []).find((c) => c.id === student.classId) ||
       INITIAL_CLASSES.find((c) => c.id === student.classId) ||
       (classes || []).find((c) => c.id.toLowerCase() === student.classId.toLowerCase()) ||
       INITIAL_CLASSES.find((c) => c.id.toLowerCase() === student.classId.toLowerCase()))
    : undefined;

  // Resolve wali kelas: dynamically matches the student's exact class
  const resolvedWaliKelas =
    classInfo?.waliKelasName ||
    (student.classId ? getWaliKelasForClass(student.classId, classes) : undefined) ||
    config.waliKelasName ||
    '-';

  const resolvedClassAr = classInfo?.nameAr || config.classAr;
  const resolvedClassLatin = classInfo?.nameLatin || config.classLatin;

  const effectiveConfig: SchoolConfig = {
    ...config,
    classAr: resolvedClassAr,
    classLatin: resolvedClassLatin,
    waliKelasName: resolvedWaliKelas,
  };

  // Deteksi apakah siswa / kelas adalah Full Day (Non-Mukim)
  const isFullDay =
    student.schoolType === 'fullday' ||
    config.schoolType === 'fullday' ||
    classInfo?.schoolType === 'fullday' ||
    (student.classId || '').includes('fd') ||
    (classInfo?.nameLatin || '').toLowerCase().includes('full day') ||
    (classInfo?.nameLatin || '').toLowerCase().includes('non mukim');

  if (isFullDay) {
    return (
      <ReportCertificateFullDay
        id={id}
        student={student}
        subjects={effectiveSubjects}
        config={effectiveConfig}
        classes={classes}
        className={className}
        isPrintOnly={isPrintOnly}
        isEditingMode={isEditingMode}
        totalStudentsInClass={36}
        onUpdateScore={onUpdateScore}
        onUpdateStudentName={onUpdateStudentName}
        onUpdateNisn={onUpdateNisn}
        paperSize={paperSize}
      />
    );
  }

  const pageHeight = paperSize === 'A4' ? '297mm' : '330mm';

  return (
    <div
      id={id}
      data-paper-size={paperSize}
      className={`rapor-page paper-${paperSize.toLowerCase()} mx-auto bg-white text-stone-900 ${
        isPrintOnly ? '' : 'shadow-2xl rounded-sm'
      } ${className}`}
      style={{
        width: '210mm',
        height: pageHeight,
        minWidth: '210mm',
        minHeight: pageHeight,
        maxWidth: '210mm',
        maxHeight: pageHeight,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        margin: '0 auto',
        padding: 0,
      }}
    >
      <CertificateBorder
        id={id || `cert-${student.id}`}
        designConfig={designConfig}
        onUpdateDesignConfig={onUpdateDesignConfig}
        isPrintOnly={isPrintOnly}
        isEditingMode={isEditingMode}
      >
        <ReportHeader
          studentName={student.name}
          nisn={student.nisn}
          config={effectiveConfig}
          designConfig={designConfig}
          isEditingMode={isEditingMode}
          isPrintOnly={isPrintOnly}
          onUpdateStudentName={onUpdateStudentName ? (newName) => onUpdateStudentName(student.id, newName) : undefined}
          onUpdateNisn={onUpdateNisn ? (newNisn) => onUpdateNisn(student.id, newNisn) : undefined}
        />

        <ReportTable
          subjects={effectiveSubjects}
          scores={student.scores}
          totalScore={student.totalScore}
          averageScore={student.averageScore}
          rank={student.rank}
          studentId={student.id}
          designConfig={designConfig}
          onUpdateDesignConfig={onUpdateDesignConfig}
          onUpdateScore={onUpdateScore}
          customSubjectOverrides={customSubjectOverrides}
          onUpdateSubjectName={onUpdateSubjectName}
          isPrintOnly={isPrintOnly}
          isEditingMode={isEditingMode}
          selectedCol={selectedCol}
          onSelectCol={onSelectCol}
          onActiveCellChange={onActiveCellChange}
          formulaBarValue={formulaBarValue}
          onAddSubject={onAddSubject}
          onDeleteSubject={onDeleteSubject}
        />

        <ReportSignatures
          config={effectiveConfig}
          onOpenDateSettings={onOpenDateSettings}
          designConfig={designConfig}
        />
      </CertificateBorder>
    </div>
  );
};

