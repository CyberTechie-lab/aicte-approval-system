'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { USER_ACCOUNTS } from '@/data/users';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Sparkles,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { UserAccount } from '@/types';

export function LoginPage() {
  const { login, loginWithCredentials } = useDashboard();

  const [activeTab, setActiveTab] = useState<'CREDENTIALS' | 'PERSONAS'>('PERSONAS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpSentEmail, setOtpSentEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your registered AICTE official email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithCredentials(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Invalid login credentials or rate limit reached.');
    }
  };

  const handleSelectPersona = async (user: UserAccount) => {
    setError('');
    setIsSubmitting(true);
    const result = await login(user);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message || 'Authentication error.');
    }
  };

  const handleSimulateOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSentEmail.trim()) return;
    setOtpSuccess(true);
    setTimeout(async () => {
      const user = USER_ACCOUNTS.find(u => u.email.toLowerCase() === otpSentEmail.trim().toLowerCase()) || USER_ACCOUNTS[0];
      setShowOtpModal(false);
      setOtpSuccess(false);
      await login(user);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] flex flex-col justify-between text-slate-800">
      {/* Tiranga Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Brand Panel */}
          <div className="md:col-span-5 bg-[#032761] p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white p-2 shadow-inner flex items-center justify-center shrink-0">
                  <span className="font-extrabold text-[#032761] text-base tracking-tighter">AICTE</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                    All India Council for Technical Education
                  </span>
                  <span className="text-xs text-blue-200 font-medium">Statutory Body, Govt. of India</span>
                </div>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug mt-2">
                  Approval Workflow &amp; Compliance Portal
                </h1>
                <p className="text-xs text-blue-200 mt-2 leading-relaxed">
                  Integrated APH 2026-27 automation: Stage Routing, Scrutiny, EVC Scheduling, Conditional Undertakings &amp; 30-Year Lease Sentinels.
                </p>
              </div>

              <div className="pt-2 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Configurable APH Statutory Timelines</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Level 1 &rarr; 2 &rarr; 3 Multi-Tier Escalations</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Role-Based Access &amp; Regional Isolation</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-900/60 border border-blue-700/50 text-[11px] space-y-1 relative z-10 mt-6">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Regulatory Safeguard Enforced</span>
              </div>
              <p className="text-blue-100 text-[10px] leading-relaxed">
                Automated recommendations support administrative workflows but shall not supersede statutory decisions reserved for competent authorities.
              </p>
            </div>
          </div>

          {/* Right Login & RBAC Gateway */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">AICTE Single Sign-On (SSO)</h2>
                  <p className="text-xs text-slate-500">Secure Role-Based Authentication Gateway</p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  APH 2026-27
                </span>
              </div>

              {/* Tabs: Personas vs Manual Credentials */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('PERSONAS')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'PERSONAS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Evaluation Personas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('CREDENTIALS')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'CREDENTIALS'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Official Credentials</span>
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* TAB 1: Evaluation Personas (1-Click Login) */}
              {activeTab === 'PERSONAS' && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    Select a designated persona to authenticate through the server with strict role-based access:
                  </p>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {USER_ACCOUNTS.map(user => (
                      <div
                        key={user.id}
                        onClick={() => !isSubmitting && handleSelectPersona(user)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition cursor-pointer flex items-center justify-between gap-2 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full ${user.avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs`}>
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-900 truncate">
                              {user.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {user.designation} {user.region && `(${user.region} Region)`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${user.badgeBg}`}>
                            {user.role.replace(/_/g, ' ')}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: Manual Credentials Login */}
              {activeTab === 'CREDENTIALS' && (
                <form onSubmit={handleManualLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Official AICTE / Institute Email:
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. member.secretary@aicte-india.org"
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">Official Password:</label>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSentEmail(email || 'official@aicte-india.org');
                          setShowOtpModal(true);
                        }}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Login via AICTE e-Gov OTP
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full text-xs pl-9 pr-9 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Evaluation Demo Password: <strong className="text-slate-600">password123</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Remember my session on this computer</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign In to Approval Portal</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>National Informatics Centre (NIC) SSO Gateway</span>
              <span>256-bit TLS Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Two-Factor OTP Simulation</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter simulated 6-digit OTP sent to <strong>{otpSentEmail}</strong>
              </p>
            </div>
            <form onSubmit={handleSimulateOtp} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1 2 3 4 5 6"
                className="w-full text-center text-lg font-mono tracking-widest py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={otpSuccess}
                className="w-full py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition"
              >
                {otpSuccess ? 'OTP Verified. Redirecting...' : 'Verify OTP & Establish Session'}
              </button>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 block mx-auto"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        All India Council for Technical Education &bull; Approval Process Handbook (APH 2026-27) &bull; Govt. of India
      </footer>
    </div>
  );
}
