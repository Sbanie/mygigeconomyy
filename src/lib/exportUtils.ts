import { Income, Expense } from '../types';
import { formatZAR, formatDate, getCurrentTaxYear } from './utils';
import { calculateSARSTax } from './taxCalculator';

interface ExportData {
  incomes: Income[];
  expenses: Expense[];
  userProfile: {
    name: string;
    email: string;
    taxNumber?: string;
    idNumber?: string;
  };
}

export const exportToExcel = (data: ExportData) => {
  const { incomes, expenses, userProfile } = data;

  const ytdIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const ytdExpenses = expenses
    .filter((e) => e.is_deductible)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const taxCalc = calculateSARSTax(ytdIncome, ytdExpenses);

  let csv = '';

  csv += `SARS TAX REPORT - ${getCurrentTaxYear()}\n`;
  csv += `Generated: ${formatDate(new Date().toISOString())}\n`;
  csv += `Taxpayer: ${userProfile.name}\n`;
  csv += `Email: ${userProfile.email}\n`;
  if (userProfile.idNumber) {
    csv += `ID Number: ${userProfile.idNumber}\n`;
  }
  if (userProfile.taxNumber) {
    csv += `Tax Number: ${userProfile.taxNumber}\n`;
  }
  csv += '\n\n';

  csv += 'INCOME SUMMARY\n';
  csv += `Total Income (YTD),${ytdIncome.toFixed(2)}\n`;
  csv += `Total Deductible Expenses,${ytdExpenses.toFixed(2)}\n`;
  csv += `Taxable Income,${taxCalc.taxableIncome.toFixed(2)}\n`;
  csv += `Estimated Tax,${taxCalc.estimatedTax.toFixed(2)}\n`;
  csv += `Effective Tax Rate,${taxCalc.effectiveRate.toFixed(2)}%\n`;
  csv += '\n\n';

  csv += 'INCOME RECORDS\n';
  csv += 'Date,Amount (ZAR),Platform,Client,Category,Status,Description,Value Type,Tax Withheld\n';
  incomes.forEach((income) => {
    csv += `${formatDate(income.date)},`;
    csv += `${Number(income.amount).toFixed(2)},`;
    csv += `"${income.platform || ''}",`;
    csv += `"${income.client || ''}",`;
    csv += `${income.category},`;
    csv += `${income.is_paid ? 'Paid' : 'Pending'},`;
    csv += `"${(income.description || '').replace(/"/g, '""')}",`;
    csv += `${income.value_type || 'monetary'},`;
    csv += `${(income.tax_withheld || 0).toFixed(2)}\n`;
  });
  csv += '\n\n';

  csv += 'EXPENSE RECORDS\n';
  csv += 'Date,Amount (ZAR),Category,Deductible,Description,VAT Amount,Deductibility Score,SARS Section\n';
  expenses.forEach((expense) => {
    csv += `${formatDate(expense.date)},`;
    csv += `${Number(expense.amount).toFixed(2)},`;
    csv += `"${expense.category}",`;
    csv += `${expense.is_deductible ? 'Yes' : 'No'},`;
    csv += `"${(expense.description || '').replace(/"/g, '""')}",`;
    csv += `${(expense.vat_amount || 0).toFixed(2)},`;
    csv += `${expense.deductibility_score || 100},`;
    csv += `"${expense.sars_section || ''}"\n`;
  });
  csv += '\n\n';

  csv += 'DEDUCTIBLE EXPENSES BY CATEGORY\n';
  const expensesByCategory = expenses
    .filter((e) => e.is_deductible)
    .reduce((acc, e) => {
      const cat = e.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

  csv += 'Category,Total Amount (ZAR)\n';
  Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, amount]) => {
      csv += `"${category}",${amount.toFixed(2)}\n`;
    });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `SARS_Tax_Report_${getCurrentTaxYear()}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (data: ExportData) => {
  const { incomes, expenses, userProfile } = data;

  const ytdIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
  const ytdExpenses = expenses
    .filter((e) => e.is_deductible)
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const taxCalc = calculateSARSTax(ytdIncome, ytdExpenses);

  const expensesByCategory = expenses
    .filter((e) => e.is_deductible)
    .reduce((acc, e) => {
      const cat = e.category;
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SARS Tax Report - ${getCurrentTaxYear()}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
      max-width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0 0 10px 0;
      font-size: 24pt;
    }
    .header .subtitle {
      color: #64748b;
      font-size: 11pt;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .info-box h3 {
      margin: 0 0 10px 0;
      color: #1e40af;
      font-size: 12pt;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .info-label {
      font-weight: bold;
      color: #475569;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .summary-card.expense {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .summary-card h4 {
      margin: 0 0 10px 0;
      font-size: 10pt;
      opacity: 0.9;
    }
    .summary-card .amount {
      font-size: 20pt;
      font-weight: bold;
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 9pt;
    }
    table caption {
      text-align: left;
      font-size: 14pt;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
      padding: 10px 0;
      border-bottom: 2px solid #2563eb;
    }
    th {
      background: #1e40af;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 9pt;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .amount-cell {
      text-align: right;
      font-weight: 600;
      color: #059669;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      font-size: 8pt;
      color: #64748b;
    }
    .page-break {
      page-break-after: always;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 600;
    }
    .badge-success {
      background: #d1fae5;
      color: #065f46;
    }
    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🇿🇦 SARS TAX REPORT</h1>
    <div class="subtitle">South African Revenue Service Compliance Report</div>
    <div class="subtitle">Tax Year: ${getCurrentTaxYear()}</div>
  </div>

  <div class="info-box">
    <h3>Taxpayer Information</h3>
    <div class="info-row">
      <span class="info-label">Name:</span>
      <span>${userProfile.name}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email:</span>
      <span>${userProfile.email}</span>
    </div>
    ${userProfile.idNumber ? `
    <div class="info-row">
      <span class="info-label">ID Number:</span>
      <span>${userProfile.idNumber}</span>
    </div>
    ` : ''}
    ${userProfile.taxNumber ? `
    <div class="info-row">
      <span class="info-label">Tax Number:</span>
      <span>${userProfile.taxNumber}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Report Generated:</span>
      <span>${formatDate(new Date().toISOString())} ${new Date().toLocaleTimeString()}</span>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <h4>Total Income (YTD)</h4>
      <p class="amount">${formatZAR(ytdIncome)}</p>
    </div>
    <div class="summary-card expense">
      <h4>Deductible Expenses</h4>
      <p class="amount">${formatZAR(ytdExpenses)}</p>
    </div>
  </div>

  <div class="info-box">
    <h3>Tax Calculation Summary</h3>
    <div class="info-row">
      <span class="info-label">Total Income:</span>
      <span>${formatZAR(ytdIncome)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Less: Deductible Expenses:</span>
      <span>(${formatZAR(ytdExpenses)})</span>
    </div>
    <div class="info-row" style="border-top: 2px solid #cbd5e1; margin-top: 10px; padding-top: 10px;">
      <span class="info-label" style="font-size: 12pt; color: #1e40af;">Taxable Income:</span>
      <span style="font-size: 12pt; font-weight: bold; color: #1e40af;">${formatZAR(taxCalc.taxableIncome)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Estimated Tax:</span>
      <span style="color: #dc2626; font-weight: bold;">${formatZAR(taxCalc.estimatedTax)}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Effective Tax Rate:</span>
      <span>${taxCalc.effectiveRate.toFixed(2)}%</span>
    </div>
    <div class="info-row">
      <span class="info-label">Tax Bracket:</span>
      <span>${taxCalc.taxBracket}</span>
    </div>
  </div>

  <table>
    <caption>📊 Income Records (${incomes.length} transactions)</caption>
    <thead>
      <tr>
        <th>Date</th>
        <th>Platform</th>
        <th>Client</th>
        <th>Category</th>
        <th>Status</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${incomes.map(income => `
        <tr>
          <td>${formatDate(income.date)}</td>
          <td>${income.platform || '-'}</td>
          <td>${income.client || '-'}</td>
          <td>${income.category}</td>
          <td>
            <span class="badge ${income.is_paid ? 'badge-success' : 'badge-warning'}">
              ${income.is_paid ? 'Paid' : 'Pending'}
            </span>
          </td>
          <td class="amount-cell">${formatZAR(Number(income.amount))}</td>
        </tr>
      `).join('')}
      <tr style="background: #f1f5f9; font-weight: bold;">
        <td colspan="5" style="text-align: right; padding-right: 20px;">TOTAL INCOME:</td>
        <td class="amount-cell" style="font-size: 11pt;">${formatZAR(ytdIncome)}</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <table>
    <caption>💰 Expense Records (${expenses.length} transactions)</caption>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th>Deductible</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${expenses.map(expense => `
        <tr>
          <td>${formatDate(expense.date)}</td>
          <td>${expense.category}</td>
          <td style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${expense.description || '-'}</td>
          <td>
            <span class="badge ${expense.is_deductible ? 'badge-success' : 'badge-warning'}">
              ${expense.is_deductible ? 'Yes' : 'No'}
            </span>
          </td>
          <td class="amount-cell">${formatZAR(Number(expense.amount))}</td>
        </tr>
      `).join('')}
      <tr style="background: #f1f5f9; font-weight: bold;">
        <td colspan="4" style="text-align: right; padding-right: 20px;">TOTAL DEDUCTIBLE:</td>
        <td class="amount-cell" style="font-size: 11pt;">${formatZAR(ytdExpenses)}</td>
      </tr>
    </tbody>
  </table>

  <table>
    <caption>📂 Expenses by Category</caption>
    <thead>
      <tr>
        <th>Category</th>
        <th style="text-align: right;">Total Amount</th>
        <th style="text-align: right;">% of Total</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => `
          <tr>
            <td>${category}</td>
            <td class="amount-cell">${formatZAR(amount)}</td>
            <td style="text-align: right;">${((amount / ytdExpenses) * 100).toFixed(1)}%</td>
          </tr>
        `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Generated by MyGig-Economy</strong> - SARS Compliance Platform for South African Creators</p>
    <p>This report is for informational purposes. Please consult with a registered tax practitioner for official submissions.</p>
    <p>Keep this report with your tax records for 5 years as required by SARS.</p>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};
