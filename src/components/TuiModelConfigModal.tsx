import React, { useState } from 'react';
import { ModelConfig, ModelProvider, TuiTheme } from '../types';
import { DEFAULT_MODELS, THEMES } from '../constants';
import { loadGeminiSsoState } from '../utils/storage';
import { X, Cpu, Key, Globe, Check, AlertCircle, Loader2, Sparkles, Sliders, Zap, ShieldCheck } from 'lucide-react';

interface TuiModelConfigModalProps {
  currentModel: ModelConfig;
  onSelectModel: (model: ModelConfig) => void;
  onSaveCustomModel: (model: ModelConfig) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiModelConfigModal({
  currentModel,
  onSelectModel,
  onSaveCustomModel,
  onClose,
  currentTheme,
}: TuiModelConfigModalProps) {
  const theme = THEMES[currentTheme];
  const ssoState = loadGeminiSsoState();

  const [provider, setProvider] = useState<ModelProvider>(currentModel.provider);
  const [modelId, setModelId] = useState(currentModel.id);
  const [modelName, setModelName] = useState(currentModel.name);
  const [authType, setAuthType] = useState<'api_key' | 'oauth_sso'>(currentModel.authType || (ssoState.isConnected ? 'oauth_sso' : 'api_key'));
  const [apiKey, setApiKey] = useState(currentModel.apiKey || '');
  const [oauthToken, setOauthToken] = useState(currentModel.oauthToken || ssoState.accessToken || '');
  const [baseUrl, setBaseUrl] = useState(currentModel.baseUrl || '');
  const [maxTokens, setMaxTokens] = useState(currentModel.maxTokens || 8192);
  const [temperature, setTemperature] = useState(currentModel.temperature || 0.2);
  const [systemPrompt, setSystemPrompt] = useState(currentModel.systemPrompt || '');

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging Model API Endpoint...');

    try {
      const startTime = performance.now();
      const testConfig: ModelConfig = {
        id: modelId,
        name: modelName,
        provider,
        authType: provider === 'gemini' ? authType : 'api_key',
        apiKey: authType === 'api_key' ? apiKey : undefined,
        oauthToken: authType === 'oauth_sso' ? (oauthToken || ssoState.accessToken) : undefined,
        baseUrl,
        maxTokens,
        temperature,
        inputCostPer1M: 0,
        outputCostPer1M: 0,
        contextWindow: 128000,
        systemPrompt,
      };

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelConfig: testConfig,
          messages: [{ role: 'user', content: 'Say "OK"' }],
        }),
      });

      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMessage(`✔ Connection Successful! Latency: ${latency}ms`);
      } else {
        const errData = await res.json();
        setTestStatus('error');
        setTestMessage(`✖ Connection Failed (${res.status}): ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`✖ Network error: ${err.message}`);
    }
  };

  const handleApply = () => {
    const updated: ModelConfig = {
      id: modelId,
      name: modelName,
      provider,
      authType: provider === 'gemini' ? authType : 'api_key',
      apiKey: authType === 'api_key' ? apiKey : undefined,
      oauthToken: authType === 'oauth_sso' ? (oauthToken || ssoState.accessToken) : undefined,
      baseUrl,
      maxTokens,
      temperature,
      inputCostPer1M: currentModel.inputCostPer1M || 1.0,
      outputCostPer1M: currentModel.outputCostPer1M || 3.0,
      contextWindow: currentModel.contextWindow || 128000,
      systemPrompt,
    };

    onSaveCustomModel(updated);
    onSelectModel(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Modal Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span className="font-extrabold text-base tracking-wide">LOAD ANY MODEL API</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Preset Model Picker */}
          <div>
            <label className="block text-xs uppercase font-bold text-slate-400 mb-2">Select Pre-Configured Model:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setProvider(m.provider);
                    setModelId(m.id);
                    setModelName(m.name);
                    setBaseUrl(m.baseUrl || '');
                    setMaxTokens(m.maxTokens);
                    setTemperature(m.temperature);
                    setSystemPrompt(m.systemPrompt || '');
                  }}
                  className={`p-2.5 rounded border text-left flex flex-col transition-all ${
                    modelId === m.id ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold' : 'hover:bg-white/5 border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="truncate font-semibold">{m.name}</span>
                  <span className="text-[10px] text-slate-400 uppercase mt-0.5">{m.provider}</span>
                </button>
              ))}
            </div>
          </div>

          <hr style={{ borderColor: theme.border }} />

          {/* Model Configuration Fields */}
          <div className="space-y-3">
            <div className="font-bold text-xs uppercase text-amber-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Custom Provider & API Parameters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Provider Type:</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as ModelProvider)}
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                  style={{ borderColor: theme.border }}
                >
                  <option value="gemini">Google Gemini (@google/genai)</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="openai">OpenAI ChatGPT</option>
                  <option value="ollama">Ollama / Local Endpoint</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="groq">Groq AI</option>
                  <option value="custom">Custom OpenAI-Compatible API</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Model Name / ID:</label>
                <input
                  type="text"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="e.g. claude-3-7-sonnet-20250219 or gpt-4o"
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                  style={{ borderColor: theme.border }}
                />
              </div>
            </div>

            {/* Gemini Provider Auth Mode Selector */}
            {provider === 'gemini' && (
              <div className="p-3 rounded-lg border bg-sky-950/20 border-sky-500/30 space-y-2">
                <label className="block text-xs font-bold text-sky-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current text-sky-400" />
                    Gemini Authentication Method
                  </span>
                  <span className="text-[10px] text-emerald-400 font-normal">
                    {ssoState.isConnected ? 'Google SSO Connected' : 'Free Quota SSO Available'}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthType('oauth_sso')}
                    className={`p-2 rounded border text-left font-bold flex items-center gap-1.5 transition-all ${
                      authType === 'oauth_sso'
                        ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow'
                        : 'bg-black/30 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Google OAuth SSO (Free Quota)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthType('api_key')}
                    className={`p-2 rounded border text-left font-bold flex items-center gap-1.5 transition-all ${
                      authType === 'api_key'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow'
                        : 'bg-black/30 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Standard API Key</span>
                  </button>
                </div>
              </div>
            )}

            {/* API Key Input or OAuth SSO Token Status */}
            {authType === 'api_key' || provider !== 'gemini' ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1 flex items-center justify-between">
                  <span>API Key:</span>
                  <span className="text-[10px] text-slate-500">
                    {provider === 'gemini' ? 'Optional (Defaults to server environment key)' : 'Required for direct external call'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'gemini' ? 'Inherited from AI Studio Secrets' : 'sk-...'}
                    className="w-full bg-black/40 border rounded p-2 pr-8 text-xs text-slate-100 outline-none font-mono"
                    style={{ borderColor: theme.border }}
                  />
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Google OAuth Access Token (Free Quota Active):</label>
                <div className="relative">
                  <input
                    type="password"
                    value={oauthToken || ssoState.accessToken || ''}
                    onChange={(e) => setOauthToken(e.target.value)}
                    placeholder="ya29.a0AxM30..."
                    className="w-full bg-black/40 border rounded p-2 pr-8 text-xs text-emerald-300 border-emerald-500/40 outline-none font-mono"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Connected as: <span className="text-white font-bold">{ssoState.userEmail || 'user@gmail.com'}</span> ({ssoState.quotaTier})
                </p>
              </div>
            )}

            {/* Base URL Input for Ollama/Custom */}
            {['ollama', 'openrouter', 'groq', 'custom'].includes(provider) && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Base API URL Endpoint:</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="e.g. http://localhost:11434/v1 or https://openrouter.ai/api/v1"
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                  style={{ borderColor: theme.border }}
                />
              </div>
            )}

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Max Response Tokens: {maxTokens}</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                  className="w-full bg-black/40 border rounded p-1.5 text-xs text-slate-100 outline-none"
                  style={{ borderColor: theme.border }}
                />
              </div>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Custom System Instruction:</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are OpenCode AI coding agent..."
                rows={3}
                className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none resize-none"
                style={{ borderColor: theme.border }}
              />
            </div>
          </div>

          {/* Test Status Feedback Banner */}
          {testStatus !== 'idle' && (
            <div className={`p-3 rounded border text-xs font-mono flex items-center gap-2 ${
              testStatus === 'testing' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              testStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
              'bg-red-500/20 text-red-300 border-red-500/40'
            }`}>
              {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
              {testStatus === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
              <span>{testMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: theme.border }}>
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Test Connection
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 rounded text-slate-400 hover:text-white text-xs">
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 rounded font-bold text-xs text-black transition-colors"
              style={{ backgroundColor: theme.primary }}
            >
              Load & Activate Model
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
