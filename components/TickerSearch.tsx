
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Search, Loader2, Tag, Check } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastProcessedQuery = useRef<string>('');

  // Sync internal query with external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Robust Debounce for Mobile
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Show loading/dropdown immediately on mobile for feedback
    setIsOpen(true);

    const timer = setTimeout(() => {
      if (query !== lastProcessedQuery.current) {
        searchTickers(query);
        lastProcessedQuery.current = query;
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    // Using pointerdown for better mobile support (handles touch and mouse)
    const handleClickOutside = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const searchTickers = async (searchTerm: string) => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the 5 most relevant stock ticker symbols for: "${searchTerm}". Include both global (e.g. AAPL) and regional stocks (e.g. 2330.TW). Return exactly 5 items.`,
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

      const results = JSON.parse(response.text || "[]");
      setSuggestions(results);
    } catch (error) {
      console.error("Ticker search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
  };

  const selectSuggestion = (s: Suggestion) => {
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
          spellCheck="false"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className={`w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 ${ringClass} outline-none transition-all uppercase placeholder:normal-case text-base`}
        />
        <div className="absolute right-3 top-3.5">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-slate-400" />
          ) : (
            <Search size={18} className="text-slate-300" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && suggestions.length === 0 ? (
            <div className="p-5 text-center text-sm text-slate-500 flex items-center justify-center space-x-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Searching...</span>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onPointerDown={() => selectSuggestion(s)}
                  className="w-full text-left px-5 py-4 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 text-base">{s.ticker}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[180px]">{s.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.exchange}</span>
                    {value === s.ticker && <Check size={16} className="text-emerald-500 mt-1" />}
                  </div>
                </button>
              ))}
              {suggestions.length === 0 && !loading && (
                <div className="p-5 text-center text-sm text-slate-400 italic">
                  No matches found.
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
