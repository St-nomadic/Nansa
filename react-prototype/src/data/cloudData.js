const TABLE = 'user_data';
const KEYS = {
  basics: 'nansa.basics.v1',
  careers: 'nansa.careers.v1',
  achievements: 'nansa.achievements.v1',
  jobs: 'nansa.jobs.v1',
  documents: 'nansa.docs.v1',
};

let clientPromise;
let timer;

async function client() {
  if (typeof window === 'undefined' || !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => (
      createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    )).catch(() => null);
  }
  return clientPromise;
}

function read(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch { return fallback; }
}

function snapshot() {
  return {
    basics: read(KEYS.basics, {}),
    careers: read(KEYS.careers, []),
    achievements: read(KEYS.achievements, []),
    jobs: read(KEYS.jobs, []),
    documents: read(KEYS.documents, []),
  };
}

export async function syncAfterAuth() {
  const supabase = await client();
  if (!supabase) return;
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult?.user;
  if (!user) return;
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('사용자 데이터를 불러오지 못했어요.');
  if (data) {
    for (const key of Object.keys(KEYS)) {
      if (data[key] !== null && data[key] !== undefined) window.localStorage.setItem(KEYS[key], JSON.stringify(data[key]));
    }
    return;
  }
  await persistSnapshot(supabase, user.id, snapshot());
}

async function persistSnapshot(supabase, userId, values) {
  const { error } = await supabase.from(TABLE).upsert({ user_id: userId, ...values, updated_at: new Date().toISOString() });
  if (error) throw new Error('사용자 데이터를 저장하지 못했어요.');
}

export function queueCloudSync() {
  if (typeof window === 'undefined') return;
  window.clearTimeout(timer);
  timer = window.setTimeout(async () => {
    const supabase = await client();
    if (!supabase) return;
    const { data: userResult } = await supabase.auth.getUser();
    if (userResult?.user) await persistSnapshot(supabase, userResult.user.id, snapshot()).catch(() => {});
  }, 250);
}
