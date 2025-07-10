/*
  # Email Lead Capture System

  1. New Tables
    - `email_leads`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `source` (text) - where the email was captured
      - `context` (text) - conversation context when captured
      - `session_id` (uuid) - link to chat session
      - `status` (text) - lead status (new, contacted, converted)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `email_leads` table
    - Add policies for authenticated users to manage leads
    - Add policy for anonymous users to insert leads

  3. Indexes
    - Index on email for fast lookups
    - Index on created_at for sorting
    - Index on status for filtering
*/

CREATE TABLE IF NOT EXISTS email_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  source text DEFAULT 'chat' NOT NULL,
  context text,
  session_id uuid REFERENCES chat_sessions(id) ON DELETE SET NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'unqualified')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert email leads"
  ON email_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all leads"
  ON email_leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update leads"
  ON email_leads
  FOR UPDATE
  TO authenticated
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_leads_email ON email_leads(email);
CREATE INDEX IF NOT EXISTS idx_email_leads_created_at ON email_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_leads_status ON email_leads(status);
CREATE INDEX IF NOT EXISTS idx_email_leads_session_id ON email_leads(session_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_email_leads_updated_at
    BEFORE UPDATE ON email_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();