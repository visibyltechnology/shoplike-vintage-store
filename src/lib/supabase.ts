import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Keep localStorage in sync so existing sync helpers keep working
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    const meta = session.user.user_metadata ?? {};
    const user = {
      id: session.user.id,
      email: session.user.email ?? '',
      name: meta.name || session.user.email?.split('@')[0] || 'User',
      phone: meta.phone || null,
    };
    localStorage.setItem('sv_customer_user', JSON.stringify(user));
    localStorage.setItem('sv_customer_token', session.access_token);
  } else if (event === 'SIGNED_OUT') {
    localStorage.removeItem('sv_customer_user');
    localStorage.removeItem('sv_customer_token');
  }
});
