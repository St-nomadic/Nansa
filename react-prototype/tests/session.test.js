import test from 'node:test';
import assert from 'node:assert/strict';
import { isSessionActive, startSession, endSession, subscribeSession } from '../src/data/session.js';

test('demo logout persists, preserves user data, and notifies subscribers', () => {
 const values = new Map([['nansa.careers.v1', 'saved career']]);
 const target = new EventTarget();
 globalThis.window = { localStorage: {getItem: k=>values.get(k) ?? null, setItem:(k,v)=>values.set(k,v)}, addEventListener: target.addEventListener.bind(target), removeEventListener:target.removeEventListener.bind(target), dispatchEvent:target.dispatchEvent.bind(target)};
 let changes=0;const unsubscribe=subscribeSession(()=>changes++);
 assert.equal(isSessionActive(),true);
 endSession();assert.equal(isSessionActive(),false);
 assert.equal(values.get('nansa.careers.v1'),'saved career');
 startSession();assert.equal(isSessionActive(),true);assert.equal(changes,2);
 unsubscribe();endSession();assert.equal(changes,2);
 delete globalThis.window;
});
