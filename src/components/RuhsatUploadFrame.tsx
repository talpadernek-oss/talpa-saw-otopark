import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, X, CheckCircle2, Image as ImageIcon } from 'lucide-react';

interface RuhsatUploadFrameProps {
  value?: string;
  onChange: (base64: string) => void;
  label?: string;
}

export default function RuhsatUploadFrame({ value, onChange, label = 'Araç Ruhsat Görseli' }: RuhsatUploadFrameProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir görsel dosyası (JPG, PNG vb.) seçiniz.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-talpa-gold-600" />
          <span>{label}</span>
          <span className="text-red-500">*</span>
        </label>
        <span className="text-[11px] text-slate-500 font-medium">Yatay Dikdörtgen Ruhsat Çerçevesi</span>
      </div>

      {/* Rectangular Ruhsat Upload Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !value && fileInputRef.current?.click()}
        className={`relative aspect-[16/10] w-full rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center p-4 cursor-pointer ${
          value
            ? 'border-emerald-500 bg-emerald-50/20'
            : dragOver
            ? 'border-talpa-navy-700 bg-talpa-navy-50 scale-[1.01]'
            : 'border-slate-300 bg-slate-50/70 hover:border-talpa-navy-600 hover:bg-slate-100/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          <div className="relative w-full h-full group">
            <img
              src={value}
              alt="Ruhsat Görseli"
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg backdrop-blur-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-100 shadow-md"
              >
                Görseli Değiştir
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute bottom-2 left-2 bg-emerald-700/90 backdrop-blur-md text-white text-[11px] px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5 shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ruhsat Görseli Yüklendi</span>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 p-2">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs text-talpa-navy-800 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6 text-talpa-gold-600 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Ruhsat görselinizi buraya sürükleyin veya dosya seçin
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                PNG, JPG, WEBP formatlarında araç ruhsatı ön yüzünü yükleyebilirsiniz.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
