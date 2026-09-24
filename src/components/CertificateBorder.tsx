import React from 'react';
import { ReportDesignConfig } from '../data/reportDesign';

interface CertificateBorderProps {
  children: React.ReactNode;
  className?: string;
  designConfig?: ReportDesignConfig;
  onUpdateDesignConfig?: (newConfig: ReportDesignConfig) => void;
  isPrintOnly?: boolean;
  isEditingMode?: boolean;
  id?: string;
}

export const CertificateBorder: React.FC<CertificateBorderProps> = ({
  children,
  className = '',
  designConfig,
  onUpdateDesignConfig,
  isPrintOnly = false,
  isEditingMode = false,
  id,
}) => {
  const reactId = React.useId().replace(/:/g, '');
  const borderId = id ? `${id}-${reactId}` : `cert-border-${reactId}`;
  const paddingTop = designConfig?.framePaddingTop ?? 16;
  const paddingBottom = designConfig?.framePaddingBottom ?? 16;
  const paddingLeft = designConfig?.framePaddingLeft ?? 20;
  const paddingRight = designConfig?.framePaddingRight ?? 20;

  // Islamic Academic Palette sesuai spesifikasi resmi:
  // Deep Islamic Green: #1F6B4F
  // Dark Forest Green: #174D3A
  // Elegant Gold: #B28A3A
  // Soft Champagne Gold: #D8BE78
  // Warm Ivory: #FFFDF5
  const colorDarkForest = '#174D3A';
  const colorIslamicGreen = '#1F6B4F';
  const colorElegantGold = '#B28A3A';
  const colorChampagneGold = '#D8BE78';

  // Drag handlers for Frame Padding in all 4 directions (Top, Bottom, Left, Right)
  const handleStartDrag = (
    edge: 'top' | 'bottom' | 'left' | 'right',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onUpdateDesignConfig || !designConfig) return;

    const startY = e.clientY;
    const startX = e.clientX;
    const initialTop = paddingTop;
    const initialBottom = paddingBottom;
    const initialLeft = paddingLeft;
    const initialRight = paddingRight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaX = moveEvent.clientX - startX;

      if (edge === 'top') {
        const nextTop = Math.max(0, Math.min(60, Math.round(initialTop + deltaY)));
        onUpdateDesignConfig({ ...designConfig, framePaddingTop: nextTop });
      } else if (edge === 'bottom') {
        const nextBottom = Math.max(0, Math.min(60, Math.round(initialBottom - deltaY)));
        onUpdateDesignConfig({ ...designConfig, framePaddingBottom: nextBottom });
      } else if (edge === 'left') {
        const nextLeft = Math.max(0, Math.min(60, Math.round(initialLeft + deltaX)));
        onUpdateDesignConfig({ ...designConfig, framePaddingLeft: nextLeft });
      } else if (edge === 'right') {
        const nextRight = Math.max(0, Math.min(60, Math.round(initialRight - deltaX)));
        onUpdateDesignConfig({ ...designConfig, framePaddingRight: nextRight });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = edge === 'top' || edge === 'bottom' ? 'ns-resize' : 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Border band thickness (46px ≈ 12.2mm)
  const B = 46;
  // Corner rosette dimensions (64px × 64px)
  const C = 64;

  return (
    <div 
      className={`frame-container relative w-full h-full bg-white text-stone-900 box-border group/frame ${className}`}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* =========================================================================
          MASTER TEMPLATE: BINGKAI RAPORT PONDOK MODERN ISLAMI
          (ELEGANT ADAPTIVE ISLAMIC GEOMETRIC REPORT FRAME - F4 210 × 330 mm)
          Komponen:
          - 4 Pita Pola Geometris Islami (Atas, Bawah, Kiri, Kanan)
          - 4 Roset Sudut Arabesque Besar (Top-Left, Top-Right, Bottom-Left, Bottom-Right)
          - 4 Medallion Diamond Tengah (Atas, Bawah, Kiri, Kanan)
          - Garis Ganda Emas Luar & Garis Ganda Emas/Hijau Dalam
          ========================================================================= */}
      <div 
        className="absolute inset-0 pointer-events-none select-none z-10"
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* 1. SISI ATAS (TOP BAND) - Direct SVG vector rendering (100% html2canvas & Print compatible) */}
        <div 
          className="absolute"
          style={{ top: 0, left: `${B}px`, right: `${B}px`, height: `${B}px`, overflow: 'hidden' }}
        >
          <svg width="100%" height={B} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: `${B}px` }}>
            {/* Latar Belakang Hijau Hutan Gelap Solid */}
            <rect width="100%" height={B} fill={colorDarkForest} />
            
            {/* Garis Aksen Emas Tepi Atas & Bawah */}
            <line x1="0" y1="2" x2="100%" y2="2" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1="4" x2="100%" y2="4" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="0" y1={B - 2} x2="100%" y2={B - 2} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1={B - 4} x2="100%" y2={B - 4} stroke={colorChampagneGold} strokeWidth="0.5" />

            {/* Anyaman Geometris Islami: Bintang 8 Sudut & Tali Penghubung */}
            {Array.from({ length: 25 }).map((_, idx) => {
              const x = idx * 40;
              return (
                <g key={idx}>
                  {/* Tali Anyaman Penghubung (Interlacing Straps) */}
                  <path d={`M ${x},23 L ${x + 10},13 L ${x + 20},23 L ${x + 30},13 L ${x + 40},23`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <path d={`M ${x},23 L ${x + 10},33 L ${x + 20},23 L ${x + 30},33 L ${x + 40},23`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <circle cx={x + 10} cy={23} r={1.5} fill={colorChampagneGold} />
                  <circle cx={x + 30} cy={23} r={1.5} fill={colorChampagneGold} />

                  {/* Bintang 8 Sudut Tengah (Khatim Sulayman / Rub el Hizb) */}
                  <g transform={`translate(${x + 20}, 23)`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>

                  {/* Bintang 8 Sudut Sambungan Antar Unit */}
                  <g transform={`translate(${x}, 23)`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 2. SISI BAWAH (BOTTOM BAND) - Direct SVG vector rendering */}
        <div 
          className="absolute"
          style={{ bottom: 0, left: `${B}px`, right: `${B}px`, height: `${B}px`, overflow: 'hidden' }}
        >
          <svg width="100%" height={B} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: `${B}px` }}>
            <rect width="100%" height={B} fill={colorDarkForest} />
            <line x1="0" y1="2" x2="100%" y2="2" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1="4" x2="100%" y2="4" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="0" y1={B - 2} x2="100%" y2={B - 2} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1={B - 4} x2="100%" y2={B - 4} stroke={colorChampagneGold} strokeWidth="0.5" />

            {Array.from({ length: 25 }).map((_, idx) => {
              const x = idx * 40;
              return (
                <g key={idx}>
                  <path d={`M ${x},23 L ${x + 10},13 L ${x + 20},23 L ${x + 30},13 L ${x + 40},23`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <path d={`M ${x},23 L ${x + 10},33 L ${x + 20},23 L ${x + 30},33 L ${x + 40},23`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <circle cx={x + 10} cy={23} r={1.5} fill={colorChampagneGold} />
                  <circle cx={x + 30} cy={23} r={1.5} fill={colorChampagneGold} />

                  <g transform={`translate(${x + 20}, 23)`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>

                  <g transform={`translate(${x}, 23)`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 3. SISI KIRI (LEFT BAND) - Direct SVG vector rendering */}
        <div 
          className="absolute"
          style={{ top: `${B}px`, bottom: `${B}px`, left: 0, width: `${B}px`, overflow: 'hidden' }}
        >
          <svg width={B} height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: `${B}px`, height: '100%' }}>
            <rect width={B} height="100%" fill={colorDarkForest} />
            <line x1="2" y1="0" x2="2" y2="100%" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="4" y1="0" x2="4" y2="100%" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1={B - 2} y1="0" x2={B - 2} y2="100%" stroke={colorElegantGold} strokeWidth="1" />
            <line x1={B - 4} y1="0" x2={B - 4} y2="100%" stroke={colorChampagneGold} strokeWidth="0.5" />

            {Array.from({ length: 35 }).map((_, idx) => {
              const y = idx * 40;
              return (
                <g key={idx}>
                  <path d={`M 23,${y} L 13,${y + 10} L 23,${y + 20} L 13,${y + 30} L 23,${y + 40}`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <path d={`M 23,${y} L 33,${y + 10} L 23,${y + 20} L 33,${y + 30} L 23,${y + 40}`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <circle cx="23" cy={y + 10} r={1.5} fill={colorChampagneGold} />
                  <circle cx="23" cy={y + 30} r={1.5} fill={colorChampagneGold} />

                  <g transform={`translate(23, ${y + 20})`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>

                  <g transform={`translate(23, ${y})`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 4. SISI KANAN (RIGHT BAND) - Direct SVG vector rendering */}
        <div 
          className="absolute"
          style={{ top: `${B}px`, bottom: `${B}px`, right: 0, width: `${B}px`, overflow: 'hidden' }}
        >
          <svg width={B} height="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: `${B}px`, height: '100%' }}>
            <rect width={B} height="100%" fill={colorDarkForest} />
            <line x1="2" y1="0" x2="2" y2="100%" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="4" y1="0" x2="4" y2="100%" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1={B - 2} y1="0" x2={B - 2} y2="100%" stroke={colorElegantGold} strokeWidth="1" />
            <line x1={B - 4} y1="0" x2={B - 4} y2="100%" stroke={colorChampagneGold} strokeWidth="0.5" />

            {Array.from({ length: 35 }).map((_, idx) => {
              const y = idx * 40;
              return (
                <g key={idx}>
                  <path d={`M 23,${y} L 13,${y + 10} L 23,${y + 20} L 13,${y + 30} L 23,${y + 40}`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <path d={`M 23,${y} L 33,${y + 10} L 23,${y + 20} L 33,${y + 30} L 23,${y + 40}`} fill="none" stroke={colorElegantGold} strokeWidth="0.75" />
                  <circle cx="23" cy={y + 10} r={1.5} fill={colorChampagneGold} />
                  <circle cx="23" cy={y + 30} r={1.5} fill={colorChampagneGold} />

                  <g transform={`translate(23, ${y + 20})`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>

                  <g transform={`translate(23, ${y})`}>
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" />
                    <rect x="-8" y="-8" width="16" height="16" fill="none" stroke={colorChampagneGold} strokeWidth="0.85" transform="rotate(45)" />
                    <circle cx="0" cy="0" r="3.5" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.75" />
                    <circle cx="0" cy="0" r="1.5" fill={colorChampagneGold} />
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* =========================================================================
            4 ROSET SUDUT ARABESQUE PRESISI (4 PRECISION CORNER ROSETTES)
            Didesain presisi ${B}px × ${B}px menyatu sempurna dengan 4 pita tanpa overlap
           ========================================================================= */}
        {/* 1. SUDUT KIRI ATAS (TOP-LEFT CORNER) */}
        <div 
          className="absolute z-20"
          style={{ top: 0, left: 0, width: `${B}px`, height: `${B}px`, overflow: 'hidden' }}
        >
          <svg width={B} height={B} viewBox={`0 0 ${B} ${B}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={B} height={B} fill={colorDarkForest} />
            {/* Garis Tepi Luar (Atas & Kiri) */}
            <line x1="0" y1="2" x2={B} y2="2" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1="4" x2={B} y2="4" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="2" y1="0" x2="2" y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="4" y1="0" x2="4" y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />
            {/* Garis Tepi Dalam (Bawah & Kanan) */}
            <line x1="0" y1={B - 2} x2={B} y2={B - 2} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1={B - 4} x2={B} y2={B - 4} stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1={B - 2} y1="0" x2={B - 2} y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1={B - 4} y1="0" x2={B - 4} y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />

            {/* Roset Arabesque Mandala Sudut */}
            <g transform={`translate(${B / 2}, ${B / 2})`}>
              <circle cx="0" cy="0" r="19.5" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
              <circle cx="0" cy="0" r="17" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" strokeDasharray="1.5, 1" />
              <circle cx="0" cy="0" r="14" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="1" />
              <circle cx="0" cy="0" r="10" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" />
              <circle cx="0" cy="0" r="7" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />

              {/* 16 Kelopak Bunga Emas Berputar */}
              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <line x1="0" y1="-10" x2="0" y2="-16.5" stroke={colorChampagneGold} strokeWidth="0.75" />
                  <circle cx="0" cy="-17" r="1.1" fill={colorChampagneGold} />
                </g>
              ))}

              {/* Bintang 8 Sudut Inti */}
              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" />
              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" transform="rotate(45)" />

              {/* Inti Tengah Zamrud & Emas */}
              <circle cx="0" cy="0" r="3.2" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.3" fill={colorChampagneGold} />
            </g>
          </svg>
        </div>

        {/* 2. SUDUT KANAN ATAS (TOP-RIGHT CORNER) */}
        <div 
          className="absolute z-20"
          style={{ top: 0, right: 0, width: `${B}px`, height: `${B}px`, overflow: 'hidden' }}
        >
          <svg width={B} height={B} viewBox={`0 0 ${B} ${B}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={B} height={B} fill={colorDarkForest} />
            <line x1="0" y1="2" x2={B} y2="2" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1="4" x2={B} y2="4" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1={B - 2} y1="0" x2={B - 2} y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1={B - 4} y1="0" x2={B - 4} y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="0" y1={B - 2} x2={B} y2={B - 2} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1={B - 4} x2={B} y2={B - 4} stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="2" y1="0" x2="2" y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="4" y1="0" x2="4" y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />

            <g transform={`translate(${B / 2}, ${B / 2})`}>
              <circle cx="0" cy="0" r="19.5" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
              <circle cx="0" cy="0" r="17" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" strokeDasharray="1.5, 1" />
              <circle cx="0" cy="0" r="14" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="1" />
              <circle cx="0" cy="0" r="10" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" />
              <circle cx="0" cy="0" r="7" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />

              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <line x1="0" y1="-10" x2="0" y2="-16.5" stroke={colorChampagneGold} strokeWidth="0.75" />
                  <circle cx="0" cy="-17" r="1.1" fill={colorChampagneGold} />
                </g>
              ))}

              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" />
              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" transform="rotate(45)" />

              <circle cx="0" cy="0" r="3.2" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.3" fill={colorChampagneGold} />
            </g>
          </svg>
        </div>

        {/* 3. SUDUT KIRI BAWAH (BOTTOM-LEFT CORNER) */}
        <div 
          className="absolute z-20"
          style={{ bottom: 0, left: 0, width: `${B}px`, height: `${B}px`, overflow: 'hidden' }}
        >
          <svg width={B} height={B} viewBox={`0 0 ${B} ${B}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={B} height={B} fill={colorDarkForest} />
            <line x1="0" y1={B - 2} x2={B} y2={B - 2} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1={B - 4} x2={B} y2={B - 4} stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="2" y1="0" x2="2" y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="4" y1="0" x2="4" y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="0" y1="2" x2={B} y2="2" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1="4" x2={B} y2="4" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1={B - 2} y1="0" x2={B - 2} y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1={B - 4} y1="0" x2={B - 4} y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />

            <g transform={`translate(${B / 2}, ${B / 2})`}>
              <circle cx="0" cy="0" r="19.5" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
              <circle cx="0" cy="0" r="17" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" strokeDasharray="1.5, 1" />
              <circle cx="0" cy="0" r="14" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="1" />
              <circle cx="0" cy="0" r="10" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" />
              <circle cx="0" cy="0" r="7" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />

              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <line x1="0" y1="-10" x2="0" y2="-16.5" stroke={colorChampagneGold} strokeWidth="0.75" />
                  <circle cx="0" cy="-17" r="1.1" fill={colorChampagneGold} />
                </g>
              ))}

              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" />
              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" transform="rotate(45)" />

              <circle cx="0" cy="0" r="3.2" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.3" fill={colorChampagneGold} />
            </g>
          </svg>
        </div>

        {/* 4. SUDUT KANAN BAWAH (BOTTOM-RIGHT CORNER) */}
        <div 
          className="absolute z-20"
          style={{ bottom: 0, right: 0, width: `${B}px`, height: `${B}px`, overflow: 'hidden' }}
        >
          <svg width={B} height={B} viewBox={`0 0 ${B} ${B}`} xmlns="http://www.w3.org/2000/svg">
            <rect width={B} height={B} fill={colorDarkForest} />
            <line x1="0" y1={B - 2} x2={B} y2={B - 2} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1={B - 4} x2={B} y2={B - 4} stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1={B - 2} y1="0" x2={B - 2} y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1={B - 4} y1="0" x2={B - 4} y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="0" y1="2" x2={B} y2="2" stroke={colorElegantGold} strokeWidth="1" />
            <line x1="0" y1="4" x2={B} y2="4" stroke={colorChampagneGold} strokeWidth="0.5" />
            <line x1="2" y1="0" x2="2" y2={B} stroke={colorElegantGold} strokeWidth="1" />
            <line x1="4" y1="0" x2="4" y2={B} stroke={colorChampagneGold} strokeWidth="0.5" />

            <g transform={`translate(${B / 2}, ${B / 2})`}>
              <circle cx="0" cy="0" r="19.5" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
              <circle cx="0" cy="0" r="17" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" strokeDasharray="1.5, 1" />
              <circle cx="0" cy="0" r="14" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="1" />
              <circle cx="0" cy="0" r="10" fill="none" stroke={colorChampagneGold} strokeWidth="0.75" />
              <circle cx="0" cy="0" r="7" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />

              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle) => (
                <g key={angle} transform={`rotate(${angle})`}>
                  <line x1="0" y1="-10" x2="0" y2="-16.5" stroke={colorChampagneGold} strokeWidth="0.75" />
                  <circle cx="0" cy="-17" r="1.1" fill={colorChampagneGold} />
                </g>
              ))}

              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" />
              <rect x="-4" y="-4" width="8" height="8" fill="none" stroke={colorChampagneGold} strokeWidth="0.9" transform="rotate(45)" />

              <circle cx="0" cy="0" r="3.2" fill={colorIslamicGreen} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.3" fill={colorChampagneGold} />
            </g>
          </svg>
        </div>

        {/* =========================================================================
            4 MEDALLION DIAMOND ARABESQUE TENGAH (CENTER ORNAMENTS)
            Persis di tengah sisi Atas, Bawah, Kiri, dan Kanan
           ========================================================================= */}
        {/* MEDALLION TENGAH ATAS (TOP-CENTER) */}
        <div 
          className="absolute z-20 -translate-x-1/2"
          style={{ top: 0, left: '50%', width: '56px', height: `${B + 6}px` }}
        >
          <svg width="56" height={B + 6} viewBox={`0 0 56 ${B + 6}`} xmlns="http://www.w3.org/2000/svg">
            <path d={`M 0,0 L 56,0 L 46,${B} L 28,${B + 6} L 10,${B} Z`} fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
            <g transform={`translate(28, ${B / 2 + 1})`}>
              <polygon points="0,-16 12,0 0,16 -12,0" fill={colorIslamicGreen} stroke={colorChampagneGold} strokeWidth="1" />
              <polygon points="0,-10 8,0 0,10 -8,0" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="3" fill={colorChampagneGold} />
              <circle cx="0" cy="0" r="1.2" fill={colorDarkForest} />
            </g>
          </svg>
        </div>

        {/* MEDALLION TENGAH BAWAH (BOTTOM-CENTER) */}
        <div 
          className="absolute z-20 -translate-x-1/2"
          style={{ bottom: 0, left: '50%', width: '56px', height: `${B + 6}px` }}
        >
          <svg width="56" height={B + 6} viewBox={`0 0 56 ${B + 6}`} xmlns="http://www.w3.org/2000/svg">
            <path d={`M 10,6 L 28,0 L 46,6 L 56,${B + 6} L 0,${B + 6} Z`} fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
            <g transform={`translate(28, ${B / 2 + 5})`}>
              <polygon points="0,-16 12,0 0,16 -12,0" fill={colorIslamicGreen} stroke={colorChampagneGold} strokeWidth="1" />
              <polygon points="0,-10 8,0 0,10 -8,0" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="3" fill={colorChampagneGold} />
              <circle cx="0" cy="0" r="1.2" fill={colorDarkForest} />
            </g>
          </svg>
        </div>

        {/* MEDALLION TENGAH KIRI (LEFT-CENTER) */}
        <div 
          className="absolute z-20 -translate-y-1/2"
          style={{ left: 0, top: '50%', width: `${B + 6}px`, height: '56px' }}
        >
          <svg width={B + 6} height="56" viewBox={`0 0 ${B + 6} 56`} xmlns="http://www.w3.org/2000/svg">
            <path d={`M 0,0 L ${B},10 L ${B + 6},28 L ${B},46 L 0,56 Z`} fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
            <g transform={`translate(${B / 2 + 1}, 28)`}>
              <polygon points="-16,0 0,-12 16,0 0,12" fill={colorIslamicGreen} stroke={colorChampagneGold} strokeWidth="1" />
              <polygon points="-10,0 0,-8 10,0 0,8" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="3" fill={colorChampagneGold} />
              <circle cx="0" cy="0" r="1.2" fill={colorDarkForest} />
            </g>
          </svg>
        </div>

        {/* MEDALLION TENGAH KANAN (RIGHT-CENTER) */}
        <div 
          className="absolute z-20 -translate-y-1/2"
          style={{ right: 0, top: '50%', width: `${B + 6}px`, height: '56px' }}
        >
          <svg width={B + 6} height="56" viewBox={`0 0 ${B + 6} 56`} xmlns="http://www.w3.org/2000/svg">
            <path d={`M ${B + 6},0 L 6,10 L 0,28 L 6,46 L ${B + 6},56 Z`} fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="1.2" />
            <g transform={`translate(${B / 2 + 5}, 28)`}>
              <polygon points="-16,0 0,-12 16,0 0,12" fill={colorIslamicGreen} stroke={colorChampagneGold} strokeWidth="1" />
              <polygon points="-10,0 0,-8 10,0 0,8" fill={colorDarkForest} stroke={colorElegantGold} strokeWidth="0.8" />
              <circle cx="0" cy="0" r="3" fill={colorChampagneGold} />
              <circle cx="0" cy="0" r="1.2" fill={colorDarkForest} />
            </g>
          </svg>
        </div>

        {/* =========================================================================
            GARIS BATAS GANDA EMAS LUAR & DALAM (DOUBLE GOLD HAILINES)
           ========================================================================= */}
        {/* Garis Emas Paling Luar 1.5px */}
        <div 
          className="absolute"
          style={{ top: '1px', bottom: '1px', left: '1px', right: '1px', border: `1.5px solid ${colorElegantGold}`, pointerEvents: 'none', boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        />
        {/* Garis Emas Kedua Luar 0.75px */}
        <div 
          className="absolute"
          style={{ top: '3.5px', bottom: '3.5px', left: '3.5px', right: '3.5px', border: `0.75px solid ${colorChampagneGold}`, pointerEvents: 'none', boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        />

        {/* Garis Emas Dalam 1.5px */}
        <div 
          className="absolute"
          style={{ top: `${B}px`, bottom: `${B}px`, left: `${B}px`, right: `${B}px`, border: `1.5px solid ${colorElegantGold}`, pointerEvents: 'none', boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        />
        {/* Garis Hijau Dalam Sekunder 0.75px */}
        <div 
          className="absolute"
          style={{ top: `${B + 3}px`, bottom: `${B + 3}px`, left: `${B + 3}px`, right: `${B + 3}px`, border: `0.75px solid ${colorIslamicGreen}`, pointerEvents: 'none', boxSizing: 'border-box', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        />
      </div>

      {/* =========================================================================
          AREA KONTEN RAPORT (DI DALAM BINGKAI BERSIH DENGAN ZONA AMAN)
          ========================================================================= */}
      <div
        className="w-full h-full box-border relative flex flex-col justify-between z-20"
        style={{
          padding: `${B + 4 + paddingTop}px ${B + 4 + paddingRight}px ${B + 4 + paddingBottom}px ${B + 4 + paddingLeft}px`,
          boxSizing: 'border-box',
          backgroundColor: 'transparent',
        }}
      >
        {/* =========================================================================
            EXCEL-STYLE 4-DIRECTIONAL BORDER RESIZE HANDLERS & BADGES (ATAS, BAWAH, KIRI, KANAN)
           ========================================================================= */}
        {isEditingMode && !isPrintOnly && onUpdateDesignConfig && designConfig && (
          <>
            {/* 1. ATAS: Drag Line & Quick Adjuster Badge */}
            <div
              data-editing-control="true"
              className="no-print absolute top-0 left-0 right-0 h-3 -mt-1.5 cursor-ns-resize z-40 flex items-center justify-center group/edge-top"
              onMouseDown={(e) => handleStartDrag('top', e)}
              title="Geser batas atas bingkai (Atas/Bawah) seperti Excel"
            >
              <div className="w-full h-[2px] bg-transparent group-hover/edge-top:bg-emerald-500/80 transition-colors" />
            </div>

            <div 
              data-editing-control="true"
              className="no-print absolute top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/frame:opacity-100 hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-stone-900/95 text-white text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-emerald-500/50 z-50 select-none"
            >
              <span className="text-emerald-300 font-bold">⬍ Padding Atas: {paddingTop}px</span>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingTop: Math.max(0, paddingTop - 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Kurangi Padding Atas (-2px)"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingTop: Math.min(60, paddingTop + 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Tambah Padding Atas (+2px)"
              >
                +
              </button>
            </div>

            {/* 2. BAWAH: Drag Line & Quick Adjuster Badge */}
            <div
              data-editing-control="true"
              className="no-print absolute bottom-0 left-0 right-0 h-3 -mb-1.5 cursor-ns-resize z-40 flex items-center justify-center group/edge-bottom"
              onMouseDown={(e) => handleStartDrag('bottom', e)}
              title="Geser batas bawah bingkai (Atas/Bawah) seperti Excel"
            >
              <div className="w-full h-[2px] bg-transparent group-hover/edge-bottom:bg-emerald-500/80 transition-colors" />
            </div>

            <div 
              data-editing-control="true"
              className="no-print absolute bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/frame:opacity-100 hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-stone-900/95 text-white text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-emerald-500/50 z-50 select-none"
            >
              <span className="text-emerald-300 font-bold">⬍ Padding Bawah: {paddingBottom}px</span>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingBottom: Math.max(0, paddingBottom - 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Kurangi Padding Bawah (-2px)"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingBottom: Math.min(60, paddingBottom + 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Tambah Padding Bawah (+2px)"
              >
                +
              </button>
            </div>

            {/* 3. KIRI: Drag Line & Quick Adjuster Badge */}
            <div
              data-editing-control="true"
              className="no-print absolute top-0 bottom-0 left-0 w-3 -ml-1.5 cursor-ew-resize z-40 flex items-center justify-center group/edge-left"
              onMouseDown={(e) => handleStartDrag('left', e)}
              title="Geser batas kiri bingkai (Kiri/Kanan) seperti Excel"
            >
              <div className="h-full w-[2px] bg-transparent group-hover/edge-left:bg-emerald-500/80 transition-colors" />
            </div>

            <div 
              data-editing-control="true"
              className="no-print absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/frame:opacity-100 hover:opacity-100 transition-opacity flex flex-col items-center gap-1 bg-stone-900/95 text-white text-[9px] px-1.5 py-2 rounded-xl shadow-lg border border-emerald-500/50 z-50 select-none"
            >
              <span className="text-emerald-300 font-bold [writing-mode:vertical-lr] rotate-180">Kiri {paddingLeft}px</span>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingLeft: Math.max(0, paddingLeft - 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Kurangi Padding Kiri (-2px)"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingLeft: Math.min(60, paddingLeft + 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Tambah Padding Kiri (+2px)"
              >
                +
              </button>
            </div>

            {/* 4. KANAN: Drag Line & Quick Adjuster Badge */}
            <div
              data-editing-control="true"
              className="no-print absolute top-0 bottom-0 right-0 w-3 -mr-1.5 cursor-ew-resize z-40 flex items-center justify-center group/edge-right"
              onMouseDown={(e) => handleStartDrag('right', e)}
              title="Geser batas kanan bingkai (Kiri/Kanan) seperti Excel"
            >
              <div className="h-full w-[2px] bg-transparent group-hover/edge-right:bg-emerald-500/80 transition-colors" />
            </div>

            <div 
              data-editing-control="true"
              className="no-print absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover/frame:opacity-100 hover:opacity-100 transition-opacity flex flex-col items-center gap-1 bg-stone-900/95 text-white text-[9px] px-1.5 py-2 rounded-xl shadow-lg border border-emerald-500/50 z-50 select-none"
            >
              <span className="text-emerald-300 font-bold [writing-mode:vertical-lr] rotate-180">Kanan {paddingRight}px</span>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingRight: Math.max(0, paddingRight - 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Kurangi Padding Kanan (-2px)"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onUpdateDesignConfig({ ...designConfig, framePaddingRight: Math.min(60, paddingRight + 2) })}
                className="w-4 h-4 rounded bg-stone-800 hover:bg-emerald-600 flex items-center justify-center font-bold text-xs"
                title="Tambah Padding Kanan (+2px)"
              >
                +
              </button>
            </div>
          </>
        )}

        {children}
      </div>
    </div>
  );
};
