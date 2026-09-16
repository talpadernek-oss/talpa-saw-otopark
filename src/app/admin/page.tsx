'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Send,
  Eye,
  FileSpreadsheet,
  Settings,
  RefreshCw,
  Lock,
  ArrowRight,
  FileText,
  CreditCard,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { ApplicationRecord, AdminStats, EmailSettings } from '@/types';
import { formatTurkishDate } from '@/lib/tckn';
import { getPaymentSummary } from '@/lib/payment';

export default function AdminPage() {
  // Login auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active tab state
  const [activeTab, setActiveTab] = useState<'applications' | 'emailSettings'>('applications');

  // Applications & Stats state
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [persistentStorage, setPersistentStorage] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Detail Modal state
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [forwardEmailTo, setForwardEmailTo] = useState('');
  const [forwarding, setForwarding] = useState(false);
  const [forwardMsg, setForwardMsg] = useState({ text: '', isError: false });

  // Revealed card details (kabin) for the selected application
  const [cardDetails, setCardDetails] = useState<{ cardNumberFormatted: string; cardholderName: string; expiryMonth: string; expiryYear: string } | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState('');

  // Email Settings state
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ text: '', isError: false });
  const [testEmailAddr, setTestEmailAddr] = useState('');
  const [sendingTestMail, setSendingTestMail] = useState(false);

  // The admin secret lives in sessionStorage for this tab only and is sent as
  // x-admin-key on every /api/admin request; the server validates it against
  // ADMIN_SECRET_KEY. Nothing is stored across browser sessions.
  const ADMIN_KEY_STORAGE = 'talpa_admin_key';
  const getAdminKey = () => sessionStorage.getItem(ADMIN_KEY_STORAGE) || '';

  const logout = (message = '') => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    localStorage.removeItem('talpa_admin_auth'); // legacy flag from the old client-side login
    setIsAuthenticated(false);
    setPassword('');
    setApplications([]);
    setStats(null);
    setSelectedApp(null);
    setLoginError(message);
  };

  const adminFetch = async (input: string, init: RequestInit = {}) => {
    const res = await fetch(input, {
      ...init,
      cache: 'no-store',
      headers: { ...(init.headers || {}), 'x-admin-key': getAdminKey() }
    });
    if (res.status === 401) {
      logout('Oturum doğrulanamadı. Lütfen yeniden giriş yapınız.');
      throw new Error('unauthorized');
    }
    return res;
  };

  // Restore the session for this tab (key is re-validated by the first request)
  useEffect(() => {
    if (getAdminKey()) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      localStorage.removeItem('talpa_admin_auth');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setLoginError(json.error || 'Geçersiz yönetici şifresi.');
        return;
      }
      sessionStorage.setItem(ADMIN_KEY_STORAGE, password);
      setIsAuthenticated(true);
      fetchData();
    } catch {
      setLoginError('Sunucuya ulaşılamadı. Lütfen tekrar deneyiniz.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/applications?refresh=1');
      const json = await res.json();
      if (json.success) {
        setApplications(json.data.applications);
        setStats(json.data.stats);
        setPersistentStorage(json.data.persistentStorage ?? null);
      }

      const settingsRes = await adminFetch('/api/admin/email-settings');
      const settingsJson = await settingsRes.json();
      if (settingsJson.success) {
        setEmailSettings(settingsJson.data);
        if (settingsJson.data.adminNotificationEmail) {
          setTestEmailAddr(settingsJson.data.adminNotificationEmail);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await adminFetch('/api/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setApplications(prev =>
          prev.map(a => (a.id === id ? { ...a, status: newStatus } : a))
        );
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (e) {
      alert('Statü güncellenemedi.');
    }
  };

  const handleRevealCard = async () => {
    if (!selectedApp) return;
    setCardLoading(true);
    setCardError('');
    try {
      const res = await adminFetch('/api/admin/payment-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedApp.id })
      });
      const json = await res.json();
      if (json.success) {
        setCardDetails(json.data);
      } else {
        setCardError(json.error || 'Kart bilgisi alınamadı.');
      }
    } catch (e) {
      setCardError('Bağlantı hatası.');
    } finally {
      setCardLoading(false);
    }
  };

  const handleForwardEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !forwardEmailTo) return;

    setForwarding(true);
    setForwardMsg({ text: '', isError: false });

    try {
      // The server composes the subscription-request email from the template
      // and attaches the ruhsat image.
      const res = await adminFetch('/api/admin/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forward',
          id: selectedApp.id,
          forwardTo: forwardEmailTo
        })
      });

      const json = await res.json();
      setForwarding(false);

      if (json.success) {
        setForwardMsg({ text: json.message, isError: false });
        setForwardEmailTo('');
      } else {
        setForwardMsg({ text: json.error || 'Gönderilemedi.', isError: true });
      }
    } catch (e) {
      setForwarding(false);
      setForwardMsg({ text: 'Bağlantı hatası.', isError: true });
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSettings) return;

    setSavingSettings(true);
    setSettingsMsg({ text: '', isError: false });

    try {
      const res = await adminFetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminNotificationEmail: emailSettings.adminNotificationEmail,
          applicantConfirmationTemplate: emailSettings.applicantConfirmationTemplate,
          adminNotificationTemplate: emailSettings.adminNotificationTemplate
        })
      });

      const json = await res.json();
      setSavingSettings(false);

      if (json.success) {
        setSettingsMsg({ text: 'E-posta ayarları ve şablonlar başarıyla kaydedildi.', isError: false });
      } else {
        setSettingsMsg({ text: json.error || 'Kaydedilemedi.', isError: true });
      }
    } catch (e) {
      setSavingSettings(false);
      setSettingsMsg({ text: 'Sunucu hatası.', isError: true });
    }
  };

  const handleResetTemplates = async () => {
    if (!confirm('E-posta şablonları varsayılan metinlere döndürülecek. Devam edilsin mi?')) return;
    setSavingSettings(true);
    setSettingsMsg({ text: '', isError: false });
    try {
      const res = await adminFetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-templates' })
      });
      const json = await res.json();
      if (json.success) {
        setEmailSettings(json.data);
        setSettingsMsg({ text: json.message, isError: false });
      } else {
        setSettingsMsg({ text: json.error || 'Şablonlar sıfırlanamadı.', isError: true });
      }
    } catch {
      setSettingsMsg({ text: 'Sunucu hatası.', isError: true });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendTestMail = async () => {    if (!testEmailAddr || !testEmailAddr.includes('@')) {
      alert('Lütfen test için geçerli e-posta adresi giriniz.');
      return;
    }

    setSendingTestMail(true);
    try {
      const res = await adminFetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          testEmailAddress: testEmailAddr
        })
      });

      const json = await res.json();
      setSendingTestMail(false);
      alert(json.message || json.error);
    } catch (e) {
      setSendingTestMail(false);
      alert('Test maili gönderilirken hata oluştu.');
    }
  };

  // Filtering
  const filteredApps = applications.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.tc.includes(searchTerm) ||
      app.referenceCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || app.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Login view if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-slate-100">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-talpa-navy-900 text-talpa-gold-400 flex items-center justify-center mx-auto shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-talpa-navy-950">
              Yönetici Paneli Girişi
            </h1>
            <p className="text-xs text-slate-500">
              SAW Otopark Ek Kontenjan Yönetim Paneli
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                Yönetici Şifresi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Yönetici şifreniz"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-talpa-gold-400"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-12 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md"
            >
              <span>Giriş Yap</span>
              <ArrowRight className="w-4 h-4 text-talpa-gold-400" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 pb-16">
      {/* Top Header */}
      <div className="bg-talpa-navy-950 text-white border-b border-slate-800 py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-talpa-gold-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Yönetim Paneli</span>
            </div>
            <h1 className="font-serif text-2xl font-bold mt-1">SAW Otopark Başvuru Yönetimi</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-xs font-medium rounded-xl border border-white/10 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>

            <button
              onClick={() => logout()}
              className="px-3.5 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium rounded-xl border border-red-500/30 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 mt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'border-talpa-gold-500 text-talpa-navy-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Başvurular ({applications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('emailSettings')}
            className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'emailSettings'
                ? 'border-talpa-gold-500 text-talpa-navy-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>E-posta Bildirim ve Şablon Ayarları</span>
          </button>
        </div>

        {/* TAB 1: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {persistentStorage === false && process.env.NODE_ENV === 'production' && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-2xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Kalıcı depo yapılandırılmamış.</strong> Vercel Blob (BLOB_READ_WRITE_TOKEN) tanımlı olmadığı için başvurular yalnızca geçici bellekte tutuluyor ve sunucu yeniden başladığında kaybolabilir. Vercel panelinden bir Blob store bağlayınız.
                </span>
              </div>
            )}
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Toplam</span>
                  <span className="text-2xl font-bold text-slate-900">{stats.totalApplications}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Kokpit</span>
                  <span className="text-2xl font-bold text-talpa-navy-900">{stats.kokpitCount}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Kabin</span>
                  <span className="text-2xl font-bold text-slate-700">{stats.kabinCount}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-amber-600 block">Bekleyen</span>
                  <span className="text-2xl font-bold text-amber-600">{stats.pendingCount}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-emerald-600 block">Onaylı</span>
                  <span className="text-2xl font-bold text-emerald-600">{stats.approvedCount}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold uppercase text-red-600 block">Reddedilen</span>
                  <span className="text-2xl font-bold text-red-600">{stats.rejectedCount}</span>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="İsim, plaka, TC veya Ref No ile ara..."
                  className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-talpa-gold-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="all">Tüm Görevler</option>
                  <option value="kokpit">Kokpit (Pilot)</option>
                  <option value="kabin">Kabin Görevlisi</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="all">Tüm Statüler</option>
                  <option value="pending">Bekleyenler</option>
                  <option value="approved">Onaylananlar</option>
                  <option value="rejected">Reddedilenler</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-3 px-4">Ref Code</th>
                      <th className="py-3 px-4">Tarih</th>
                      <th className="py-3 px-4">Görev</th>
                      <th className="py-3 px-4">Ad Soyad / TCKN</th>
                      <th className="py-3 px-4">İletişim</th>
                      <th className="py-3 px-4">Plaka</th>
                      <th className="py-3 px-4">Statü</th>
                      <th className="py-3 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredApps.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Kriterlere uygun başvuru bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {app.referenceCode}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {formatTurkishDate(app.createdAt)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded font-bold text-[10px] uppercase ${
                                app.role === 'kokpit'
                                  ? 'bg-talpa-navy-100 text-talpa-navy-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {app.role === 'kokpit' ? 'Kokpit' : 'Kabin'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{app.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{app.tc}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-800">{app.email}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{app.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {app.plate}
                          </td>
                          <td className="py-3.5 px-4">
                            {app.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Onaylandı
                              </span>
                            )}
                            {app.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                <XCircle className="w-3 h-3" /> Reddedildi
                              </span>
                            )}
                            {app.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                <Clock className="w-3 h-3" /> Bekliyor
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => { setSelectedApp(app); setCardDetails(null); setCardError(''); }}
                              className="px-3 py-1.5 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-talpa-gold-400" />
                              <span>İncele</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL SETTINGS & TEMPLATES */}
        {activeTab === 'emailSettings' && emailSettings && (
          <form onSubmit={handleSaveEmailSettings} className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl font-bold text-talpa-navy-950">
                  E-posta Bildirim ve Şablon Ayarları
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  SMTP Sunucusu: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-talpa-navy-900 font-bold">{emailSettings.smtpHost}:{emailSettings.smtpPort} ({emailSettings.smtpUser})</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetTemplates}
                  disabled={savingSettings}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Varsayılan Şablonlara Dön</span>
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2.5 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-talpa-gold-400" />
                  <span>Ayarları Kaydet</span>
                </button>
              </div>
            </div>

            {settingsMsg.text && (
              <div className={`p-4 rounded-xl text-xs font-semibold ${settingsMsg.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                {settingsMsg.text}
              </div>
            )}

            {/* General Recipient Email Input */}
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-talpa-gold-600" />
                <span>Ek Bildirim Alıcısı (Yönetici E-posta Adresi)</span>
              </h3>

              <div>
                <input
                  type="email"
                  value={emailSettings.adminNotificationEmail}
                  onChange={(e) => setEmailSettings({ ...emailSettings, adminNotificationEmail: e.target.value })}
                  placeholder="ör. talpa@talpa.org"
                  className="w-full h-11 px-4 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-talpa-gold-400"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Her yeni başvuru, belge görselleri ekli olarak her zaman <strong>talpa@talpa.org</strong> adresine gönderilir. Buraya farklı bir adres yazarsanız bildirim o adrese de iletilir.
                </p>
              </div>

              {/* Test Email Row */}
              <div className="pt-3 border-t border-slate-200 flex items-center gap-3">
                <input
                  type="email"
                  value={testEmailAddr}
                  onChange={(e) => setTestEmailAddr(e.target.value)}
                  placeholder="Test e-posta adresi"
                  className="h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 flex-1"
                />
                <button
                  type="button"
                  onClick={handleSendTestMail}
                  disabled={sendingTestMail}
                  className="h-10 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-talpa-gold-400" />
                  <span>Test Maili Gönder</span>
                </button>
              </div>
            </div>

            {/* Applicant Confirmation Template */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                1. Başvurana Gönderilecek Onay E-postası Şablonu
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-posta Konusu</label>
                <input
                  type="text"
                  value={emailSettings.applicantConfirmationTemplate.subject}
                  onChange={(e) => setEmailSettings({
                    ...emailSettings,
                    applicantConfirmationTemplate: {
                      ...emailSettings.applicantConfirmationTemplate,
                      subject: e.target.value
                    }
                  })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-posta Metni / Şablonu</label>
                <textarea
                  rows={8}
                  value={emailSettings.applicantConfirmationTemplate.body}
                  onChange={(e) => setEmailSettings({
                    ...emailSettings,
                    applicantConfirmationTemplate: {
                      ...emailSettings.applicantConfirmationTemplate,
                      body: e.target.value
                    }
                  })}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono leading-relaxed text-slate-900"
                />
              </div>
            </div>

            {/* Admin Notification Template */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                2. Abonelik Kaydı Talebi Şablonu (talpa@talpa.org bildirimi ve otoparka &quot;Mail İlet&quot;)
              </h3>
              <p className="text-[11px] text-slate-500">
                Kullanılabilir alanlar: {'{{NAME}}'}, {'{{PLATE}}'}, {'{{REF_CODE}}'}, {'{{TC}}'}, {'{{EMAIL}}'}, {'{{PHONE}}'}, {'{{ROLE_TITLE}}'}, {'{{START_DATE}}'}, {'{{MONTHLY_FEE}}'}, {'{{PAYMENT_INFO}}'}, {'{{TALPA_STATUS}}'}, {'{{DATE}}'}. Ruhsat görseli otomatik eklenir.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-posta Konusu</label>
                <input
                  type="text"
                  value={emailSettings.adminNotificationTemplate.subject}
                  onChange={(e) => setEmailSettings({
                    ...emailSettings,
                    adminNotificationTemplate: {
                      ...emailSettings.adminNotificationTemplate,
                      subject: e.target.value
                    }
                  })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-posta Metni / Şablonu</label>
                <textarea
                  rows={8}
                  value={emailSettings.adminNotificationTemplate.body}
                  onChange={(e) => setEmailSettings({
                    ...emailSettings,
                    adminNotificationTemplate: {
                      ...emailSettings.adminNotificationTemplate,
                      body: e.target.value
                    }
                  })}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono leading-relaxed text-slate-900"
                />
              </div>
            </div>
          </form>
        )}
      </div>

      {/* APPLICATION DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-talpa-navy-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-talpa-gold-400">
                  Başvuru Detayı • {selectedApp.referenceCode}
                </div>
                <h3 className="font-serif text-lg font-bold">{selectedApp.name}</h3>
              </div>
              <button
                onClick={() => { setSelectedApp(null); setCardDetails(null); setCardError(''); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Status & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">Mevcut Statü:</span>
                  <span className="font-bold text-sm uppercase text-talpa-navy-900">
                    {selectedApp.status === 'approved' ? 'ONAYLANDI' : selectedApp.status === 'rejected' ? 'REDDEDİLDİ' : 'BEKLİYOR'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedApp.id, 'approved')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Onayla</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedApp.id, 'rejected')}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reddet</span>
                  </button>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Görev Unvanı</span>
                  <strong className="text-slate-900 font-bold uppercase">
                    {selectedApp.role === 'kokpit' ? 'Kokpit Görevlisi (Pilot)' : 'Kabin Görevlisi'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">T.C. Kimlik No</span>
                  <strong className="text-slate-900 font-mono font-bold">{selectedApp.tc}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Araç Plakası</span>
                  <strong className="text-slate-900 font-mono font-bold text-sm bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    {selectedApp.plate}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">E-posta</span>
                  <strong className="text-slate-900 font-bold">{selectedApp.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Telefon</span>
                  <strong className="text-slate-900 font-mono font-bold">{selectedApp.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">TALPA Üyeliği</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedApp.isTalpaMember ? 'Doğrulanmış Üye' : 'Üye Değil'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Abonelik Başlangıcı</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedApp.startDateOption === 'next_month' ? 'Önümüzdeki Ay Başında' : 'Hemen Başlat'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Aylık Ücret</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedApp.monthlyFee.toLocaleString('tr-TR')} TL
                  </strong>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block font-semibold">Ödeme Bilgisi</span>
                  <strong className="text-slate-900 font-mono font-bold">
                    {getPaymentSummary(selectedApp)}
                  </strong>
                </div>
              </div>

              {/* Card details (kabin only) - revealed on demand via admin-key protected endpoint */}
              {selectedApp.role === 'kabin' && (
                <div className="space-y-3 border border-slate-200 p-4 rounded-2xl bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <CreditCard className="w-4 h-4 text-talpa-navy-700" />
                      <span>Kart Bilgileri</span>
                    </span>
                    {cardDetails ? (
                      <button
                        type="button"
                        onClick={() => setCardDetails(null)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold"
                      >
                        Gizle
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRevealCard}
                        disabled={cardLoading}
                        className="px-3 py-1.5 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {cardLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-talpa-gold-400" />}
                        <span>Kart Numarasını Göster</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-slate-400 block font-semibold">Kart Numarası</span>
                      <strong className="text-slate-900 font-mono font-bold text-sm tracking-wider">
                        {cardDetails ? cardDetails.cardNumberFormatted : `**** **** **** ${selectedApp.paymentCardLast4 || '----'}`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Kart Sahibi</span>
                      <strong className="text-slate-900 font-bold">{selectedApp.paymentCardholderName || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Son Kullanma</span>
                      <strong className="text-slate-900 font-mono font-bold">
                        {selectedApp.paymentExpiryMonth && selectedApp.paymentExpiryYear ? `${selectedApp.paymentExpiryMonth}/${selectedApp.paymentExpiryYear}` : '-'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">CVV</span>
                      <strong className="text-slate-500 font-bold">Saklanmaz</strong>
                    </div>
                  </div>

                  {cardError && (
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{cardError}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Kart numarası şifreli saklanır ve yalnızca yönetici şifresi doğrulanarak görüntülenir. CVV, PCI DSS gereği hiçbir koşulda kaydedilmez.
                  </p>
                </div>
              )}

              {/* Uploaded Documents */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Yüklenen Belgeler
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ruhsat Image View */}
                  <div className="space-y-2 border border-slate-200 p-3 rounded-2xl bg-white">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <FileText className="w-4 h-4 text-talpa-gold-600" />
                      <span>Araç Ruhsat Görseli</span>
                    </span>
                    <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                      {selectedApp.ruhsatImage ? (
                        <img src={selectedApp.ruhsatImage} alt="Ruhsat" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-slate-400">Görsel yüklenmedi</span>
                      )}
                    </div>
                  </div>

                  {/* Apron Card Image View */}
                  <div className="space-y-2 border border-slate-200 p-3 rounded-2xl bg-white">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <CreditCard className="w-4 h-4 text-talpa-navy-700" />
                      <span>Apron Kart Görseli</span>
                    </span>
                    <div className="aspect-[16/10] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center">
                      {selectedApp.apronCardImage ? (
                        <img src={selectedApp.apronCardImage} alt="Apron Kartı" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-slate-400">Görsel yüklenmedi</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Forward Email Section */}
              <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-talpa-navy-900" />
                  <span>Otopark İşletmesine Abonelik Kaydı Talebi Gönder</span>
                </h4>

                <form onSubmit={handleForwardEmail} className="flex gap-2">
                  <input
                    type="email"
                    value={forwardEmailTo}
                    onChange={(e) => setForwardEmailTo(e.target.value)}
                    placeholder="Otopark yetkilisinin e-posta adresi..."
                    className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={forwarding}
                    className="h-10 px-4 bg-talpa-navy-900 hover:bg-talpa-navy-800 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-talpa-gold-400" />
                    <span>Mail İlet</span>
                  </button>
                </form>
                <p className="text-[11px] text-slate-500">
                  E-posta, ayarlardaki &quot;Abonelik Kaydı Talebi&quot; şablonuyla ve ruhsat görseli ekli olarak gönderilir.
                </p>

                {forwardMsg.text && (
                  <div className={`text-xs p-2 rounded-lg font-medium ${forwardMsg.isError ? 'text-red-700 bg-red-50' : 'text-emerald-800 bg-emerald-50'}`}>
                    {forwardMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}