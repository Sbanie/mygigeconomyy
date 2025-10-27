import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatZAR, getCurrentTaxYear, isInCurrentTaxYear } from '../lib/utils';
import {
  getComplianceStatus,
  getTaxStatusColor,
  getIncomeThresholdProgress,
  getThresholdColor,
  calculateSARSTax
} from '../lib/taxCalculator';
import { TAX_THRESHOLD } from '../lib/constants';
import { Income, Expense } from '../types';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, DollarSign, Receipt } from 'lucide-react';
import { ProvisionalTaxCoach } from './ProvisionalTaxCoach';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { profile } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      const [incomesRes, expensesRes] = await Promise.all([
        supabase.from('income').select('*').eq('user_id', profile.id).order('date', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', profile.id).order('date', { ascending: false })
      ]);

      if (incomesRes.data) setIncomes(incomesRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ytdIncome = incomes
    .filter((i) => isInCurrentTaxYear(i.date))
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const ytdExpenses = expenses
    .filter((e) => isInCurrentTaxYear(e.date) && e.is_deductible)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const taxCalc = calculateSARSTax(ytdIncome, ytdExpenses);
  const netProfit = ytdIncome - ytdExpenses;
  const complianceStatus = getComplianceStatus(profile, ytdIncome);
  const thresholdProgress = getIncomeThresholdProgress(ytdIncome);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile?.name}!</h1>
        <p className="text-gray-600 mt-1">Tax Year {getCurrentTaxYear()}</p>
      </div>

      <div className={`p-6 rounded-xl border-2 ${getTaxStatusColor(complianceStatus.status)}`}>
        <div className="flex items-start gap-4">
          <div className="mt-1">
            {complianceStatus.status === 'success' ? (
              <CheckCircle size={24} className="text-green-600" />
            ) : (
              <AlertCircle size={24} className="text-current" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Tax Compliance Status</h3>
            <p className="mb-3">{complianceStatus.message}</p>
            {complianceStatus.action && (
              <button
                onClick={() => onNavigate(complianceStatus.link ? 'learn' : 'profile')}
                className="px-4 py-2 bg-white border-2 border-current rounded-lg font-medium hover:bg-opacity-50 transition-colors"
              >
                {complianceStatus.action}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-lg mb-4">Income vs Tax Threshold</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Year-to-date income</span>
            <span className="font-semibold text-gray-900">{formatZAR(ytdIncome)}</span>
          </div>
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute h-full ${getThresholdColor(thresholdProgress)} transition-all duration-500`}
              style={{ width: `${thresholdProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax threshold</span>
            <span className="font-semibold text-gray-900">{formatZAR(TAX_THRESHOLD)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Income</span>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(ytdIncome)}</p>
          <p className="text-xs text-gray-500 mt-1">Year-to-date</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Expenses</span>
            <TrendingDown size={20} className="text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(ytdExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">Deductible only</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Estimated Tax</span>
            <Receipt size={20} className="text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(taxCalc.estimatedTax)}</p>
          <p className="text-xs text-gray-500 mt-1">{taxCalc.effectiveRate.toFixed(1)}% effective</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Net Profit</span>
            <DollarSign size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatZAR(netProfit)}</p>
          <p className="text-xs text-gray-500 mt-1">After deductions</p>
        </div>
      </div>

      <ProvisionalTaxCoach />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('income')}
          className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-6 text-left transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-gray-900">Track Income</h3>
            <TrendingUp size={24} className="text-green-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-gray-600 text-sm">Add new income from your platforms and clients</p>
        </button>

        <button
          onClick={() => onNavigate('expenses')}
          className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-6 text-left transition-colors group"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-gray-900">Track Expenses</h3>
            <Receipt size={24} className="text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-gray-600 text-sm">Record SARS-compliant deductible expenses</p>
        </button>
      </div>

      {incomes.length === 0 && expenses.length === 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-lg text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600 mb-4">
            Start tracking your income and expenses to see your tax obligations and financial insights.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => onNavigate('income')}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Income
            </button>
            <button
              onClick={() => onNavigate('expenses')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Expense
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
