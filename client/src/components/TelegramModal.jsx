import React, { useState, useEffect } from 'react';
import { TailwindModal } from './TailwindModal';
import { Button } from '@heroui/react';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  Unlink, 
  RefreshCw, 
  Send,
  HelpCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

export function TelegramModal({ 
  isOpen, 
  onClose, 
  isLinked = false, 
  currentTelegramId = null, 
  activeCode = null,
  botUsername = 'MarriageExpenseManagementBot',
  onStatusChange 
}) {
  const toast = useToast();
  const [isLinkedLocal, setIsLinkedLocal] = useState(isLinked);
  const [currentIdLocal, setCurrentIdLocal] = useState(currentTelegramId);
  const [telegramIdInput, setTelegramIdInput] = useState('');
  const [savingId, setSavingId] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [code, setCode] = useState(activeCode);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  useEffect(() => {
    setIsLinkedLocal(isLinked);
    setCurrentIdLocal(currentTelegramId);
    setTelegramIdInput(currentTelegramId || '');
    setCode(activeCode);
    setShowConfirmDisconnect(false);
  }, [isOpen, isLinked, currentTelegramId, activeCode]);

  const handleCopyId = () => {
    if (!currentIdLocal) return;
    navigator.clipboard.writeText(currentIdLocal);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveId = async (e) => {
    e?.preventDefault();
    const clean = telegramIdInput.trim();
    if (!clean) {
      toast({ title: 'Telegram ID Required', description: 'Please enter a valid Telegram chat/user ID.', status: 'warning' });
      return;
    }

    setSavingId(true);
    try {
      const res = await api.setTelegramId(clean);
      toast({ 
        title: 'Telegram Connected', 
        description: `Successfully linked Telegram ID: ${clean}`, 
        status: 'success' 
      });
      setIsLinkedLocal(true);
      setCurrentIdLocal(clean);
      if (onStatusChange) {
        onStatusChange({ isLinked: true, telegramId: clean });
      }
    } catch (err) {
      toast({ title: 'Connection Failed', description: err.message, status: 'error' });
    } finally {
      setSavingId(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.disconnectTelegram();
      toast({ 
        title: 'Telegram Disconnected', 
        description: 'Your Telegram account has been unlinked.', 
        status: 'info' 
      });
      setIsLinkedLocal(false);
      setCurrentIdLocal(null);
      setShowConfirmDisconnect(false);
      setTelegramIdInput('');
      setCode(null);
      if (onStatusChange) {
        onStatusChange({ isLinked: false, telegramId: null, activeCode: null });
      }
    } catch (err) {
      toast({ title: 'Disconnect Failed', description: err.message, status: 'error' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await api.generateTelegramCode();
      setCode(res.code);
      toast({ title: 'Code Generated', description: 'Send this code to the bot to link your account.', status: 'success' });
      if (onStatusChange) {
        onStatusChange({ activeCode: res.code });
      }
    } catch (err) {
      toast({ title: 'Failed to generate code', description: err.message, status: 'error' });
    } finally {
      setGeneratingCode(false);
    }
  };

  return (
    <TailwindModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Telegram Bot Integration"
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Status Header Banner */}
        <div className={`p-4 rounded-xl border transition-all ${
          isLinkedLocal 
            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950' 
            : 'bg-amber-50/70 border-amber-200/80 text-amber-950'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isLinkedLocal ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                {isLinkedLocal ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-900">
                    {isLinkedLocal ? 'Telegram Connected' : 'Telegram Not Connected'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isLinkedLocal ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isLinkedLocal ? 'Active' : 'Unlinked'}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {isLinkedLocal 
                    ? 'Receipts, images, and voice notes sent to your bot automatically sync to your dashboard.' 
                    : 'Connect your Telegram account to upload wedding receipts on the go.'}
                </p>
              </div>
            </div>

            <a 
              href={`https://t.me/${botUsername}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 shadow-2xs shrink-0 transition-colors"
            >
              <Send size={13} className="text-[#234c6a]" />
              <span>@{botUsername}</span>
              <ExternalLink size={12} className="text-zinc-400" />
            </a>
          </div>

          {/* Current ID Pill */}
          {isLinkedLocal && currentIdLocal && (
            <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 font-medium">Existing Telegram ID:</span>
                <code className="px-2.5 py-1 bg-white border border-emerald-200 rounded-md font-bold text-emerald-900 text-xs shadow-2xs select-all">
                  {currentIdLocal}
                </code>
              </div>
              <button 
                type="button" 
                onClick={handleCopyId} 
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-100/50 cursor-pointer transition-colors shadow-2xs font-medium"
              >
                {copiedId ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Change ID & Reconnect Form */}
        <div className="p-4 rounded-xl border border-zinc-200/90 bg-white shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-[#234c6a]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
              {isLinkedLocal ? 'Change Telegram ID & Reconnect' : 'Connect Telegram by ID'}
            </h4>
          </div>
          <p className="text-xs text-zinc-500">
            Enter your Telegram Chat ID below. The bot will associate all messages from this ID with your account.
          </p>

          <form onSubmit={handleSaveId} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={telegramIdInput}
                  onChange={(e) => setTelegramIdInput(e.target.value)}
                  placeholder="e.g. 1256918427"
                  className="w-full h-10 px-3 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#234c6a]/20 focus:border-[#234c6a] transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={savingId}
                className="inline-flex items-center justify-center gap-1.5 bg-[#234c6a] text-white hover:bg-[#1b3c53] font-semibold text-xs px-4 h-10 rounded-lg shadow-xs cursor-pointer shrink-0 disabled:opacity-60 transition-colors"
              >
                {savingId ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isLinkedLocal ? 'Update & Reconnect' : 'Save & Connect'}</span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
              <HelpCircle size={14} className="text-zinc-400 shrink-0" />
              <span>
                Need your ID? Message{' '}
                <a 
                  href="https://t.me/userinfobot" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#234c6a] font-semibold underline underline-offset-2"
                >
                  @userinfobot
                </a>{' '}
                or start{' '}
                <a 
                  href={`https://t.me/${botUsername}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#234c6a] font-semibold underline underline-offset-2"
                >
                  @{botUsername}
                </a>{' '}
                to get your numeric Chat ID.
              </span>
            </div>
          </form>
        </div>

        {/* Alternative: 6-Digit Code Connection */}
        <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-[#456882]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                Or Connect via 6-Digit Code
              </h4>
            </div>
            <button
              type="button"
              disabled={generatingCode}
              onClick={handleGenerateCode}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 cursor-pointer shadow-2xs transition-colors disabled:opacity-60"
            >
              {generatingCode ? 'Generating...' : (code ? 'Generate New Code' : 'Generate Code')}
            </button>
          </div>

          {code ? (
            <div className="bg-white p-3.5 rounded-lg border border-zinc-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 font-medium">Your 6-Digit Link Code:</span>
                  <div className="text-2xl font-black tracking-widest text-[#1b3c53] mt-0.5">
                    {code}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer transition-colors shadow-2xs"
                    title="Copy code"
                  >
                    {copiedCode ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  </button>
                  <a
                    href={`https://t.me/${botUsername}?start=${code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#234c6a] text-white hover:bg-[#1b3c53] transition-colors shadow-2xs"
                  >
                    <span>Open in Telegram</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Send <code className="bg-zinc-100 px-1 py-0.5 rounded font-semibold text-zinc-800">/link {code}</code> in the Telegram bot chat to complete linking.
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              You can also generate a temporary 6-digit code and send it to the Telegram bot to link automatically.
            </p>
          )}
        </div>

        {/* Disconnect Action */}
        {isLinkedLocal && (
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
            {!showConfirmDisconnect ? (
              <button
                type="button"
                onClick={() => setShowConfirmDisconnect(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg border border-rose-200/80 transition-colors cursor-pointer"
              >
                <Unlink size={14} />
                <span>Disconnect Telegram</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50/80 p-2.5 rounded-lg border border-rose-200 w-full justify-between">
                <div className="text-xs text-rose-900 font-medium">
                  Disconnect your Telegram account?
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowConfirmDisconnect(false)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:bg-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={disconnecting}
                    onClick={handleDisconnect}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer transition-colors shadow-2xs"
                  >
                    {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ml-auto text-xs font-semibold text-zinc-700 border border-zinc-200 bg-white hover:bg-zinc-100 px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        )}

        {!isLinkedLocal && (
          <div className="pt-2 border-t border-zinc-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-zinc-700 border border-zinc-200 bg-white hover:bg-zinc-100 px-3 py-2 rounded-lg cursor-pointer transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </TailwindModal>
  );
}
