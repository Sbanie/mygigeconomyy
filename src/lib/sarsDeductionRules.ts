import { DeductionRule } from '../types';

export const SARS_DEDUCTION_RULES: Record<string, DeductionRule> = {
  'Home Office (Max 50%)': {
    category: 'Home Office',
    section: '11(a)',
    maxPercentage: 50,
    requirements: ['Dedicated space for business', 'Regular and exclusive use'],
    documentation: ['Lease agreement or bond statement', 'Utility bills', 'Floor plan or photos']
  },
  'Data & Airtime': {
    category: 'Data & Communication',
    section: '11(a)',
    maxPercentage: 100,
    requirements: ['Primarily used for business purposes'],
    documentation: ['Itemized bills showing business usage']
  },
  'Equipment & Software': {
    category: 'Equipment',
    section: '11(e)',
    maxPercentage: 100,
    wearTearRate: 33.3,
    requirements: ['Used for business'],
    documentation: ['Purchase invoices', 'Asset register', 'Proof of business use']
  },
  'Travel (Log Book Required)': {
    category: 'Travel',
    section: '8(1)',
    maxPercentage: 80,
    requirements: ['Detailed logbook', 'Business purpose documented'],
    documentation: ['Travel logbook', 'Trip receipts', 'Business meeting proof']
  },
  'Marketing & Advertising': {
    category: 'Marketing',
    section: '11(a)',
    maxPercentage: 100,
    requirements: ['Business promotion purpose'],
    documentation: ['Invoices', 'Campaign details', 'Advertising contracts']
  },
  'Professional Services': {
    category: 'Professional Services',
    section: '11(a)',
    maxPercentage: 100,
    requirements: ['Related to business operations'],
    documentation: ['Professional service invoices', 'Contracts']
  },
  'Bank Charges': {
    category: 'Bank Charges',
    section: '11(a)',
    maxPercentage: 100,
    requirements: ['Business bank account charges'],
    documentation: ['Bank statements', 'Fee invoices']
  },
  'Training & Development': {
    category: 'Training',
    section: '11(a)',
    maxPercentage: 100,
    requirements: ['Directly related to income-earning activities'],
    documentation: ['Course receipts', 'Training certificates', 'Course content proof']
  },
  'Insurance': {
    category: 'Insurance',
    section: '11(a)',
    maxPercentage: 100,
    requirements: ['Business-related insurance'],
    documentation: ['Insurance policy documents', 'Premium receipts']
  },
  'Repairs & Maintenance': {
    category: 'Repairs',
    section: '11(d)',
    maxPercentage: 100,
    requirements: ['Repairs to business equipment or premises'],
    documentation: ['Repair invoices', 'Before/after photos', 'Service reports']
  },
  'Other Deductible': {
    category: 'Other',
    section: '11(a)',
    maxPercentage: 100,
    requirements: ['Wholly and exclusively for business'],
    documentation: ['Detailed receipts', 'Business purpose explanation']
  }
};

export const analyzeExpenseDeductibility = (
  amount: number,
  category: string,
  description: string
): {
  deductibilityScore: number;
  sarsSection: string;
  maxDeductibleAmount: number;
  maxDeductiblePercentage: number;
  reasoning: string;
  warnings: string[];
  requiredDocumentation: string[];
  potentialDeduction: number;
  optimizationTips: string[];
} => {
  const rule = SARS_DEDUCTION_RULES[category];

  if (!rule) {
    return {
      deductibilityScore: 50,
      sarsSection: '11(a)',
      maxDeductibleAmount: amount,
      maxDeductiblePercentage: 100,
      reasoning: 'Category not in standard SARS deduction rules. Manual review recommended.',
      warnings: ['Custom category - ensure it qualifies under SARS rules'],
      requiredDocumentation: ['Detailed receipts', 'Business purpose explanation'],
      potentialDeduction: amount,
      optimizationTips: ['Consult with a tax practitioner for this expense category']
    };
  }

  const maxDeductibleAmount = (amount * rule.maxPercentage) / 100;
  const warnings: string[] = [];
  const optimizationTips: string[] = [];
  let deductibilityScore = 100;

  if (category === 'Home Office (Max 50%)') {
    warnings.push('Limited to 50% of home-related costs');
    warnings.push('Must calculate based on floor area used exclusively for business');
    optimizationTips.push('Measure and document the exact business use area');
    optimizationTips.push('Keep all utility bills for the tax year');
  }

  if (category === 'Travel (Log Book Required)') {
    warnings.push('Detailed logbook required for all business travel');
    warnings.push('Must record: date, destination, purpose, km traveled');
    deductibilityScore = 80;
    optimizationTips.push('Maintain a digital or physical logbook for every trip');
    optimizationTips.push('Take photos of odometer readings');
  }

  if (category === 'Equipment & Software' && rule.wearTearRate) {
    warnings.push(`Depreciation applies: ${rule.wearTearRate}% per year over 3 years`);
    optimizationTips.push('Register in asset register for depreciation tracking');
    optimizationTips.push(`Annual deduction: R${(amount * rule.wearTearRate / 100).toFixed(2)}`);
  }

  if (category === 'Data & Airtime') {
    warnings.push('Must be primarily for business use to claim 100%');
    optimizationTips.push('Separate business and personal usage where possible');
  }

  const reasoning = `This expense qualifies under SARS Section ${rule.section} as a deductible business expense. ${
    rule.maxPercentage < 100
      ? `Maximum deductible amount is ${rule.maxPercentage}% (R${maxDeductibleAmount.toFixed(2)}). `
      : ''
  }${rule.requirements.join('. ')}.`;

  return {
    deductibilityScore,
    sarsSection: rule.section,
    maxDeductibleAmount,
    maxDeductiblePercentage: rule.maxPercentage,
    reasoning,
    warnings,
    requiredDocumentation: rule.documentation,
    potentialDeduction: maxDeductibleAmount,
    optimizationTips
  };
};

export const suggestExpenseCategory = (description: string): string => {
  const desc = description.toLowerCase();

  if (desc.includes('rent') || desc.includes('bond') || desc.includes('rates') || desc.includes('electricity')) {
    return 'Home Office (Max 50%)';
  }
  if (desc.includes('data') || desc.includes('airtime') || desc.includes('internet') || desc.includes('phone')) {
    return 'Data & Airtime';
  }
  if (desc.includes('laptop') || desc.includes('camera') || desc.includes('software') || desc.includes('computer')) {
    return 'Equipment & Software';
  }
  if (desc.includes('petrol') || desc.includes('fuel') || desc.includes('travel') || desc.includes('uber')) {
    return 'Travel (Log Book Required)';
  }
  if (desc.includes('ad') || desc.includes('marketing') || desc.includes('promo')) {
    return 'Marketing & Advertising';
  }
  if (desc.includes('accountant') || desc.includes('lawyer') || desc.includes('consultant')) {
    return 'Professional Services';
  }
  if (desc.includes('bank') || desc.includes('fee')) {
    return 'Bank Charges';
  }
  if (desc.includes('course') || desc.includes('training') || desc.includes('learn')) {
    return 'Training & Development';
  }
  if (desc.includes('insurance')) {
    return 'Insurance';
  }
  if (desc.includes('repair') || desc.includes('fix') || desc.includes('maintenance')) {
    return 'Repairs & Maintenance';
  }

  return 'Other Deductible';
};
