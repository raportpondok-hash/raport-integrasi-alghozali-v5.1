/**
 * Modern Excel (.xlsx) Styling & Export Engine.
 * Generates beautiful, styled OpenXML spreadsheets with rich colors, crisp borders,
 * zebra striping, custom column widths, and typography without any external libraries.
 */

import { createZipArchive, ZipFileEntry } from './zipHelper';

export type CellStyleType =
  | 'headerCenter'
  | 'headerLeft'
  | 'headerRight'
  | 'dataEvenCenter'
  | 'dataEvenLeft'
  | 'dataEvenRight'
  | 'dataOddCenter'
  | 'dataOddLeft'
  | 'dataOddRight'
  | 'nameEven'
  | 'nameOdd'
  | 'tuntasEven'
  | 'tuntasOdd'
  | 'remidiEven'
  | 'remidiOdd'
  | 'bannerTitle'
  | 'subtitle'
  | 'metaLabel'
  | 'metaValue'
  | 'summaryLabel'
  | 'summaryValue'
  | 'arabicEven'
  | 'arabicOdd'
  | 'highlightEven'
  | 'highlightOdd'
  | 'noticeBox'
  | 'default';

const STYLE_INDEX_MAP: Record<CellStyleType, number> = {
  default: 0,
  headerCenter: 1,
  headerLeft: 2,
  headerRight: 3,
  dataEvenCenter: 4,
  dataEvenLeft: 5,
  dataEvenRight: 6,
  dataOddCenter: 7,
  dataOddLeft: 8,
  dataOddRight: 9,
  nameEven: 10,
  nameOdd: 11,
  tuntasEven: 12,
  tuntasOdd: 13,
  remidiEven: 14,
  remidiOdd: 15,
  bannerTitle: 16,
  subtitle: 17,
  metaLabel: 18,
  metaValue: 19,
  summaryLabel: 20,
  summaryValue: 21,
  arabicEven: 22,
  arabicOdd: 23,
  highlightEven: 24,
  highlightOdd: 25,
  noticeBox: 26,
};

export interface ModernExcelCell {
  value: string | number;
  style?: CellStyleType;
  type?: 'string' | 'number';
}

export interface ModernExcelMerge {
  startCol: number; // 0-indexed
  startRow: number; // 0-indexed
  endCol: number;   // 0-indexed
  endRow: number;   // 0-indexed
}

export interface ModernExcelColWidth {
  colIndex: number; // 0-indexed
  width: number;    // character width
}

export interface ModernExcelOptions {
  sheetName?: string;
  bannerTitle?: string;
  subtitle?: string;
  metaRows?: { label: string; value: string | number; labelCol?: number; valueCol?: number }[];
  instruction?: string;
  tableHeaders: string[];
  tableHeaderAligns?: ('center' | 'left' | 'right')[];
  rows: (string | number | ModernExcelCell)[][];
  highlightColIndex?: number;
  summaryRows?: { label: string; values: Record<number, string | number> }[];
  signatureInfo?: {
    placeAndDate?: string;
    waliKelasTitle?: string;
    waliKelasName?: string;
    pimpinanTitle?: string;
    pimpinanName?: string;
  };
  colWidths?: number[];
  fileName?: string;
}

/**
 * Escapes XML special characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts column number (0-indexed) to Excel column letters (A, B, ..., Z, AA, AB, ...).
 */
export function colIndexToLetter(colIndex: number): string {
  let temp = colIndex + 1;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
}

/**
 * Builds the standard styles.xml with Emerald pesantren theme.
 */
function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="11">
    <!-- 0: Default Regular -->
    <font><sz val="11"/><color rgb="FF1E293B"/><name val="Calibri"/><family val="2"/></font>
    <!-- 1: Bold White (Header) -->
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <!-- 2: Big Title Banner White -->
    <font><b/><sz val="14"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <!-- 3: Subtitle / Meta Label -->
    <font><b/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/><family val="2"/></font>
    <!-- 4: Bold Data (Names / Totals) -->
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/><family val="2"/></font>
    <!-- 5: Success Green (Tuntas) -->
    <font><b/><sz val="11"/><color rgb="FF047857"/><name val="Calibri"/><family val="2"/></font>
    <!-- 6: Danger Red (Remidi) -->
    <font><b/><sz val="11"/><color rgb="FFDC2626"/><name val="Calibri"/><family val="2"/></font>
    <!-- 7: Dark Green Subtitle -->
    <font><b/><sz val="13"/><color rgb="FF065F46"/><name val="Calibri"/><family val="2"/></font>
    <!-- 8: Notice Instruction Text -->
    <font><i/><sz val="9.5"/><color rgb="FF92400E"/><name val="Calibri"/><family val="2"/></font>
    <!-- 9: Amber Bold (Input highlight) -->
    <font><b/><sz val="11"/><color rgb="FF92400E"/><name val="Calibri"/><family val="2"/></font>
    <!-- 10: Arabic Normal -->
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/><family val="2"/></font>
  </fonts>

  <fills count="10">
    <!-- 0: none -->
    <fill><patternFill patternType="none"/></fill>
    <!-- 1: gray125 -->
    <fill><patternFill patternType="gray125"/></fill>
    <!-- 2: Emerald Table Header (#065F46) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF065F46"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 3: Soft Mint (#ECFDF5) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFECFDF5"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 4: Zebra Odd Row Light Gray (#F8FAFC) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 5: Soft Amber Highlight (#FEF3C7) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 6: Soft Red Alert (#FEF2F2) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF2F2"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 7: Dark Banner (#044E3B) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FF044E3B"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 8: Summary Total Gray (#F1F5F9) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill>
    <!-- 9: Subtle Amber Notice (#FFFBEB) -->
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFBEB"/><bgColor indexed="64"/></patternFill></fill>
  </fills>

  <borders count="5">
    <!-- 0: none -->
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <!-- 1: Thin Gray Border (#CBD5E1) -->
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
    </border>
    <!-- 2: Header Border (#047857) -->
    <border>
      <left style="thin"><color rgb="FF047857"/></left>
      <right style="thin"><color rgb="FF047857"/></right>
      <top style="medium"><color rgb="FF065F46"/></top>
      <bottom style="medium"><color rgb="FF047857"/></bottom>
    </border>
    <!-- 3: Summary Border (Top Thin, Bottom Double) -->
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FF94A3B8"/></top>
      <bottom style="double"><color rgb="FF065F46"/></bottom>
    </border>
    <!-- 4: Subtle Notice Border (#FCD34D) -->
    <border>
      <left style="thin"><color rgb="FFFCD34D"/></left>
      <right style="thin"><color rgb="FFFCD34D"/></right>
      <top style="thin"><color rgb="FFFCD34D"/></top>
      <bottom style="thin"><color rgb="FFFCD34D"/></bottom>
    </border>
  </borders>

  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>

  <cellXfs count="27">
    <!-- 0: default -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <!-- 1: headerCenter (Font 1, Fill 2, Border 2, Center) -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="1"/>
    </xf>
    <!-- 2: headerLeft -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
    <!-- 3: headerRight -->
    <xf numFmtId="0" fontId="1" fillId="2" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center" wrapText="1"/>
    </xf>
    <!-- 4: dataEvenCenter (Font 0, Fill 0, Border 1, Center) -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 5: dataEvenLeft -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 6: dataEvenRight -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 7: dataOddCenter (Font 0, Fill 4, Border 1, Center) -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 8: dataOddLeft -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 9: dataOddRight -->
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 10: nameEven (Font 4, Fill 0, Border 1, Left) -->
    <xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 11: nameOdd (Font 4, Fill 4, Border 1, Left) -->
    <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 12: tuntasEven (Font 5, Fill 3, Border 1, Center) -->
    <xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 13: tuntasOdd (Font 5, Fill 3, Border 1, Center) -->
    <xf numFmtId="0" fontId="5" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 14: remidiEven (Font 6, Fill 6, Border 1, Center) -->
    <xf numFmtId="0" fontId="6" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 15: remidiOdd (Font 6, Fill 6, Border 1, Center) -->
    <xf numFmtId="0" fontId="6" fillId="6" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 16: bannerTitle (Font 2, Fill 7, Center) -->
    <xf numFmtId="0" fontId="2" fillId="7" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 17: subtitle (Font 7, Center) -->
    <xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 18: metaLabel (Font 3, Left) -->
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 19: metaValue (Font 4, Left) -->
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 20: summaryLabel (Font 4, Fill 8, Border 3, Left) -->
    <xf numFmtId="0" fontId="4" fillId="8" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center"/>
    </xf>
    <!-- 21: summaryValue (Font 4, Fill 8, Border 3, Center) -->
    <xf numFmtId="0" fontId="4" fillId="8" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 22: arabicEven (Font 10, Border 1, Right) -->
    <xf numFmtId="0" fontId="10" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 23: arabicOdd (Font 10, Fill 4, Border 1, Right) -->
    <xf numFmtId="0" fontId="10" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="right" vertical="center"/>
    </xf>
    <!-- 24: highlightEven (Font 9, Fill 5, Border 1, Center) -->
    <xf numFmtId="0" fontId="9" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 25: highlightOdd (Font 9, Fill 5, Border 1, Center) -->
    <xf numFmtId="0" fontId="9" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center"/>
    </xf>
    <!-- 26: noticeBox (Font 8, Fill 9, Border 4, Left) -->
    <xf numFmtId="0" fontId="8" fillId="9" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="left" vertical="center" wrapText="1"/>
    </xf>
  </cellXfs>
</styleSheet>`;
}

/**
 * Builds the worksheet XML.
 */
function buildWorksheetXml(options: ModernExcelOptions): string {
  const {
    bannerTitle = 'YAYASAN PENDIDIKAN ISLAM PONDOK MODERN AL-GHOZALI',
    subtitle,
    metaRows = [],
    instruction,
    tableHeaders,
    tableHeaderAligns = [],
    rows,
    highlightColIndex,
    summaryRows = [],
    signatureInfo,
    colWidths = [],
  } = options;

  const totalCols = Math.max(
    tableHeaders.length,
    ...rows.map((r) => r.length),
    colWidths.length,
    7
  );

  const merges: ModernExcelMerge[] = [];
  const sheetRowsXml: string[] = [];
  let currentRow = 1; // 1-indexed

  // 1. Top Banner Row
  sheetRowsXml.push(
    `<row r="${currentRow}" ht="28" customHeight="1">` +
      `<c r="A${currentRow}" s="${STYLE_INDEX_MAP.bannerTitle}" t="inlineStr"><is><t>${escapeXml(bannerTitle)}</t></is></c>` +
    `</row>`
  );
  merges.push({ startCol: 0, startRow: currentRow - 1, endCol: totalCols - 1, endRow: currentRow - 1 });
  currentRow++;

  // 2. Subtitle Row
  if (subtitle) {
    sheetRowsXml.push(
      `<row r="${currentRow}" ht="22" customHeight="1">` +
        `<c r="A${currentRow}" s="${STYLE_INDEX_MAP.subtitle}" t="inlineStr"><is><t>${escapeXml(subtitle)}</t></is></c>` +
      `</row>`
    );
    merges.push({ startCol: 0, startRow: currentRow - 1, endCol: totalCols - 1, endRow: currentRow - 1 });
    currentRow++;
  }

  // 3. Metadata Rows
  if (metaRows.length > 0) {
    // Empty row before meta
    sheetRowsXml.push(`<row r="${currentRow}" ht="8" customHeight="1"></row>`);
    currentRow++;

    for (const meta of metaRows) {
      const labelCol = meta.labelCol ?? 0;
      const valueCol = meta.valueCol ?? labelCol + 1;
      const labelRef = `${colIndexToLetter(labelCol)}${currentRow}`;
      const valueRef = `${colIndexToLetter(valueCol)}${currentRow}`;

      sheetRowsXml.push(
        `<row r="${currentRow}" ht="18" customHeight="1">` +
          `<c r="${labelRef}" s="${STYLE_INDEX_MAP.metaLabel}" t="inlineStr"><is><t>${escapeXml(meta.label)}</t></is></c>` +
          `<c r="${valueRef}" s="${STYLE_INDEX_MAP.metaValue}" t="inlineStr"><is><t>${escapeXml(String(meta.value))}</t></is></c>` +
        `</row>`
      );
      currentRow++;
    }
  }

  // 4. Instructions / Notice Box Row
  if (instruction) {
    sheetRowsXml.push(`<row r="${currentRow}" ht="6" customHeight="1"></row>`);
    currentRow++;

    sheetRowsXml.push(
      `<row r="${currentRow}" ht="26" customHeight="1">` +
        `<c r="A${currentRow}" s="${STYLE_INDEX_MAP.noticeBox}" t="inlineStr"><is><t>${escapeXml(instruction)}</t></is></c>` +
      `</row>`
    );
    merges.push({ startCol: 0, startRow: currentRow - 1, endCol: totalCols - 1, endRow: currentRow - 1 });
    currentRow++;
  }

  // Empty row before table
  sheetRowsXml.push(`<row r="${currentRow}" ht="10" customHeight="1"></row>`);
  currentRow++;

  // 5. Table Header Row
  const headerCellsXml = tableHeaders
    .map((headerText, cIdx) => {
      const cellRef = `${colIndexToLetter(cIdx)}${currentRow}`;
      const align = tableHeaderAligns[cIdx] || (cIdx === 0 ? 'center' : cIdx === 1 ? 'left' : 'center');
      const styleKey = align === 'left' ? 'headerLeft' : align === 'right' ? 'headerRight' : 'headerCenter';
      const styleId = STYLE_INDEX_MAP[styleKey];
      return `<c r="${cellRef}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(headerText)}</t></is></c>`;
    })
    .join('');

  sheetRowsXml.push(`<row r="${currentRow}" ht="24" customHeight="1">${headerCellsXml}</row>`);
  currentRow++;

  // 6. Data Rows
  rows.forEach((row, rowIdx) => {
    const isOdd = rowIdx % 2 === 1;
    const cellsXml = row
      .map((cell, cIdx) => {
        const cellRef = `${colIndexToLetter(cIdx)}${currentRow}`;
        let rawVal: string | number = '';
        let explicitStyle: CellStyleType | undefined;
        let explicitType: 'string' | 'number' | undefined;

        if (typeof cell === 'object' && cell !== null && 'value' in cell) {
          rawVal = cell.value;
          explicitStyle = cell.style;
          explicitType = cell.type;
        } else {
          rawVal = cell as string | number;
        }

        const isHighlight = highlightColIndex !== undefined && cIdx === highlightColIndex;

        // Determine style
        let styleId: number;
        if (explicitStyle && STYLE_INDEX_MAP[explicitStyle] !== undefined) {
          styleId = STYLE_INDEX_MAP[explicitStyle];
        } else if (isHighlight) {
          styleId = isOdd ? STYLE_INDEX_MAP.highlightOdd : STYLE_INDEX_MAP.highlightEven;
        } else if (cIdx === 1 || cIdx === 2 || cIdx === 3) {
          // Check if it looks like a student name (col index 2 or 3 usually)
          const strVal = String(rawVal);
          if (cIdx === 2 || (cIdx === 3 && typeof rawVal === 'string' && isNaN(Number(rawVal)))) {
            styleId = isOdd ? STYLE_INDEX_MAP.nameOdd : STYLE_INDEX_MAP.nameEven;
          } else if (typeof rawVal === 'number' || (!isNaN(Number(rawVal)) && strVal.length <= 4)) {
            styleId = isOdd ? STYLE_INDEX_MAP.dataOddCenter : STYLE_INDEX_MAP.dataEvenCenter;
          } else {
            styleId = isOdd ? STYLE_INDEX_MAP.dataOddLeft : STYLE_INDEX_MAP.dataEvenLeft;
          }
        } else if (typeof rawVal === 'string' && (rawVal === 'Tuntas' || rawVal.includes('Mumtaz') || rawVal.includes('Jayyid'))) {
          styleId = isOdd ? STYLE_INDEX_MAP.tuntasOdd : STYLE_INDEX_MAP.tuntasEven;
        } else if (typeof rawVal === 'string' && (rawVal === 'Remidi' || rawVal === 'Belum Tuntas' || rawVal === 'Rasib')) {
          styleId = isOdd ? STYLE_INDEX_MAP.remidiOdd : STYLE_INDEX_MAP.remidiEven;
        } else if (typeof rawVal === 'number') {
          styleId = isOdd ? STYLE_INDEX_MAP.dataOddCenter : STYLE_INDEX_MAP.dataEvenCenter;
        } else {
          styleId = isOdd ? STYLE_INDEX_MAP.dataOddCenter : STYLE_INDEX_MAP.dataEvenCenter;
        }

        // Cell output (numeric or inlineStr)
        if (typeof rawVal === 'number' || (explicitType === 'number' && !isNaN(Number(rawVal)))) {
          return `<c r="${cellRef}" s="${styleId}" t="n"><v>${rawVal}</v></c>`;
        }
        return `<c r="${cellRef}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(String(rawVal))}</t></is></c>`;
      })
      .join('');

    sheetRowsXml.push(`<row r="${currentRow}" ht="20" customHeight="1">${cellsXml}</row>`);
    currentRow++;
  });

  // 7. Summary / Total Rows
  if (summaryRows.length > 0) {
    for (const sum of summaryRows) {
      const summaryCells: string[] = [];

      // Label in Col 0 (or merged with Col 1)
      const labelRef = `A${currentRow}`;
      summaryCells.push(
        `<c r="${labelRef}" s="${STYLE_INDEX_MAP.summaryLabel}" t="inlineStr"><is><t>${escapeXml(sum.label)}</t></is></c>`
      );

      // Remaining columns
      for (let c = 1; c < totalCols; c++) {
        const cRef = `${colIndexToLetter(c)}${currentRow}`;
        const val = sum.values[c];
        if (val !== undefined && val !== null) {
          if (typeof val === 'number') {
            summaryCells.push(`<c r="${cRef}" s="${STYLE_INDEX_MAP.summaryValue}" t="n"><v>${val}</v></c>`);
          } else {
            summaryCells.push(
              `<c r="${cRef}" s="${STYLE_INDEX_MAP.summaryValue}" t="inlineStr"><is><t>${escapeXml(String(val))}</t></is></c>`
            );
          }
        } else {
          summaryCells.push(`<c r="${cRef}" s="${STYLE_INDEX_MAP.summaryValue}"></c>`);
        }
      }

      sheetRowsXml.push(`<row r="${currentRow}" ht="22" customHeight="1">${summaryCells.join('')}</row>`);
      currentRow++;
    }
  }

  // 8. Signatures Section
  if (signatureInfo) {
    sheetRowsXml.push(`<row r="${currentRow}" ht="12" customHeight="1"></row>`);
    currentRow++;

    // Place & Date
    if (signatureInfo.placeAndDate) {
      sheetRowsXml.push(
        `<row r="${currentRow}" ht="18" customHeight="1">` +
          `<c r="A${currentRow}" s="${STYLE_INDEX_MAP.default}"></c>` +
          `<c r="${colIndexToLetter(totalCols - 3)}${currentRow}" s="${STYLE_INDEX_MAP.default}" t="inlineStr"><is><t>${escapeXml(signatureInfo.placeAndDate)}</t></is></c>` +
        `</row>`
      );
      currentRow++;
    }

    // Role Titles
    sheetRowsXml.push(
      `<row r="${currentRow}" ht="18" customHeight="1">` +
        `<c r="B${currentRow}" s="${STYLE_INDEX_MAP.metaLabel}" t="inlineStr"><is><t>${escapeXml(signatureInfo.waliKelasTitle || 'Wali Kelas')}</t></is></c>` +
        `<c r="${colIndexToLetter(totalCols - 3)}${currentRow}" s="${STYLE_INDEX_MAP.metaLabel}" t="inlineStr"><is><t>${escapeXml(signatureInfo.pimpinanTitle || 'Pimpinan Pesantren')}</t></is></c>` +
      `</row>`
    );
    currentRow++;

    // Space for signature (3 rows)
    sheetRowsXml.push(`<row r="${currentRow}" ht="18" customHeight="1"></row>`);
    currentRow++;
    sheetRowsXml.push(`<row r="${currentRow}" ht="18" customHeight="1"></row>`);
    currentRow++;

    // Names
    sheetRowsXml.push(
      `<row r="${currentRow}" ht="18" customHeight="1">` +
        `<c r="B${currentRow}" s="${STYLE_INDEX_MAP.metaValue}" t="inlineStr"><is><t>${escapeXml(signatureInfo.waliKelasName || '-')}</t></is></c>` +
        `<c r="${colIndexToLetter(totalCols - 3)}${currentRow}" s="${STYLE_INDEX_MAP.metaValue}" t="inlineStr"><is><t>${escapeXml(signatureInfo.pimpinanName || '-')}</t></is></c>` +
      `</row>`
    );
    currentRow++;
  }

  // Column Widths XML
  const defaultColWidths: number[] = [6, 16, 18, 32, 16, 18, 14, 14, 16, 16, 14];
  const colsXml = Array.from({ length: totalCols })
    .map((_, i) => {
      const w = colWidths[i] || defaultColWidths[i] || 16;
      return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`;
    })
    .join('');

  // Merges XML
  const mergesXml =
    merges.length > 0
      ? `<mergeCells count="${merges.length}">` +
        merges
          .map(
            (m) =>
              `<mergeCell ref="${colIndexToLetter(m.startCol)}${m.startRow + 1}:${colIndexToLetter(m.endCol)}${m.endRow + 1}"/>`
          )
          .join('') +
        `</mergeCells>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="${metaRows.length > 0 ? 5 : 4}" topLeftCell="A${metaRows.length > 0 ? 6 : 5}" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${colsXml}</cols>
  <sheetData>${sheetRowsXml.join('')}</sheetData>
  ${mergesXml}
</worksheet>`;
}

/**
 * Generates modern styled .xlsx binary buffer (Uint8Array).
 */
export function generateModernExcelBuffer(options: ModernExcelOptions): Uint8Array {
  const sheetName = options.sheetName || 'Rekap Nilai';

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const stylesXml = buildStylesXml();
  const worksheetXml = buildWorksheetXml(options);

  const files: ZipFileEntry[] = [
    { name: '[Content_Types].xml', data: contentTypesXml },
    { name: '_rels/.rels', data: rootRelsXml },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRelsXml },
    { name: 'xl/workbook.xml', data: workbookXml },
    { name: 'xl/styles.xml', data: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', data: worksheetXml },
  ];

  return createZipArchive(files);
}

/**
 * Generates and downloads a modern styled .xlsx file in the browser.
 */
export function generateModernExcel(options: ModernExcelOptions): void {
  const xlsxBytes = generateModernExcelBuffer(options);
  const blob = new Blob([xlsxBytes as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = options.fileName?.endsWith('.xlsx')
    ? options.fileName
    : `${options.fileName || 'Rekapitulasi_Nilai'}.xlsx`;

  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
