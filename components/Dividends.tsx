
import React, { useState } from 'react';
import { Dividend } from '../types';
import { Plus, Calendar, DollarSign, ExternalLink, Trash2 } from 'lucide-react';
import TickerSearch, { Suggestion } from './TickerSearch';

interface DividendsProps {
  dividends: Dividend[];
  onAdd: (d: Dividend) => void;
  onDelete: (id: string) => void;
}

const Dividends: React.FC<DividendsProps> = ({ dividends, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ticker: '',
    name: '',
    amount: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticker || !formData.amount) return;

    onAdd({
      id: Date.now().toString(),
      date: formData.date,
      ticker: formData.ticker.toUpperCase(),
      name: formData.name || formData.ticker.toUpperCase(),
      amount: parseFloat(formData.amount)
    });
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ticker: '',
      name: '',
      amount: ''
    });
    setShowForm(false);
  };

  const handleTickerSelect = (s: Suggestion) => {
    setFormData(prev => ({ ...prev, ticker: s.ticker, name: s.name }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-bold text-slate-900">Dividend Tracker</h3>
           <p className="text-slate-500 text-sm">Monitor your passive income stream</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
          >
            <Plus size={20} />
            <span className="font-semibold">Record Dividend</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">New Dividend Payment</h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date Received</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Ticker Symbol (Auto-lookup)</label>
              <TickerSearch 
                value={formData.ticker}
                onChange={(val) => setFormData({...formData, ticker: val})}
                onSelect={handleTickerSelect}
                placeholder="e.g. KO or Coca Cola"
                accentColor="emerald"
              />
              {formData.name && (
                <p className="text-xs text-emerald-600 font-medium px-1">Selected: {formData.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Amount Received</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="number" step="any"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-100"
              >
                Save Dividend
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticker</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...dividends].sort((a,b) => b.date.localeCompare(a.date)).map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-slate-600 text-sm">{d.date}</td>
                  <td className="px-6 py-4">
                    <a 
                      href={`https://finance.yahoo.com/quote/${d.ticker}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center space-x-1 transition-colors"
                    >
                      <span>{d.ticker}</span>
                      <ExternalLink size={12} className="opacity-40" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-slate-700 text-sm font-medium">{d.name}</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    +${d.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(d.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Dividend Record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {dividends.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                     No dividend records found.
                   </td>
                </tr>
              )}
            </tbody>
            {dividends.length > 0 && (
               <tfoot className="bg-emerald-50/50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 font-bold text-slate-700">Lifetime Total Dividends</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-700 text-lg">
                      ${dividends.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
               </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dividends;
