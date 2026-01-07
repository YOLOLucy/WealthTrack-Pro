
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

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchTickers = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setIsOpen(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the 5 most relevant stock ticker symbols for the search query: "${searchTerm}". Include both global and regional stocks if applicable.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ticker: { type: Type.STRING, description: "The stock ticker symbol (e.g., AAPL, 2330.TW)" },
                name: { type: Type.STRING, description: "The full company name" },
                exchange: { type: Type.STRING, description: "The exchange name (e.g., NASDAQ, NYSE, TWSE)" }
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
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    
    // Simple debounce/delay logic
    const timeoutId = setTimeout(() => {
      if (val === e.target.value) searchTickers(val);
    }, 600);
    return () => clearTimeout(timeoutId);
  };

  const selectSuggestion = (s: Suggestion) => {
    setQuery(s.ticker);
    onChange(s.ticker);
    if (onSelect) onSelect(s);
    setIsOpen(false);
  };

  const ringClass = accentColor === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500';

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Tag className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className={`w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 ${ringClass} outline-none transition-all uppercase placeholder:normal-case`}
        />
        <div className="absolute right-3 top-3">
          {loading ? (
            <Loader2 size={18} className="animate-spin text-slate-400" />
          ) : (
            <Search size={18} className="text-slate-300" />
          )}
        </div>
      </div>

      {isOpen && (suggestions.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {loading && suggestions.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 flex items-center justify-center space-x-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Searching tickers...</span>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{s.ticker}</span>
                    <span className="text-xs text-slate-500 truncate max-w-[220px]">{s.name}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.exchange}</span>
                    {value === s.ticker && <Check size={14} className="text-emerald-500 mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TickerSearch;
