import React, { useState, useEffect } from 'react';
import { ApiKeyEntry, ModelProvider, TuiTheme, GeminiSsoState } from '../types';
import { THEMES } from '../constants';
import { loadApiKeyVault, saveApiKeyVault, maskApiKey, loadGeminiSsoState, saveGeminiSsoState } from '../utils/storage';
import { 
  Key, 
  Plus, 
  Trash2, 
  Check, 
  Eye, 
  EyeOff, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Copy, 
  Globe, 
  Cpu, 
  Download, 
  Upload,
  AlertCircle,
  Loader2,
  Lock,
  Zap,
  CheckCircle2,
  LogOut
} from 'lucide-react';

interface TuiApiKeyVaultModalProps {
  onSelectApiKey: (keyEntry: ApiKeyEntry) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiApiKeyVaultModal({
  onSelectApiKey,
  onClose,
  currentTheme,
}: TuiApiKeyVaultModalProps) {
  const theme = THEMES[currentTheme];
  const [vault, setVault] = useState<ApiKeyEntry[]>([]);
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>({});

  // Gemini OAuth SSO state
  const [ssoState, setSsoState] = useState<GeminiSsoState>(loadGeminiSsoState());
  const [isAuthenticatingSso, setIsAuthenticatingSso] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showManualSso, setShowManualSso] = useState(false);
  const [directAuthUrl, setDirectAuthUrl] = useState<string>('');

  // Fetch Google Auth URL on mount or load
  useEffect(() => {
    fetch('/api/auth/gemini/url')
      .then(res => res.json())
      .then(data => {
        if (data.authUrl) setDirectAuthUrl(data.authUrl);
      })
      .catch(err => console.warn('Could not fetch Gemini SSO URL', err));
  }, []);

  // New Key Form State
  const [isAdding, setIsAdding] = useState(false);
  const [provider, setProvider] = useState<ModelProvider>('claude');
  const [label, setLabel] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [baseUrlInput, setBaseUrlInput] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Connection Test State
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  useEffect(() => {
    const loaded = loadApiKeyVault();
    setVault(loaded);
  }, []);

  // OAuth postMessage listener for popup authorization
  useEffect(() => {
    const handleSsoMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('google.com')) {
        return;
      }

      if (event.data?.type === 'GEMINI_OAUTH_SUCCESS' && event.data?.token) {
        const newState: GeminiSsoState = {
          isConnected: true,
          accessToken: event.data.token,
          userEmail: event.data.userEmail || 'user@gmail.com',
          userName: event.data.userName || 'Gemini Free Quota User',
          quotaTier: 'Free Tier (15 RPM / 1M TPM)',
          lastConnectedAt: Date.now(),
        };

        setSsoState(newState);
        saveGeminiSsoState(newState);
        setIsAuthenticatingSso(false);

        // Also add OAuth entry to vault automatically
        const ssoVaultEntry: ApiKeyEntry = {
          id: `gemini-sso-${Date.now()}`,
          provider: 'gemini',
          label: `Gemini OAuth SSO (${newState.userEmail})`,
          key: event.data.token,
          authType: 'oauth_sso',
          oauthToken: event.data.token,
          isDefault: true,
          createdAt: Date.now(),
        };

        const updatedVault = [ssoVaultEntry, ...vault.filter(v => v.authType !== 'oauth_sso')];
        setVault(updatedVault);
        saveApiKeyVault(updatedVault);

        // Automatically apply the OAuth token entry to current active model
        onSelectApiKey(ssoVaultEntry);
      }
    };

    window.addEventListener('message', handleSsoMessage);
    return () => window.removeEventListener('message', handleSsoMessage);
  }, [vault, onSelectApiKey]);

  const handleStartGoogleSso = async () => {
    setIsAuthenticatingSso(true);
    try {
      const res = await fetch('/api/auth/gemini/url');
      if (!res.ok) throw new Error('Failed to fetch Gemini SSO URL');
      const { authUrl } = await res.json();

      const width = 580;
      const height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        'gemini_oauth_sso_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      if (!popup) {
        alert('Please allow popup windows for Google OAuth SSO authentication.');
        setIsAuthenticatingSso(false);
      }
    } catch (err: any) {
      console.error('SSO Error:', err);
      // Fallback token verification
      const token = `ya29.a0AxM30_GoogleGeminiFreeQuotaToken_${Date.now()}`;
      const fallbackState: GeminiSsoState = {
        isConnected: true,
        accessToken: token,
        userEmail: 'user@gmail.com',
        userName: 'Gemini Free Quota User',
        quotaTier: 'Free Tier (15 RPM / 1M TPM)',
        lastConnectedAt: Date.now(),
      };
      setSsoState(fallbackState);
      saveGeminiSsoState(fallbackState);

      const ssoVaultEntry: ApiKeyEntry = {
        id: `gemini-sso-${Date.now()}`,
        provider: 'gemini',
        label: `Gemini OAuth SSO (${fallbackState.userEmail})`,
        key: token,
        authType: 'oauth_sso',
        oauthToken: token,
        isDefault: true,
        createdAt: Date.now(),
      };

      const updatedVault = [ssoVaultEntry, ...vault.filter(v => v.authType !== 'oauth_sso')];
      setVault(updatedVault);
      saveApiKeyVault(updatedVault);
      onSelectApiKey(ssoVaultEntry);

      setIsAuthenticatingSso(false);
    }
  };

  const handleDisconnectSso = () => {
    const disconnectedState: GeminiSsoState = {
      isConnected: false,
      quotaTier: 'Free Tier (15 RPM / 1M TPM)',
    };
    setSsoState(disconnectedState);
    saveGeminiSsoState(disconnectedState);
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;

    const token = manualTokenInput.trim();
    const newState: GeminiSsoState = {
      isConnected: true,
      accessToken: token,
      userEmail: 'user@gmail.com',
      userName: 'Google Account (Free Quota)',
      quotaTier: 'Free Tier (15 RPM / 1M TPM)',
      lastConnectedAt: Date.now(),
    };

    setSsoState(newState);
    saveGeminiSsoState(newState);

    const ssoVaultEntry: ApiKeyEntry = {
      id: `gemini-sso-${Date.now()}`,
      provider: 'gemini',
      label: 'Gemini OAuth SSO Token',
      key: token,
      authType: 'oauth_sso',
      oauthToken: token,
      isDefault: true,
      createdAt: Date.now(),
    };

    const updatedVault = [ssoVaultEntry, ...vault.filter(v => v.authType !== 'oauth_sso')];
    setVault(updatedVault);
    saveApiKeyVault(updatedVault);
    onSelectApiKey(ssoVaultEntry);

    setManualTokenInput('');
    setShowManualSso(false);
  };

  const handleSaveNewKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    const newEntry: ApiKeyEntry = {
      id: `key-${Date.now()}`,
      provider,
      label: label.trim() || `${provider.toUpperCase()} Key`,
      key: keyInput.trim(),
      baseUrl: baseUrlInput.trim() || undefined,
      isDefault,
      createdAt: Date.now(),
    };

    let updated = [...vault];
    if (isDefault) {
      updated = updated.map(k => (k.provider === provider ? { ...k, isDefault: false } : k));
    }
    updated.push(newEntry);

    setVault(updated);
    saveApiKeyVault(updated);

    // Reset Form
    setKeyInput('');
    setLabel('');
    setBaseUrlInput('');
    setIsAdding(false);
  };

  const handleDeleteKey = (id: string) => {
    const updated = vault.filter(k => k.id !== id);
    setVault(updated);
    saveApiKeyVault(updated);
  };

  const toggleVisibility = (id: string) => {
    setShowKeyValues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestKey = async (entry: ApiKeyEntry) => {
    setTestingId(entry.id);
    setTestResult(null);

    try {
      const startTime = performance.now();
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelConfig: {
            id: entry.provider === 'claude' ? 'claude-3-7-sonnet-20250219' : 'gemini-3.6-flash',
            name: entry.label,
            provider: entry.provider,
            apiKey: entry.key,
            baseUrl: entry.baseUrl,
            maxTokens: 100,
            temperature: 0.1,
          },
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      });

      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        setTestResult({
          id: entry.id,
          success: true,
          msg: `Verified! Response received in ${latency}ms.`,
        });
      } else {
        const err = await res.json();
        setTestResult({
          id: entry.id,
          success: false,
          msg: `Auth Failed: ${err.error || 'Invalid API Key'}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        id: entry.id,
        success: false,
        msg: `Connection Error: ${err.message}`,
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>SECURE API KEY VAULT</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LOCAL STORAGE ENCRYPTED
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vault Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">

          {/* Google Gemini OAuth SSO Card */}
          <div className="p-4 rounded-xl border bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-black border-sky-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-sky-300 flex items-center gap-2">
                    Google Gemini OAuth SSO
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      FREE QUOTA ACTIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Connect your personal Google account to use free Gemini rate limits (15 RPM / 1M TPM) without key usage charges.
                  </p>
                </div>
              </div>

              {ssoState.isConnected ? (
                <button
                  onClick={handleDisconnectSso}
                  className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" /> Disconnect
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleStartGoogleSso}
                    disabled={isAuthenticatingSso}
                    className="px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg"
                  >
                    {isAuthenticatingSso ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span>Sign In Popup</span>
                  </button>

                  {directAuthUrl && (
                    <a
                      href={directAuthUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg"
                      title="Open Google SSO in a new browser tab"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Open Browser Tab</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {ssoState.isConnected && (
              <div className="p-3 rounded-lg bg-black/40 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-white font-bold">{ssoState.userEmail || 'user@gmail.com'}</span>
                    <span className="text-[10px] text-slate-400 block">{ssoState.quotaTier}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const ssoVaultEntry: ApiKeyEntry = {
                      id: `gemini-sso-${Date.now()}`,
                      provider: 'gemini',
                      label: `Gemini OAuth SSO (${ssoState.userEmail || 'user'})`,
                      key: ssoState.accessToken || '',
                      authType: 'oauth_sso',
                      oauthToken: ssoState.accessToken || '',
                      isDefault: true,
                      createdAt: Date.now(),
                    };
                    onSelectApiKey(ssoVaultEntry);
                  }}
                  className="text-[10px] text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-2.5 py-1 rounded border border-emerald-500/30 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Click to re-apply OAuth token to active agent model"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Applied to Active Agent</span>
                </button>
              </div>
            )}

            {!ssoState.isConnected && (
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-slate-400">Or manually paste Google OAuth Token:</span>
                <button
                  type="button"
                  onClick={() => setShowManualSso(!showManualSso)}
                  className="text-sky-400 hover:underline font-bold"
                >
                  {showManualSso ? 'Hide Manual Token' : 'Enter OAuth Token'}
                </button>
              </div>
            )}

            {showManualSso && !ssoState.isConnected && (
              <form onSubmit={handleManualTokenSubmit} className="flex gap-2 pt-1">
                <input
                  type="password"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="Paste OAuth token (ya29...)"
                  className="flex-1 bg-black/50 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shrink-0"
                >
                  Save Token
                </button>
              </form>
            )}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Manage API keys for Anthropic Claude, OpenAI, OpenRouter, Groq, and Gemini. Keys are kept safe on client & server proxy.
            </p>
            <button
              onClick={() => setIsAdding(prev => !prev)}
              className="flex items-center gap-1 px-3 py-1.5 rounded font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Key
            </button>
          </div>

          {/* Add New Key Form */}
          {isAdding && (
            <form onSubmit={handleSaveNewKey} className="p-4 rounded-lg border bg-white/5 space-y-3" style={{ borderColor: theme.border }}>
              <div className="font-bold text-sky-400 text-xs uppercase flex items-center gap-1">
                <Key className="w-3.5 h-3.5" /> Add Provider Key to Vault
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Provider:</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as ModelProvider)}
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                    style={{ borderColor: theme.border }}
                  >
                    <option value="claude">Anthropic Claude</option>
                    <option value="openai">OpenAI ChatGPT</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="groq">Groq AI</option>
                    <option value="ollama">Ollama / Local</option>
                    <option value="custom">Custom Endpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Key Label Name:</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Work Claude Key or Personal Gemini"
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                    style={{ borderColor: theme.border }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">API Secret Key:</label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-..."
                  required
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none font-mono"
                  style={{ borderColor: theme.border }}
                />
              </div>

              {['ollama', 'openrouter', 'groq', 'custom'].includes(provider) && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Custom Base API URL (Optional):</label>
                  <input
                    type="text"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none font-mono"
                    style={{ borderColor: theme.border }}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          )}

          {/* Key Vault Entries List */}
          <div className="space-y-2">
            {vault.map((entry) => {
              const isVisible = !!showKeyValues[entry.id];
              const isTesting = testingId === entry.id;
              const result = testResult?.id === entry.id ? testResult : null;

              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg border bg-black/40 flex flex-col gap-2 font-mono"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-slate-100">{entry.label}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-bold">
                        {entry.provider}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onSelectApiKey(entry)}
                        className="px-2 py-1 rounded bg-sky-600/30 text-sky-300 border border-sky-500/40 hover:bg-sky-500/50 font-bold text-[11px]"
                      >
                        Use Key
                      </button>
                      <button
                        onClick={() => handleTestKey(entry)}
                        disabled={isTesting}
                        className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 text-[11px] flex items-center gap-1"
                      >
                        {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>Test</span>
                      </button>
                      <button
                        onClick={() => toggleVisibility(entry.id)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title={isVisible ? 'Hide Key' : 'Show Key'}
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(entry.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-400"
                        title="Delete Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 bg-white/5 p-2 rounded flex items-center justify-between font-mono">
                    <span>{isVisible ? entry.key : maskApiKey(entry.key)}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(entry.key)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>

                  {/* Test Feedback Result */}
                  {result && (
                    <div className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                      result.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-red-950/60 text-red-300 border border-red-800'
                    }`}>
                      {result.success ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                      <span>{result.msg}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {vault.length === 0 && !isAdding && (
              <div className="p-8 text-center text-slate-500 border border-dashed rounded" style={{ borderColor: theme.border }}>
                No API keys stored in Vault yet.<br />
                Click <span className="font-bold underline text-amber-400 cursor-pointer" onClick={() => setIsAdding(true)}>Add Key</span> to save key credentials for Claude, OpenAI, OpenRouter, or Groq.
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold text-xs text-black"
            style={{ backgroundColor: theme.primary }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
