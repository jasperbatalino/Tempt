/*
  # Fix Email Leads RLS Policies

  1. Security Updates
    - Drop existing restrictive policies
    - Add policy allowing anonymous users to insert email leads
    - Add policy allowing authenticated users to view and manage leads
    - Ensure proper permissions for email capture functionality

  2. Changes
    - Allow INSERT operations for anonymous (anon) role
    - Allow SELECT/UPDATE operations for authenticated users
    - Maintain data security while enabling lead capture
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can insert email leads" ON email_leads;
DROP POLICY IF EXISTS "Authenticated users can view all leads" ON email_leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON email_leads;

-- Create policy to allow anonymous users to insert email leads
CREATE POLICY "Anyone can insert email leads"
  ON email_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create policy to allow authenticated users to view all leads
CREATE POLICY "Authenticated users can view all leads"
  ON email_leads
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update leads
CREATE POLICY "Authenticated users can update leads"
  ON email_leads
  FOR UPDATE
  TO authenticated
  USING (true);