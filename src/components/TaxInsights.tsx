import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatZAR, getCurrentTaxYear, isInCurrentTaxYear } from '../lib/utils';
import { calculateSARSTax } from '../lib/taxCalculator';
import { TAX_THRESHOLD, TAX_BRACKETS } from '../lib/constants';
import { Income, Expense } from '../types';
import { Calculator, TrendingUp, AlertCircle, FileSpreadsheet, FileText, Download, Send, X } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../lib/exportUtils';

export const TaxInsights = () => {
  const { profile } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      const [incomesRes, expensesRes] = await Promise.all([
        supabase.from('income').select('*').eq('user_id', profile.id),
        supabase.from('expenses').select('*').eq('user_id', profile.id)
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

  const handleExportExcel = () => {
    if (!profile) return;

    const ytdIncomes = incomes.filter((i) => isInCurrentTaxYear(i.date));
    const ytdExpensesData = expenses.filter((e) => isInCurrentTaxYear(e.date));

    exportToExcel({
      incomes: ytdIncomes,
      expenses: ytdExpensesData,
      userProfile: {
        name: profile.name || 'Unknown',
        email: profile.email || '',
        taxNumber: profile.tax_number || undefined,
        idNumber: profile.id_number || undefined
      }
    });
  };

  const handleExportPDF = () => {
    if (!profile) return;

    const ytdIncomes = incomes.filter((i) => isInCurrentTaxYear(i.date));
    const ytdExpensesData = expenses.filter((e) => isInCurrentTaxYear(e.date));

    exportToPDF({
      incomes: ytdIncomes,
      expenses: ytdExpensesData,
      userProfile: {
        name: profile.name || 'Unknown',
        email: profile.email || '',
        taxNumber: profile.tax_number || undefined,
        idNumber: profile.id_number || undefined
      }
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading tax insights...</div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-blue-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Coming Soon!
              </h2>

              <p className="text-gray-600 mb-4">
                Direct SARS eFiling integration is currently in development. This feature will allow you to file your tax returns directly from MyGig-Economy.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">What's Coming:</h3>
                <ul className="text-sm text-gray-700 space-y-1 text-left">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Secure connection to SARS eFiling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Auto-fill tax forms with your data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Submit returns without leaving MyGig-Economy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>Track submission status in real-time</span>
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                In the meantime, you can export your reports and file manually on{' '}
                <a
                  href="https://www.sarsefiling.co.za"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  SARS eFiling
                </a>
              </p>

              <button
                onClick={() => setShowComingSoonModal(false)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Insights</h1>
          <p className="text-gray-600 mt-1">SARS 2024/25 Tax Year Calculations</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowComingSoonModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Send size={20} />
            <span>File Returns with SARS</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet size={20} />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <FileText size={20} />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Download size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Export Your SARS Tax Reports</h3>
            <p className="text-sm text-gray-700 mb-3">
              Download comprehensive reports for your tax year with all income, expenses, and calculations formatted for SARS compliance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <FileSpreadsheet size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Excel/CSV Format</p>
                  <p className="text-gray-600">Editable spreadsheet for further analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">PDF Format</p>
                  <p className="text-gray-600">Professional report ready for submission</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calculator size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tax Summary</h2>
              <p className="text-sm text-gray-600">{getCurrentTaxYear()}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Annual Income</span>
              <span className="font-semibold text-gray-900">{formatZAR(ytdIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Deductible Expenses</span>
              <span className="font-semibold text-gray-900">- {formatZAR(ytdExpenses)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-600">Taxable Income</span>
              <span className="font-semibold text-gray-900">{formatZAR(taxCalc.taxableIncome)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-blue-50 -mx-6 px-6 rounded-lg">
              <span className="text-gray-900 font-semibold">Estimated Tax</span>
              <span className="text-2xl font-bold text-blue-600">{formatZAR(taxCalc.estimatedTax)}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Effective Tax Rate</span>
              <span className="font-semibold text-gray-900">{taxCalc.effectiveRate.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Tax Bracket</span>
              <span className="font-semibold text-gray-900 text-sm">{taxCalc.taxBracket}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp size={24} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Provisional Tax</h2>
              <p className="text-sm text-gray-600">Payment Schedule</p>
            </div>
          </div>

          {ytdIncome > TAX_THRESHOLD ? (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">First Payment</h3>
                    <p className="text-sm text-gray-600 mb-2">Due: August 31, {new Date().getFullYear()}</p>
                    <p className="text-2xl font-bold text-orange-600">{formatZAR(taxCalc.provisionalFirstPayment)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Second Payment</h3>
                    <p className="text-sm text-gray-600 mb-2">Due: February 28, {new Date().getFullYear() + 1}</p>
                    <p className="text-2xl font-bold text-orange-600">{formatZAR(taxCalc.provisionalSecondPayment)}</p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">Payment Methods:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>SARS eFiling platform</li>
                  <li>EFT to SARS bank account</li>
                  <li>Debit order arrangement</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-gray-600">
                Your income is below R{TAX_THRESHOLD.toLocaleString()} threshold.
                <br />
                No provisional tax payments required.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">SARS 2024/25 Tax Brackets</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Income Range</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tax Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Base Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {TAX_BRACKETS.map((bracket, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    R{bracket.min.toLocaleString()} - {bracket.max === Infinity ? 'R1,817,001+' : `R${bracket.max.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{(bracket.rate * 100).toFixed(0)}%</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatZAR(bracket.base)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Important Reminders</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span>•</span>
            <span>Tax year runs from March 1 to February 28</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Register for eFiling at <span className="font-medium">www.sarsefiling.co.za</span></span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Keep all receipts and records for 5 years</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>VAT registration required if turnover exceeds R1 million</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Consider hiring a tax practitioner for complex situations</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
