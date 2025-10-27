/*
  # Enhanced Income Aggregation and Fair Market Value Features
  
  1. Enhanced Income Table
    - Add income source tracking (platform payouts, brand deals, etc.)
    - Add value type (monetary vs non-monetary/barter)
    - Add non-monetary item details for SARS compliance
    - Add platform-specific campaign tracking
  
  2. New Fair Market Value Table
    - Track FMV calculations for barter/sponsored items
    - Store proof documentation (screenshots, links, sources)
    - SARS compliance verification
    - Link to income records
  
  3. Enhanced Expenses Table
    - AI deduction analysis fields
    - SARS section references
    - Deduction optimization tracking
    - Documentation requirements
  
  4. Security
    - RLS enabled on all new tables
    - Users can only access their own FMV records
*/

-- Add new columns to income table for enhanced tracking
DO $$
BEGIN
  -- Income source type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'income_source_type'
  ) THEN
    ALTER TABLE income ADD COLUMN income_source_type text DEFAULT 'direct_transfer' 
      CHECK (income_source_type IN ('platform_payout', 'direct_transfer', 'affiliate', 'brand_deal', 'freelance'));
  END IF;

  -- Platform/campaign tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'campaign_name'
  ) THEN
    ALTER TABLE income ADD COLUMN campaign_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'aggregated_from'
  ) THEN
    ALTER TABLE income ADD COLUMN aggregated_from text[];
  END IF;

  -- Value type (monetary vs barter)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'value_type'
  ) THEN
    ALTER TABLE income ADD COLUMN value_type text DEFAULT 'monetary' 
      CHECK (value_type IN ('monetary', 'non_monetary'));
  END IF;

  -- Non-monetary details
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'item_description'
  ) THEN
    ALTER TABLE income ADD COLUMN item_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'item_quantity'
  ) THEN
    ALTER TABLE income ADD COLUMN item_quantity integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'income' AND column_name = 'recipient_type'
  ) THEN
    ALTER TABLE income ADD COLUMN recipient_type text DEFAULT 'self' 
      CHECK (recipient_type IN ('self', 'business'));
  END IF;
END $$;

-- Create fair_market_values table
CREATE TABLE IF NOT EXISTS fair_market_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  income_id uuid REFERENCES income(id) ON DELETE CASCADE NOT NULL,
  
  -- Item details
  item_description text NOT NULL,
  calculation_method text NOT NULL CHECK (calculation_method IN ('market_research', 'retailer_price', 'comparable_sales')),
  
  -- Valuation
  fmv_amount numeric(10, 2) NOT NULL,
  valuation_date date NOT NULL,
  
  -- Proof documentation (CRITICAL for SARS)
  proof_source_type text CHECK (proof_source_type IN ('website', 'screenshot', 'document')),
  proof_source_url text,
  proof_screenshot_url text,
  retailer_name text,
  product_link text,
  proof_captured_at timestamptz DEFAULT now(),
  
  -- Verification
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'requires_review')),
  notes text,
  
  -- Compliance tracking
  added_to_taxable_income boolean DEFAULT true,
  tax_year text NOT NULL,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add enhanced expense tracking columns
DO $$
BEGIN
  -- AI analysis category suggestion
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'suggested_category'
  ) THEN
    ALTER TABLE expenses ADD COLUMN suggested_category text;
  END IF;

  -- Deductibility score
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'deductibility_score'
  ) THEN
    ALTER TABLE expenses ADD COLUMN deductibility_score integer DEFAULT 100 CHECK (deductibility_score >= 0 AND deductibility_score <= 100);
  END IF;

  -- SARS section reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'sars_section'
  ) THEN
    ALTER TABLE expenses ADD COLUMN sars_section text;
  END IF;

  -- Max deductible amount/percentage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'max_deductible_amount'
  ) THEN
    ALTER TABLE expenses ADD COLUMN max_deductible_amount numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'max_deductible_percentage'
  ) THEN
    ALTER TABLE expenses ADD COLUMN max_deductible_percentage integer DEFAULT 100;
  END IF;

  -- AI reasoning and warnings
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'ai_reasoning'
  ) THEN
    ALTER TABLE expenses ADD COLUMN ai_reasoning text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'warnings'
  ) THEN
    ALTER TABLE expenses ADD COLUMN warnings text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'required_documentation'
  ) THEN
    ALTER TABLE expenses ADD COLUMN required_documentation text[];
  END IF;

  -- Deduction optimization
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'potential_deduction'
  ) THEN
    ALTER TABLE expenses ADD COLUMN potential_deduction numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'optimization_tips'
  ) THEN
    ALTER TABLE expenses ADD COLUMN optimization_tips text[];
  END IF;
END $$;

-- Create SARS filing reports table
CREATE TABLE IF NOT EXISTS sars_filing_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  tax_year text NOT NULL,
  generated_date timestamptz DEFAULT now(),
  
  -- Income totals
  total_cash_income numeric(10, 2) DEFAULT 0,
  total_fmv_income numeric(10, 2) DEFAULT 0,
  total_gross_income numeric(10, 2) DEFAULT 0,
  
  -- Deduction totals
  total_deductions numeric(10, 2) DEFAULT 0,
  
  -- Tax calculation
  taxable_income numeric(10, 2) DEFAULT 0,
  tax_payable numeric(10, 2) DEFAULT 0,
  provisional_tax_paid numeric(10, 2) DEFAULT 0,
  balance_payable numeric(10, 2) DEFAULT 0,
  
  -- Export URLs
  pdf_url text,
  csv_url text,
  excel_url text,
  
  -- Report data (JSON)
  report_data jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, tax_year)
);

-- Enable RLS on new tables
ALTER TABLE fair_market_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE sars_filing_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fair_market_values
CREATE POLICY "Users can view own FMV records"
  ON fair_market_values FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own FMV records"
  ON fair_market_values FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own FMV records"
  ON fair_market_values FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own FMV records"
  ON fair_market_values FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for sars_filing_reports
CREATE POLICY "Users can view own SARS reports"
  ON sars_filing_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SARS reports"
  ON sars_filing_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SARS reports"
  ON sars_filing_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SARS reports"
  ON sars_filing_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fmv_user_id ON fair_market_values(user_id);
CREATE INDEX IF NOT EXISTS idx_fmv_income_id ON fair_market_values(income_id);
CREATE INDEX IF NOT EXISTS idx_fmv_tax_year ON fair_market_values(tax_year);
CREATE INDEX IF NOT EXISTS idx_sars_reports_user_id ON sars_filing_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_sars_reports_tax_year ON sars_filing_reports(tax_year);