import React from 'react';
import Link from 'next/link';
import { Plane, Shield, ShieldAlert } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-talpa-navy-950 border-b border-talpa-gold-500/20 text-white sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-talpa-navy-800 to-talpa-navy-900 border border-talpa-gold-400/40 p-2 flex items-center justify-center shadow-md group-hover:border-talpa-gold-400 transition-all">
            <Plane className="w-7 h-7 text-talpa-gold-400 -rotate-45" />
          </div>
          <div>
            <div className="font-serif text-lg font-bold tracking-tight text-white flex items-center gap-2">
              TALPA
              <span className="text-[10px] bg-talpa-gold-500/20 border border-talpa-gold-400/40 text-talpa-gold-300 font-sans font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">
                SAW Otopark
              </span>
            </div>
            <p className="text-xs text-talpa-sand-300 font-sans tracking-wide">
              Sabiha Gökçen Ek Kontenjan Başvuru Portalı
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-talpa-gold-300 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-colors font-medium"
          >
            <Shield className="w-3.5 h-3.5 text-talpa-gold-400" />
            <span>Yönetici Girişi</span>
          </Link>
        </div>
      </div>
    </header>
  );
}