import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatZAR, formatDate, formatDateInput } from '../lib/utils';
import { EXPENSE_CATEGORIES } from '../lib/constants';
import { Expense } from '../types';
import { Plus, Edit2, Trash2, X, Receipt, CheckCircle, XCircle, Sparkles, AlertCircle } from 'lucide-react';
import { analyzeExpenseDeductibility, suggestExpenseCategory } from '../lib/sarsDeductionRules';

export const ExpenseTracker = () => {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: formatDateInput(new Date()),
    amount: '',
    category: '',
    is_deductible: true,
    description: '',
    vat_amount: '0'
  });
  const [aiAnalysis, setAiAnalysis] = useState<ReturnType<typeof analyzeExpenseDeductibility> | null>(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [profile]);

  const loadExpenses = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      const expenseData = {
        user_id: profile.id,
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: formData.category,
        is_deductible: formData.is_deductible,
        description: formData.description,
        vat_amount: parseFloat(formData.vat_amount),
        suggested_category: aiAnalysis?.sarsSection ? formData.category : null,
        deductibility_score: aiAnalysis?.deductibilityScore || 100,
        sars_section: aiAnalysis?.sarsSection || null,
        max_deductible_amount: aiAnalysis?.maxDeductibleAmount || parseFloat(formData.amount),
        max_deductible_percentage: aiAnalysis?.maxDeductiblePercentage || 100,
        ai_reasoning: aiAnalysis?.reasoning || null,
        warnings: aiAnalysis?.warnings || null,
        required_documentation: aiAnalysis?.requiredDocumentation || null,
        potential_deduction: aiAnalysis?.potentialDeduction || parseFloat(formData.amount),
        optimization_tips: aiAnalysis?.optimizationTips || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('expenses').insert(expenseData);

        if (error) throw error;
      }

      setAiAnalysis(null);
      setShowAiSuggestion(false);
      resetForm();
      await loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      date: expense.date,
      amount: expense.amount.toString(),
      category: expense.category,
      is_deductible: expense.is_deductible,
      description: expense.description,
      vat_amount: expense.vat_amount.toString()
    });
    setEditingId(expense.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);

      if (error) throw error;
      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      date: formatDateInput(new Date()),
      amount: '',
      category: '',
      is_deductible: true,
      description: '',
      vat_amount: '0'
    });
    setEditingId(null);
    setShowForm(false);
    setAiAnalysis(null);
    setShowAiSuggestion(false);
  };

  const handleDescriptionChange = (description: string) => {
    setFormData({ ...formData, description });

    if (description.trim().length > 5) {
      const suggestedCategory = suggestExpenseCategory(description);
      if (!formData.category || showAiSuggestion) {
        setFormData(prev => ({ ...prev, category: suggestedCategory }));
        setShowAiSuggestion(true);
      }
    }
  };

  const analyzeExpense = () => {
    if (!formData.amount || !formData.category || !formData.description) return;

    const analysis = analyzeExpenseDeductibility(
      parseFloat(formData.amount),
      formData.category,
      formData.description
    );

    setAiAnalysis(analysis);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const deductibleExpenses = expenses
    .filter((e) => e.is_deductible)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading expenses...</div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Tracker</h1>
          <p className="text-gray-600 mt-1">SARS-compliant expense tracking</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Total Expenses</span>
            <Receipt size={20} className="text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatZAR(totalExpenses)}</p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Deductible Expenses</span>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatZAR(deductibleExpenses)}</p>
        </div>
      </div>

      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 mb-2">SARS Compliance Reminder</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>Keep receipts for all expenses for 5 years</li>
          <li>Home office expenses limited to 50% of costs</li>
          <li>Travel requires a log book for deduction</li>
        </ul>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SARS Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">VAT Amount (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.vat_amount}
                  onChange={(e) => setFormData({ ...formData, vat_amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onBlur={analyzeExpense}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the expense (AI will suggest category)"
                required
              />
              {showAiSuggestion && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <Sparkles size={16} />
                  <span>AI suggested category</span>
                </div>
              )}
            </div>

            {aiAnalysis && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-blue-600" size={20} />
                  <h3 className="font-semibold text-gray-900">AI Deduction Analysis</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Deductibility Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            aiAnalysis.deductibilityScore >= 80 ? 'bg-green-500' :
                            aiAnalysis.deductibilityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${aiAnalysis.deductibilityScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900">{aiAnalysis.deductibilityScore}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">SARS Section</p>
                    <p className="font-semibold text-gray-900">{aiAnalysis.sarsSection}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Max Deductible</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatZAR(aiAnalysis.maxDeductibleAmount)}
                    {aiAnalysis.maxDeductiblePercentage < 100 && (
                      <span className="text-sm text-gray-600 ml-2">({aiAnalysis.maxDeductiblePercentage}%)</span>
                    )}
                  </p>
                  {aiAnalysis.maxDeductibleAmount < parseFloat(formData.amount) && (
                    <p className="text-sm text-orange-600 mt-1">
                      Save {formatZAR(parseFloat(formData.amount) - aiAnalysis.maxDeductibleAmount)} in taxes!
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Reasoning</p>
                  <p className="text-sm text-gray-600">{aiAnalysis.reasoning}</p>
                </div>

                {aiAnalysis.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Warnings</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {aiAnalysis.warnings.map((warning, idx) => (
                            <li key={idx}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {aiAnalysis.optimizationTips.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Optimization Tips</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {aiAnalysis.optimizationTips.map((tip, idx) => (
                        <li key={idx}>💡 {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Required Documentation</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {aiAnalysis.requiredDocumentation.map((doc, idx) => (
                      <li key={idx}>📄 {doc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_deductible"
                checked={formData.is_deductible}
                onChange={(e) => setFormData({ ...formData, is_deductible: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_deductible" className="text-sm font-medium text-gray-700">
                Tax deductible expense
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingId ? 'Update Expense' : 'Add Expense'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <Receipt size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No expense records yet</p>
            <p>Start tracking your SARS-compliant deductible expenses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Deductible</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatZAR(Number(expense.amount))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{expense.category}</td>
                    <td className="px-6 py-4 text-sm">
                      {expense.is_deductible ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <XCircle size={18} className="text-red-600" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
