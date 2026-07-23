import React, { useState } from 'react';
import { WebSearchResult, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { 
  Globe, 
  Search, 
  ExternalLink, 
  FileText, 
  X, 
  Loader2, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface TuiWebSearchModalProps {
  onSendMessage: (msg: string) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiWebSearchModal({
  onSendMessage,
  onClose,
  currentTheme,
}: TuiWebSearchModalProps) {
  const theme = THEMES[currentTheme];

  const [query, setQuery] = useState('');
  const [urlToRead, setUrlToRead] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);
  const [readContent, setReadContent] = useState<{ title: string; url: string; text: string } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setReadContent(null);

    try {
      const res = await fetch('/api/tools/web-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error('Web search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleReadUrl = async (targetUrl: string) => {
    setIsReading(true);
    try {
      const res = await fetch('/api/tools/web-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      setReadContent({
        title: data.title || targetUrl,
        url: data.url || targetUrl,
        text: data.content || 'Failed to extract text from page.',
      });
    } catch (err) {
      console.error('Web read failed:', err);
    } finally {
      setIsReading(false);
    }
  };

  const handleInjectIntoAgent = (text: string) => {
    onSendMessage(`[Web Context Data Injected]:\n${text}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-3xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <Globe className="w-5 h-5 text-sky-400" />
            <span>WEB SEARCH & WEB READER ENGINE</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              LIVE INTERNET INSPECTOR
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search web documentation, API references, GitHub, security CVEs..."
                className="w-full pl-9 pr-3 py-2 bg-black/40 border rounded text-xs text-slate-100 outline-none focus:border-sky-500 font-mono"
                style={{ borderColor: theme.border }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 rounded font-bold text-xs bg-sky-600 text-white hover:bg-sky-500 shrink-0 flex items-center gap-1.5"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Search Web</span>
            </button>
          </form>

          {/* URL Reader Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={urlToRead}
              onChange={(e) => setUrlToRead(e.target.value)}
              placeholder="Or paste full URL to read content (e.g. https://docs.github.com/...)"
              className="flex-1 px-3 py-2 bg-black/40 border rounded text-xs text-slate-100 outline-none focus:border-sky-500 font-mono"
              style={{ borderColor: theme.border }}
            />
            <button
              type="button"
              onClick={() => urlToRead && handleReadUrl(urlToRead)}
              disabled={isReading || !urlToRead.trim()}
              className="px-4 py-2 rounded font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-500 shrink-0 flex items-center gap-1.5"
            >
              {isReading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              <span>Read Web Page</span>
            </button>
          </div>

          {/* Active Read Page Result */}
          {readContent && (
            <div className="p-4 rounded-lg border bg-emerald-950/20 border-emerald-800 space-y-2 font-mono">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="truncate">{readContent.title}</span>
                <button
                  onClick={() => handleInjectIntoAgent(`URL: ${readContent.url}\nTitle: ${readContent.title}\nContent:\n${readContent.text}`)}
                  className="px-3 py-1 rounded bg-emerald-500 text-black font-bold text-xs flex items-center gap-1"
                >
                  <span>Inject into Agent</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-black/60 p-3 rounded text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {readContent.text}
              </div>
            </div>
          )}

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Web Search Results for "{query}":
              </div>

              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border bg-black/40 flex flex-col gap-1.5 hover:border-sky-500/50 transition-colors font-mono"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sky-400 hover:underline flex items-center gap-1 text-xs truncate"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReadUrl(item.link)}
                        className="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 text-[10px] font-bold border border-sky-500/30"
                      >
                        Scrape Content
                      </button>

                      <button
                        onClick={() => handleInjectIntoAgent(`Web Search snippet for [${item.title}]: ${item.snippet} (URL: ${item.link})`)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[10px] font-bold border border-emerald-500/30"
                      >
                        Inject Snippet
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{item.snippet}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold text-xs text-black"
            style={{ backgroundColor: theme.primary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
