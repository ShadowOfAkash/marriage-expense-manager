import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/react';
import { 
  Mail, CheckCircle2, AlertTriangle, ExternalLink, 
  RefreshCw, ShieldCheck, Key, Server, Eye, EyeOff, 
  Send, Trash2, X, Info
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';
import { TailwindModal } from './TailwindModal';

export function EmailSettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  // Tab: 'gmail' or 'smtp'
  const [activeTab, setActiveTab] = useState('gmail');
  
  // Status
  const [configured, setConfigured] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Form fields
  const [provider, setProvider] = useState('gmail');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [senderName, setSenderName] = useState('Wedding Celebrations');
  const [hasExistingPass, setHasExistingPass] = useState(false);

  // Load current settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getEmailSettings();
      setConfigured(Boolean(data.configured));
      setProvider(data.provider || 'gmail');
      setActiveTab(data.provider === 'smtp' ? 'smtp' : 'gmail');
      setSmtpHost(data.smtp_host || (data.provider === 'gmail' ? 'smtp.gmail.com' : ''));
      setSmtpPort(data.smtp_port || 587);
      setSmtpSecure(Boolean(data.smtp_secure));
      setSmtpUser(data.smtp_user || '');
      setSenderName(data.sender_name || 'Wedding Celebrations');
      setHasExistingPass(Boolean(data.hasPassword));
      setTestEmailRecipient(data.smtp_user || '');
      setTestResult(null);
    } catch (err) {
      console.error('Failed to load email settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!smtpUser || !smtpUser.trim()) {
      toast({ title: 'Email required', description: 'Please enter your email or username.', status: 'warning' });
      return;
    }
    if (!hasExistingPass && (!smtpPass || !smtpPass.trim())) {
      toast({ title: 'Password required', description: 'Please provide your Google App Password or SMTP password.', status: 'warning' });
      return;
    }

    setSaving(true);
    setTestResult(null);
    try {
      const payload = {
        provider: activeTab,
        smtp_host: activeTab === 'gmail' ? 'smtp.gmail.com' : smtpHost,
        smtp_port: activeTab === 'gmail' ? 587 : Number(smtpPort) || 587,
        smtp_secure: activeTab === 'gmail' ? false : smtpSecure,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass.trim(),
        sender_name: senderName.trim()
      };

      const res = await api.saveEmailSettings(payload);
      toast({
        title: 'Email Delivery Connected!',
        description: res.message || 'Email delivery settings verified and saved.',
        status: 'success'
      });
      setConfigured(true);
      setHasExistingPass(true);
      setSmtpPass('');
      if (onSettingsUpdated) onSettingsUpdated(true, smtpUser.trim());
      onClose();
    } catch (err) {
      toast({
        title: 'Connection Failed',
        description: err.message || 'Could not connect to mail server.',
        status: 'error'
      });
      setTestResult({
        success: false,
        message: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    const target = (testEmailRecipient || smtpUser || '').trim();
    if (!target) {
      toast({ title: 'Recipient email required', description: 'Enter an email to receive the test email.', status: 'warning' });
      return;
    }
    if (!configured) {
      toast({ title: 'Save settings first', description: 'Please save your email settings before sending a test.', status: 'warning' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testEmailSettings(target);
      toast({
        title: 'Test Email Sent!',
        description: res.message,
        status: 'success'
      });
      setTestResult({
        success: true,
        message: res.message
      });
    } catch (err) {
      toast({
        title: 'Test Email Failed',
        description: err.message,
        status: 'error'
      });
      setTestResult({
        success: false,
        message: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect email delivery? Invitations will revert to test sandbox mode.')) {
      return;
    }
    try {
      await api.disconnectEmailSettings();
      toast({ title: 'Email Disconnected', description: 'Email delivery reverted to test mode.', status: 'info' });
      setConfigured(false);
      setSmtpUser('');
      setSmtpPass('');
      setHasExistingPass(false);
      if (onSettingsUpdated) onSettingsUpdated(false, '');
      onClose();
    } catch (err) {
      toast({ title: 'Disconnect failed', description: err.message, status: 'error' });
    }
  };

  return (
    <TailwindModal
      isOpen={isOpen}
      onClose={onClose}
      title="Email Delivery Settings"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        
        {/* Status Banner */}
        {configured ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                <span>Real Email Delivery is Active</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">Live</span>
              </div>
              <p className="text-emerald-800 text-xs mt-0.5">
                Invitations are being sent directly from <strong>{smtpUser}</strong> to your guests' inboxes.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-amber-950 text-sm">
                Real Email Delivery Not Configured (Sandbox Mode Active)
              </div>
              <p className="text-amber-800 text-xs mt-0.5">
                Invitations are currently simulated in an offline test sandbox. Connect your Gmail or SMTP below so invitations and PDF cards reach real recipient inboxes.
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-200 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('gmail'); setProvider('gmail'); }}
            className={`pb-2 px-3 font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 text-xs ${
              activeTab === 'gmail'
                ? 'border-[#1b3c53] text-[#1b3c53]'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Mail size={14} />
            <span>Gmail / Google Workspace</span>
            <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">Recommended</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('smtp'); setProvider('smtp'); }}
            className={`pb-2 px-3 font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 text-xs ${
              activeTab === 'smtp'
                ? 'border-[#1b3c53] text-[#1b3c53]'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <Server size={14} />
            <span>Custom SMTP</span>
          </button>
        </div>

        {/* ================= GMAIL TAB ================= */}
        {activeTab === 'gmail' && (
          <div className="space-y-3.5">
            {/* 3-Step Guide */}
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1.5 text-zinc-700">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900">
                <Info size={14} className="text-[#234c6a]" />
                <span>How to connect Gmail in 3 simple steps:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-zinc-600 text-[11px] leading-relaxed">
                <li>Make sure <strong>2-Step Verification</strong> is enabled on your Google Account.</li>
                <li>
                  Open Google App Passwords: 
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1 inline-flex items-center gap-0.5 font-bold text-[#1b3c53] hover:underline"
                  >
                    <span>myaccount.google.com/apppasswords</span>
                    <ExternalLink size={10} />
                  </a>
                </li>
                <li>Enter App Name (e.g. <em>"Wedding Manager"</em>), copy the generated <strong>16-character code</strong>, and paste it below.</li>
              </ol>
            </div>

            {/* Gmail User */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Your Gmail Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              />
            </div>

            {/* Google App Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-zinc-700">
                  Google App Password (16 characters) <span className="text-rose-500">*</span>
                </label>
                {hasExistingPass && (
                  <span className="text-[11px] text-emerald-700 font-semibold">✓ Existing password saved</span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={hasExistingPass ? '•••• •••• •••• •••• (Leave blank to keep saved password)' : 'xxxx xxxx xxxx xxxx'}
                  className="w-full px-3 py-2 pr-9 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Sender Name */}
            <div>
              <label className="block font-bold text-zinc-700 mb-1">
                Sender Display Name (as seen by guests)
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Akash & Wedding Team"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              />
            </div>
          </div>
        )}

        {/* ================= CUSTOM SMTP TAB ================= */}
        {activeTab === 'smtp' && (
          <div className="space-y-3">
            <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 text-[11px]">
              Works with Brevo, SendGrid, Amazon SES, Mailgun, Outlook / Office365, or your custom SMTP server.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block font-bold text-zinc-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="e.g. smtp-relay.brevo.com"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Username / Email</label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="e.g. apikey or user@domain.com"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Password / API Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder={hasExistingPass ? '•••••••• (Leave blank to keep saved password)' : 'Enter SMTP password or API key'}
                  className="w-full px-3 py-2 pr-9 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.checked)}
                className="rounded border-zinc-300 text-[#1b3c53] focus:ring-[#1b3c53]"
              />
              <label htmlFor="smtpSecure" className="text-zinc-700 cursor-pointer font-medium">
                Use SSL / TLS (typically Port 465)
              </label>
            </div>

            <div>
              <label className="block font-bold text-zinc-700 mb-1">Sender Display Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Akash & Wedding Team"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-[#1b3c53] outline-none"
              />
            </div>
          </div>
        )}

        {/* Send Real Test Email Card (when configured) */}
        {configured && (
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                <Send size={13} className="text-[#234c6a]" />
                <span>Verify Delivery with a Real Test Email</span>
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="Enter recipient email to verify..."
                className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:border-[#1b3c53] outline-none"
              />
              <Button
                radius="sm"
                size="sm"
                type="button"
                disabled={testing}
                onClick={handleSendTestEmail}
                className="bg-[#234c6a] hover:bg-[#1b3c53] text-white font-bold text-xs shrink-0"
              >
                {testing ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={12} />
                    <span>Send Test</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Test Result Message */}
        {testResult && (
          <div className={`p-2.5 rounded-lg border text-xs ${
            testResult.success 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
          <div>
            {configured && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Disconnect</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              radius="sm"
              variant="bordered"
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </Button>
            <Button
              radius="sm"
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="text-xs font-semibold bg-[#1b3c53] hover:bg-[#132e40] text-white disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
            >
              {saving ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Verifying Connection...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="text-[#f3e5ab]" />
                  <span>Save & Connect Email</span>
                </>
              )}
            </Button>
          </div>
        </div>

      </div>
    </TailwindModal>
  );
}
