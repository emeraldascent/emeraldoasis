import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Member, BadgeStatus } from '../lib/types';
import type { User, Session } from '@supabase/supabase-js';

function calculateBadgeStatus(member: Member): BadgeStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(member.membership_start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(member.membership_end);
  end.setHours(0, 0, 0, 0);

  if (start > today) return 'future';
  if (end < today) return 'expired';
  return 'active';
}

export function useMember() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [badgeStatus, setBadgeStatus] = useState<BadgeStatus>('expired');
  const [loading, setLoading] = useState(true);

  const fetchMember = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching member:', error);
      return;
    }

    if (data) {
      setMember(data as Member);
      setBadgeStatus(calculateBadgeStatus(data as Member));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMember(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchMember(session.user.id);
        } else {
          setMember(null);
          setBadgeStatus('expired');
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchMember]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setMember(null);
  };

  const refreshMember = useCallback(async () => {
    if (user) {
      await fetchMember(user.id);
    }
  }, [user, fetchMember]);

  return {
    user,
    session,
    member,
    badgeStatus,
    loading,
    login,
    signup,
    logout,
    refreshMember,
  };
}
