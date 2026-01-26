-- Fix Row Level Security policies for application use
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can read technologies" ON technologies;
DROP POLICY IF EXISTS "Users can manage own files" ON files;

-- Create more permissive policies for application use
-- (You can tighten these later based on your security requirements)

-- Users table policies
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON users FOR DELETE USING (true);

-- Technologies table policies
CREATE POLICY "Enable read access for all users" ON technologies FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON technologies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON technologies FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON technologies FOR DELETE USING (true);

-- User_technologies table policies
CREATE POLICY "Enable all access for user_technologies" ON user_technologies FOR ALL USING (true);

-- Files table policies
CREATE POLICY "Enable all access for files" ON files FOR ALL USING (true);

-- Sessions table policies
CREATE POLICY "Enable all access for sessions" ON sessions FOR ALL USING (true);

-- Account linking tokens table policies
CREATE POLICY "Enable all access for account_linking_tokens" ON account_linking_tokens FOR ALL USING (true);

-- Alternative: Disable RLS entirely for development (less secure but simpler)
-- Uncomment these lines if you prefer to disable RLS:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE technologies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_technologies DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE files DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE account_linking_tokens DISABLE ROW LEVEL SECURITY;