
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Holding, Transaction } from '../types';
import { BrainCircuit, Sparkles, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AIInsightsProps {
  holdings: Holding[];
  transactions: Transaction[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ holdings, transactions }) => {
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As a senior financial advisor, analyze this investment portfolio:
        Current Holdings: ${JSON.stringify(holdings.map(h => ({ ticker: h.ticker, totalInvested: h.totalInvested })))}
        Total Transactions: ${transactions.length}
        
        Please provide:
        1. A brief summary of the portfolio risk (diversification check).
        2. Potential market sectors the user might be over-exposed or under-exposed to.
        3. Strategic advice for the next quarter.
        
        Keep the response professional, concise, and in markdown format. 
        Focus on these specific tickers if mentioned: ${holdings.map(h => h.ticker).join(', ')}.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setInsight(response.text || "Sorry, I couldn't generate insights at this moment.");
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AI insights. Please check your connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <Sparkles size={14} />
              <span>POWERED BY GEMINI AI</span>
            </div>
            <h2 className="text-3xl font-bold">Smart Portfolio Analysis</h2>
            <p className="text-blue-100 max-w-md">
              Get institutional-grade insights into your holdings. Our AI analyzes your transaction history and current allocation to provide strategic guidance.
            </p>
          </div>
          <div className="hidden md:block">
            <BrainCircuit size={80} className="text-white/20" />
          </div>
        </div>
        
        {!insight && !loading && (
          <button 
            onClick={generateInsights}
            disabled={holdings.length === 0}
            className="mt-8 bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={20} />
            <span>Generate Insights Now</span>
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-slate-500 font-medium">Analyzing your market position...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center space-x-3 text-red-600">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={generateInsights} className="ml-auto underline font-bold">Try again</button>
        </div>
      )}

      {insight && !loading && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
          <button 
            onClick={generateInsights}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="Regenerate Insights"
          >
            <RefreshCw size={20} />
          </button>
          
          <div className="prose prose-slate max-w-none">
             <div className="flex items-center space-x-2 text-blue-600 mb-6">
                <BrainCircuit size={24} />
                <h3 className="text-xl font-bold m-0">Advisor's Report</h3>
             </div>
             <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
               {insight}
             </div>
          </div>
        </div>
      )}
      
      {holdings.length === 0 && (
         <div className="bg-slate-50 p-12 rounded-3xl border border-slate-200 border-dashed text-center">
            <p className="text-slate-500 font-medium">Add some holdings to get started with AI Analysis.</p>
         </div>
      )}
    </div>
  );
};

export default AIInsights;
