import React, { useState } from 'react';
import { X, RefreshCw, Copy, Check, Smartphone, Laptop, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { format7DigitCode } from '../utils/sync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncCode: string;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  onConnectCode: (code: string) => Promise<boolean>;
  onGenerateNewCode: () => void;
  onManualSync: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  syncCode,
  isSyncing,
  lastSyncedAt,
  onConnectCode,
  onGenerateNewCode,
  onManualSync,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [connectStatus, setConnectStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length !== 7) {
      setErrorMessage('Please enter a valid 7-character code (letters and numbers)');
      setConnectStatus('error');
      return;
    }

    setConnectStatus('loading');
    setErrorMessage('');

    try {
      const success = await onConnectCode(clean);
      if (success) {
        setConnectStatus('success');
        setInputCode('');
        setTimeout(() => {
          setConnectStatus('idle');
          onClose();
        }, 1500);
      } else {
        setConnectStatus('error');
        setErrorMessage('Code not found or failed to fetch. Check the 7 letters and numbers and try again.');
      }
    } catch {
      setConnectStatus('error');
      setErrorMessage('Could not connect to sync service. Please try again.');
    }
  };

  const lastSyncFormatted = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Not synced yet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Cross-Device 7-Character Sync
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Keep your timers, custom playlists, and focus metrics in sync across your phone, tablet, and laptop using letters and numbers.
          </p>
        </div>

        {/* This Device's 7-Character Code Box */}
        <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 mb-6 text-center">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-1">
            Your Personal 7-Character Sync Code
          </span>

          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-neutral-900 dark:text-neutral-100 my-2 select-all tabular-nums uppercase">
            {format7DigitCode(syncCode)}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy 7-Character Code</span>
                </>
              )}
            </button>

            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-500' : ''}`} />
              <span>Sync Now</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-3">
            Last synced: <span className="tabular-nums">{lastSyncFormatted}</span>
          </div>
        </div>

        {/* Connect Another Device Form */}
        <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-5 mb-5">
          <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block mb-1.5">
            Connect to Another Device
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Have a 7-character code (letters and numbers) from your other device? Enter it below:
          </p>

          <form onSubmit={handleConnect} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={8}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase())}
                placeholder="e.g. Z7N-4K9P"
                className="flex-1 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono text-center tracking-widest text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 uppercase"
              />
              <button
                type="submit"
                disabled={connectStatus === 'loading'}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                {connectStatus === 'loading' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Connect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {connectStatus === 'success' && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                <Check className="w-3.5 h-3.5" />
                <span>Connected! Devices are now synced.</span>
              </div>
            )}

            {connectStatus === 'error' && (
              <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMessage || 'Failed to connect. Check the code and try again.'}</span>
              </div>
            )}
          </form>
        </div>

        {/* Quick Tips / Device pairing illustration */}
        <div className="bg-neutral-50 dark:bg-neutral-950/50 rounded-xl p-3 border border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-neutral-400" />
            <span>Mobile</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-neutral-400" />
            <span>Desktop</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">Instant Sync</span>
        </div>

        {/* Generate Fresh Code option */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onGenerateNewCode}
            className="text-[11px] text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline transition-colors"
          >
            Need a fresh code? Generate new 7-character code
          </button>
        </div>
      </div>
    </div>
  );
};
