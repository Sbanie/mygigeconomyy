import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateSARSTax } from '../lib/taxCalculator';
import { formatZAR } from '../lib/utils';
import { Calendar, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ProvisionalTaxCoach = () => {
  const { profile } = useAuth();
  const [ytdCashIncome, setYtdCashIncome] = useState(0);
  const [ytdFMVIncome, setYtdFMVIncome] = useState(0);
  const [ytdDeductions, setYtdDeductions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaxData();
  }, [profile]);

  const loadTaxData = async () => {
    if (!profile) return;

    try {
      const currentYear = new Date().getFullYear();
      const month = new Date().getMonth();
      const taxYearStart = month >= 2 ? `${currentYear}-03-01` : `${currentYear - 1}-03-01`;
      const taxYearEnd = month >= 2 ? `${currentYear + 1}-02-28` : `${currentYear}-02-28`;

      const { data: incomeData } = await supabase
        .from('income')
        .select('amount, value_type')
        .eq('user_id', profile.id)
        .gte('date', taxYearStart)
        .lte('date', taxYearEnd);

      const cashIncome = incomeData?.filter(i => i.value_type !== 'non_monetary')
        .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      const { data: fmvData } = await supabase
        .from('fair_market_values')
        .select('fmv_amount')
        .eq('user_id', profile.id)
        .gte('valuation_date', taxYearStart)
        .lte('valuation_date', taxYearEnd);

      const fmvIncome = fmvData?.reduce((sum, f) => sum + Number(f.fmv_amount), 0) || 0;

      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount, is_deductible, max_deductible_percentage')
        .eq('user_id', profile.id)
        .eq('is_deductible', true)
        .gte('date', taxYearStart)
        .lte('date', taxYearEnd);

      const deductions = expenseData?.reduce((sum, e) => {
        const percentage = e.max_deductible_percentage || 100;
        return sum + (Number(e.amount) * percentage / 100);
      }, 0) || 0;

      setYtdCashIncome(cashIncome);
      setYtdFMVIncome(fmvIncome);
      setYtdDeductions(deductions);
    } catch (error) {
      console.error('Error loading tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading tax position...</div>;
  }

  const totalIncome = ytdCashIncome + ytdFMVIncome;
  const taxCalc = calculateSARSTax(totalIncome, ytdDeductions);

  const firstPaymentDate = new Date();
  firstPaymentDate.setMonth(7);
  firstPaymentDate.setDate(31);

  const secondPaymentDate = new Date();
  secondPaymentDate.setMonth(1);
  secondPaymentDate.setDate(28);

  const today = new Date();
  const firstPaymentPassed = today > firstPaymentDate;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Provisional Tax Coach</h2>
        <TrendingUp className="text-blue-600" size={24} />
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Your Tax Position</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Cash Income (YTD):</span>
              <span className="font-medium">{formatZAR(ytdCashIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">+ Fair Market Value:</span>
              <span className="font-medium">{formatZAR(ytdFMVIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">- Deductions:</span>
              <span className="font-medium">-{formatZAR(ytdDeductions)}</span>
            </div>
            <div className="border-t-2 border-blue-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Taxable Income:</span>
                <span className="font-bold text-blue-600">{formatZAR(taxCalc.taxableIncome)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="text-green-600" size={20} />
            <h3 className="font-semibold text-gray-900">Tax Bracket & Rate</h3>
          </div>
          <p className="text-sm text-gray-700 mb-2">{taxCalc.taxBracket}</p>
          <div className="flex justify-between items-end">
            <span className="text-sm text-gray-700">Effective Tax Rate:</span>
            <span className="text-2xl font-bold text-green-600">{taxCalc.effectiveRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-orange-600" size={20} />
            <h3 className="font-semibold text-gray-900">Estimated Tax Due</h3>
          </div>
          <div className="text-center mb-3">
            <p className="text-3xl font-bold text-gray-900">{formatZAR(taxCalc.estimatedTax)}</p>
            <p className="text-sm text-gray-600 mt-1">for the tax year</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="text-gray-600" size={20} />
            <h3 className="font-semibold text-gray-900">Provisional Tax Schedule</h3>
          </div>
          <div className="space-y-3">
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              firstPaymentPassed ? 'bg-gray-200' : 'bg-white border-2 border-orange-300'
            }`}>
              <div>
                <p className="font-medium text-gray-900">1st Payment</p>
                <p className="text-sm text-gray-600">Due: 31 August</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatZAR(taxCalc.provisionalFirstPayment)}</p>
                {firstPaymentPassed && <span className="text-xs text-gray-600">Period passed</span>}
              </div>
            </div>

            <div className={`flex justify-between items-center p-3 rounded-lg ${
              !firstPaymentPassed ? 'bg-gray-100' : 'bg-white border-2 border-orange-300'
            }`}>
              <div>
                <p className="font-medium text-gray-900">2nd Payment</p>
                <p className="text-sm text-gray-600">Due: 28 February</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{formatZAR(taxCalc.provisionalSecondPayment)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Smart Recommendations</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            {taxCalc.taxableIncome === 0 && (
              <li className="flex gap-2">
                <span className="text-green-600">✓</span>
                <span>Great! You're below the tax threshold - no tax payable!</span>
              </li>
            )}
            {taxCalc.taxableIncome > 0 && ytdDeductions < totalIncome * 0.2 && (
              <li className="flex gap-2">
                <span className="text-orange-600">!</span>
                <span>Review your expenses - you may have unclaimed deductions</span>
              </li>
            )}
            {ytdFMVIncome > 0 && (
              <li className="flex gap-2">
                <span className="text-blue-600">i</span>
                <span>You have R{formatZAR(ytdFMVIncome)} in barter income included in calculations</span>
              </li>
            )}
            <li className="flex gap-2">
              <span className="text-blue-600">i</span>
              <span>Keep all receipts and documentation for SARS verification</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
