import { startSession } from './session.js';
import { syncAfterAuth } from './cloudData.js';
const ACCOUNT_KEY = 'nansa.demo-account.v1';
let clientPromise;
async function client() {
  if (!clientPromise) clientPromise = (async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('로그인 서비스 연결을 준비 중입니다. 잠시 후 다시 시도해 주세요.');
    const { createClient } = await import('@supabase/supabase-js');
    return createClient(url, key);
  })().catch(error => { clientPromise = null; throw error; });
  return clientPromise;
}
export async function authenticate({ signup, name, email, password }) {
  // When no hosted auth provider is configured, keep the prototype usable with
  // a browser-local account. The Supabase branch remains available for a real deployment.
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    const normalizedEmail = email.trim().toLowerCase();
    let account = null;
    try { account = JSON.parse(window.localStorage.getItem(ACCOUNT_KEY) || 'null'); } catch { account = null; }
    if (signup) {
      if (account?.email === normalizedEmail) throw new Error('이미 가입한 이메일이에요. 로그인해 주세요.');
      window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ name: name.trim(), email: normalizedEmail, password }));
      startSession();
      return { session: { user: { email: normalizedEmail } } };
    }
    if (!account || account.email !== normalizedEmail || account.password !== password) {
      throw new Error('이메일 또는 비밀번호를 확인해 주세요.');
    }
    startSession();
    await syncAfterAuth();
    return { session: { user: { email: account.email } } };
  }
  const supabase = await client();
  const { data, error } = signup
    ? await supabase.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: `${window.location.origin}/login` } })
    : await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === 'invalid_credentials') throw new Error('이메일 또는 비밀번호를 확인해 주세요.');
    if (error.code === 'email_not_confirmed') throw new Error('이메일 인증을 완료한 뒤 로그인해 주세요.');
    throw new Error(signup ? '회원가입하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.' : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
  if (data.session) {
    startSession();
    await syncAfterAuth();
  }
  return data;
}
export async function signOut() {
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) { const supabase = await client(); const { error } = await supabase.auth.signOut({ scope: 'local' }); if (error) throw error; }
}
