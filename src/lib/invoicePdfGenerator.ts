import { Invoice } from '../types';
import { formatZAR, formatDate } from './utils';

export const generateInvoicePDF = (invoice: Invoice, userProfile: any) => {
  const vatAmount = Number(invoice.vat_amount) || 0;
  const subtotal = Number(invoice.subtotal) || 0;
  const total = Number(invoice.total) || 0;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      max-width: 100%;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .company-info {
      flex: 1;
    }
    .company-name {
      font-size: 24pt;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 8px;
    }
    .invoice-title {
      font-size: 28pt;
      font-weight: bold;
      color: #1e40af;
      text-align: right;
    }
    .invoice-number {
      font-size: 14pt;
      color: #64748b;
      text-align: right;
      margin-top: 4px;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .info-box {
      flex: 1;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      margin-right: 15px;
    }
    .info-box:last-child {
      margin-right: 0;
    }
    .info-box h3 {
      font-size: 10pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin: 0 0 8px 0;
      letter-spacing: 0.5px;
    }
    .info-box p {
      margin: 4px 0;
      font-size: 11pt;
    }
    .info-box strong {
      font-weight: 600;
      color: #1e40af;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    thead {
      background: #1e40af;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    th.text-right {
      text-align: right;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11pt;
    }
    td.text-right {
      text-align: right;
    }
    td.text-center {
      text-align: center;
    }
    tbody tr:hover {
      background: #f8fafc;
    }
    .totals-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 350px;
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      border: 2px solid #e2e8f0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 11pt;
    }
    .total-row.subtotal {
      color: #64748b;
    }
    .total-row.vat {
      color: #64748b;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .total-row.final {
      font-size: 16pt;
      font-weight: bold;
      color: #1e40af;
      padding-top: 12px;
      border-top: 2px solid #2563eb;
    }
    .banking-section {
      margin-top: 40px;
      padding: 20px;
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
    }
    .banking-section h3 {
      font-size: 13pt;
      font-weight: 600;
      color: #1e40af;
      margin: 0 0 12px 0;
    }
    .banking-details {
      display: flex;
      gap: 40px;
    }
    .banking-item {
      flex: 1;
    }
    .banking-item strong {
      display: block;
      color: #64748b;
      font-size: 9pt;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .banking-item span {
      display: block;
      font-size: 12pt;
      font-weight: 600;
      color: #1e40af;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 9pt;
      color: #64748b;
    }
    .notes-section {
      margin-top: 30px;
      padding: 15px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
    }
    .notes-section h4 {
      font-size: 11pt;
      font-weight: 600;
      color: #92400e;
      margin: 0 0 8px 0;
    }
    .notes-section p {
      margin: 0;
      font-size: 10pt;
      color: #78350f;
    }
    .vat-notice {
      margin-top: 10px;
      padding: 10px;
      background: #dbeafe;
      border-radius: 6px;
      font-size: 9pt;
      color: #1e40af;
    }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <div class="company-name">${userProfile?.business_name || userProfile?.name || 'Your Business'}</div>
      <p style="margin: 4px 0; color: #64748b;">
        ${userProfile?.email || ''}<br>
        ${userProfile?.phone || ''}<br>
        ${userProfile?.address || ''}
      </p>
      ${userProfile?.vat_number ? `<p style="margin-top: 8px; font-weight: 600;">VAT No: ${userProfile.vat_number}</p>` : ''}
      ${userProfile?.tax_number ? `<p style="font-weight: 600;">Tax No: ${userProfile.tax_number}</p>` : ''}
    </div>
    <div style="text-align: right;">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">#${invoice.invoice_number}</div>
    </div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>Bill To</h3>
      <p><strong>${invoice.client_name}</strong></p>
      <p>${invoice.client_email}</p>
      ${invoice.client_vat_number ? `<p style="margin-top: 8px;">VAT No: ${invoice.client_vat_number}</p>` : ''}
    </div>
    <div class="info-box">
      <h3>Invoice Details</h3>
      <p><strong>Invoice Date:</strong> ${formatDate(invoice.date)}</p>
      <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
      <p><strong>Status:</strong> <span style="text-transform: capitalize; color: ${
        invoice.status === 'paid' ? '#16a34a' : invoice.status === 'sent' ? '#2563eb' : '#64748b'
      }; font-weight: 600;">${invoice.status}</span></p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Description</th>
        <th class="text-center" style="width: 15%;">Quantity</th>
        <th class="text-right" style="width: 17.5%;">Rate</th>
        <th class="text-right" style="width: 17.5%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.line_items.map((item: any) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${formatZAR(Number(item.rate))}</td>
          <td class="text-right" style="font-weight: 600;">${formatZAR(Number(item.amount))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals-section">
    <div class="totals-box">
      <div class="total-row subtotal">
        <span>Subtotal:</span>
        <span style="font-weight: 600;">${formatZAR(subtotal)}</span>
      </div>
      ${vatAmount > 0 ? `
        <div class="total-row vat">
          <span>VAT (15%):</span>
          <span style="font-weight: 600;">${formatZAR(vatAmount)}</span>
        </div>
      ` : ''}
      <div class="total-row final">
        <span>Total Amount:</span>
        <span>${formatZAR(total)}</span>
      </div>
    </div>
  </div>

  ${invoice.bank_name && invoice.account_number ? `
    <div class="banking-section">
      <h3>Banking Details for Payment</h3>
      <div class="banking-details">
        <div class="banking-item">
          <strong>Bank Name</strong>
          <span>${invoice.bank_name}</span>
        </div>
        <div class="banking-item">
          <strong>Account Number</strong>
          <span>${invoice.account_number}</span>
        </div>
        ${invoice.branch_code ? `
          <div class="banking-item">
            <strong>Branch Code</strong>
            <span>${invoice.branch_code}</span>
          </div>
        ` : ''}
      </div>
      ${userProfile?.vat_number ? `
        <div class="vat-notice">
          This is a VAT invoice. VAT amount: ${formatZAR(vatAmount)}
        </div>
      ` : ''}
    </div>
  ` : ''}

  <div class="notes-section">
    <h4>Payment Terms</h4>
    <p>Payment is due by ${formatDate(invoice.due_date)}. Please use invoice number ${invoice.invoice_number} as payment reference.</p>
  </div>

  <div class="footer">
    <p><strong>Thank you for your business!</strong></p>
    <p style="margin-top: 8px;">This invoice was generated on ${formatDate(new Date().toISOString().split('T')[0])}</p>
    ${userProfile?.vat_number ? '<p style="margin-top: 4px;">VAT Invoice - Please retain for your records</p>' : ''}
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        URL.revokeObjectURL(url);
      }, 250);
    };
  }
};
