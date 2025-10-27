export interface UserProfile {
  id: string;
  email: string;
  name: string;
  id_number?: string;
  user_types: string[];
  platforms: string[];
  follower_count: number;
  skills: string[];
  hourly_rate?: number;
  monthly_goal?: number;
  tax_number?: string;
  vat_number?: string;
  is_provisional_tax_payer: boolean;
  province?: string;
  bank_name?: string;
  account_number?: string;
  branch_code?: string;
  tax_status: 'below_threshold' | 'requires_registration' | 'registered' | 'vat_required';
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  platform: string;
  client: string;
  category: 'cash' | 'barter' | 'sponsorship' | 'eft';
  description: string;
  is_paid: boolean;
  invoice_id?: string;
  tax_withheld: number;
  income_source_type?: 'platform_payout' | 'direct_transfer' | 'affiliate' | 'brand_deal' | 'freelance';
  campaign_name?: string;
  aggregated_from?: string[];
  value_type?: 'monetary' | 'non_monetary';
  item_description?: string;
  item_quantity?: number;
  recipient_type?: 'self' | 'business';
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  category: string;
  is_deductible: boolean;
  description: string;
  receipt_url?: string;
  vat_amount: number;
  suggested_category?: string;
  deductibility_score?: number;
  sars_section?: string;
  max_deductible_amount?: number;
  max_deductible_percentage?: number;
  ai_reasoning?: string;
  warnings?: string[];
  required_documentation?: string[];
  potential_deduction?: number;
  optimization_tips?: string[];
  created_at: string;
  updated_at: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  client_email: string;
  client_vat_number?: string;
  invoice_number: string;
  date: string;
  due_date: string;
  line_items: LineItem[];
  subtotal: number;
  vat_amount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  bank_name?: string;
  account_number?: string;
  branch_code?: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TaxCalculation {
  id: string;
  user_id: string;
  tax_year: string;
  annual_income: number;
  total_deductions: number;
  taxable_income: number;
  estimated_tax: number;
  tax_bracket: string;
  effective_rate: number;
  provisional_first_payment: number;
  provisional_second_payment: number;
  first_payment_paid: boolean;
  second_payment_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceStatus {
  status: 'success' | 'warning' | 'urgent' | 'critical';
  message: string;
  action?: string;
  link?: string;
  guide?: boolean;
}

export interface FairMarketValue {
  id: string;
  user_id: string;
  income_id: string;
  item_description: string;
  calculation_method: 'market_research' | 'retailer_price' | 'comparable_sales';
  fmv_amount: number;
  valuation_date: string;
  proof_source_type?: 'website' | 'screenshot' | 'document';
  proof_source_url?: string;
  proof_screenshot_url?: string;
  retailer_name?: string;
  product_link?: string;
  proof_captured_at: string;
  verification_status: 'pending' | 'verified' | 'requires_review';
  notes?: string;
  added_to_taxable_income: boolean;
  tax_year: string;
  created_at: string;
  updated_at: string;
}

export interface SARSFilingReport {
  id: string;
  user_id: string;
  tax_year: string;
  generated_date: string;
  total_cash_income: number;
  total_fmv_income: number;
  total_gross_income: number;
  total_deductions: number;
  taxable_income: number;
  tax_payable: number;
  provisional_tax_paid: number;
  balance_payable: number;
  pdf_url?: string;
  csv_url?: string;
  excel_url?: string;
  report_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DeductionRule {
  category: string;
  section: string;
  maxPercentage: number;
  requirements: string[];
  documentation: string[];
  wearTearRate?: number;
}
