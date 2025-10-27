import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatZAR, formatDate, formatDateInput, generateInvoiceNumber } from '../lib/utils';
import { SA_BANKS } from '../lib/constants';
import { Invoice, LineItem } from '../types';
import { Plus, Edit2, Trash2, X, FileText, Send, Download } from 'lucide-react';
import { generateInvoicePDF } from '../lib/invoicePdfGenerator';

export const InvoiceSystem = () => {
  const { profile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_vat_number: '',
    date: formatDateInput(new Date()),
    due_date: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    line_items: [{ description: '', quantity: 1, rate: 0, amount: 0 }] as LineItem[],
    bank_name: profile?.bank_name || '',
    account_number: profile?.account_number || '',
    branch_code: profile?.branch_code || ''
  });

  useEffect(() => {
    loadInvoices();
  }, [profile]);

  const loadInvoices = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateLineItem = (item: LineItem): LineItem => {
    return { ...item, amount: item.quantity * item.rate };
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index] = calculateLineItem(newItems[index]);
    setFormData({ ...formData, line_items: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const subtotal = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
      const vatAmount = profile.vat_number ? subtotal * 0.15 : 0;
      const total = subtotal + vatAmount;

      const invoiceNumber = editingId
        ? invoices.find((inv) => inv.id === editingId)?.invoice_number
        : generateInvoiceNumber(invoices.length);

      const invoiceData = {
        user_id: profile.id,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_vat_number: formData.client_vat_number || null,
        invoice_number: invoiceNumber!,
        date: formData.date,
        due_date: formData.due_date,
        line_items: formData.line_items,
        subtotal,
        vat_amount: vatAmount,
        total,
        status: 'draft' as const,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        branch_code: formData.branch_code
      };

      if (editingId) {
        const { error } = await supabase.from('invoices').update(invoiceData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('invoices').insert(invoiceData);
        if (error) throw error;
      }

      resetForm();
      await loadInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Please try again.');
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setFormData({
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      client_vat_number: invoice.client_vat_number || '',
      date: invoice.date,
      due_date: invoice.due_date,
      line_items: invoice.line_items,
      bank_name: invoice.bank_name || '',
      account_number: invoice.account_number || '',
      branch_code: invoice.branch_code || ''
    });
    setEditingId(invoice.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      await loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  const markAsPaid = async (invoice: Invoice) => {
    try {
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoice.id);

      if (invoiceError) throw invoiceError;

      const { error: incomeError } = await supabase.from('income').insert({
        user_id: profile!.id,
        date: new Date().toISOString().split('T')[0],
        amount: invoice.total,
        platform: 'Invoice',
        client: invoice.client_name,
        category: 'eft',
        description: `Invoice ${invoice.invoice_number}`,
        is_paid: true,
        invoice_id: invoice.id,
        tax_withheld: 0
      });

      if (incomeError) throw incomeError;

      await loadInvoices();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      alert('Failed to mark invoice as paid. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      client_email: '',
      client_vat_number: '',
      date: formatDateInput(new Date()),
      due_date: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      line_items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
      bank_name: profile?.bank_name || '',
      account_number: profile?.account_number || '',
      branch_code: profile?.branch_code || ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleExportPDF = (invoice: Invoice) => {
    if (!profile) return;
    generateInvoicePDF(invoice, profile);
  };

  const subtotal = formData.line_items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = profile?.vat_number ? subtotal * 0.15 : 0;
  const total = subtotal + vatAmount;

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading invoices...</div>;
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice System</h1>
          <p className="text-gray-600 mt-1">Professional invoicing with SA banking details</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Create Invoice'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Email</label>
                <input
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
              <div className="space-y-2">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                      placeholder="Qty"
                      className="w-20 px-4 py-2 border border-gray-300 rounded-lg"
                      min="1"
                      required
                    />
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value))}
                      placeholder="Rate"
                      className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
                      step="0.01"
                      required
                    />
                    <div className="w-32 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                      {formatZAR(item.amount)}
                    </div>
                    {formData.line_items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addLineItem}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Line Item
              </button>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatZAR(subtotal)}</span>
              </div>
              {profile?.vat_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT (15%):</span>
                  <span className="font-semibold">{formatZAR(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatZAR(total)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Banking Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank</label>
                  <select
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select bank</option>
                    {SA_BANKS.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Code</label>
                  <input
                    type="text"
                    value={formData.branch_code}
                    onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingId ? 'Update Invoice' : 'Create Invoice'}
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
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No invoices yet</p>
            <p>Create your first professional invoice with SA banking details</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{invoice.client_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatZAR(Number(invoice.total))}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleExportPDF(invoice)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Export PDF"
                        >
                          <Download size={16} />
                        </button>
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => markAsPaid(invoice)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <Send size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
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
