"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Lock, RefreshCw, Check, Eye, EyeOff } from "lucide-react";
import { Settings } from "@drift-deck/types";
import { deriveKey } from "@drift-deck/utils";

interface SettingsPanelProps {
  settings: Settings | null;
  masterKey: string | null;
  onSavePipelineCredentials: (botToken: string, channelId: number) => Promise<void>;
  onSetMasterKey: (key: string) => void;
}

export default function SettingsPanel({
  settings,
  masterKey,
  onSavePipelineCredentials,
  onSetMasterKey,
}: SettingsPanelProps) {
  const [botToken, setBotToken] = useState(settings?.telegramBotToken ?? "");
  const [channelId, setChannelId] = useState(
    settings?.telegramChannelId ? String(settings.telegramChannelId) : ""
  );
  const [password, setPassword] = useState("");
  const [showBotToken, setShowBotToken] = useState(false);
  const [savingCreds, setSavingCreds] = useState(false);
  const [savedCreds, setSavedCreds] = useState(false);
  const [derivingKey, setDerivingKey] = useState(false);

  const handleSaveCreds = async () => {
    if (!botToken || !channelId) return;
    setSavingCreds(true);
    await onSavePipelineCredentials(botToken, Number(channelId));
    setSavingCreds(false);
    setSavedCreds(true);
    setTimeout(() => setSavedCreds(false), 2500);
  };

  const handleDeriveKey = async () => {
    if (!password) return;
    setDerivingKey(true);
    // Use a brief timeout to let UI update before CPU-heavy PBKDF2
    setTimeout(() => {
      const salt = settings?.encKeySalt ?? "drift_deck_default_salt_2026";
      const key = deriveKey(password, salt);
      onSetMasterKey(key);
      setPassword("");
      setDerivingKey(false);
    }, 50);
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-2xl mx-auto flex flex-col gap-6"
    >
      {/* Telegram credentials */}
      <div className="glass-panel p-6 rounded-2xl border-border flex flex-col gap-5">
        <h3 className="text-sm font-bold border-b border-border/30 pb-3 flex items-center gap-2 text-foreground">
          <Terminal className="w-4 h-4 text-primary" />
          Telegram Cloud Pipeline Credentials
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          Configure your Telegram Bot Token and the target channel/group ID where files will be stored.
          The bot must be an admin in the channel.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted uppercase">Bot Token API</label>
            <div className="relative">
              <input
                type={showBotToken ? "text" : "password"}
                placeholder="777777777:AAF_xxxxxxxxxxxxxxxx"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full h-9 bg-card border border-border rounded-xl px-3 pr-9 text-xs outline-none focus:border-primary/50 text-foreground"
              />
              <button
                onClick={() => setShowBotToken(!showBotToken)}
                className="absolute right-3 top-2.5 text-muted hover:text-foreground transition-colors"
              >
                {showBotToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-muted uppercase">Channel / Group ID</label>
            <input
              type="text"
              placeholder="-100xxxxxxxxxx"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              className="h-9 bg-card border border-border rounded-xl px-3 text-xs outline-none focus:border-primary/50 text-foreground"
            />
          </div>
        </div>
        <button
          onClick={handleSaveCreds}
          disabled={savingCreds || !botToken || !channelId}
          className="self-start px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white transition-all shadow-md shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingCreds ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : savedCreds ? (
            <Check className="w-3.5 h-3.5" />
          ) : null}
          {savedCreds ? "Saved!" : "Save Credentials"}
        </button>
      </div>

      {/* Zero-knowledge encryption */}
      <div className="glass-panel p-6 rounded-2xl border-border flex flex-col gap-5">
        <h3 className="text-sm font-bold border-b border-border/30 pb-3 flex items-center gap-2 text-foreground">
          <Lock className="w-4 h-4 text-accent" />
          Zero-Knowledge Master Key
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          Your master password is never stored or sent to the server. It&apos;s used locally with PBKDF2
          to derive an AES-256 key that encrypts files before upload.
        </p>

        {masterKey && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">
              Encryption key derived and active in memory.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-muted uppercase">Master Passphrase</label>
          <input
            type="password"
            placeholder="Enter a strong passphrase..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDeriveKey()}
            className="h-9 bg-card border border-border rounded-xl px-3 text-xs outline-none focus:border-primary/50 text-foreground"
          />
          <p className="text-[10px] text-muted">
            Salt: <code className="font-mono">{settings?.encKeySalt ?? "drift_deck_default_salt"}</code>
          </p>
        </div>

        <button
          onClick={handleDeriveKey}
          disabled={derivingKey || !password}
          className="self-start px-5 py-2 rounded-xl bg-accent hover:bg-accent/80 font-bold text-xs text-white transition-all shadow-md shadow-accent/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {derivingKey ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          {derivingKey ? "Deriving key..." : "Derive & Apply Encryption Key"}
        </button>
      </div>
    </motion.div>
  );
}
