/**
 * Lightweight pure TypeScript ZIP archive generator (STORE mode, 0 dependencies).
 * Fully compliant with PKWARE ZIP Specification and OpenXML/Office (.xlsx, .docx, .zip).
 * Runs seamlessly in all browsers and Node.js environments.
 */

// Precomputed CRC32 Table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

export function calculateCrc32(data: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

export interface ZipFileEntry {
  name: string;
  data: Uint8Array | string;
}

/**
 * Converts JS Date to MS-DOS date and time (packed 16-bit values).
 */
function getDosDateTime(date: Date = new Date()): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hours << 11) | (minutes << 5) | seconds;

  return { time: dosTime, date: dosDate };
}

/**
 * Creates a standard uncompressed ZIP archive (Uint8Array) from a list of files.
 */
export function createZipArchive(files: ZipFileEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let currentOffset = 0;

  const { time: dosTime, date: dosDate } = getDosDateTime();

  for (const file of files) {
    const fileNameBytes = encoder.encode(file.name);
    const fileData = typeof file.data === 'string' ? encoder.encode(file.data) : file.data;
    const crc = calculateCrc32(fileData);
    const size = fileData.length;

    // 1. Local File Header (30 bytes + filename + data)
    const localHeader = new Uint8Array(30 + fileNameBytes.length + size);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true); // Local header signature 'PK\x03\x04'
    localView.setUint16(4, 20, true);         // Version needed to extract (2.0)
    localView.setUint16(6, 0x0800, true);     // General purpose bit flag (Bit 11 = UTF-8 filename)
    localView.setUint16(8, 0, true);          // Compression method (0 = STORE)
    localView.setUint16(10, dosTime, true);   // Last mod file time
    localView.setUint16(12, dosDate, true);   // Last mod file date
    localView.setUint32(14, crc, true);       // CRC-32
    localView.setUint32(18, size, true);      // Compressed size
    localView.setUint32(22, size, true);      // Uncompressed size
    localView.setUint16(26, fileNameBytes.length, true); // File name length
    localView.setUint16(28, 0, true);         // Extra field length

    localHeader.set(fileNameBytes, 30);
    localHeader.set(fileData, 30 + fileNameBytes.length);

    localHeaders.push(localHeader);

    // 2. Central Directory Header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + fileNameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, 0x02014b50, true); // Central directory signature 'PK\x01\x02'
    centralView.setUint16(4, 20, true);         // Version made by (2.0)
    centralView.setUint16(6, 20, true);         // Version needed to extract (2.0)
    centralView.setUint16(8, 0x0800, true);     // General purpose bit flag (UTF-8)
    centralView.setUint16(10, 0, true);         // Compression method (0 = STORE)
    centralView.setUint16(12, dosTime, true);   // Last mod file time
    centralView.setUint16(14, dosDate, true);   // Last mod file date
    centralView.setUint32(16, crc, true);       // CRC-32
    centralView.setUint32(20, size, true);      // Compressed size
    centralView.setUint32(24, size, true);      // Uncompressed size
    centralView.setUint16(28, fileNameBytes.length, true); // File name length
    centralView.setUint16(30, 0, true);         // Extra field length
    centralView.setUint16(32, 0, true);         // File comment length
    centralView.setUint16(34, 0, true);         // Disk number start
    centralView.setUint16(36, 0, true);         // Internal file attributes
    centralView.setUint32(38, 0x20, true);      // External file attributes: 0x20 = FILE_ATTRIBUTE_ARCHIVE (Standard file on Windows)
    centralView.setUint32(42, currentOffset, true); // Relative offset of local header

    centralHeader.set(fileNameBytes, 46);
    centralHeaders.push(centralHeader);

    currentOffset += localHeader.length;
  }

  // 3. Calculate sizes for Central Directory and End of Central Directory Record
  const centralDirSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);
  const endOfCentralDir = new Uint8Array(22);
  const eocdView = new DataView(endOfCentralDir.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature 'PK\x05\x06'
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, files.length, true);  // Number of central directory records on this disk
  eocdView.setUint16(10, files.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirSize, true); // Size of central directory
  eocdView.setUint32(16, currentOffset, true);  // Offset of start of central directory
  eocdView.setUint16(20, 0, true);         // ZIP file comment length

  // 4. Concatenate all parts into a single Uint8Array
  const totalLength = currentOffset + centralDirSize + 22;
  const result = new Uint8Array(totalLength);

  let writePos = 0;
  for (const h of localHeaders) {
    result.set(h, writePos);
    writePos += h.length;
  }
  for (const ch of centralHeaders) {
    result.set(ch, writePos);
    writePos += ch.length;
  }
  result.set(endOfCentralDir, writePos);

  return result;
}

/**
 * Downloads a list of files as a single .zip file in the browser.
 */
export function downloadZip(files: ZipFileEntry[], zipFileName: string): void {
  const zipBytes = createZipArchive(files);
  const blob = new Blob([zipBytes as unknown as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revoking URL by 60 seconds to allow the browser download manager to finish streaming
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
