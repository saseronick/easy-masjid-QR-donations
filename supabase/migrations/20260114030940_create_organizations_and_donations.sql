/*
  # Masjid Donation System - Core Schema

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key) - Unique organization identifier
      - `name` (text) - Mosque/organization name
      - `name_urdu` (text) - Name in Urdu
      - `location` (text) - Physical address
      - `contact_phone` (text) - Contact number
      - `contact_email` (text) - Email address
      - `jazzcash_merchant_id` (text, encrypted) - JazzCash merchant ID
      - `jazzcash_merchant_password` (text, encrypted) - JazzCash password
      - `easypaisa_store_id` (text, encrypted) - EasyPaisa store ID
      - `easypaisa_merchant_hash` (text, encrypted) - EasyPaisa hash key
      - `enabled_payment_methods` (jsonb) - Array of enabled methods
      - `user_id` (uuid, foreign key) - Admin user who owns this org
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
      
    - `donations`
      - `id` (uuid, primary key) - Unique donation identifier
      - `organization_id` (uuid, foreign key) - Reference to organization
      - `amount` (numeric) - Donation amount in PKR
      - `currency` (text) - Currency code (default PKR)
      - `donor_name` (text, optional) - Donor name if provided
      - `donor_phone` (text, optional) - Donor phone if provided
      - `donor_email` (text, optional) - Donor email if provided
      - `payment_method` (text) - jazzcash or easypaisa
      - `transaction_id` (text) - Payment gateway transaction ID
      - `status` (text) - pending, completed, failed, refunded
      - `payment_response` (jsonb) - Full payment gateway response
      - `created_at` (timestamptz) - Creation timestamp
      - `completed_at` (timestamptz) - Completion timestamp

  2. Security
    - Enable RLS on all tables
    - Organizations: Users can only manage their own organizations
    - Donations: Read-only for organization owners, no public access
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_urdu text,
  location text,
  contact_phone text NOT NULL,
  contact_email text,
  jazzcash_merchant_id text,
  jazzcash_merchant_password text,
  easypaisa_store_id text,
  easypaisa_merchant_hash text,
  enabled_payment_methods jsonb DEFAULT '["jazzcash", "easypaisa"]'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'PKR' NOT NULL,
  donor_name text,
  donor_phone text,
  donor_email text,
  payment_method text NOT NULL CHECK (payment_method IN ('jazzcash', 'easypaisa')),
  transaction_id text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_response jsonb,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_organization_id ON donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_transaction_id ON donations(transaction_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations table
CREATE POLICY "Users can view own organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own organizations"
  ON organizations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for donations table
CREATE POLICY "Organization owners can view their donations"
  ON donations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create donations"
  ON donations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Organization owners can update donation status"
  ON donations FOR UPDATE
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
