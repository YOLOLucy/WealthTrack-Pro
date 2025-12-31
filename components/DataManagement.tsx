
import React, { useRef, useState } from 'react';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, PiggyBank, Trash2, ShieldAlert } from 'lucide-react';
import { Transaction, Dividend, TransactionType } from '../types';

interface DataManagementProps {
  transactions: Transaction[];
  dividends: Dividend[];
  onImportTransactions: (ts: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  onImportDividends: (ds: Dividend[] | ((prev: Dividend[]) => Dividend[])) => void;
  onResetAll: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  transactions, 
  dividends, 
  onImportTransactions, 
  onImportDividends,
  onResetAll
}) => {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const transactionInputRef = useRef<HTMLInputElement>(null);
  const dividendInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    // Scroll to top so user sees the message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClearTransactions = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('確定要刪除「所有」交易紀錄嗎？此動作無法復原。')) {
      onImportTransactions([]);
      showMessage('交易紀錄已清空', 'success');
    }
  };

  const handleClearDividends = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('確定要刪除「所有」股息紀錄嗎？此動作無法復原。')) {
      onImportDividends([]);
      showMessage('股息紀錄已清空', 'success');
    }
  };

  const handleResetApp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('【危險操作】確定要重置所有資料嗎？這將會清除所有交易、股息以及您設定的估計值。')) {
      onResetAll();
      showMessage('系統已全面重置', 'success');
    }
  };

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTransactions = () => {
    const headers = ['id', 'date', 'ticker', 'name', 'type', 'quantity', 'price', 'fees'];
    const rows = transactions.map(t => [
      t.id, t.date, t.ticker, t.name, t.type, t.quantity, t.price, t.fees
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCSV(csvContent, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    showMessage('交易紀錄匯出成功', 'success');
  };

  const exportDividends = () => {
    const headers = ['id', 'date', 'ticker', 'name', 'amount'];
    const rows = dividends.map(d => [
      d.id, d.date, d.ticker, d.name, d.amount
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCSV(csvContent, `dividends_${new Date().toISOString().split('T')[0]}.csv`);
    showMessage('股息紀錄匯出成功', 'success');
  };

  const handleImportTransactions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const imported: Transaction[] = lines.slice(1).map(line => {
          const parts = line.split(',');
          return {
            id: parts[0] || Date.now().toString() + Math.random(),
            date: parts[1],
            ticker: parts[2],
            name: parts[3],
            type: parts[4] as TransactionType,
            quantity: parseFloat(parts[5]),
            price: parseFloat(parts[6]),
            fees: parseFloat(parts[7] || '0')
          };
        });
        onImportTransactions((prev) => [...prev, ...imported]);
        showMessage(`成功匯入 ${imported.length} 筆交易!`, 'success');
      } catch (err) {
        showMessage('匯入失敗，請檢查 CSV 格式。', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportDividends = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const imported: Dividend[] = lines.slice(1).map(line => {
          const parts = line.split(',');
          return {
            id: parts[0] || Date.now().toString() + Math.random(),
            date: parts[1],
            ticker: parts[2],
            name: parts[3],
            amount: parseFloat(parts[4])
          };
        });
        onImportDividends((prev) => [...prev, ...imported]);
        showMessage(`成功匯入 ${imported.length} 筆股息資料!`, 'success');
      } catch (err) {
        showMessage('匯入失敗，請檢查 CSV 格式。', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-20">
      {message && (
        <div className={`fixed top-20 right-8 z-50 flex items-center space-x-2 px-6 py-4 rounded-2xl shadow-lg border animate-in slide-in-from-right-8 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Transactions Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">交易數據管理</h3>
              <p className="text-sm text-slate-500">目前共有 {transactions.length} 筆紀錄</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={exportTransactions}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all group"
            >
              <div className="flex items-center space-x-3 text-slate-700 font-semibold">
                <Download size={20} className="text-blue-500" />
                <span>匯出 CSV 檔案</span>
              </div>
            </button>

            <div className="relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleImportTransactions} 
                ref={transactionInputRef} 
                className="hidden" 
              />
              <button 
                onClick={() => transactionInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white transition-all shadow-lg shadow-blue-100"
              >
                <div className="flex items-center space-x-3 font-semibold">
                  <Upload size={20} />
                  <span>匯入 CSV 檔案</span>
                </div>
              </button>
            </div>

            <button 
              type="button"
              onClick={handleClearTransactions}
              disabled={transactions.length === 0}
              className="w-full flex items-center justify-center space-x-2 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium disabled:opacity-30 cursor-pointer"
            >
              <Trash2 size={18} />
              <span>清空所有交易紀錄</span>
            </button>
          </div>
        </div>

        {/* Dividends Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <PiggyBank size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">股息數據管理</h3>
              <p className="text-sm text-slate-500">目前共有 {dividends.length} 筆紀錄</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={exportDividends}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all group"
            >
              <div className="flex items-center space-x-3 text-slate-700 font-semibold">
                <Download size={20} className="text-emerald-500" />
                <span>匯出 CSV 檔案</span>
              </div>
            </button>

            <div className="relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleImportDividends} 
                ref={dividendInputRef} 
                className="hidden" 
              />
              <button 
                onClick={() => dividendInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white transition-all shadow-lg shadow-emerald-100"
              >
                <div className="flex items-center space-x-3 font-semibold">
                  <Upload size={20} />
                  <span>匯入 CSV 檔案</span>
                </div>
              </button>
            </div>

            <button 
              type="button"
              onClick={handleClearDividends}
              disabled={dividends.length === 0}
              className="w-full flex items-center justify-center space-x-2 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium disabled:opacity-30 cursor-pointer"
            >
              <Trash2 size={18} />
              <span>清空所有股息紀錄</span>
            </button>
          </div>
        </div>
      </div>

      {/* Master Reset Area */}
      <div className="mt-12 bg-red-50 p-8 rounded-3xl border border-red-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-red-900">系統全面重置</h4>
            <p className="text-sm text-red-700 leading-relaxed mt-1">
              這將會清除「所有」存在瀏覽器中的資料。如果您想要更換設備或徹底重新開始，請使用此按鈕。
            </p>
          </div>
        </div>
        <button 
          type="button"
          onClick={handleResetApp}
          className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-red-200 transition-all flex items-center space-x-2 cursor-pointer"
        >
          <Trash2 size={20} />
          <span>立即重置所有資料</span>
        </button>
      </div>
    </div>
  );
};

export default DataManagement;
