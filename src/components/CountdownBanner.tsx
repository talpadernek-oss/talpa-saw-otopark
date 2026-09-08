'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatTurkishDate } from '@/lib/tckn';

interface CountdownBannerProps {
  deadline?: string;
}

export default function CountdownBanner({ deadline }: CountdownBannerProps) {
  const [targetDate, setTargetDate] = useState<string>(deadline || '2026-09-15T23:59:59+03:00');
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!deadline) {
      fetch('/api/admin/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.data && data.data.deadline) {
            setTargetDate(data.data.deadline);
          }
        })
        .catch(() => {});
    } else {
      setTargetDate(deadline);
    }
  }, [deadline]);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const update = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="bg-gradient-to-r from-talpa-gold-100 via-talpa-sand-100 to-talpa-gold-50 border-y border-talpa-gold-300/60 py-2.5 px-4 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-talpa-navy-900">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-talpa-gold-600"></span>
          </span>
          <span className="font-semibold text-talpa-navy-950">Önemli Hatırlatma:</span>
          <span className="text-talpa-navy-700 hidden md:inline">
            {formatTurkishDate(targetDate)} tarihine kadar işlem yapmayan üyelerimizin 1. Plakası otomatik atanacaktır.
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-talpa-gold-700 bg-white/90 px-3 py-1 rounded-lg border border-talpa-gold-300 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-talpa-gold-600 mr-1" />
          <span className="font-bold text-talpa-navy-900">{timeLeft.days}</span> gün
          <span className="font-bold text-talpa-navy-900">{timeLeft.hours}</span> sa
          <span className="font-bold text-talpa-navy-900">{timeLeft.minutes}</span> dk
          <span className="font-bold text-talpa-navy-900">{timeLeft.seconds}</span> sn
        </div>
      </div>
    </div>
  );
}