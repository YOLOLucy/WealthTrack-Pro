
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Search, Loader2, Tag, Check, AlertCircle } from 'lucide-react';

export interface Suggestion {
  ticker: string;
  name: string;
  exchange: string;
}

interface TickerSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
  accentColor?: string;
}

const TickerSearch: React.FC<TickerSearchProps> = ({ value, onChange, onSelect, placeholder = "Enter ticker or company name", accentColor = "blue" }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastProcessedQuery = useRef<string>('');

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setError(null);

    const timer = setTimeout(() => {
      if (query !== lastProcessedQuery.current) {
        searchTickers(query);
        lastProcessedQuery.current = query;
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  const searchTickers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.trim().length < 2) return;
    
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === 'undefined') {
        throw new Error("API Key missing");
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Search for 5 stock symbols matching "${searchTerm}". 
      MUST be compatible with Yahoo Finance (e.g., 2330.TW, 0050.TW, 0700.HK, AAPL). 
      Return JSON array of objects with keys: ticker, name, exchange.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ticker: { type: Type.STRING },
                name: { type: Type.STRING },
                exchange: { type: Type.STRING }
              },
              required: ["ticker", "name", "exchange"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      
      const results = JSON.parse(text);
      setSuggestions(Array.isArray(results) ? results : []);
    } catch (err: any) {
      console.error("Ticker search failed:", err);
      if (err.message?.includes("API Key")) {
        setError("Configuration error (API Key)");
      } else {
        setError("Search service unreachable");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
  };

  const selectSuggestion = (e: React.PointerEvent, s: Suggestion) => {
    e.preventDefault();
    e.stopPropagation();
    
    setQuery(s.ticker);
    onChange(s.ticker);
    if (onSelect) onSelect(s);
    setIsOpen(false);
  };

  const ringClass = accentColor === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Tag className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck="false"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className={`w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 ${ringClass} outline-none transition-all uppercase placeholder:normal-case text-base bg-white shadow-sm`}
        />
        <div className="absolute right-3 top-3.5">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-blue-500" />
          ) : error ? (
            <AlertCircle size={18} className="text-red-400" />
          ) : (
            <Search size={18} className="text-slate-300" />
          )}
        </div>
      </div>

      {isOpen && (
        <div 
          className="absolute left-0 right-0 z-[10000] mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ maxHeight: '320px' }}
        >
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center justify-center space-y-3">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="font-medium">Searching Yahoo Finance...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-sm text-red-500 flex flex-col items-center space-y-2">
              <AlertCircle size={20} />
              <span className="font-medium">{error}</span>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[310px] overscroll-contain">
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  onPointerDown={(e) => selectSuggestion(e, s)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-900 text-base">{s.ticker}</span>
                    <span className="text-xs text-slate-500 truncate">{s.name}</span>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 ml-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.exchange}</span>
                    {value === s.ticker && <Check size={18} className="text-emerald-500 mt-1" />}
                  </div>
                </div>
              ))}
              {suggestions.length === 0 && !loading && !error && (
                <div className="p-8 text-center text-sm text-slate-400 italic">
                  No matches found. Try again.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TickerSearch;
