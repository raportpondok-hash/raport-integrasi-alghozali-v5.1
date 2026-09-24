import React, { useState, useRef } from 'react';
import { Subject } from '../types';
import {
  toEasternArabicNumerals,
  numberToArabicWords,
  rankToArabicOrdinal,
} from '../utils/arabicNumbers';
import { ReportDesignConfig } from '../data/reportDesign';
import { SelectedColumnKey } from './ExcelTableToolbar';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Trash2, Plus } from 'lucide-react';

interface ReportTableProps {
  subjects: Subject[];
  scores: Record<string, number>;
  totalScore: number;
  averageScore: number;
  rank: number;
  studentId?: string;
  designConfig?: ReportDesignConfig;
  onUpdateDesignConfig?: (newConfig: ReportDesignConfig) => void;
  onUpdateScore?: (studentId: string, subjectId: string, score: number) => void;
  customSubjectOverrides?: Record<string, { nameAr?: string; nameId?: string; customTerbilang?: string }>;
  onUpdateSubjectName?: (subjectId: string, overrides: { nameAr?: string; nameId?: string; customTerbilang?: string }) => void;
  onAddSubject?: () => void;
  onDeleteSubject?: (subjectId: string) => void;
  isPrintOnly?: boolean;
  isEditingMode?: boolean;
  selectedCol?: SelectedColumnKey;
  onSelectCol?: (col: SelectedColumnKey) => void;
  onActiveCellChange?: (label: string, value: string, coord?: { row: number; col: number }) => void;
  formulaBarValue?: string;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  subjects,
  scores,
  totalScore,
  averageScore,
  rank,
  studentId,
  designConfig,
  onUpdateDesignConfig,
  onUpdateScore,
  customSubjectOverrides,
  onUpdateSubjectName,
  onAddSubject,
  onDeleteSubject,
  isPrintOnly = false,
  isEditingMode = false,
  selectedCol,
  onSelectCol,
  onActiveCellChange,
  formulaBarValue,
}) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const totalSubjects = Math.max(1, subjects.length);

  // 6 Kolom Sesuai Template Resmi & Foto Referensi:
  // Col 0: No (الرقم)
  // Col 1: Mapel Arab (المواد الدراسية)
  // Col 2: Mapel Latin (Mata Pelajaran)
  // Col 3: Nilai Angka Arab (٦٨)
  // Col 4: Nilai Angka Latin (68)
  // Col 5: Terbilang Arab (ثـمـان و ســــــتّون)
  const COL_KEYS: SelectedColumnKey[] = ['no', 'subjectAr', 'subjectLat', 'score', 'score', 'terbilang'];
  const COL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const COL_NAMES = [
    'الرقم (No)',
    'المواد (Arab)',
    'Mata Pelajaran (Latin)',
    'الدرجة بالرقم العربي',
    'الدرجة بالرقم اللاتيني',
    'بالحروف (Terbilang)',
  ];

  // Typography & Column Settings from designConfig
  const numberFormat = designConfig?.numberFormat ?? 'arabic';
  const numberAlign = designConfig?.numberAlign ?? 'center';
  const arabicSubjectAlign = designConfig?.arabicSubjectAlign ?? 'right';
  const latinSubjectAlign = designConfig?.latinSubjectAlign ?? 'left';
  const scoreAlign = designConfig?.scoreAlign ?? 'center';
  const terbilangAlign = designConfig?.terbilangAlign ?? 'center';

  // Active column selection for Excel-like in-place editing
  const [internalSelectedCol, setInternalSelectedCol] = useState<SelectedColumnKey>('no');
  const activeSelectedCol = selectedCol ?? internalSelectedCol;
  const handleSelectCol = (col: SelectedColumnKey) => {
    if (onSelectCol) onSelectCol(col);
    else setInternalSelectedCol(col);
  };

  // Active Excel Cell: { row: number; col: number } (0-indexed)
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellEditValue, setCellEditValue] = useState<string>('');

  const getCellValue = (row: number, col: number): string | number => {
    const subject = subjects[row];
    if (!subject) return '';
    const rawScore = scores[subject.id];
    const score = typeof rawScore === 'number' && !Number.isNaN(rawScore) ? rawScore : 0;
    const arabicWords = customSubjectOverrides?.[subject.id]?.customTerbilang || numberToArabicWords(score);

    switch (col) {
      case 0:
        return numberFormat === 'arabic' ? toEasternArabicNumerals(row + 1) : row + 1;
      case 1:
        return customSubjectOverrides?.[subject.id]?.nameAr || subject.nameAr;
      case 2:
        return customSubjectOverrides?.[subject.id]?.nameId || subject.nameId;
      case 3:
        return toEasternArabicNumerals(score);
      case 4:
        return score;
      case 5:
        return arabicWords;
      default:
        return '';
    }
  };

  const notifyActiveCell = (row: number, col: number, overrideVal?: string) => {
    if (onActiveCellChange) {
      const val = overrideVal !== undefined ? overrideVal : getCellValue(row, col);
      const coord = `${COL_LETTERS[col]}${row + 1}`;
      onActiveCellChange(`${coord} (${COL_NAMES[col]})`, String(val), { row, col });
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!isEditingMode || isPrintOnly) return;
    if (editingCell && (editingCell.row !== row || editingCell.col !== col)) {
      handleCommitCellEdit();
    }
    setActiveCell({ row, col });
    handleSelectCol(COL_KEYS[col]);
    notifyActiveCell(row, col);
    tableRef.current?.focus();
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    if (!isEditingMode || isPrintOnly) return;
    setActiveCell({ row, col });
    setEditingCell({ row, col });
    setCellEditValue(String(getCellValue(row, col)));
  };

  const handleCommitCellEdit = () => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const subject = subjects[row];
    if (!subject) {
      setEditingCell(null);
      return;
    }

    if (col === 3 || col === 4) {
      // Nilai Angka (Score) - baik diedit via kolom Arab maupun Latin
      let numVal = 0;
      // Handle eastern arabic numerals input
      const convertedInput = cellEditValue
        .replace(/٠/g, '0')
        .replace(/١/g, '1')
        .replace(/٢/g, '2')
        .replace(/٣/g, '3')
        .replace(/٤/g, '4')
        .replace(/٥/g, '5')
        .replace(/٦/g, '6')
        .replace(/٧/g, '7')
        .replace(/٨/g, '8')
        .replace(/٩/g, '9');
      numVal = Math.max(0, Math.min(100, Number(convertedInput) || 0));
      if (studentId && onUpdateScore) {
        onUpdateScore(studentId, subject.id, numVal);
      }
    } else if (col === 1) {
      // Mapel Arab
      if (onUpdateSubjectName) {
        onUpdateSubjectName(subject.id, { nameAr: cellEditValue });
      }
    } else if (col === 2) {
      // Mapel Latin
      if (onUpdateSubjectName) {
        onUpdateSubjectName(subject.id, { nameId: cellEditValue });
      }
    } else if (col === 5) {
      // Terbilang Arab
      if (onUpdateSubjectName) {
        onUpdateSubjectName(subject.id, { customTerbilang: cellEditValue });
      }
    }

    setEditingCell(null);
    notifyActiveCell(row, col, cellEditValue);
  };

  // Keyboard handling inside cell inputs
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleCommitCellEdit();
      if (activeCell && activeCell.row < subjects.length - 1) {
        const nextRow = activeCell.row + 1;
        setActiveCell({ row: nextRow, col: activeCell.col });
        notifyActiveCell(nextRow, activeCell.col);
      }
      tableRef.current?.focus();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      handleCommitCellEdit();
      if (activeCell) {
        const nextCol = e.shiftKey ? Math.max(0, activeCell.col - 1) : Math.min(5, activeCell.col + 1);
        setActiveCell({ row: activeCell.row, col: nextCol });
        handleSelectCol(COL_KEYS[nextCol]);
        notifyActiveCell(activeCell.row, nextCol);
      }
      tableRef.current?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setEditingCell(null);
      tableRef.current?.focus();
    }
  };

  // Keyboard navigation & Excel shortcuts on table
  const handleTableKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditingMode || isPrintOnly) return;

    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCommitCellEdit();
        if (activeCell && activeCell.row < subjects.length - 1) {
          const nextRow = activeCell.row + 1;
          setActiveCell({ row: nextRow, col: activeCell.col });
          notifyActiveCell(nextRow, activeCell.col);
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        handleCommitCellEdit();
        if (activeCell) {
          const nextCol = e.shiftKey ? Math.max(0, activeCell.col - 1) : Math.min(5, activeCell.col + 1);
          setActiveCell({ row: activeCell.row, col: nextCol });
          handleSelectCol(COL_KEYS[nextCol]);
          notifyActiveCell(activeCell.row, nextCol);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setEditingCell(null);
      }
      return;
    }

    if (!activeCell) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = Math.min(subjects.length - 1, activeCell.row + 1);
      setActiveCell({ row: nextRow, col: activeCell.col });
      notifyActiveCell(nextRow, activeCell.col);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextRow = Math.max(0, activeCell.row - 1);
      setActiveCell({ row: nextRow, col: activeCell.col });
      notifyActiveCell(nextRow, activeCell.col);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextCol = Math.min(5, activeCell.col + 1);
      setActiveCell({ row: activeCell.row, col: nextCol });
      handleSelectCol(COL_KEYS[nextCol]);
      notifyActiveCell(activeCell.row, nextCol);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextCol = Math.max(0, activeCell.col - 1);
      setActiveCell({ row: activeCell.row, col: nextCol });
      handleSelectCol(COL_KEYS[nextCol]);
      notifyActiveCell(activeCell.row, nextCol);
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault();
      setEditingCell(activeCell);
      setCellEditValue(String(getCellValue(activeCell.row, activeCell.col)));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = e.shiftKey ? Math.max(0, activeCell.col - 1) : Math.min(5, activeCell.col + 1);
      setActiveCell({ row: activeCell.row, col: nextCol });
      handleSelectCol(COL_KEYS[nextCol]);
      notifyActiveCell(activeCell.row, nextCol);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setEditingCell(activeCell);
      setCellEditValue(e.key);
    }
  };

  /*
   * Row height & margin disesuaikan secara dinamis agar 28 mata pelajaran pas 1 lembar F4
   */
  const rowHeight = designConfig?.tableRowHeight ?? Math.max(
    20,
    Math.min(
      25,
      Math.floor(620 / totalSubjects)
    )
  );

  const tableMarginTop = designConfig?.tableMarginTop ?? 3;
  const tableMarginBottom = designConfig?.tableMarginBottom ?? 3;
  const tableBorderWidth = designConfig?.tableBorderWidth ?? 0.75;
  const tableBorderColor = designConfig?.tableBorderColor ?? '#1f2937';
  const tableHeaderBg = designConfig?.tableHeaderBg ?? '#f8fafc';

  const headerHeight = 30;
  const summaryHeight = Math.max(22, rowHeight);

  const isCompact = totalSubjects > 22;

  const headerFontSize = designConfig?.tableHeaderFontSize ?? (isCompact ? 12 : 13.5);
  const numberFontSize = designConfig?.numberFontSize ?? (isCompact ? 10.5 : 12);
  const subjectFontSize = designConfig?.latinSubjectFontSize ?? (isCompact ? 10.5 : 11.5);
  const arabicFontSize = designConfig?.arabicSubjectFontSize ?? (isCompact ? 13.5 : 14.5);
  const scoreFontSize = designConfig?.scoreFontSize ?? (isCompact ? 11.5 : 12.5);
  const terbilangFontSize = designConfig?.terbilangFontSize ?? (isCompact ? 13 : 14);
  const summaryFontSize = designConfig?.summaryFontSize ?? (isCompact ? 12 : 13.5);

  const arabicFontFamily = designConfig?.arabicFontFamily ?? "'Traditional Arabic', 'Amiri', 'Scheherazade New', serif";
  const latinFontFamily = designConfig?.latinFontFamily ?? "'Times New Roman', Arial, sans-serif";
  const arabicFontWeight = designConfig?.arabicFontWeight ?? '700';
  const latinFontWeight = designConfig?.latinFontWeight ?? 'normal';

  // Vertical alignment
  const tableVerticalAlign = designConfig?.tableVerticalAlign ?? 'middle';
  const numberVAlign = designConfig?.numberVerticalAlign ?? tableVerticalAlign;
  const arabicSubjectVAlign = designConfig?.arabicSubjectVerticalAlign ?? tableVerticalAlign;
  const latinSubjectVAlign = designConfig?.latinSubjectVerticalAlign ?? tableVerticalAlign;
  const scoreVAlign = designConfig?.scoreVerticalAlign ?? tableVerticalAlign;
  const terbilangVAlign = designConfig?.terbilangVerticalAlign ?? tableVerticalAlign;

  // 6 Column widths with fallback
  const colWidthNo = designConfig?.colWidthNo ?? (designConfig?.numberColWidth ?? 5.5);
  const colWidthSubjectAr = designConfig?.colWidthSubjectAr ?? 28.5;
  const colWidthSubjectLat = designConfig?.colWidthSubjectLat ?? 24.5;
  const colWidthScoreAr = designConfig?.colWidthScoreAr ?? 6.5;
  const colWidthScoreLat = designConfig?.colWidthScoreLat ?? 6.5;
  const colWidthTerbilang = designConfig?.colWidthTerbilang ?? 28.5;

  // Handle Drag-to-Resize Column Width like Excel
  const handleStartResize = (
    colKey: 'no' | 'subjectAr' | 'subjectLat' | 'scoreAr' | 'scoreLat' | 'terbilang',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onUpdateDesignConfig || !designConfig) return;

    const startX = e.clientX;
    const initialNo = colWidthNo;
    const initialAr = colWidthSubjectAr;
    const initialLat = colWidthSubjectLat;
    const initialScoreAr = colWidthScoreAr;
    const initialScoreLat = colWidthScoreLat;
    const initialTer = colWidthTerbilang;

    const tableEl = document.querySelector('.report-custom-table');
    const tableWidth = tableEl ? tableEl.getBoundingClientRect().width : 700;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // In RTL table, moving mouse left makes right column wider
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / tableWidth) * 100;
      const effectiveDelta = -deltaPercent; // RTL inversion

      let newNo = initialNo;
      let newAr = initialAr;
      let newLat = initialLat;
      let newScoreAr = initialScoreAr;
      let newScoreLat = initialScoreLat;
      let newTer = initialTer;

      if (colKey === 'no') {
        newNo = Math.max(4, Math.min(15, initialNo + effectiveDelta));
        const diff = newNo - initialNo;
        newAr = Math.max(15, initialAr - diff);
      } else if (colKey === 'subjectAr') {
        newAr = Math.max(15, Math.min(45, initialAr + effectiveDelta));
        const diff = newAr - initialAr;
        newLat = Math.max(12, initialLat - diff);
      } else if (colKey === 'subjectLat') {
        newLat = Math.max(12, Math.min(40, initialLat + effectiveDelta));
        const diff = newLat - initialLat;
        newScoreAr = Math.max(5, initialScoreAr - diff);
      } else if (colKey === 'scoreAr') {
        newScoreAr = Math.max(5, Math.min(15, initialScoreAr + effectiveDelta));
        const diff = newScoreAr - initialScoreAr;
        newScoreLat = Math.max(5, initialScoreLat - diff);
      } else if (colKey === 'scoreLat') {
        newScoreLat = Math.max(5, Math.min(15, initialScoreLat + effectiveDelta));
        const diff = newScoreLat - initialScoreLat;
        newTer = Math.max(15, initialTer - diff);
      } else if (colKey === 'terbilang') {
        newTer = Math.max(15, Math.min(45, initialTer - effectiveDelta));
        const diff = newTer - initialTer;
        newAr = Math.max(15, initialAr - diff);
      }

      onUpdateDesignConfig({
        ...designConfig,
        colWidthNo: Number(newNo.toFixed(1)),
        colWidthSubjectAr: Number(newAr.toFixed(1)),
        colWidthSubjectLat: Number(newLat.toFixed(1)),
        colWidthScoreAr: Number(newScoreAr.toFixed(1)),
        colWidthScoreLat: Number(newScoreLat.toFixed(1)),
        colWidthScore: Number((newScoreAr + newScoreLat).toFixed(1)),
        colWidthTerbilang: Number(newTer.toFixed(1)),
        numberColWidth: Number(newNo.toFixed(1)),
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag-to-Resize Table Margins in Vertical Directions (Atas / Bawah)
  const handleStartTableMarginResize = (
    direction: 'top' | 'bottom',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onUpdateDesignConfig || !designConfig) return;

    const startY = e.clientY;
    const initialTop = tableMarginTop;
    const initialBottom = tableMarginBottom;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      if (direction === 'top') {
        const nextTop = Math.max(0, Math.min(35, Math.round(initialTop + deltaY)));
        onUpdateDesignConfig({ ...designConfig, tableMarginTop: nextTop });
      } else {
        const nextBottom = Math.max(0, Math.min(35, Math.round(initialBottom - deltaY)));
        onUpdateDesignConfig({ ...designConfig, tableMarginBottom: nextBottom });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Drag-to-Resize Table Corner
  const handleStartCornerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onUpdateDesignConfig || !designConfig) return;

    const startY = e.clientY;
    const initialHeight = rowHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const nextHeight = Math.max(18, Math.min(32, Math.round(initialHeight + deltaY / 6)));
      onUpdateDesignConfig({
        ...designConfig,
        tableRowHeight: nextHeight,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Direct alignment setter
  const handleQuickSetAlign = (
    col: SelectedColumnKey,
    align: 'left' | 'center' | 'right' | 'justify',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!onUpdateDesignConfig || !designConfig) return;

    switch (col) {
      case 'no':
        onUpdateDesignConfig({ ...designConfig, numberAlign: align });
        break;
      case 'subjectAr':
        onUpdateDesignConfig({ ...designConfig, arabicSubjectAlign: align });
        break;
      case 'subjectLat':
        onUpdateDesignConfig({ ...designConfig, latinSubjectAlign: align });
        break;
      case 'score':
        onUpdateDesignConfig({ ...designConfig, scoreAlign: align as 'left' | 'center' | 'right' });
        break;
      case 'terbilang':
        onUpdateDesignConfig({ ...designConfig, terbilangAlign: align });
        break;
    }
  };

  // Direct vertical alignment setter (Top, Middle, Bottom)
  const handleQuickSetVAlign = (
    col: SelectedColumnKey,
    valign: 'top' | 'middle' | 'bottom',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!onUpdateDesignConfig || !designConfig) return;

    switch (col) {
      case 'no':
        onUpdateDesignConfig({ ...designConfig, numberVerticalAlign: valign });
        break;
      case 'subjectAr':
        onUpdateDesignConfig({ ...designConfig, arabicSubjectVerticalAlign: valign });
        break;
      case 'subjectLat':
        onUpdateDesignConfig({ ...designConfig, latinSubjectVerticalAlign: valign });
        break;
      case 'score':
        onUpdateDesignConfig({ ...designConfig, scoreVerticalAlign: valign });
        break;
      case 'terbilang':
        onUpdateDesignConfig({ ...designConfig, terbilangVerticalAlign: valign });
        break;
      case 'all':
        onUpdateDesignConfig({
          ...designConfig,
          tableVerticalAlign: valign,
          numberVerticalAlign: valign,
          arabicSubjectVerticalAlign: valign,
          latinSubjectVerticalAlign: valign,
          scoreVerticalAlign: valign,
          terbilangVerticalAlign: valign,
        });
        break;
    }
  };

  return (
    <div
      className="report-table-wrapper w-full relative group/table"
      style={{
        marginTop: `${tableMarginTop}px`,
        marginBottom: `${tableMarginBottom}px`,
      }}
      dir="rtl"
    >
      {/* =========================================================================
          EXCEL-STYLE 4-DIRECTIONAL TABLE RESIZE HANDLERS & BADGES
         ========================================================================= */}
      {isEditingMode && !isPrintOnly && onUpdateDesignConfig && designConfig && (
        <>
          {/* 1. ATAS: Drag Line & Quick Margin Atas Badge */}
          <div
            data-editing-control="true"
            className="no-print absolute top-0 left-0 right-0 h-3 -mt-1.5 cursor-ns-resize z-30 flex items-center justify-center group/tbl-top"
            onMouseDown={(e) => handleStartTableMarginResize('top', e)}
            title="Geser batas atas tabel untuk mengatur jarak atas (Margin Atas) seperti Excel"
          >
            <div className="w-full h-[2px] bg-transparent group-hover/tbl-top:bg-emerald-500/80 transition-colors" />
          </div>

          <div 
            data-editing-control="true"
            className="no-print absolute -top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/table:opacity-100 hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-stone-900/95 text-white text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-emerald-500/50 z-40 select-none"
          >
            <span className="text-emerald-300 font-bold">⬍ Margin Atas: {tableMarginTop}px</span>
            <button
              type="button"
              onClick={() => onUpdateDesignConfig({ ...designConfig, tableMarginTop: Math.max(0, tableMarginTop - 1) })}
              className="w-3.5 h-3.5 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
              title="Kurangi Margin Atas (-1px)"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => onUpdateDesignConfig({ ...designConfig, tableMarginTop: Math.min(35, tableMarginTop + 1) })}
              className="w-3.5 h-3.5 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
              title="Tambah Margin Atas (+1px)"
            >
              +
            </button>
          </div>

          {/* 2. BAWAH: Drag Line & Quick Margin Bawah + Tinggi Baris Badge */}
          <div
            data-editing-control="true"
            className="no-print absolute bottom-0 left-0 right-0 h-3 -mb-1.5 cursor-ns-resize z-30 flex items-center justify-center group/tbl-bottom"
            onMouseDown={(e) => handleStartTableMarginResize('bottom', e)}
            title="Geser batas bawah tabel untuk mengatur jarak bawah (Margin Bawah) seperti Excel"
          >
            <div className="w-full h-[2px] bg-transparent group-hover/tbl-bottom:bg-emerald-500/80 transition-colors" />
          </div>

          <div 
            data-editing-control="true"
            className="no-print absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/table:opacity-100 hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-stone-900/95 text-white text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-emerald-500/50 z-40 select-none"
          >
            <span className="text-emerald-300 font-bold">⬍ Margin Bawah: {tableMarginBottom}px</span>
            <button
              type="button"
              onClick={() => onUpdateDesignConfig({ ...designConfig, tableMarginBottom: Math.max(0, tableMarginBottom - 1) })}
              className="w-3.5 h-3.5 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
              title="Kurangi Margin Bawah (-1px)"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => onUpdateDesignConfig({ ...designConfig, tableMarginBottom: Math.min(35, tableMarginBottom + 1) })}
              className="w-3.5 h-3.5 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
              title="Tambah Margin Bawah (+1px)"
            >
              +
            </button>

            <span className="text-stone-600">|</span>

            <span className="text-amber-300 font-bold">⬍ Tinggi Baris: {rowHeight}px</span>
            <button
              type="button"
              onClick={() => onUpdateDesignConfig({ ...designConfig, tableRowHeight: Math.max(18, rowHeight - 1) })}
              className="w-3.5 h-3.5 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
              title="Kurangi Tinggi Baris (-1px)"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => onUpdateDesignConfig({ ...designConfig, tableRowHeight: Math.min(32, rowHeight + 1) })}
              className="w-3.5 h-3.5 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
              title="Tambah Tinggi Baris (+1px)"
            >
              +
            </button>
          </div>

          {/* 3. KIRI: Outer Table Left Edge Drag Line */}
          <div
            data-editing-control="true"
            className="no-print absolute top-0 bottom-0 left-0 w-3 -ml-1.5 cursor-col-resize z-30 flex items-center justify-center group/tbl-left"
            onMouseDown={(e) => handleStartResize('terbilang', e)}
            title="Geser batas kiri tabel (Kiri/Kanan) seperti Excel"
          >
            <div className="h-full w-[2px] bg-transparent group-hover/tbl-left:bg-emerald-500/80 transition-colors" />
          </div>

          {/* 4. KANAN: Outer Table Right Edge Drag Line */}
          <div
            data-editing-control="true"
            className="no-print absolute top-0 bottom-0 right-0 w-3 -mr-1.5 cursor-col-resize z-30 flex items-center justify-center group/tbl-right"
            onMouseDown={(e) => handleStartResize('no', e)}
            title="Geser batas kanan tabel (Kiri/Kanan) seperti Excel"
          >
            <div className="h-full w-[2px] bg-transparent group-hover/tbl-right:bg-emerald-500/80 transition-colors" />
          </div>

          {/* 5. Excel Table Corner Resize Gripper */}
          <div
            data-editing-control="true"
            className="no-print absolute -bottom-1 -left-1 w-4 h-4 cursor-nwse-resize z-40 flex items-end justify-start select-none group/corner"
            onMouseDown={(e) => handleStartCornerResize(e)}
            title="Tarik sudut tabel untuk memperbesar/memperkecil tinggi tabel seperti Excel"
          >
            <div className="w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-600 bg-emerald-100/80 shadow-xs group-hover/corner:scale-125 transition-transform" />
          </div>
        </>
      )}

      <style>{`
        .report-custom-table {
          width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
          border-spacing: 0;
          font-size: 11px;
          border: ${tableBorderWidth}px solid ${tableBorderColor};
        }

        .report-custom-table th,
        .report-custom-table td {
          box-sizing: border-box;
          vertical-align: middle;
          border: ${tableBorderWidth}px solid ${tableBorderColor};
          padding: 0;
          position: relative;
        }

        .report-custom-table th > div,
        .report-custom-table td > div {
          box-sizing: border-box;
          width: 100%;
          min-height: ${rowHeight}px;
          display: flex;
          align-items: center;
          line-height: normal;
        }

        .report-custom-table th {
          background-color: ${tableHeaderBg};
          font-weight: bold;
          text-align: center;
          color: #000000;
          user-select: none;
        }

        .report-custom-table .text-ar {
          font-family: ${arabicFontFamily};
          font-weight: ${arabicFontWeight};
          direction: rtl;
          color: #000000;
        }

        .report-custom-table .text-lat {
          font-family: ${latinFontFamily};
          font-weight: ${latinFontWeight};
          direction: ltr;
          color: #000000;
        }

        .col-selected-cell {
          background-color: rgba(16, 185, 129, 0.06) !important;
        }

        .col-selected-th {
          box-shadow: inset 0 0 0 2px #059669 !important;
          background-color: #e6f4ea !important;
        }

        @media print {
          .report-custom-table {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            table-layout: fixed !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }

          .report-custom-table th {
            background-color: ${tableHeaderBg} !important;
          }

          .report-custom-table th,
          .report-custom-table td {
            border-color: ${tableBorderColor} !important;
            height: auto !important;
            vertical-align: middle !important;
          }

          .report-custom-table td > div,
          .report-custom-table th > div {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            padding-top: ${isCompact ? '1px' : '2.5px'} !important;
            padding-bottom: ${isCompact ? '1px' : '2.5px'} !important;
            line-height: ${isCompact ? '1.15' : '1.25'} !important;
            white-space: normal !important;
            word-break: break-word !important;
          }

          .col-selected-cell {
            background-color: transparent !important;
          }

          .col-selected-th {
            box-shadow: none !important;
            background-color: ${tableHeaderBg} !important;
          }

          .report-custom-table td {
            outline: none !important;
          }

          [data-editing-control] {
            display: none !important;
          }
        }
      `}</style>

      <table
        ref={tableRef}
        tabIndex={isEditingMode && !isPrintOnly ? 0 : undefined}
        onKeyDown={handleTableKeyDown}
        className="report-custom-table"
        aria-label="Tabel nilai kasyfud darajat 6 kolom"
        style={{ outline: 'none' }}
      >
        {/* =====================================================
            6 KOLOM PERSENTASE SESUAI TEMPLATE RESMI
           ===================================================== */}
        <colgroup>
          {/* 1. الرقم (No) */}
          <col style={{ width: `${colWidthNo}%` }} />
          {/* 2. المواد الدراسية (Mapel Arab) */}
          <col style={{ width: `${colWidthSubjectAr}%` }} />
          {/* 3. Mata Pelajaran (Mapel Latin) */}
          <col style={{ width: `${colWidthSubjectLat}%` }} />
          {/* 4. Nilai Angka Arab */}
          <col style={{ width: `${colWidthScoreAr}%` }} />
          {/* 5. Nilai Angka Latin */}
          <col style={{ width: `${colWidthScoreLat}%` }} />
          {/* 6. Terbilang Arab */}
          <col style={{ width: `${colWidthTerbilang}%` }} />
        </colgroup>

        <thead>
          <tr
            className="text-ar"
            style={{
              height: `${headerHeight}px`,
            }}
          >
            {/* 1. الرقم (Kolom No) */}
            <th
              onClick={() => isEditingMode && handleSelectCol('no')}
              className={`${isEditingMode && !isPrintOnly ? 'cursor-pointer group' : ''} ${
                isEditingMode && !isPrintOnly && activeSelectedCol === 'no' ? 'col-selected-th' : ''
              }`}
              style={{
                fontSize: `${headerFontSize}px`,
                height: `${headerHeight}px`,
                textAlign: numberAlign,
                verticalAlign: numberVAlign,
                padding: 0,
                boxSizing: 'border-box',
              }}
              title={isEditingMode ? 'Klik untuk memilih Kolom Nomor' : undefined}
            >
              <div 
                className="flex flex-col items-center justify-center"
                style={{
                  width: '100%',
                  height: `${headerHeight}px`,
                  minHeight: `${headerHeight}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 2px',
                  boxSizing: 'border-box',
                }}
              >
                <span>الرقم</span>
                {isEditingMode && !isPrintOnly && (
                  <div 
                    data-editing-control="true"
                    className="no-print opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 mt-0.5"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleQuickSetVAlign('no', 'middle', e)}
                      className="px-1 py-0.5 hover:bg-emerald-100 rounded text-emerald-700 font-bold text-[8.5px] border border-emerald-300"
                      title="Middle Align"
                    >
                      ⬍
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleQuickSetAlign('no', 'center', e)}
                      className="p-0.5 hover:bg-stone-200 rounded text-stone-600"
                      title="Rata Tengah"
                    >
                      <AlignCenter size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Resizer Handle */}
              {isEditingMode && !isPrintOnly && onUpdateDesignConfig && (
                <div
                  data-editing-control="true"
                  className="no-print absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-20 flex items-center justify-center group/handle"
                  onMouseDown={(e) => handleStartResize('no', e)}
                  title="Geser batas kolom"
                >
                  <div className="w-[2px] h-full bg-transparent group-hover/handle:bg-emerald-600 transition" />
                </div>
              )}
            </th>

            {/* 2. المواد الدراسية (Kolom Mapel Arab) */}
            <th
              onClick={() => isEditingMode && handleSelectCol('subjectAr')}
              className={`${isEditingMode && !isPrintOnly ? 'cursor-pointer group' : ''} ${
                isEditingMode && !isPrintOnly && activeSelectedCol === 'subjectAr' ? 'col-selected-th' : ''
              }`}
              style={{
                fontSize: `${headerFontSize + 1}px`,
                height: `${headerHeight}px`,
                textAlign: arabicSubjectAlign,
                verticalAlign: arabicSubjectVAlign,
                padding: 0,
                boxSizing: 'border-box',
              }}
              title={isEditingMode ? 'Klik untuk memilih Kolom Mapel Arab' : undefined}
            >
              <div 
                className="flex flex-col items-center justify-center"
                style={{
                  width: '100%',
                  height: `${headerHeight}px`,
                  minHeight: `${headerHeight}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxSizing: 'border-box',
                }}
              >
                <span>المواد الدّراسيّة</span>
                {isEditingMode && !isPrintOnly && (
                  <div 
                    data-editing-control="true"
                    className="no-print opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 mt-0.5"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleQuickSetVAlign('subjectAr', 'middle', e)}
                      className="px-1 py-0.5 hover:bg-emerald-100 rounded text-emerald-700 font-bold text-[8.5px] border border-emerald-300"
                      title="Middle Align"
                    >
                      ⬍
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleQuickSetAlign('subjectAr', 'right', e)}
                      className="p-0.5 hover:bg-stone-200 rounded text-stone-600"
                      title="Rata Kanan"
                    >
                      <AlignRight size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Resizer Handle */}
              {isEditingMode && !isPrintOnly && onUpdateDesignConfig && (
                <div
                  data-editing-control="true"
                  className="no-print absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-20 flex items-center justify-center group/handle"
                  onMouseDown={(e) => handleStartResize('subjectAr', e)}
                  title="Geser batas kolom"
                >
                  <div className="w-[2px] h-full bg-transparent group-hover/handle:bg-emerald-600 transition" />
                </div>
              )}
            </th>

            {/* 3. Mata Pelajaran (Kolom Mapel Latin) */}
            <th
              onClick={() => isEditingMode && handleSelectCol('subjectLat')}
              className={`text-lat ${isEditingMode && !isPrintOnly ? 'cursor-pointer group' : ''} ${
                isEditingMode && !isPrintOnly && activeSelectedCol === 'subjectLat' ? 'col-selected-th' : ''
              }`}
              style={{
                fontSize: `${headerFontSize - 0.5}px`,
                height: `${headerHeight}px`,
                fontWeight: 'bold',
                textAlign: latinSubjectAlign,
                verticalAlign: latinSubjectVAlign,
                padding: 0,
                boxSizing: 'border-box',
              }}
              title={isEditingMode ? 'Klik untuk memilih Kolom Mata Pelajaran Latin' : undefined}
            >
              <div 
                className="flex flex-col items-center justify-center"
                style={{
                  width: '100%',
                  height: `${headerHeight}px`,
                  minHeight: `${headerHeight}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxSizing: 'border-box',
                }}
              >
                <span>Mata Pelajaran</span>
                {isEditingMode && !isPrintOnly && (
                  <div 
                    data-editing-control="true"
                    className="no-print opacity-0 group-hover:opacity-100 flex items-center justify-center gap-0.5 mt-0.5"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleQuickSetVAlign('subjectLat', 'middle', e)}
                      className="px-1 py-0.5 hover:bg-emerald-100 rounded text-emerald-700 font-bold text-[8.5px] border border-emerald-300"
                      title="Middle Align"
                    >
                      ⬍
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleQuickSetAlign('subjectLat', 'left', e)}
                      className="p-0.5 hover:bg-stone-200 rounded text-stone-600"
                      title="Rata Kiri"
                    >
                      <AlignLeft size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Resizer Handle */}
              {isEditingMode && !isPrintOnly && onUpdateDesignConfig && (
                <div
                  data-editing-control="true"
                  className="no-print absolute left-0 top-0 bottom-0 w-3 -ml-1.5 cursor-col-resize z-20 flex items-center justify-center group/handle"
                  onMouseDown={(e) => handleStartResize('subjectLat', e)}
                  title="Geser batas kolom"
                >
                  <div className="w-[2px] h-full bg-transparent group-hover/handle:bg-emerald-600 transition" />
                </div>
              )}
            </th>

            {/* 4, 5, 6. الدّرجة الّتي حصلت عليها الطالب / الطالبة (Header Menggabungkan 3 Kolom Nilai) */}
            <th
              colSpan={3}
              onClick={() => isEditingMode && handleSelectCol('score')}
              className={`${isEditingMode && !isPrintOnly ? 'cursor-pointer group' : ''} ${
                isEditingMode && !isPrintOnly && (activeSelectedCol === 'score' || activeSelectedCol === 'terbilang') ? 'col-selected-th' : ''
              }`}
              style={{
                fontSize: `${headerFontSize}px`,
                height: `${headerHeight}px`,
                lineHeight: 1.15,
                textAlign: 'center',
                verticalAlign: 'middle',
                padding: 0,
                boxSizing: 'border-box',
              }}
              title="الدّرجة الّتي حصلت عليها الطالب / الطالبة"
            >
              <div 
                className="flex items-center justify-center"
                style={{
                  width: '100%',
                  height: `${headerHeight}px`,
                  minHeight: `${headerHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxSizing: 'border-box',
                  lineHeight: 1.15,
                }}
              >
                <span>الدّرجة الّتي حصلت عليها الطالب / الطالبة</span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {subjects.map((subject, index) => {
            const rawScore = scores[subject.id];
            const score =
              typeof rawScore === 'number' && !Number.isNaN(rawScore)
                ? rawScore
                : 0;

            const arabicWords = customSubjectOverrides?.[subject.id]?.customTerbilang || numberToArabicWords(score);
            const subjectNameAr = customSubjectOverrides?.[subject.id]?.nameAr || subject.nameAr;
            const subjectNameId = customSubjectOverrides?.[subject.id]?.nameId || subject.nameId;

            return (
              <tr
                key={subject.id}
                className="group/row relative"
                style={{
                  height: `${rowHeight}px`,
                }}
              >
                {/* 1. الرقم (Kolom Nomor) */}
                <td
                  onClick={() => handleCellClick(index, 0)}
                  onDoubleClick={() => handleCellDoubleClick(index, 0)}
                  className={`${numberFormat === 'arabic' ? 'text-ar font-bold' : 'text-lat font-bold'} ${
                    isEditingMode && !isPrintOnly && activeSelectedCol === 'all' ? 'col-selected-cell' : ''
                  }`}
                  style={{
                    height: `${rowHeight}px`,
                    fontSize: `${numberFontSize}px`,
                    padding: 0,
                    verticalAlign: numberVAlign,
                    boxSizing: 'border-box',
                    outline: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 0 ? '2px solid #107c41' : undefined,
                    outlineOffset: '-2px',
                    position: 'relative',
                    zIndex: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 0 ? 20 : undefined,
                    backgroundColor: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 0 ? '#f0fdf4' : undefined,
                    cursor: isEditingMode && !isPrintOnly ? 'cell' : 'default',
                  }}
                  title={isEditingMode ? 'Klik untuk memilih sel, dobel-klik untuk edit' : undefined}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: `${rowHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1px 3px',
                      boxSizing: 'border-box',
                      lineHeight: 'normal',
                    }}
                  >
                    {/* Delete Row Button */}
                    {isEditingMode && !isPrintOnly && onDeleteSubject && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Hapus baris mata pelajaran "${subjectNameId}" dari tabel?`)) {
                            onDeleteSubject(subject.id);
                          }
                        }}
                        className="no-print absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 hover:opacity-100 p-0.5 bg-white hover:bg-rose-50 text-rose-600 rounded-full border border-rose-200 shadow-sm transition z-30 flex items-center justify-center w-5 h-5"
                        title={`Hapus baris "${subjectNameId}"`}
                        data-editing-control="true"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                    {isEditingMode && !isPrintOnly && editingCell?.row === index && editingCell?.col === 0 ? (
                      <input
                        type="text"
                        value={cellEditValue}
                        onChange={(e) => setCellEditValue(e.target.value)}
                        onBlur={handleCommitCellEdit}
                        onKeyDown={handleInputKeyDown}
                        autoFocus
                        className="w-full h-full text-center bg-white text-stone-900 border border-[#107c41] p-0 outline-none"
                      />
                    ) : (
                      numberFormat === 'arabic' ? toEasternArabicNumerals(index + 1) : index + 1
                    )}
                  </div>
                </td>

                {/* 2. المواد الدراسية (Mapel Arab) */}
                <td
                  onClick={() => handleCellClick(index, 1)}
                  onDoubleClick={() => handleCellDoubleClick(index, 1)}
                  className={`text-ar ${
                    isEditingMode && !isPrintOnly && activeSelectedCol === 'all' ? 'col-selected-cell' : ''
                  }`}
                  title={isEditingMode ? 'Klik untuk memilih sel, dobel-klik untuk edit' : subjectNameAr}
                  style={{
                    height: `${rowHeight}px`,
                    fontSize: `${arabicFontSize}px`,
                    padding: 0,
                    verticalAlign: arabicSubjectVAlign,
                    boxSizing: 'border-box',
                    outline: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 1 ? '2px solid #107c41' : undefined,
                    outlineOffset: '-2px',
                    position: 'relative',
                    zIndex: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 1 ? 20 : undefined,
                    backgroundColor: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 1 ? '#f0fdf4' : undefined,
                    cursor: isEditingMode && !isPrintOnly ? 'cell' : 'default',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: `${rowHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: arabicSubjectAlign === 'center' ? 'center' : arabicSubjectAlign === 'left' ? 'flex-end' : 'flex-start',
                      padding: '1px 6px',
                      boxSizing: 'border-box',
                      lineHeight: 'normal',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    {isEditingMode && !isPrintOnly && editingCell?.row === index && editingCell?.col === 1 ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={cellEditValue}
                        onChange={(e) => setCellEditValue(e.target.value)}
                        onBlur={handleCommitCellEdit}
                        onKeyDown={handleInputKeyDown}
                        autoFocus
                        className="w-full h-full text-right bg-white text-stone-900 border border-[#107c41] p-0 outline-none font-bold"
                      />
                    ) : (
                      subjectNameAr
                    )}
                  </div>
                </td>

                {/* 3. Mata Pelajaran (Mapel Latin) */}
                <td
                  onClick={() => handleCellClick(index, 2)}
                  onDoubleClick={() => handleCellDoubleClick(index, 2)}
                  className={`text-lat ${
                    isEditingMode && !isPrintOnly && activeSelectedCol === 'all' ? 'col-selected-cell' : ''
                  }`}
                  title={isEditingMode ? 'Klik untuk memilih sel, dobel-klik untuk edit' : subjectNameId}
                  style={{
                    height: `${rowHeight}px`,
                    fontSize: `${subjectFontSize}px`,
                    padding: 0,
                    verticalAlign: latinSubjectVAlign,
                    boxSizing: 'border-box',
                    outline: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 2 ? '2px solid #107c41' : undefined,
                    outlineOffset: '-2px',
                    position: 'relative',
                    zIndex: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 2 ? 20 : undefined,
                    backgroundColor: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 2 ? '#f0fdf4' : undefined,
                    cursor: isEditingMode && !isPrintOnly ? 'cell' : 'default',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: `${rowHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: latinSubjectAlign === 'center' ? 'center' : latinSubjectAlign === 'right' ? 'flex-end' : 'flex-start',
                      padding: '1px 6px',
                      boxSizing: 'border-box',
                      lineHeight: 'normal',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    {isEditingMode && !isPrintOnly && editingCell?.row === index && editingCell?.col === 2 ? (
                      <input
                        type="text"
                        dir="ltr"
                        value={cellEditValue}
                        onChange={(e) => setCellEditValue(e.target.value)}
                        onBlur={handleCommitCellEdit}
                        onKeyDown={handleInputKeyDown}
                        autoFocus
                        className="w-full h-full text-left bg-white text-stone-900 border border-[#107c41] p-0 outline-none"
                      />
                    ) : (
                      subjectNameId
                    )}
                  </div>
                </td>

                {/* 4. Nilai Angka Arab (٦٨) */}
                <td
                  onClick={() => handleCellClick(index, 3)}
                  onDoubleClick={() => handleCellDoubleClick(index, 3)}
                  className={`text-ar font-bold ${
                    isEditingMode && !isPrintOnly && activeSelectedCol === 'all' ? 'col-selected-cell' : ''
                  }`}
                  style={{
                    height: `${rowHeight}px`,
                    fontSize: `${scoreFontSize + 1}px`,
                    padding: 0,
                    verticalAlign: scoreVAlign,
                    boxSizing: 'border-box',
                    outline: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 3 ? '2px solid #107c41' : undefined,
                    outlineOffset: '-2px',
                    position: 'relative',
                    zIndex: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 3 ? 20 : undefined,
                    backgroundColor: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 3 ? '#f0fdf4' : undefined,
                    cursor: isEditingMode && !isPrintOnly ? 'cell' : 'default',
                  }}
                  title={isEditingMode ? 'Klik untuk memilih sel, dobel-klik untuk edit nilai' : undefined}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: `${rowHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1px 2px',
                      boxSizing: 'border-box',
                      lineHeight: 'normal',
                    }}
                  >
                    {isEditingMode && !isPrintOnly && editingCell?.row === index && editingCell?.col === 3 ? (
                      <input
                        type="text"
                        value={cellEditValue}
                        onChange={(e) => setCellEditValue(e.target.value)}
                        onBlur={handleCommitCellEdit}
                        onKeyDown={handleInputKeyDown}
                        autoFocus
                        className="w-full h-full text-center font-bold bg-white text-stone-900 border border-[#107c41] p-0 outline-none"
                      />
                    ) : (
                      toEasternArabicNumerals(score)
                    )}
                  </div>
                </td>

                {/* 5. Nilai Angka Latin (68) */}
                <td
                  onClick={() => handleCellClick(index, 4)}
                  onDoubleClick={() => handleCellDoubleClick(index, 4)}
                  className={`text-lat font-bold ${
                    isEditingMode && !isPrintOnly && activeSelectedCol === 'all' ? 'col-selected-cell' : ''
                  }`}
                  style={{
                    height: `${rowHeight}px`,
                    fontSize: `${scoreFontSize}px`,
                    padding: 0,
                    verticalAlign: scoreVAlign,
                    boxSizing: 'border-box',
                    outline: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 4 ? '2px solid #107c41' : undefined,
                    outlineOffset: '-2px',
                    position: 'relative',
                    zIndex: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 4 ? 20 : undefined,
                    backgroundColor: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 4 ? '#f0fdf4' : undefined,
                    cursor: isEditingMode && !isPrintOnly ? 'cell' : 'default',
                  }}
                  title={isEditingMode ? 'Klik untuk memilih sel, dobel-klik untuk edit nilai' : undefined}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: `${rowHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1px 2px',
                      boxSizing: 'border-box',
                      lineHeight: 'normal',
                    }}
                  >
                    {isEditingMode && !isPrintOnly && editingCell?.row === index && editingCell?.col === 4 ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cellEditValue}
                        onChange={(e) => setCellEditValue(e.target.value)}
                        onBlur={handleCommitCellEdit}
                        onKeyDown={handleInputKeyDown}
                        autoFocus
                        className="w-full h-full text-center font-bold bg-white text-stone-900 border border-[#107c41] p-0 outline-none"
                      />
                    ) : (
                      score
                    )}
                  </div>
                </td>

                {/* 6. Terbilang Arab (ثـمـان و ســــــتّون) */}
                <td
                  onClick={() => handleCellClick(index, 5)}
                  onDoubleClick={() => handleCellDoubleClick(index, 5)}
                  className={`text-ar ${
                    isEditingMode && !isPrintOnly && activeSelectedCol === 'all' ? 'col-selected-cell' : ''
                  }`}
                  title={isEditingMode ? 'Klik untuk memilih sel, dobel-klik untuk edit' : arabicWords}
                  style={{
                    height: `${rowHeight}px`,
                    fontSize: `${terbilangFontSize}px`,
                    padding: 0,
                    verticalAlign: terbilangVAlign,
                    boxSizing: 'border-box',
                    outline: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 5 ? '2px solid #107c41' : undefined,
                    outlineOffset: '-2px',
                    position: 'relative',
                    zIndex: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 5 ? 20 : undefined,
                    backgroundColor: isEditingMode && !isPrintOnly && activeCell?.row === index && activeCell?.col === 5 ? '#f0fdf4' : undefined,
                    cursor: isEditingMode && !isPrintOnly ? 'cell' : 'default',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: `${rowHeight}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: terbilangAlign === 'center' ? 'center' : terbilangAlign === 'left' ? 'flex-end' : 'flex-start',
                      padding: '1px 6px',
                      boxSizing: 'border-box',
                      lineHeight: 'normal',
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                    }}
                  >
                    {isEditingMode && !isPrintOnly && editingCell?.row === index && editingCell?.col === 5 ? (
                      <input
                        type="text"
                        dir="rtl"
                        value={cellEditValue}
                        onChange={(e) => setCellEditValue(e.target.value)}
                        onBlur={handleCommitCellEdit}
                        onKeyDown={handleInputKeyDown}
                        autoFocus
                        className="w-full h-full text-center bg-white text-stone-900 border border-[#107c41] p-0 outline-none font-bold"
                      />
                    ) : (
                      arabicWords
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {/* Tombol Tambah Baris / Mata Pelajaran Baru */}
          {isEditingMode && !isPrintOnly && onAddSubject && (
            <tr data-editing-control="true" className="no-print">
              <td
                colSpan={6}
                className="py-1 px-2 text-center bg-emerald-50/70 hover:bg-emerald-100/90 transition cursor-pointer border-t border-dashed border-emerald-400"
                onClick={onAddSubject}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
                >
                  <Plus size={14} className="text-emerald-600" />
                  <span>+ Tambah Baris / Mata Pelajaran Baru</span>
                </button>
              </td>
            </tr>
          )}
        </tbody>

        {/* =====================================================
            FOOTER: JUMLAH, RATA-RATA, PERINGKAT PERSIS TEMPLATE
            Col 0+1: Label Arab | Col 2: Label Latin | Col 3: Angka Arab | Col 4: Angka Latin | Col 5: Terbilang / Kosong
           ===================================================== */}
        <tfoot>
          {/* 1. Jumlah */}
          <tr style={{ height: `${summaryHeight}px`, backgroundColor: '#ffffff' }}>
            <td
              colSpan={2}
              className="text-ar text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                المجموع
              </div>
            </td>
            <td
              className="text-lat text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize - 1}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                Jumlah
              </div>
            </td>
            <td
              className="text-ar text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize + 1}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 2px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                {toEasternArabicNumerals(totalScore)}
              </div>
            </td>
            <td
              className="text-lat text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 2px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                {totalScore}
              </div>
            </td>
            <td
              style={{
                height: `${summaryHeight}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px` }}></div>
            </td>
          </tr>

          {/* 2. Nilai Rata-Rata */}
          <tr style={{ height: `${summaryHeight}px`, backgroundColor: '#ffffff' }}>
            <td
              colSpan={2}
              className="text-ar text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                النتيجة المعدّلة
              </div>
            </td>
            <td
              className="text-lat text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize - 1}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                Nilai Rata Rata
              </div>
            </td>
            <td
              className="text-ar text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize + 1}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 2px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                {toEasternArabicNumerals(averageScore)}
              </div>
            </td>
            <td
              className="text-lat text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 2px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                {averageScore}
              </div>
            </td>
            <td
              style={{
                height: `${summaryHeight}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px` }}></div>
            </td>
          </tr>

          {/* 3. Peringkat */}
          <tr style={{ height: `${summaryHeight}px`, backgroundColor: '#ffffff', borderBottom: `${tableBorderWidth}px solid ${tableBorderColor}` }}>
            <td
              colSpan={2}
              className="text-ar text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                المقام
              </div>
            </td>
            <td
              className="text-lat text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize - 1}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                Peringkat
              </div>
            </td>
            <td
              className="text-ar text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize + 1}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 2px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                {toEasternArabicNumerals(rank)}
              </div>
            </td>
            <td
              className="text-lat text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 2px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                {rank}
              </div>
            </td>
            <td
              className="text-ar text-center font-bold"
              style={{
                height: `${summaryHeight}px`,
                fontSize: `${summaryFontSize}px`,
                padding: 0,
                verticalAlign: 'middle',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ width: '100%', height: '100%', minHeight: `${summaryHeight}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1px 6px', boxSizing: 'border-box', lineHeight: 'normal' }}>
                {rankToArabicOrdinal(rank)}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
