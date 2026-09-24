/**
 * Gmail API v1 Service
 * 
 * Provides features to send official e-Raport and academic notifications directly
 * through Gmail using OAuth 2.0 Access Token acquired via Firebase Google Auth.
 */

import { StudentRecord, Subject, SchoolConfig } from '../types';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  subject?: string;
  to?: string;
  from?: string;
  date?: string;
}

/**
 * Encode string to Base64URL (RFC 4648 §5)
 */
function base64UrlEncode(str: string): string {
  // UTF-8 safe base64 encoding in browser
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Construct RFC 2822 formatted raw email and send via Gmail API
 */
export async function sendGmailMessage(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    htmlBody: string;
    fromName?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const { to, subject, htmlBody, fromName = 'Pondok Modern Al-Ghozali' } = params;

  // Build RFC 2822 email message
  const rawEmail = [
    `From: "${fromName.replace(/"/g, '')}" <me>`,
    `To: ${to.trim()}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
  ].join('\r\n');

  const encodedMessage = base64UrlEncode(rawEmail);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Gagal mengirim email via Gmail (${response.status}: ${response.statusText})`
    );
  }

  return await response.json();
}

/**
 * Save email as a Draft in Gmail
 */
export async function createGmailDraft(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    htmlBody: string;
    fromName?: string;
  }
): Promise<{ id: string; message: { id: string; threadId: string } }> {
  const { to, subject, htmlBody, fromName = 'Pondok Modern Al-Ghozali' } = params;

  const rawEmail = [
    `From: "${fromName.replace(/"/g, '')}" <me>`,
    `To: ${to.trim()}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody,
  ].join('\r\n');

  const encodedMessage = base64UrlEncode(rawEmail);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        raw: encodedMessage,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Gagal menyimpan draf di Gmail (${response.status}: ${response.statusText})`
    );
  }

  return await response.json();
}

/**
 * List recent messages sent or in inbox
 */
export async function listGmailMessages(
  accessToken: string,
  query: string = '',
  maxResults: number = 10
): Promise<GmailMessageSummary[]> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('maxResults', String(maxResults));
  if (query) {
    url.searchParams.set('q', query);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Gagal memuat pesan Gmail (${response.status}: ${response.statusText})`
    );
  }

  const data = await response.json();
  const messages: Array<{ id: string; threadId: string }> = data.messages || [];

  // Fetch summary headers for each message (parallel max 5)
  const summaries: GmailMessageSummary[] = await Promise.all(
    messages.slice(0, 8).map(async (msg) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=From&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!detailRes.ok) return { id: msg.id, threadId: msg.threadId };
        const detailData = await detailRes.json();
        const headers = detailData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(Tanpa Subjek)';
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detailData.snippet,
          internalDate: detailData.internalDate,
          subject,
          to,
          from,
          date,
        };
      } catch {
        return { id: msg.id, threadId: msg.threadId };
      }
    })
  );

  return summaries;
}

/**
 * Generate a beautifully styled, mobile-responsive HTML email for e-Raport Kasyfud Darajat
 */
export function generateRaportEmailHtml(params: {
  student: StudentRecord;
  subjects: Subject[];
  config: SchoolConfig;
  customMessage?: string;
}): string {
  const { student, subjects, config, customMessage } = params;

  // Calculate scores
  let totalScore = 0;
  let count = 0;
  const subjectRows = subjects.map((sub, idx) => {
    const score = student.scores[sub.id];
    const hasScore = score !== undefined && score !== null;
    if (hasScore) {
      totalScore += score;
      count++;
    }
    const scoreVal = hasScore ? score : 0;

    // Predikat
    let predikat = 'Rasib';
    let badgeBg = '#FEE2E2';
    let badgeColor = '#991B1B';

    if (scoreVal >= 90) {
      predikat = 'Mumtaz (Istimewa)';
      badgeBg = '#D1FAE5';
      badgeColor = '#065F46';
    } else if (scoreVal >= 80) {
      predikat = 'Jayyid Jiddan (Sangat Baik)';
      badgeBg = '#E0F2FE';
      badgeColor = '#075985';
    } else if (scoreVal >= 65) {
      predikat = 'Jayyid (Baik)';
      badgeBg = '#FEF3C7';
      badgeColor = '#92400E';
    } else if (scoreVal >= 60) {
      predikat = 'Maqbul (Cukup)';
      badgeBg = '#F3F4F6';
      badgeColor = '#374151';
    }

    return `
      <tr style="border-bottom: 1px solid #E5E7EB;">
        <td style="padding: 10px 12px; font-size: 13px; color: #4B5563; text-align: center; width: 40px;">${idx + 1}</td>
        <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #1F2937;">
          ${sub.nameId}
          ${sub.nameAr ? `<div style="font-size: 12px; color: #047857; direction: rtl; font-family: serif;">${sub.nameAr}</div>` : ''}
        </td>
        <td style="padding: 10px 12px; font-size: 14px; font-weight: bold; text-align: center; color: #111827; width: 70px;">
          ${hasScore ? scoreVal : '<span style="color:#9CA3AF;">-</span>'}
        </td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: center; width: 140px;">
          <span style="display: inline-block; padding: 3px 8px; border-radius: 9999px; background-color: ${badgeBg}; color: ${badgeColor}; font-weight: 600;">
            ${hasScore ? predikat : '-'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const average = count > 0 ? (totalScore / count).toFixed(1) : '0';

  let generalPredikat = 'Perlu Peningkatan';
  let generalColor = '#B91C1C';
  const numAvg = parseFloat(average);
  if (numAvg >= 90) {
    generalPredikat = 'Mumtaz (Istimewa)';
    generalColor = '#047857';
  } else if (numAvg >= 80) {
    generalPredikat = 'Jayyid Jiddan (Sangat Baik)';
    generalColor = '#0284C7';
  } else if (numAvg >= 65) {
    generalPredikat = 'Jayyid (Baik)';
    generalColor = '#D97706';
  } else if (numAvg >= 60) {
    generalPredikat = 'Maqbul (Cukup)';
    generalColor = '#4B5563';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Hasil Belajar Santri - Pondok Modern Al-Ghozali</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937;">
  <div style="max-width: 650px; margin: 24px auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #E5E7EB;">
    
    <!-- Header Kop Pondok -->
    <div style="background: linear-gradient(135deg, #064E3B 0%, #065F46 100%); color: #FFFFFF; padding: 28px 24px; text-align: center;">
      <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; color: #A7F3D0; margin-bottom: 6px;">
        Pondok Modern Al-Ghozali Bogor
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
        KASYFUD DARAJAT
      </h1>
      <div style="font-size: 13px; color: #D1FAE5; margin-top: 4px;">
        Laporan Hasil Evaluasi Belajar Santri (e-Raport Resmi)
      </div>
    </div>

    <!-- Konten Utama -->
    <div style="padding: 24px;">
      
      ${customMessage ? `
        <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; color: #065F46;">
          ${customMessage.replace(/\n/g, '<br/>')}
        </div>
      ` : ''}

      <!-- Kartu Biodata Santri -->
      <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #6B7280; width: 120px;">Nama Santri</td>
            <td style="padding: 4px 8px; font-weight: bold; color: #111827;">: ${student.name}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">NISN / No. Induk</td>
            <td style="padding: 4px 8px; color: #111827;">: ${student.nisn || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Kelas / Jenjang</td>
            <td style="padding: 4px 8px; font-weight: 600; color: #047857;">: ${config.classLatin || '-'} (${config.academicYearLatin || '2025/2026'})</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Wali Kelas</td>
            <td style="padding: 4px 8px; color: #111827;">: ${config.waliKelasName || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #6B7280;">Semester</td>
            <td style="padding: 4px 8px; color: #111827;">: ${config.semesterLatin || 'Ganjil'}</td>
          </tr>
        </table>
      </div>

      <!-- Ringkasan Nilai Card -->
      <div style="display: flex; gap: 12px; margin-bottom: 24px; text-align: center;">
        <div style="flex: 1; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 12px;">
          <div style="font-size: 11px; color: #166534; font-weight: 600; text-transform: uppercase;">Total Nilai</div>
          <div style="font-size: 20px; font-weight: 800; color: #15803D; margin-top: 2px;">${totalScore}</div>
        </div>
        <div style="flex: 1; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 12px;">
          <div style="font-size: 11px; color: #1E40AF; font-weight: 600; text-transform: uppercase;">Rata-Rata</div>
          <div style="font-size: 20px; font-weight: 800; color: #1D4ED8; margin-top: 2px;">${average}</div>
        </div>
        <div style="flex: 1; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 12px;">
          <div style="font-size: 11px; color: #92400E; font-weight: 600; text-transform: uppercase;">Predikat</div>
          <div style="font-size: 13px; font-weight: 800; color: ${generalColor}; margin-top: 6px;">${generalPredikat}</div>
        </div>
      </div>

      <!-- Tabel Nilai Mata Pelajaran -->
      <div style="margin-bottom: 24px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #065F46; color: #FFFFFF; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
              <th style="padding: 10px 12px; text-align: center; width: 40px;">No</th>
              <th style="padding: 10px 12px; text-align: left;">Mata Pelajaran</th>
              <th style="padding: 10px 12px; text-align: center; width: 70px;">Nilai</th>
              <th style="padding: 10px 12px; text-align: center; width: 140px;">Predikat</th>
            </tr>
          </thead>
          <tbody>
            ${subjectRows}
          </tbody>
        </table>
      </div>

      <!-- Catatan dan Tanda Tangan -->
      <div style="border-top: 1px dashed #D1D5DB; padding-top: 18px; margin-top: 20px;">
        <div style="font-size: 12px; color: #6B7280; font-style: italic; line-height: 1.5; margin-bottom: 16px;">
          * e-Raport ini diterbitkan secara otomatis dan sah melalui Sistem Manajemen Akademik Kasyfud Darajat Pondok Modern Al-Ghozali Bogor.
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr>
            <td style="width: 50%; text-align: left; vertical-align: top; font-size: 12px;">
              <div style="color: #6B7280;">Mengetahui,</div>
              <div style="font-weight: bold; color: #111827; margin-top: 2px;">Direktur KMI / Pimpinan Pondok</div>
              <div style="margin-top: 36px; font-weight: bold; color: #111827; text-decoration: underline;">
                ${config.direkturName || 'Ust. H. Muhamad Ihsan, M.Pd.'}
              </div>
            </td>
            <td style="width: 50%; text-align: right; vertical-align: top; font-size: 12px;">
              <div style="color: #6B7280;">${config.placeNameLatin || 'Bogor'}, ${config.dateMasehi || '21 Juni 2026'}</div>
              <div style="font-weight: bold; color: #111827; margin-top: 2px;">Wali Kelas</div>
              <div style="margin-top: 36px; font-weight: bold; color: #111827; text-decoration: underline;">
                ${config.waliKelasName || '-'}
              </div>
            </td>
          </tr>
        </table>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #F9FAFB; padding: 16px 24px; text-align: center; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF;">
      © ${new Date().getFullYear()} Pondok Modern Al-Ghozali Bogor. Seluruh hak cipta dilindungi.
    </div>

  </div>
</body>
</html>
  `;
}
