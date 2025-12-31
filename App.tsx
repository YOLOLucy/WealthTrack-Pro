
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  PiggyBank, 
  PlusCircle, 
  Menu, 
  TrendingUp,
  Database
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Portfolio from './components/Portfolio';
import Dividends from './components/Dividends';
import DataManagement from './components/DataManagement';
import { Transaction, Dividend, Holding, TransactionType } from './types';

const INITIAL_TRANSACTIONS: Transaction[] = [];
const INITIAL_DIVIDENDS: Dividend[] = [];

const SidebarItem = ({ to, icon: Icon, label, active }: { to: string, icon: any, label: string, active: boolean }) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const AppContent = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('wt_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });
  
  const [dividends, setDividends] = useState<Dividend[]>(() => {
    try {
      const saved = localStorage.getItem('wt_dividends');
      return saved ? JSON.parse(saved) : INITIAL_DIVIDENDS;
    } catch {
      return INITIAL_DIVIDENDS;
    }
  });

  const [dividendEstimates, setDividendEstimates] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('wt_div_estimates');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem('wt_transactions', JSON.stringify(transactions));
    localStorage.setItem('wt_dividends', JSON.stringify(dividends));
    localStorage.setItem('wt_div_estimates', JSON.stringify(dividendEstimates));
  }, [transactions, dividends, dividendEstimates]);

  const updateDividendEstimate = (ticker: string, value: number) => {
    setDividendEstimates(prev => ({
      ...prev,
      [ticker]: value
    }));
  };

  const holdings = useMemo(() => {
    const map = new Map<string, Holding>();
    // Sort transactions by date and type (BUY first)
    const sortedTransactions = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.type === TransactionType.BUY ? -1 : 1;
    });

    sortedTransactions.forEach(t => {
      const current: Holding = map.get(t.ticker) || { 
        ticker: t.ticker, 
        name: t.name, 
        quantity: 0, 
        averageCost: 0, 
        totalInvested: 0,
        estimatedDividendPerShare: dividendEstimates[t.ticker] || 0,
        estimatedTotalDividend: 0
      };
      
      if (t.type === TransactionType.BUY) {
        const newQuantity = current.quantity + t.quantity;
        const newInvestment = t.quantity * t.price + t.fees;
        current.totalInvested += newInvestment;
        current.quantity = newQuantity;
        current.averageCost = current.totalInvested / newQuantity;
      } else {
        const soldQty = Math.min(t.quantity, current.quantity);
        current.quantity -= soldQty;
        if (current.quantity > 0) {
          current.totalInvested = current.quantity * current.averageCost;
        } else {
          current.totalInvested = 0;
          current.averageCost = 0;
        }
      }
      
      current.estimatedDividendPerShare = dividendEstimates[t.ticker] || 0;
      current.estimatedTotalDividend = current.quantity * (current.estimatedDividendPerShare || 0);
      
      map.set(t.ticker, current);
    });
    
    return Array.from(map.values()).filter(h => h.quantity > 0);
  }, [transactions, dividendEstimates]);

  const addTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);
  const removeTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  
  const addDividend = (d: Dividend) => setDividends(prev => [...prev, d]);
  const removeDividend = (id: string) => setDividends(prev => prev.filter(d => d.id !== id));

  const resetAllData = () => {
    setTransactions([]);
    setDividends([]);
    setDividendEstimates({});
    localStorage.clear();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <TrendingUp size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">WealthTrack Pro</h1>
          </div>

          <nav className="space-y-2">
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} />
            <SidebarItem to="/portfolio" icon={Wallet} label="Inventory" active={location.pathname === '/portfolio'} />
            <SidebarItem to="/transactions" icon={ArrowLeftRight} label="Transactions" active={location.pathname === '/transactions'} />
            <SidebarItem to="/dividends" icon={PiggyBank} label="Dividends" active={location.pathname === '/dividends'} />
            <SidebarItem to="/data" icon={Database} label="Data Manager" active={location.pathname === '/data'} />
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Total Cost (Inventory)</p>
            <p className="text-lg font-bold text-slate-900">
              ${holdings.reduce((acc, h) => acc + h.totalInvested, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <button 
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-semibold text-slate-800">
              {location.pathname === '/' ? 'Portfolio Dashboard' : 
               location.pathname === '/portfolio' ? 'Current Holdings' :
               location.pathname === '/transactions' ? 'Transaction History' :
               location.pathname === '/dividends' ? 'Dividend Rewards' : 'Data Management'}
            </h2>
          </div>
          <div className="flex items-center space-x-3">
             <Link 
                to="/transactions" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 shadow-sm transition-all"
             >
               <PlusCircle size={18} />
               <span className="hidden sm:inline">Add Trade</span>
             </Link>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard holdings={holdings} transactions={transactions} dividends={dividends} />} />
            <Route 
              path="/portfolio" 
              element={<Portfolio holdings={holdings} onUpdateEstimate={updateDividendEstimate} />} 
            />
            <Route path="/transactions" element={<Transactions transactions={transactions} onAdd={addTransaction} onDelete={removeTransaction} />} />
            <Route path="/dividends" element={<Dividends dividends={dividends} onAdd={addDividend} onDelete={removeDividend} />} />
            <Route 
              path="/data" 
              element={
                <DataManagement 
                  transactions={transactions} 
                  dividends={dividends} 
                  onImportTransactions={setTransactions} 
                  onImportDividends={setDividends}
                  onResetAll={resetAllData}
                />
              } 
            />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
