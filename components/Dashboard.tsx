
import React, { useMemo } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Bar,
  Line,
  ComposedChart,
  Legend,
  ReferenceLine
} from 'recharts';
import { Transaction, Dividend, Holding, TransactionType } from '../types';
import { TrendingUp, DollarSign, Wallet, Activity, ArrowUpRight, BarChart3, Percent } from 'lucide-react';
import AIInsights from './AIInsights';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#0891b2'];

interface DashboardProps {
  holdings: Holding[];
  transactions: Transaction[];
  dividends: Dividend[];
}

const StatCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 h-full">
    <div className={`p-3 rounded-xl ${colorClass} flex-shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
      <h3 className="text-xl font-bold text-slate-900 leading-tight mt-0.5">
        {value}
      </h3>
      {subValue && (
        <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate">
          {subValue}
        </p>
      )}
    </div>
  </div>
);

// Robust year extraction from date string
const getYearFromDate = (dateStr: string) => {
  const match = dateStr.match(/(\d{4})/);
  return match ? match[0] : new Date().getFullYear().toString();
};

const Dashboard: React.FC<DashboardProps> = ({ holdings, transactions, dividends }) => {
  const currentYear = new Date().getFullYear().toString();
  const prevYear = (new Date().getFullYear() - 1).toString();
  const monthsPassed = new Date().getMonth() + 1;

  const totalInvestedAtCost = useMemo(() => holdings.reduce((acc, h) => acc + h.totalInvested, 0), [holdings]);

  const { yearlyData, currentYearStats, prevYearStats, totalStats } = useMemo(() => {
    const years: Record<string, { dividend: number; capitalGain: number }> = {};
    let allTimeRealizedGain = 0;
    let allTimeDividends = 0;
    
    // 1. Initialize unique years
    transactions.forEach(t => {
      const yr = getYearFromDate(t.date);
      if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
    });
    dividends.forEach(d => {
      const yr = getYearFromDate(d.date);
      if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
    });

    // 2. Sort & Process Gains precisely
    const sortedTx = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.type === TransactionType.BUY ? -1 : 1;
    });

    const costBasisMap: Record<string, { qty: number; totalCost: number }> = {};
    sortedTx.forEach(t => {
      const yr = getYearFromDate(t.date);
      if (t.type === TransactionType.BUY) {
        if (!costBasisMap[t.ticker]) costBasisMap[t.ticker] = { qty: 0, totalCost: 0 };
        costBasisMap[t.ticker].qty += t.quantity;
        costBasisMap[t.ticker].totalCost += (t.quantity * t.price + t.fees);
      } else if (t.type === TransactionType.SELL) {
        if (costBasisMap[t.ticker] && costBasisMap[t.ticker].qty > 0) {
          const avgPrice = costBasisMap[t.ticker].totalCost / costBasisMap[t.ticker].qty;
          const actualSoldQty = Math.min(t.quantity, costBasisMap[t.ticker].qty);
          const netProceeds = (t.price * actualSoldQty) - (t.fees * (actualSoldQty / t.quantity));
          const costOfSharesSold = avgPrice * actualSoldQty;
          const gain = netProceeds - costOfSharesSold;
          
          if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
          years[yr].capitalGain += gain;
          allTimeRealizedGain += gain;
          
          costBasisMap[t.ticker].qty -= actualSoldQty;
          costBasisMap[t.ticker].totalCost = costBasisMap[t.ticker].qty * avgPrice;
        }
      }
    });

    // 3. Sum Dividends
    dividends.forEach(d => {
      const yr = getYearFromDate(d.date);
      if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
      years[yr].dividend += d.amount;
      allTimeDividends += d.amount;
    });

    // 4. Transform to array
    let runningTotalProfit = 0;
    const sortedYears = Object.keys(years).sort();
    const yearlyDataArray = sortedYears.map(yr => {
      const yearlyProfit = years[yr].dividend + years[yr].capitalGain;
      runningTotalProfit += yearlyProfit;
      return {
        year: yr,
        dividend: years[yr].dividend,
        capitalGain: years[yr].capitalGain,
        cumulativeProfit: runningTotalProfit
      };
    });

    return { 
      yearlyData: yearlyDataArray,
      currentYearStats: years[currentYear] || { dividend: 0, capitalGain: 0 },
      prevYearStats: years[prevYear] || { dividend: 0, capitalGain: 0 },
      totalStats: { dividend: allTimeDividends, capitalGain: allTimeRealizedGain }
    };
  }, [dividends, transactions, currentYear, prevYear]);

  // Derived metrics for Growth Card
  const divGrowth = prevYearStats.dividend > 0 
    ? ((currentYearStats.dividend - prevYearStats.dividend) / prevYearStats.dividend * 100) 
    : 0;
  const gainGrowth = prevYearStats.capitalGain !== 0 
    ? ((currentYearStats.capitalGain - prevYearStats.capitalGain) / Math.abs(prevYearStats.capitalGain) * 100) 
    : 0;

  const monthlyAvgCombined = (currentYearStats.dividend + currentYearStats.capitalGain) / monthsPassed;

  const allocationData = useMemo(() => {
    return holdings.map(h => ({
      name: h.ticker,
      value: h.totalInvested
    })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Growth Rates */}
        <StatCard 
          title="Annual Performance Growth" 
          value={`D: ${divGrowth >= 0 ? '+' : ''}${divGrowth.toFixed(1)}% | G: ${gainGrowth >= 0 ? '+' : ''}${gainGrowth.toFixed(1)}%`}
          subValue={`YoY Comparison (${prevYear} to ${currentYear})`}
          icon={Percent}
          colorClass="bg-blue-50 text-blue-600"
        />
        
        {/* Card 2: Current Year Dividends (Main) / Lifetime (Sub) */}
        <StatCard 
          title={`${currentYear} Dividends`} 
          value={`$${currentYearStats.dividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`Lifetime Total: $${totalStats.dividend.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600"
        />

        {/* Card 3: Current Year Gains (Main) / Lifetime (Sub) */}
        <StatCard 
          title={`${currentYear} Realized Gains`} 
          value={`$${currentYearStats.capitalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`Lifetime Total: $${totalStats.capitalGain.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          colorClass={currentYearStats.capitalGain >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-600"}
        />

        {/* Card 4: Monthly Average */}
        <StatCard 
          title={`${currentYear} Monthly Avg`} 
          value={`$${monthlyAvgCombined.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue="Monthly Combined Returns"
          icon={BarChart3}
          colorClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Main Performance Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Growth & Gains Evolution</h3>
            <p className="text-sm text-slate-500">Visualization of annual returns and cumulative success</p>
          </div>
          <div className="bg-slate-50 p-2 rounded-xl text-indigo-600">
             <TrendingUp size={24} />
          </div>
        </div>
        <div className="h-[400px] w-full">
          {yearlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '']}
                />
                <Legend verticalAlign="top" height={40} iconType="circle" />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                
                <Bar 
                  name="Annual Realized Gain" 
                  dataKey="capitalGain" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />
                
                <Bar 
                  name="Annual Dividends" 
                  dataKey="dividend" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={30}
                />

                <Line
                  name="Cumulative Wealth Created"
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
               <Activity size={48} className="mb-4 opacity-20" />
               <p>Provide transaction data to generate your performance map.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Asset Distribution</h3>
          <div className="h-[400px] w-full">
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: number) => `$${value.toLocaleString()}`}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">
                Inventory data is required for allocation view.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI 分析區域 */}
      <div className="mt-12">
        <AIInsights holdings={holdings} transactions={transactions} />
      </div>
    </div>
  );
};

export default Dashboard;
