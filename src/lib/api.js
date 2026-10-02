import { useCallback, useEffect, useState } from 'react';

const configured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

// Sample data is a dev-only convenience; a production build without keys fails loudly instead.
export const isSample = !configured && import.meta.env.DEV;

const backend = configured
  ? import('./supabaseBackend.js')
  : isSample
    ? import('./sampleBackend.js')
    : Promise.reject(new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'));
backend.catch(() => {});

const call = (name) => async (...args) => (await backend)[name](...args);

export const listNotes = call('listNotes');
export const saveNote = call('saveNote');
export const deleteNote = call('deleteNote');
export const setPublished = call('setPublished');
export const getAdminState = call('getAdminState');
export const signIn = call('signIn');
export const signOut = call('signOut');

// Public pages share one fetch; admin pages always load fresh (and include drafts).
let publicCache = null;
// The resolved list, so a page revisited via Back renders in full on its first paint.
let publicNotes = null;

export function invalidateNotes() {
  publicCache = null;
  publicNotes = null;
}

export function useNotes({ includeDrafts = false } = {}) {
  const [state, setState] = useState(() =>
    !includeDrafts && publicNotes
      ? { notes: publicNotes, loading: false, error: null }
      : { notes: [], loading: true, error: null },
  );

  const load = useCallback(() => {
    let promise;
    if (includeDrafts) {
      promise = listNotes({ includeDrafts: true });
    } else {
      publicCache ||= listNotes();
      promise = publicCache;
    }
    return promise.then(
      (notes) => {
        if (!includeDrafts) publicNotes = notes;
        setState({ notes, loading: false, error: null });
      },
      (error) => {
        if (!includeDrafts) publicCache = null;
        setState({ notes: [], loading: false, error: error.message });
      },
    );
  }, [includeDrafts]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
