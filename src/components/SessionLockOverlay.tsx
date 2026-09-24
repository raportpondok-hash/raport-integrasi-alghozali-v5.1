import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Fingerprint, LockKeyhole, Unlock, Maximize2 } from 'lucide-react';

interface SessionLockOverlayProps {
  userName: string;
  onUnlock: () => void;
  idleMinutes?: number;
}

/**
 * Kunci sesi lokal untuk mencegah layar aplikasi terbuka saat perangkat ditinggal.
 * Catatan: WebAuthn/passkey dipakai bila perangkat/browser mendukung biometrik.
 * F11 tetap diperlakukan sebagai shortcut untuk mencoba membuka overlay, tetapi
 * browser dapat mengambil alih F11 untuk fullscreen sehingga tombol buka tetap tersedia.
 */
export const SessionLockOverlay: React.FC<SessionLockOverlayProps> = ({
  userName,
  onUnlock,
  idleMinutes = 15,
}) => {
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const timerRef = useRef<number | null>(null);

  const lock = useCallback(() => {
    setLocked(true);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (!locked) {
      timerRef.current = window.setTimeout(lock, idleMinutes * 60 * 1000);
    }
  }, [idleMinutes, lock, locked]);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
    setBiometricAvailable(supported);
  }, []);

  useEffect(() => {
    resetTimer();
    const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F11') {
        // F11 biasanya ditangkap browser sebagai fullscreen. Jika browser
        // meneruskan event ini ke halaman, gunakan sebagai shortcut buka.
        if (locked) {
          // F11 adalah kontrol fullscreen browser, bukan kredensial keamanan.
          // Jangan pernah menganggap F11 sebagai bukti identitas pengguna.
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [locked, onUnlock]);

  const unlockWithBiometric = async () => {
    if (!biometricAvailable || !window.PublicKeyCredential) return;
    setBusy(true);
    try {
      const storageKey = 'raport_local_passkey_id_v1';
      let storedId = '';
      try {
        storedId = localStorage.getItem(storageKey) || '';
      } catch {}

      const base64ToBytes = (value: string) => {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        return Uint8Array.from(atob(padded), (ch) => ch.charCodeAt(0));
      };
      const bytesToBase64Url = (bytes: Uint8Array) => {
        let binary = '';
        bytes.forEach((b) => { binary += String.fromCharCode(b); });
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      };

      if (!storedId) {
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            rp: { name: 'Raport Pondok Al-Ghozali', id: window.location.hostname },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: userName || 'pengguna',
              displayName: userName || 'Pengguna Raport',
            },
            pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
            authenticatorSelection: {
              residentKey: 'required',
              userVerification: 'required',
            },
            timeout: 60000,
            attestation: 'none',
          },
        }) as PublicKeyCredential | null;

        if (!credential) throw new Error('Perangkat tidak mengembalikan kredensial.');
        storedId = bytesToBase64Url(new Uint8Array(credential.rawId));
        localStorage.setItem(storageKey, storedId);
      }

      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
          allowCredentials: [{ type: 'public-key', id: base64ToBytes(storedId) }],
        },
      });

      setLocked(false);
      onUnlock();
    } catch (error) {
      console.warn('Biometric/passkey unlock gagal atau dibatalkan.', error);
    } finally {
      setBusy(false);
    }
  };

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl p-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
          <LockKeyhole size={30} />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-stone-900">Sesi Terkunci</h2>
        <p className="mt-1 text-sm text-stone-500">
          {userName} • aplikasi dikunci karena tidak ada aktivitas.
        </p>

        <div className="mt-5 space-y-2">
          {biometricAvailable && (
            <button
              type="button"
              onClick={unlockWithBiometric}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Fingerprint size={20} />
              {busy ? 'Memverifikasi...' : (typeof localStorage !== 'undefined' && localStorage.getItem('raport_local_passkey_id_v1') ? 'Buka dengan Sidik Jari / Passkey' : 'Aktifkan & Buka dengan Sidik Jari')}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLocked(false);
              onUnlock();
            }}
            className="w-full py-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 font-bold flex items-center justify-center gap-2"
          >
            <Unlock size={18} />
            Buka Sesi
          </button>
        </div>

        <div className="mt-4 text-[11px] text-stone-400 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <Maximize2 size={12} /> PC/Laptop: F11 dapat dipakai untuk fullscreen; buka sesi tetap memerlukan verifikasi.
          </p>
          <p>HP/PC: gunakan sidik jari, Face ID, Windows Hello, atau passkey bila tersedia.</p>
        </div>
      </div>
    </div>
  );
};
