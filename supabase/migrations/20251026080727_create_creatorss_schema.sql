/*
  # CreatorOS - South African Creator Economy Tax Compliance System
  
  1. New Tables
    - `profiles`
      - User profile with SA-specific fields (ID number, tax number, province)
      - Multi-select user types and platforms
      - Tax registration status tracking
      - Hourly rates and monthly goals in ZAR
    
    - `income`
      - Income records with SA platform tracking
      - Cash, barter, sponsorship, EFT categories
      - Tax withholding tracking
      - Links to invoices
    
    - `expenses`
      - SARS-compliant expense categories
      - Deductibility tracking
      - Receipt storage references
      - VAT amount tracking
    
    - `invoices`
      - SA banking details (FNB, Capitec, etc.)
      - VAT calculation support
      - Line items structure
      - Payment status tracking
    
    - `savings_goals`
      - Goal tracking in ZAR
      - Progress monitoring
      - Target dates
    
    - `tax_calculations`
      - Annual tax calculations by year
      - Provisional tax payment tracking
      - SARS bracket calculations
      - Deduction summaries
  
  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Authenticated access required for all operations
  
  3. South African Tax Context
    - Tax threshold: R95,750
    - VAT threshold: R1,000,000
    - Provisional tax threshold: R30,000 from non-PAYE sources
    - Tax year: March 1 - February 28/29
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  id_number text,
  user_types text[] DEFAULT '{}',
  platforms text[] DEFAULT '{}',
  follower_count integer DEFAULT 0,
  skills text[] DEFAULT '{}',
  hourly_rate numeric(10, 2),
  monthly_goal numeric(10, 2),
  tax_number text,
  vat_number text,
  is_provisional_tax_payer boolean DEFAULT false,
  province text,
  bank_name text,
  account_number text,
  branch_code text,
  tax_status text DEFAULT 'below_threshold',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create income table
CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount numeric(10, 2) NOT NULL,
  platform text NOT NULL,
  client text NOT NULL,
  category text NOT NULL CHECK (category IN ('cash', 'barter', 'sponsorship', 'eft')),
  description text NOT NULL,
  is_paid boolean DEFAULT false,
  invoice_id uuid,
  tax_withheld numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount numeric(10, 2) NOT NULL,
  category text NOT NULL,
  is_deductible boolean DEFAULT true,
  description text NOT NULL,
  receipt_url text,
  vat_amount numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_vat_number text,
  invoice_number text NOT NULL,
  date date NOT NULL,
  due_date date NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10, 2) NOT NULL,
  vat_amount numeric(10, 2) DEFAULT 0,
  total numeric(10, 2) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  bank_name text,
  account_number text,
  branch_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  target_amount numeric(10, 2) NOT NULL,
  current_amount numeric(10, 2) DEFAULT 0,
  target_date date,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tax_calculations table
CREATE TABLE IF NOT EXISTS tax_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tax_year text NOT NULL,
  annual_income numeric(10, 2) NOT NULL,
  total_deductions numeric(10, 2) DEFAULT 0,
  taxable_income numeric(10, 2) NOT NULL,
  estimated_tax numeric(10, 2) NOT NULL,
  tax_bracket text NOT NULL,
  effective_rate numeric(5, 2) NOT NULL,
  provisional_first_payment numeric(10, 2) DEFAULT 0,
  provisional_second_payment numeric(10, 2) DEFAULT 0,
  first_payment_paid boolean DEFAULT false,
  second_payment_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tax_year)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for income
CREATE POLICY "Users can view own income"
  ON income FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own income"
  ON income FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income"
  ON income FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income"
  ON income FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for savings_goals
CREATE POLICY "Users can view own savings goals"
  ON savings_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
  ON savings_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
  ON savings_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
  ON savings_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tax_calculations
CREATE POLICY "Users can view own tax calculations"
  ON tax_calculations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax calculations"
  ON tax_calculations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax calculations"
  ON tax_calculations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax calculations"
  ON tax_calculations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_income_user_id ON income(user_id);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_id ON tax_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_calculations_year ON tax_calculations(tax_year);