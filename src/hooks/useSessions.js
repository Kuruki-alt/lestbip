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

  /**
   * 共有URL等から取り込んだセッションテンプレートを保存する（v3.0.0 改修案 #2）。
   * テンプレートに id があり同 id の既存セッションがあれば「上書き」して開く。
   * 無ければテンプレートの id を保持したまま追加する（次回以降の再共有でも
   * 同じセッションを更新できるようにするため）。id 自体が無い場合のみ新規発行。
   *
   * @param {Partial<import('@/lib/calculator').Session>} template
   * @returns {string} 取り込んだ session の id
   */
  const importSession = useCallback(
    (template) => {
      const now = new Date().toISOString();
      const incomingId = typeof template?.id === 'string' ? template.id : '';
      const id = incomingId || genId('s');
      const existing = state.sessions.find((s) => s?.id === id);
      const session = {
        id,
        name: template?.name || '',
        members: (template?.members ?? []).map((m) => ({
          id: m?.id ?? genId('m'),
          name: m?.name ?? '',
        })),
        currency: template?.currency ?? 'JPY',
        rounding: template?.rounding ?? 'floor',
        payments: Array.isArray(template?.payments) ? template.payments : [],
        directPayments: Array.isArray(template?.directPayments)
          ? template.directPayments
          : [],
        driverDiscount: template?.driverDiscount,
        manualDiffPayerId: template?.manualDiffPayerId,
        createdAt: existing?.createdAt ?? template?.createdAt ?? now,
        updatedAt: now,
      };
      dispatch({ type: 'UPSERT_SESSION', session });
      persistSession(session);
      return session.id;
    },
    [dispatch, state.sessions],
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
    importSession,
    openSession,
    closeSession,
    deleteSession,
    renameSession,
    addMember,
    removeMember,
    patchSession,
  };
}
