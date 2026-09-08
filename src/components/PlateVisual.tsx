import React from 'react';

interface PlateVisualProps {
  plate: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badge?: string;
  selected?: boolean;
  isDefault?: boolean;
}

export default function PlateVisual({
  plate,
  size = 'md',
  badge,
  selected = false,
  isDefault = false,
}: PlateVisualProps) {
  const sizeClasses = {
    sm: 'h-10 px-2 text-sm',
    md: 'h-14 px-3 text-lg md:text-xl',
    lg: 'h-16 px-4 text-xl md:text-2xl',
    xl: 'h-20 px-5 text-2xl md:text-3xl tracking-widest',
  };

  const trBandSize = {
    sm: 'w-6 text-[9px]',
    md: 'w-8 text-[11px]',
    lg: 'w-10 text-[13px]',
    xl: 'w-12 text-[14px]',
  };

  const cleanPlate = plate || '34 --- 00';

  return (
    <div className="relative inline-flex flex-col items-center">
      {badge && (
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className={`text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm ${
              selected
                ? 'bg-talpa-gold-500 text-white'
                : 'bg-talpa-sand-200 text-talpa-gold-700'
            }`}
          >
            {badge}
          </span>
          {isDefault && (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
              Varsayılan
            </span>
          )}
        </div>
      )}

      {/* Realistic Turkish Plate Container */}
      <div
        className={`relative flex items-center border-[2.5px] rounded-lg font-mono font-extrabold select-none transition-all duration-300 shadow-plate ${
          sizeClasses[size]
        } ${
          selected
            ? 'bg-white border-talpa-gold-500 ring-4 ring-talpa-gold-300/50 shadow-talpa-glow scale-[1.03] opacity-100'
            : 'bg-slate-100/90 border-slate-400 opacity-60 grayscale-[0.2]'
        }`}
        style={{ minWidth: size === 'xl' ? '310px' : size === 'lg' ? '260px' : '200px' }}
      >
        {/* Left TR Blue Band */}
        <div
          className={`absolute left-0 top-0 bottom-0 bg-[#003399] rounded-l-[4.5px] flex flex-col items-center justify-between py-1 text-white font-sans font-bold ${
            trBandSize[size]
          }`}
        >
          <div className="text-[9px] leading-none opacity-90">★</div>
          <span className="leading-none tracking-tighter">TR</span>
        </div>

        {/* Embossed Plate Number */}
        <div
          className={`flex-1 flex items-center justify-center font-bold text-slate-950 ${
            size === 'xl' ? 'pl-12' : size === 'lg' ? 'pl-10' : size === 'md' ? 'pl-8' : 'pl-6'
          }`}
          style={{ letterSpacing: '0.08em' }}
        >
          {cleanPlate}
        </div>

        {/* Embossed Corner Screws */}
        <div className="absolute right-1.5 top-1.5 w-1 h-1 rounded-full bg-slate-400"></div>
        <div className="absolute right-1.5 bottom-1.5 w-1 h-1 rounded-full bg-slate-400"></div>
      </div>
    </div>
  );
}