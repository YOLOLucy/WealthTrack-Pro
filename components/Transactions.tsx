
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Plus, Calendar, Hash, DollarSign, ExternalLink, Trash2 } from 'lucide-react';
import TickerSearch, { Suggestion } from './TickerSearch';

interface TransactionsProps {
  transactions: Transaction[];
  onAdd: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ticker: '',
    name: '',
    type: TransactionType.BUY,
    quantity: '',
    price: '',
    fees: '0'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticker || !formData.quantity || !formData.price) return;

    onAdd({
      id: Date.now().toString(),
      date: formData.date,
      ticker: formData.ticker.toUpperCase(),
      name: formData.name || formData.ticker.toUpperCase(),
      type: formData.type,
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      fees: parseFloat(formData.fees || '0')
    });
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      ticker: '',
      name: '',
      type: TransactionType.BUY,
      quantity: '',
      price: '',
      fees: '0'
    });
    setShowForm(false);
  };

  const handleTickerSelect = (s: Suggestion) => {
    setFormData(prev => ({ ...prev, ticker: s.ticker, name: s.name }));
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">New Transaction</h3>
            <button 
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600 font-medium"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Ticker Symbol (Auto-lookup)</label>
              <TickerSearch 
                value={formData.ticker}
                onChange={(val) => setFormData({...formData, ticker: val})}
                onSelect={handleTickerSelect}
                placeholder="e.g. Apple or AAPL"
              />
              {formData.name && (
                <p className="text-xs text-blue-600 font-medium px-1">Selected: {formData.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white transition-all"
              >
                <option value={TransactionType.BUY}>Buy</option>
                <option value={TransactionType.SELL}>Sell</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Quantity</label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="number" step="any"
                  inputMode="decimal"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Price (Per Share)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="number" step="any"
                  inputMode="decimal"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Fees</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
                <input 
                  type="number" step="any"
                  inputMode="decimal"
                  value={formData.fees}
                  onChange={e => setFormData({...formData, fees: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                />
              </div>
            </div>
            <div className="lg:col-span-3">
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-100"
              >
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-sm"
        >
          <Plus size={20} />
          <span className="font-semibold">Add New Transaction</span>
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticker</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...transactions].sort((a,b) => b.date.localeCompare(a.date)).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{t.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <a 
                        href={`https://www.google.com/finance/quote/${t.ticker}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center space-x-1 transition-colors"
                      >
                        <span>{t.ticker}</span>
                        <ExternalLink size={12} className="opacity-40" />
                      </a>
                      <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      t.type === 'BUY' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{t.quantity}</td>
                  <td className="px-6 py-4 text-slate-600">${t.price.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    ${(t.quantity * t.price + (t.type === 'BUY' ? t.fees : -t.fees)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Transaction"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
