import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  
  res.status(200).json({
    hasDatabase: !!databaseUrl,
    hasSupabase: !!supabaseUrl,
    databaseHost: databaseUrl ? databaseUrl.split('@')[1]?.split(':')[0] : 'not found',
    supabaseHost: supabaseUrl ? new URL(supabaseUrl).hostname : 'not found',
    timestamp: new Date().toISOString()
  });
}