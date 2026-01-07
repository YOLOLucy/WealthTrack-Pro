
import React, { useState, useEffect, useRef } from 'react';
import { Search, Tag, Check, HelpCircle } from 'lucide-react';

export interface Suggestion {
  ticker: string;
  name: string;
  exchange: string;
}

// Local database for instant suggestions
const LOCAL_STOCKS: Suggestion[] = [
  { ticker: '2330.TW', name: '台積電 (TSMC)', exchange: 'TWSE' },
  { ticker: '0050.TW', name: '元大台灣50', exchange: 'TWSE' },
  { ticker: '2317.TW', name: '鴻海 (Foxconn)', exchange: 'TWSE' },
  { ticker: '2412.TW', name: '中華電信', exchange: 'TWSE' },
  { ticker: '2454.TW', name: '聯發科', exchange: 'TWSE' },
  { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ' },
  { ticker: 'META', name: 'Meta Platforms', exchange: 'NASDAQ' },
  { ticker: '0700.HK', name: '騰訊控股', exchange: 'HKEX' },
  { ticker: '9988.HK', name: '阿里巴巴', exchange: 'HKEX' }
];

interface TickerSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
  accentColor?: string;
}

const TickerSearch: React.FC<TickerSearchProps> = ({ value, onChange, onSelect, placeholder = "Input ticker (e.g. 2330.TW)", accentColor = "blue" }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const filtered = LOCAL_STOCKS.filter(s => 
      s.ticker.toLowerCase().includes(query.toLowerCase()) || 
      s.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);

    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

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
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setQuery(val);
            onChange(val);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className={`w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 ${ringClass} outline-none transition-all text-base bg-white shadow-sm font-medium`}
        />
        <div className="absolute right-3 top-3.5">
          <Search size={18} className="text-slate-300" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-[100] mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-h-[280px] overflow-y-auto">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                onPointerDown={(e) => selectSuggestion(e, s)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-900 text-sm">{s.ticker}</span>
                  <span className="text-[10px] text-slate-500 truncate">{s.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.exchange}</span>
                  {value === s.ticker && <Check size={14} className="text-emerald-500 mt-1" />}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center text-[10px] text-slate-400 italic">
            <HelpCircle size={10} className="mr-1" />
            Can't find? Type your ticker manually.
          </div>
        </div>
      )}
    </div>
  );
};

export default TickerSearch;
