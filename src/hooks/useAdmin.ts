import { useMemo } from 'react';
import type { User } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'emeraldoasiscamp@gmail.com';

export function useAdmin(user: User | null): boolean {
  return useMemo(() => {
    return user?.email === ADMIN_EMAIL;
  }, [user]);
}
