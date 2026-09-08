import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-talpa-navy-950 text-slate-400 border-t border-talpa-navy-800 text-xs py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-talpa-gold-400" />
          <span>© 2026 Türkiye Havayolu Pilotları Derneği (TALPA) - Tüm Hakları Saklıdır.</span>
        </div>

        <div className="flex items-center gap-6 text-slate-300">
          <a
            href="https://www.talpa.org/uyelik/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-talpa-gold-400 flex items-center gap-1 transition-colors"
          >
            <span>TALPA Üyelik Formu</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://www.talpa.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-talpa-gold-400 flex items-center gap-1 transition-colors"
          >
            <span>Resmi Web Sitesi</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}