import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatZAR, formatDate, formatDateInput } from '../lib/utils';
import { SA_PLATFORMS, INCOME_CATEGORIES } from '../lib/constants';
import { Income, FairMarketValue } from '../types';
import { Plus, Edit2, Trash2, Check, X, DollarSign, Gift, Calculator } from 'lucide-react';
import { FairValueAssistant } from './FairValueAssistant';

export const IncomeTracker = () => {
  const { profile } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: formatDateInput(new Date()),
    amount: '',
    platform: '',
    client: '',
    category: 'eft' as Income['category'],
    description: '',
    is_paid: true,
    tax_withheld: '0',
    value_type: 'monetary' as 'monetary' | 'non_monetary',
    item_description: '',
    item_quantity: '1',
    income_source_type: 'direct_transfer' as Income['income_source_type'],
    campaign_name: ''
  });
  const [showFMVAssistant, setShowFMVAssistant] = useState(false);
  const [fmvIncomeId, setFmvIncomeId] = useState<string | null>(null);

  useEffect(() => {
    loadIncomes();
  }, [profile]);

  const loadIncomes = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error) {
      console.error('Error loading incomes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile) return;

    try {
      const incomeData = {
        user_id: profile.id,
        date: formData.date,
        amount: formData.value_type === 'non_monetary' ? 0 : parseFloat(formData.amount),
        platform: formData.platform,
        client: formData.client,
        category: formData.category,
        description: formData.description,
        is_paid: formData.is_paid,
        tax_withheld: parseFloat(formData.tax_withheld),
        value_type: formData.value_type,
        item_description: formData.value_type === 'non_monetary' ? formData.item_description : null,
        item_quantity: formData.value_type === 'non_monetary' ? parseInt(formData.item_quantity) : null,
        income_source_type: formData.income_source_type,
        campaign_name: formData.campaign_name || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('income')
          .update(incomeData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { data: newIncome, error } = await supabase
          .from('income')
          .insert(incomeData)
          .select()
          .single();

        if (error) throw error;

        if (formData.value_type === 'non_monetary' && newIncome) {
          setFmvIncomeId(newIncome.id);
          setShowFMVAssistant(true);
          return;
        }
      }

      resetForm();
      await loadIncomes();
    } catch (error) {
      console.error('Error saving income:', error);
      alert('Failed to save income. Please try again.');
    }
  };

  const handleEdit = (income: Income) => {
    setFormData({
      date: income.date,
      amount: income.amount.toString(),
      platform: income.platform,
      client: income.client,
      category: income.category,
      description: income.description,
      is_paid: income.is_paid,
      tax_withheld: income.tax_withheld.toString()
    });
    setEditingId(income.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;

    try {
      const { error } = await supabase.from('income').delete().eq('id', id);

      if (error) throw error;
      await loadIncomes();
    } catch (error) {
      console.error('Error deleting income:', error);
      alert('Failed to delete income. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      date: formatDateInput(new Date()),
      amount: '',
      platform: '',
      client: '',
      category: 'eft',
      description: '',
      is_paid: true,
      tax_withheld: '0',
      value_type: 'monetary',
      item_description: '',
      item_quantity: '1',
      income_source_type: 'direct_transfer',
      campaign_name: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleFMVComplete = async (fmv: FairMarketValue) => {
    setShowFMVAssistant(false);
    setFmvIncomeId(null);
    resetForm();
    await loadIncomes();
  };

  const openFMVCalculator = (income: Income) => {
    setFmvIncomeId(income.id);
    setShowFMVAssistant(true);
  };

  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const paidIncome = incomes.filter((i) => i.is_paid).reduce((sum, i) => sum + Number(i.amount), 0);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading income...</div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Tracker</h1>
          <p className="text-gray-600 mt-1">Track all your earnings in ZAR</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Add Income'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Total Income</span>
            <DollarSign size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatZAR(totalIncome)}</p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">Paid Income</span>
            <Check size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatZAR(paidIncome)}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Income' : 'Add New Income'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Income Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, value_type: 'monetary' })}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    formData.value_type === 'monetary'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-500'
                  }`}
                >
                  <DollarSign size={20} />
                  Cash Payment
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, value_type: 'non_monetary' })}
                  className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    formData.value_type === 'non_monetary'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-500'
                  }`}
                >
                  <Gift size={20} />
                  Barter / Sponsored
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              {formData.value_type === 'monetary' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (ZAR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Description</label>
                    <input
                      type="text"
                      value={formData.item_description}
                      onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., iPhone 15 Pro 256GB"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={formData.item_quantity}
                      onChange={(e) => setFormData({ ...formData, item_quantity: e.target.value })}
                      className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Select platform</option>
                  {SA_PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.label}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client/Source</label>
                <input
                  type="text"
                  value={formData.client}
                  onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Client name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Income['category'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  {INCOME_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax Withheld (ZAR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tax_withheld}
                  onChange={(e) => setFormData({ ...formData, tax_withheld: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder="Brief description of the work"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_paid"
                checked={formData.is_paid}
                onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <label htmlFor="is_paid" className="text-sm font-medium text-gray-700">
                Payment received
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingId ? 'Update Income' : 'Add Income'}
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
        {incomes.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <DollarSign size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No income records yet</p>
            <p>Start tracking your earnings from SA platforms and clients</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Platform</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(income.date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatZAR(Number(income.amount))}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{income.platform}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{income.client}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          income.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {income.is_paid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        {income.value_type === 'non_monetary' && (
                          <button
                            onClick={() => openFMVCalculator(income)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Calculate FMV"
                          >
                            <Calculator size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(income)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
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

      {showFMVAssistant && fmvIncomeId && (
        <FairValueAssistant
          incomeId={fmvIncomeId}
          itemDescription={formData.item_description}
          onComplete={handleFMVComplete}
          onCancel={() => {
            setShowFMVAssistant(false);
            setFmvIncomeId(null);
          }}
        />
      )}
    </div>
  );
};
