import React from 'react';

interface TRPlateVisualProps {
  plateText: string;
  className?: string;
}

export default function TRPlateVisual({ plateText, className = '' }: TRPlateVisualProps) {
  const displayPlate = plateText ? plateText.toUpperCase() : '34 ___ ____';

  return (
    <div className={`relative flex items-stretch border-4 border-slate-950 rounded-xl overflow-hidden bg-white shadow-lg h-16 sm:h-20 select-none ${className}`}>
      {/* Blue TR Band on Left */}
      <div className="w-12 sm:w-16 bg-blue-700 flex flex-col items-center justify-between py-1.5 sm:py-2 text-white font-bold tracking-tighter shrink-0 border-r border-slate-800">
        {/* Star & Crescent icon representation */}
        <div className="text-[10px] sm:text-xs leading-none opacity-90">
          ★
        </div>
        
        {/* TR Text */}
        <div className="font-mono text-base sm:text-xl font-extrabold tracking-normal">
          TR
        </div>
      </div>

      {/* Main License Plate Text Area */}
      <div className="flex-1 flex items-center justify-center px-4 bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <span className="font-mono font-black text-2xl sm:text-4xl text-slate-950 tracking-wider uppercase drop-shadow-sm font-semibold">
          {displayPlate}
        </span>
      </div>
    </div>
  );
}
