// Local route state only; server authorization must be enforced by the authentication provider.
const KEY = 'nansa.demo-session.v1';
const EVENT = 'nansa-session-change';
let memoryState = false;
export function isSessionActive() {
  try { return window.localStorage.getItem(KEY) === 'authenticated'; }
  catch { return memoryState; }
}
function update(active) {
  memoryState = active;
  try { window.localStorage.setItem(KEY, active ? 'authenticated' : 'signed-out'); } catch { /* Keep this tab usable when storage is unavailable. */ }
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
