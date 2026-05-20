import { useCallback, useContext, useMemo } from 'react';
import { SessionsContext } from '@/store/sessionsContextValue';
import { selectCurrentSession } from '@/store/sessionsReducer';
import {
  saveSession as persistSession,
  deleteSession as persistDelete,
} from '@/lib/storage';
import { genId } from '@/lib/ids';

/**
 * セッションストアの公開 API。dispatch と storage 永続化を一括で扱う。
 *
 * @returns {{
 *   sessions: import('@/lib/calculator').Session[],
 *   currentSession: import('@/lib/calculator').Session | null,
 *   hydrated: boolean,
 *   createSession: (name: string, members: { id?: string, name: string }[], opts?: { currency?: import('@/lib/currency').CurrencyCode, rounding?: import('@/lib/calculator').RoundingMode }) => string,
 *   openSession: (id: string) => void,
 *   closeSession: () => void,
 *   deleteSession: (id: string) => void,
 *   renameSession: (id: string, name: string) => void,
 *   addMember: (sessionId: string, name: string) => void,
 *   removeMember: (sessionId: string, memberId: string) => void,
 *   patchSession: (id: string, patch: object) => void,
 * }}
 */
export function useSessions() {
  const ctx = useContext(SessionsContext);
  if (!ctx) {
    throw new Error('useSessions must be used within <SessionsProvider>');
  }
  const { state, dispatch } = ctx;

  const currentSession = useMemo(() => selectCurrentSession(state), [state]);

  const createSession = useCallback(
    (name, members, opts = {}) => {
      const now = new Date().toISOString();
      const session = {
        id: genId('s'),
        name: name || '',
        members: (members ?? []).map((m) => ({
          id: m.id ?? genId('m'),
          name: m.name,
        })),
        currency: opts.currency ?? 'JPY',
        rounding: opts.rounding ?? 'floor',
        payments: [],
        directPayments: [],
        createdAt: now,
        updatedAt: now,
      };
      dispatch({ type: 'CREATE_SESSION', session });
      persistSession(session);
      return session.id;
    },
    [dispatch],
  );

  const openSession = useCallback(
    (id) => dispatch({ type: 'OPEN_SESSION', id }),
    [dispatch],
  );

  const closeSession = useCallback(
    () => dispatch({ type: 'CLOSE_SESSION' }),
    [dispatch],
  );

  const deleteSession = useCallback(
    (id) => {
      dispatch({ type: 'DELETE_SESSION', id });
      persistDelete(id);
    },
    [dispatch],
  );

  const renameSession = useCallback(
    (id, name) => {
      dispatch({ type: 'RENAME_SESSION', id, name });
      const cur = state.sessions.find((s) => s?.id === id);
      if (cur) persistSession({ ...cur, name });
    },
    [dispatch, state.sessions],
  );

  const addMember = useCallback(
    (sessionId, name) => {
      const member = { id: genId('m'), name };
      dispatch({ type: 'ADD_MEMBER', sessionId, member });
      const cur = state.sessions.find((s) => s?.id === sessionId);
      if (cur) {
        persistSession({
          ...cur,
          members: [...(cur.members ?? []), member],
        });
      }
    },
    [dispatch, state.sessions],
  );

  const removeMember = useCallback(
    (sessionId, memberId) => {
      dispatch({ type: 'REMOVE_MEMBER', sessionId, memberId });
      const cur = state.sessions.find((s) => s?.id === sessionId);
      if (cur) {
        persistSession({
          ...cur,
          members: (cur.members ?? []).filter((m) => m?.id !== memberId),
        });
      }
    },
    [dispatch, state.sessions],
  );

  const patchSession = useCallback(
    (id, patch) => {
      dispatch({ type: 'PATCH_SESSION', id, patch });
      const cur = state.sessions.find((s) => s?.id === id);
      if (cur) persistSession({ ...cur, ...patch });
    },
    [dispatch, state.sessions],
  );

  return {
    sessions: state.sessions,
    currentSession,
    hydrated: state.hydrated,
    createSession,
    openSession,
    closeSession,
    deleteSession,
    renameSession,
    addMember,
    removeMember,
    patchSession,
  };
}
