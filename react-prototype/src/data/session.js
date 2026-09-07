// Local demo access state, not server authentication. Existing demo visits remain active.
const KEY = 'nansa.demo-session.v1';
const EVENT = 'nansa-session-change';
let memoryState = true;
export function isSessionActive() {
  try { return window.localStorage.getItem(KEY) !== 'signed-out'; }
  catch { return memoryState; }
}
function update(active) {
  memoryState = active;
  try { window.localStorage.setItem(KEY, active ? 'active' : 'signed-out'); } catch { /* Keep this tab usable when storage is unavailable. */ }
  window.dispatchEvent(new Event(EVENT));
}
export function startSession() { update(true); }
export function endSession() { update(false); }
export function subscribeSession(listener) {
  const onStorage = event => { if (event.key === KEY || event.key === null) listener(); };
  window.addEventListener(EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
