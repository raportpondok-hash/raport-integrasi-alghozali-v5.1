# Raport Integrasi Al-Ghozali V5 — Google Apps Script

Backend Web App untuk V5. Backend memilih salah satu dari 8 Google Spreadsheet berdasarkan schoolType + unit.

## Script Properties

### AI Auditor Groq
Tambahkan di Script Properties:
- `GROQ_API_KEY` = API key Groq (rahasia, jangan commit ke GitHub)
- `GROQ_MODEL_FAST` = `openai/gpt-oss-20b`
- `GROQ_MODEL_DEEP` = `openai/gpt-oss-120b`
- `GROQ_MODEL_SAFEGUARD` = `openai/gpt-oss-safeguard-20b`
- `GROQ_MODEL_WHISPER` = `whisper-large-v3`
- `GROQ_MODEL_WHISPER_FAST` = `whisper-large-v3-turbo`

Jalankan `setupAIAuditorProperties()` sekali untuk mengisi nama model. API key tetap harus diisi manual.

## Script Properties

Di Apps Script: Project Settings → Script Properties, buat:

- APP_URL (URL frontend V5 hasil build/deploy)
- ADMIN_PIN
- SPREADSHEET_SMP_FULL_DAY_ID
- SPREADSHEET_SMP_PONDOK_ID
- SPREADSHEET_SMA_X_FULL_DAY_ID
- SPREADSHEET_SMA_XI_IPA_FULL_DAY_ID
- SPREADSHEET_SMA_XI_IPS_FULL_DAY_ID
- SPREADSHEET_SMA_XII_IPA_FULL_DAY_ID
- SPREADSHEET_SMA_XII_IPS_FULL_DAY_ID
- SPREADSHEET_SMA_MUKIM_PONDOK_ID

Jangan commit nilai ID/PIN ke repository publik.

Deploy sebagai Web app, execute as Me. Setelah deployment, masukkan URL Web App ke VITE_GAS_WEB_APP_URL saat build frontend.


## Frontend Web App
`Index.html` adalah shell Web App. Atur `APP_URL` ke URL frontend V5 yang sudah dibuild. URL Apps Script tetap menjadi pintu masuk aplikasi, sedangkan backend data dan PIN tetap di Apps Script.
