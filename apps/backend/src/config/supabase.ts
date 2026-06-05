import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

// Polyfill WebSocket for Node.js environments < 22 (like Render)
if (typeof global !== 'undefined' && !global.WebSocket) {
  (global as any).WebSocket = ws;
}

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('WARNING: Supabase URL or Service Role Key is missing!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});
