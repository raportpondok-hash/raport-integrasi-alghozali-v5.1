import React, { useState, useEffect } from 'react';
import {
  ReportDesignConfig,
  DesignPreset,
  DEFAULT_DESIGN_CONFIG,
  getSavedDesignPresets,
  saveDesignPreset,
  deleteDesignPreset,
} from '../data/reportDesign';
import {
  X,
  Palette,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  RotateCcw,
  Save,
  Check,
  BookmarkPlus,
  Trash2,
  FolderOpen,
} from 'lucide-react';

interface ReportDesignModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: ReportDesignConfig;
  onSaveConfig: (newConfig: ReportDesignConfig) => void;
}

export const ReportDesignModal: React.FC<ReportDesignModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'frame' | 'table' | 'fontSize' | 'fontStyle' | 'alignment' | 'presets'>('frame');
  const [formData, setFormData] = useState<ReportDesignConfig>(currentConfig);
  const [presets, setPresets] = useState<DesignPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('default-gold-green');
  const [newPresetName, setNewPresetName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(currentConfig);
      setPresets(getSavedDesignPresets());
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleChange = <K extends keyof ReportDesignConfig>(key: K, value: ReportDesignConfig[K]) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyPreset = (preset: DesignPreset) => {
    setFormData({ ...preset.config });
    setSelectedPresetId(preset.id);
    showNotice(`Preset "${preset.name}" berhasil diterapkan!`);
  };

  const handleSaveAsNewPreset = () => {
    if (!newPresetName.trim()) {
      alert('Mohon masukkan nama untuk preset baru.');
      return;
    }
    const newPreset: DesignPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      description: 'Preset kustom buatan pengguna',
      config: { ...formData },
      isBuiltIn: false,
    };
    const updated = saveDesignPreset(newPreset);
    setPresets(updated);
    setSelectedPresetId(newPreset.id);
    setNewPresetName('');
    showNotice(`Preset "${newPreset.name}" berhasil disimpan!`);
  };

  const handleDeletePreset = (id: string, name: string) => {
    if (confirm(`Hapus preset "${name}"?`)) {
      const updated = deleteDesignPreset(id);
      setPresets(updated);
      setSelectedPresetId('default-gold-green');
      showNotice(`Preset "${name}" berhasil dihapus.`);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Kembalikan semua pengaturan desain & tata letak ke format resmi awal?')) {
      setFormData({ ...DEFAULT_DESIGN_CONFIG });
      setSelectedPresetId('default-gold-green');
      showNotice('Format desain telah dikembalikan ke format resmi bawaan.');
    }
  };

  const handleSaveAndApply = () => {
    onSaveConfig(formData);
    onClose();
  };

  const showNotice = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Palette size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                <span>Kustomisasi Desain & Tata Letak Rapor</span>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  CRUD Customizer
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Atur posisi bingkai, tabel, ukuran font, gaya huruf, dan perataan teks secara fleksibel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Check size={14} className="text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto px-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('frame')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'frame'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Layout size={15} />
            <span>1. Bingkai (Frame)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'table'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Sliders size={15} />
            <span>2. Tabel & Posisi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fontSize')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'fontSize'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Type size={15} />
            <span>3. Ukuran Font</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fontStyle')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'fontStyle'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Palette size={15} />
            <span>4. Gaya Font</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alignment')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'alignment'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <AlignCenter size={15} />
            <span>5. Posisi Huruf</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${
              activeTab === 'presets'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <BookmarkPlus size={15} />
            <span>6. Kelola Preset (CRUD)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ===================== TAB 1: BINGKAI (FRAME) ===================== */}
          {activeTab === 'frame' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <strong>Pengaturan Bingkai Sertifikat:</strong> Sesuaikan jarak tepi (*padding*), ketebalan garis, jenis bingkai ganda/tunggal, warna garis, dan aksen emas.
                </div>
              </div>

              {/* Padding Bingkai */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Jarak Isi ke Bingkai (Padding in Pixel)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Atas ({formData.framePaddingTop}px)
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="40"
                      value={formData.framePaddingTop}
                      onChange={(e) => handleChange('framePaddingTop', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Bawah ({formData.framePaddingBottom}px)
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="40"
                      value={formData.framePaddingBottom}
                      onChange={(e) => handleChange('framePaddingBottom', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Kiri ({formData.framePaddingLeft}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="45"
                      value={formData.framePaddingLeft}
                      onChange={(e) => handleChange('framePaddingLeft', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Kanan ({formData.framePaddingRight}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="45"
                      value={formData.framePaddingRight}
                      onChange={(e) => handleChange('framePaddingRight', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Garis Bingkai Utama */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Gaya Garis & Warna Bingkai Dalam
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Gaya Garis Bingkai
                    </label>
                    <select
                      value={formData.frameBorderStyle}
                      onChange={(e) => handleChange('frameBorderStyle', e.target.value as any)}
                      className="w-full text-xs font-bold bg-white border border-stone-300 rounded-lg p-2"
                    >
                      <option value="double">Double (Garis Ganda Pesantren)</option>
                      <option value="solid">Solid (Garis Tunggal Tebal)</option>
                      <option value="dashed">Dashed (Garis Putus-putus)</option>
                      <option value="ridge">Ridge (Garis Timbul)</option>
                      <option value="none">None (Tanpa Garis)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ketebalan Garis ({formData.frameBorderWidth}px)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={formData.frameBorderWidth}
                      onChange={(e) => handleChange('frameBorderWidth', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Warna Bingkai
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.frameBorderColor}
                        onChange={(e) => handleChange('frameBorderColor', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.frameBorderColor}
                        onChange={(e) => handleChange('frameBorderColor', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white border border-stone-300 rounded p-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Garis Luar (Outline) & Aksen Emas */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Garis Luar (Outline) & Aksen Emas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ketebalan Outline ({formData.frameOutlineWidth}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={formData.frameOutlineWidth}
                      onChange={(e) => handleChange('frameOutlineWidth', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Jarak Outline Offset ({formData.frameOutlineOffset}px)
                    </label>
                    <input
                      type="range"
                      min="-20"
                      max="10"
                      value={formData.frameOutlineOffset}
                      onChange={(e) => handleChange('frameOutlineOffset', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Warna Garis Outline
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.frameOutlineColor}
                        onChange={(e) => handleChange('frameOutlineColor', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.frameOutlineColor}
                        onChange={(e) => handleChange('frameOutlineColor', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white border border-stone-300 rounded p-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Warna Aksen Dalam (Emas)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.frameAccentColor === 'transparent' ? '#d4af37' : formData.frameAccentColor}
                        onChange={(e) => handleChange('frameAccentColor', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.frameAccentColor}
                        onChange={(e) => handleChange('frameAccentColor', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white border border-stone-300 rounded p-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Kelengkungan Sudut ({formData.frameBorderRadius}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={formData.frameBorderRadius}
                      onChange={(e) => handleChange('frameBorderRadius', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 2: TABEL & POSISI ===================== */}
          {activeTab === 'table' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <strong>Pengaturan Posisi & Dimensi Tabel:</strong> Atur jarak margin atas dan bawah serta tinggi baris agar 28 mata pelajaran muat presisi dalam 1 lembar A4 / F4.
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Posisi & Margin Tabel
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Margin Atas Tabel ({formData.tableMarginTop}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={formData.tableMarginTop}
                      onChange={(e) => handleChange('tableMarginTop', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Margin Bawah Tabel ({formData.tableMarginBottom}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      value={formData.tableMarginBottom}
                      onChange={(e) => handleChange('tableMarginBottom', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Tinggi Baris Mapel ({formData.tableRowHeight}px)
                    </label>
                    <input
                      type="range"
                      min="18"
                      max="32"
                      value={formData.tableRowHeight}
                      onChange={(e) => handleChange('tableRowHeight', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Disarankan 20px - 22px untuk 28 mapel
                    </span>
                  </div>
                </div>
              </div>

              {/* Pengaturan Kolom Nomor (الرقم) */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Pengaturan Kolom Nomor (الرقم)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Lebar Kolom Nomor ({formData.numberColWidth ?? 5.5}%)
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="14"
                      value={formData.numberColWidth ?? 5.5}
                      onChange={(e) => handleChange('numberColWidth', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <span className="text-[10px] text-stone-500 mt-0.5 block">
                      Default: 5.5%. Geser ke kanan jika ingin kolom nomor lebih lebar.
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Format Angka Nomor Urut
                    </label>
                    <select
                      value={formData.numberFormat ?? 'arabic'}
                      onChange={(e) => handleChange('numberFormat', e.target.value as any)}
                      className="w-full text-xs font-bold bg-white border border-stone-300 rounded-lg p-2"
                    >
                      <option value="arabic">Angka Arab Timur (١، ٢، ٣، ٤، ...)</option>
                      <option value="latin">Angka Latin (1, 2, 3, 4, ...)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Garis & Warna Tabel
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ketebalan Garis Tabel ({formData.tableBorderWidth}px)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.25"
                      value={formData.tableBorderWidth}
                      onChange={(e) => handleChange('tableBorderWidth', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Warna Garis Tabel
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.tableBorderColor}
                        onChange={(e) => handleChange('tableBorderColor', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.tableBorderColor}
                        onChange={(e) => handleChange('tableBorderColor', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white border border-stone-300 rounded p-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Warna Background Header Tabel
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.tableHeaderBg}
                        onChange={(e) => handleChange('tableHeaderBg', e.target.value)}
                        className="w-8 h-8 rounded border border-stone-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formData.tableHeaderBg}
                        onChange={(e) => handleChange('tableHeaderBg', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white border border-stone-300 rounded p-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 3: UKURAN FONT (FONT SIZE) ===================== */}
          {activeTab === 'fontSize' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <strong>Ukuran Font Setiap Bagian Rapor:</strong> Geser slider untuk memperbesar atau memperkecil teks judul, nama mapel, nilai angka, terbilang Arab, dan tanda tangan.
              </div>

              {/* Header Font Sizes */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Ukuran Font Header & Identitas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Judul كشف الدرجات ({formData.titleFontSize}pt)
                    </label>
                    <input
                      type="range"
                      min="18"
                      max="34"
                      value={formData.titleFontSize}
                      onChange={(e) => handleChange('titleFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Subjudul Ujian ({formData.subTitleFontSize}pt)
                    </label>
                    <input
                      type="range"
                      min="11"
                      max="22"
                      value={formData.subTitleFontSize}
                      onChange={(e) => handleChange('subTitleFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Identitas Santri ({formData.studentInfoFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="11"
                      max="18"
                      step="0.5"
                      value={formData.studentInfoFontSize}
                      onChange={(e) => handleChange('studentInfoFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Table Font Sizes */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Ukuran Font Isi Tabel Nilai
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Header Kolom ({formData.tableHeaderFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="16"
                      value={formData.tableHeaderFontSize}
                      onChange={(e) => handleChange('tableHeaderFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Nomor Urut Mapel ({formData.numberFontSize ?? 12}px)
                    </label>
                    <input
                      type="range"
                      min="9"
                      max="16"
                      value={formData.numberFontSize ?? 12}
                      onChange={(e) => handleChange('numberFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Mapel Arab ({formData.arabicSubjectFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="11"
                      max="19"
                      value={formData.arabicSubjectFontSize}
                      onChange={(e) => handleChange('arabicSubjectFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Mapel Latin ({formData.latinSubjectFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="9"
                      max="15"
                      step="0.5"
                      value={formData.latinSubjectFontSize}
                      onChange={(e) => handleChange('latinSubjectFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Nilai Angka ({formData.scoreFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="16"
                      value={formData.scoreFontSize}
                      onChange={(e) => handleChange('scoreFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Terbilang Arab ({formData.terbilangFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="11"
                      max="18"
                      value={formData.terbilangFontSize}
                      onChange={(e) => handleChange('terbilangFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Baris Total/Rata/Rank ({formData.summaryFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="16"
                      value={formData.summaryFontSize}
                      onChange={(e) => handleChange('summaryFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Titimangsa ({formData.titimangsaFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="11"
                      max="18"
                      value={formData.titimangsaFontSize}
                      onChange={(e) => handleChange('titimangsaFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Nama Penandatangan ({formData.signatureNameFontSize}px)
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="16"
                      value={formData.signatureNameFontSize}
                      onChange={(e) => handleChange('signatureNameFontSize', Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 4: GAYA FONT (FONT STYLE) ===================== */}
          {activeTab === 'fontStyle' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <strong>Gaya & Keluarga Huruf (Font Families & Weights):</strong> Pilih jenis tipografi Arab dan Latin serta ketebalan tulisan.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Font Arab */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Keluarga Font Arab (Arabic Typography)
                  </h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Pilihan Font Kaligrafi Arab
                    </label>
                    <select
                      value={formData.arabicFontFamily}
                      onChange={(e) => handleChange('arabicFontFamily', e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-stone-300 rounded-lg p-2 font-arabic"
                    >
                      <option value="'Traditional Arabic', 'Amiri', 'Scheherazade New', serif">
                        Traditional Arabic (Klasik Pesantren)
                      </option>
                      <option value="'Amiri', 'Traditional Arabic', serif">
                        Amiri Serif (Naskh Standar)
                      </option>
                      <option value="'Scheherazade New', serif">
                        Scheherazade New (Khas Kitab Kuning)
                      </option>
                      <option value="'Noto Naskh Arabic', serif">
                        Noto Naskh Arabic (Jelas & Modern)
                      </option>
                      <option value="Tahoma, 'Segoe UI', sans-serif">
                        Tahoma (Sans-Serif Bersih)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ketebalan Font Arab
                    </label>
                    <select
                      value={formData.arabicFontWeight}
                      onChange={(e) => handleChange('arabicFontWeight', e.target.value as any)}
                      className="w-full text-xs font-bold bg-white border border-stone-300 rounded-lg p-2"
                    >
                      <option value="normal">Normal (400)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="bold">Bold (700 - Standar Rapor)</option>
                    </select>
                  </div>
                </div>

                {/* Font Latin */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Keluarga Font Latin (Indonesia / Nama Mapel)
                  </h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Pilihan Font Latin
                    </label>
                    <select
                      value={formData.latinFontFamily}
                      onChange={(e) => handleChange('latinFontFamily', e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-stone-300 rounded-lg p-2"
                    >
                      <option value="'Times New Roman', Arial, sans-serif">
                        Times New Roman (Formal Akademik)
                      </option>
                      <option value="Arial, Helvetica, sans-serif">
                        Arial (Modern Sans-Serif)
                      </option>
                      <option value="Georgia, serif">
                        Georgia (Elegan Serif)
                      </option>
                      <option value="'Calibri', sans-serif">
                        Calibri (Minimalis)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Ketebalan Font Latin
                    </label>
                    <select
                      value={formData.latinFontWeight}
                      onChange={(e) => handleChange('latinFontWeight', e.target.value as any)}
                      className="w-full text-xs font-bold bg-white border border-stone-300 rounded-lg p-2"
                    >
                      <option value="normal">Normal (Standar Rapor)</option>
                      <option value="600">Semi-Bold (600)</option>
                      <option value="bold">Bold (Tebal 700)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 5: POSISI HURUF (ALIGNMENT) ===================== */}
          {activeTab === 'alignment' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <strong>Perataan & Posisi Huruf (Left, Center, Right, Justify):</strong> Tentukan perataan teks untuk masing-masing kolom tabel dan elemen sertifikat.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 0. Kolom Nomor */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-stone-800 block">Kolom Nomor Urut</span>
                    <span className="text-[10px] text-stone-500">الرقم (No. Urut Mapel)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleChange('numberAlign', align)}
                        className={`p-1.5 rounded transition ${
                          (formData.numberAlign || 'center') === align
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title={`Rata ${align}`}
                      >
                        {align === 'left' && <AlignLeft size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'right' && <AlignRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Mapel Arab */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-stone-800 block">Kolom Mapel Arab</span>
                    <span className="text-[10px] text-stone-500">المواد الدراسية</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200">
                    {(['right', 'center', 'justify', 'left'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleChange('arabicSubjectAlign', align)}
                        className={`p-1.5 rounded transition ${
                          formData.arabicSubjectAlign === align
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title={`Rata ${align}`}
                      >
                        {align === 'right' && <AlignRight size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'justify' && <AlignJustify size={14} />}
                        {align === 'left' && <AlignLeft size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Mapel Latin */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-stone-800 block">Kolom Mapel Latin</span>
                    <span className="text-[10px] text-stone-500">Mata Pelajaran (Indonesia)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200">
                    {(['left', 'center', 'justify', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleChange('latinSubjectAlign', align)}
                        className={`p-1.5 rounded transition ${
                          formData.latinSubjectAlign === align
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title={`Rata ${align}`}
                      >
                        {align === 'left' && <AlignLeft size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'justify' && <AlignJustify size={14} />}
                        {align === 'right' && <AlignRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Nilai Angka */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-stone-800 block">Kolom Nilai Angka</span>
                    <span className="text-[10px] text-stone-500">الدرجة بالرقـم</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200">
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleChange('scoreAlign', align)}
                        className={`p-1.5 rounded transition ${
                          formData.scoreAlign === align
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title={`Rata ${align}`}
                      >
                        {align === 'left' && <AlignLeft size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'right' && <AlignRight size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Terbilang Arab */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-stone-800 block">Kolom Terbilang Arab</span>
                    <span className="text-[10px] text-stone-500">الدرجة التي حصلت عليها</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200">
                    {(['right', 'center', 'justify', 'left'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleChange('terbilangAlign', align)}
                        className={`p-1.5 rounded transition ${
                          formData.terbilangAlign === align
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title={`Rata ${align}`}
                      >
                        {align === 'right' && <AlignRight size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'justify' && <AlignJustify size={14} />}
                        {align === 'left' && <AlignLeft size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Titimangsa */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-stone-800 block">Posisi Titimangsa</span>
                    <span className="text-[10px] text-stone-500">تحريرا بغونونج سندور...</span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-stone-200">
                    {(['right', 'center', 'left'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => handleChange('titimangsaAlign', align)}
                        className={`p-1.5 rounded transition ${
                          formData.titimangsaAlign === align
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title={`Rata ${align}`}
                      >
                        {align === 'right' && <AlignRight size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'left' && <AlignLeft size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 6: KELOLA PRESET (CRUD) ===================== */}
          {activeTab === 'presets' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <strong>Manajemen CRUD Preset Desain:</strong> Simpan gaya rapor favorit Anda sebagai preset baru, ganti format seketika, atau hapus preset yang sudah tidak digunakan.
              </div>

              {/* Simpan Preset Baru (CREATE) */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <BookmarkPlus size={15} className="text-emerald-600" />
                  <span>Simpan Konfigurasi Saat Ini Sebagai Preset Baru (Create)</span>
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Contoh: Format Rapor Semester Ganjil 2026"
                    className="flex-1 text-xs font-bold bg-white border border-stone-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAsNewPreset}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Save size={14} />
                    <span>Simpan Preset</span>
                  </button>
                </div>
              </div>

              {/* Daftar Preset yang Tersedia (READ, UPDATE, DELETE) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <FolderOpen size={15} className="text-blue-600" />
                  <span>Daftar Preset Tersedia ({presets.length})</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presets.map((preset) => {
                    const isCurrent = selectedPresetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-bold text-xs text-stone-900 flex items-center gap-1.5">
                              <span>{preset.name}</span>
                              {preset.isBuiltIn && (
                                <span className="text-[9px] font-bold uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                                  Bawaan
                                </span>
                              )}
                            </h5>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check size={11} /> Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              isCurrent
                                ? 'bg-emerald-700 text-white'
                                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            }`}
                          >
                            {isCurrent ? 'Diterapkan' : 'Terapkan'}
                          </button>

                          {!preset.isBuiltIn && (
                            <button
                              type="button"
                              onClick={() => handleDeletePreset(preset.id, preset.name)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                              title="Hapus preset ini"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-xs font-bold px-3 py-2 rounded-lg border border-stone-300 hover:bg-stone-100 transition"
          >
            <RotateCcw size={14} />
            <span>Kembalikan ke Format Awal (Reset)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 rounded-lg hover:bg-stone-200 transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-95"
            >
              <Check size={15} />
              <span>Terapkan & Simpan Desain</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
