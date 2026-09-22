import { startSession } from './session.js';
import { clearLocalUserData, syncAfterAuth } from './cloudData.js';
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
  const supabase = await client();
  if (supabase) { const { error } = await supabase.auth.signOut({ scope: 'local' }); if (error) throw error; }
  clearLocalUserData();
}

export async function getAuthSession() {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function watchAuth(callback) {
  let disposed = false;
  let unsubscribe = () => {};
  client().then(supabase => {
    if (!supabase || disposed) return;
    const result = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    unsubscribe = () => result.data.subscription.unsubscribe();
  });
  return () => { disposed = true; unsubscribe(); };
}
