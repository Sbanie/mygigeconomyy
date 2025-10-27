import { TAX_BRACKETS, TAX_THRESHOLD, VAT_THRESHOLD, PROVISIONAL_TAX_THRESHOLD } from './constants';
import { ComplianceStatus, UserProfile } from '../types';

export const calculateSARSTax = (annualIncome: number, totalDeductions: number = 0) => {
  const taxableIncome = Math.max(0, annualIncome - totalDeductions);

  if (taxableIncome <= TAX_THRESHOLD) {
    return {
      taxableIncome: 0,
      estimatedTax: 0,
      taxBracket: 'R0 - R95,750 (0%)',
      effectiveRate: 0,
      provisionalFirstPayment: 0,
      provisionalSecondPayment: 0
    };
  }

  let tax = 0;
  let bracketName = '';

  for (let i = TAX_BRACKETS.length - 1; i >= 0; i--) {
    const bracket = TAX_BRACKETS[i];
    if (taxableIncome > bracket.min) {
      tax = bracket.base + (taxableIncome - bracket.min) * bracket.rate;
      bracketName = `R${bracket.min.toLocaleString()} - ${
        bracket.max === Infinity ? 'R1,817,001+' : `R${bracket.max.toLocaleString()}`
      } (${(bracket.rate * 100).toFixed(0)}%)`;
      break;
    }
  }

  const effectiveRate = (tax / taxableIncome) * 100;

  return {
    taxableIncome,
    estimatedTax: tax,
    taxBracket: bracketName,
    effectiveRate,
    provisionalFirstPayment: tax * 0.5,
    provisionalSecondPayment: tax * 0.5
  };
};

export const getComplianceStatus = (
  user: UserProfile | null,
  ytdIncome: number
): ComplianceStatus => {
  if (!user) {
    return {
      status: 'success',
      message: 'Welcome to MyGig-Economy'
    };
  }

  if (ytdIncome > VAT_THRESHOLD && !user.vat_number) {
    return {
      status: 'critical',
      message: 'VAT registration required above R1 million turnover',
      action: 'Register for VAT with SARS',
      guide: true
    };
  }

  if (!user.tax_number && ytdIncome > TAX_THRESHOLD) {
    return {
      status: 'urgent',
      message: 'Tax registration required! You have exceeded the tax threshold.',
      action: 'Register for SARS eFiling now',
      guide: true
    };
  }

  if (!user.tax_number && ytdIncome > TAX_THRESHOLD * 0.85) {
    const remaining = TAX_THRESHOLD - ytdIncome;
    return {
      status: 'warning',
      message: `You're R${remaining.toFixed(2)} away from the tax threshold`,
      action: 'Start SARS eFiling registration',
      link: '/learn'
    };
  }

  if (ytdIncome > PROVISIONAL_TAX_THRESHOLD && !user.is_provisional_tax_payer) {
    return {
      status: 'warning',
      message: 'Consider provisional tax registration for non-PAYE income above R30,000',
      action: 'Learn about provisional tax',
      link: '/learn'
    };
  }

  if (ytdIncome <= TAX_THRESHOLD) {
    return {
      status: 'success',
      message: "Great news! You're below the tax threshold - no tax payable!"
    };
  }

  return {
    status: 'success',
    message: 'Your tax compliance is up to date'
  };
};

export const getTaxStatusColor = (status: ComplianceStatus['status']): string => {
  switch (status) {
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'urgent':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

export const getIncomeThresholdProgress = (ytdIncome: number): number => {
  return Math.min((ytdIncome / TAX_THRESHOLD) * 100, 100);
};

export const getThresholdColor = (progress: number): string => {
  if (progress < 70) return 'bg-green-500';
  if (progress < 85) return 'bg-yellow-500';
  if (progress < 100) return 'bg-orange-500';
  return 'bg-red-500';
};
