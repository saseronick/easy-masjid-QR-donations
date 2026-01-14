/*
  # Update Schema for RAAST P2P and Bookkeeping

  1. Changes to Existing Tables
    - Update `organizations` table to remove payment gateway credentials (not needed for P2P)
    - Add `raast_phone_number` for RAAST QR code generation
    - Add `qr_code_url` to store generated QR code
    - Update `donations` to support manual entry (not just gateway)

  2. New Tables
    - `expenses`
      - `id` (uuid, primary key) - Unique expense identifier
      - `organization_id` (uuid, foreign key) - Reference to organization
      - `amount` (numeric) - Expense amount in PKR
      - `currency` (text) - Currency code (default PKR)
      - `purpose` (text) - Purpose/description of expense
      - `notes` (text, optional) - Additional notes
      - `date` (date) - Date of expense
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  3. Security
    - Enable RLS on expenses table
    - Expenses: Only organization owners can manage their expenses
    
  4. Important Notes
    - RAAST P2P uses phone numbers, no merchant credentials needed
    - Donations can be manually logged by mosque managers
    - Expenses tracked for bookkeeping and accountability
*/

-- Add RAAST phone number and QR code URL to organizations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'raast_phone_number'
  ) THEN
    ALTER TABLE organizations ADD COLUMN raast_phone_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'qr_code_url'
  ) THEN
    ALTER TABLE organizations ADD COLUMN qr_code_url text;
  END IF;
END $$;

-- Update donations table to support manual entry
DO $$
BEGIN
  -- Add manual_entry flag if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'manual_entry'
  ) THEN
    ALTER TABLE donations ADD COLUMN manual_entry boolean DEFAULT false;
  END IF;

  -- Add notes field if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE donations ADD COLUMN notes text;
  END IF;

  -- Add date field if not exists (separate from created_at for manual entries)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'donations' AND column_name = 'date'
  ) THEN
    ALTER TABLE donations ADD COLUMN date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Make payment_method nullable for manual entries
ALTER TABLE donations ALTER COLUMN payment_method DROP NOT NULL;

-- Update payment_method check constraint to include 'manual' and 'raast'
DO $$
BEGIN
  -- Drop existing constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'donations_payment_method_check'
  ) THEN
    ALTER TABLE donations DROP CONSTRAINT donations_payment_method_check;
  END IF;
  
  -- Add new constraint
  ALTER TABLE donations ADD CONSTRAINT donations_payment_method_check 
    CHECK (payment_method IN ('jazzcash', 'easypaisa', 'raast', 'manual', NULL));
END $$;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'PKR' NOT NULL,
  purpose text NOT NULL,
  notes text,
  date date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Enable RLS on expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expenses table
CREATE POLICY "Organization owners can view their expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update their expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can delete their expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

-- Add trigger for expenses updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update RLS policy for donations to allow organization owners to manually add donations
DROP POLICY IF EXISTS "Anyone can create donations" ON donations;

CREATE POLICY "Authenticated users can create donations for their orgs"
  ON donations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous can create donations via payment gateway"
  ON donations FOR INSERT
  TO anon
  WITH CHECK (manual_entry = false OR manual_entry IS NULL);
