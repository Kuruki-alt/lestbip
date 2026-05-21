/**
 * sessionsReducer.js — セッション一覧と現在開いているセッションIDを管理する純粋 reducer。
 * 副作用（LocalStorage 保存等）は呼び出し側（useSessions フック）で扱う。
 *
 * @typedef {import('@/lib/calculator').Session} Session
 *
 * @typedef {Object} State
 * @property {Session[]} sessions          updatedAt 降順で保持される
 * @property {string|null} currentSessionId
 * @property {boolean} hydrated             初期 LocalStorage 読み込み完了
 *
 * @typedef {{ type: 'HYDRATE', sessions: Session[] }
 *        | { type: 'CREATE_SESSION', session: Session }
 *        | { type: 'UPSERT_SESSION', session: Session }
 *        | { type: 'OPEN_SESSION', id: string }
 *        | { type: 'CLOSE_SESSION' }
 *        | { type: 'DELETE_SESSION', id: string }
 *        | { type: 'RENAME_SESSION', id: string, name: string }
 *        | { type: 'ADD_MEMBER', sessionId: string, member: { id: string, name: string } }
 *        | { type: 'REMOVE_MEMBER', sessionId: string, memberId: string }
 *        | { type: 'PATCH_SESSION', id: string, patch: Partial<Session> }} Action
 */

/** @type {State} */
export const INITIAL_STATE = {
  sessions: [],
  currentSessionId: null,
  hydrated: false,
};

function bySessionId(id) {
  return (s) => s?.id === id;
}

/**
 * 配列内の一致セッションを差し替える。一致が無ければ末尾追加。
 * @template T
 * @param {T[]} list
 * @param {T} item
 * @param {(x: T) => boolean} match
 */
function upsert(list, item, match) {
  const idx = list.findIndex(match);
  if (idx < 0) return [...list, item];
  const copy = list.slice();
  copy.splice(idx, 1, item);
  return copy;
}

function touch(session) {
  return { ...session, updatedAt: new Date().toISOString() };
}

function sortByUpdated(list) {
  return list.slice().sort((a, b) => {
    const at = String(a?.updatedAt ?? '');
    const bt = String(b?.updatedAt ?? '');
    return bt.localeCompare(at);
  });
}

/**
 * @param {State} state
 * @param {Action} action
 * @returns {State}
 */
export function sessionsReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        sessions: sortByUpdated(action.sessions ?? []),
        hydrated: true,
      };
    case 'CREATE_SESSION':
      return {
        ...state,
        sessions: sortByUpdated([action.session, ...state.sessions]),
        currentSessionId: action.session.id,
      };
    case 'UPSERT_SESSION': {
      // 共有URL 取り込み用：同 id があれば上書き、無ければ追加。
      // 取り込み直後は current として開く（v3.0.0 改修案 #2）。
      const sessions = upsert(
        state.sessions,
        touch(action.session),
        bySessionId(action.session.id),
      );
      return {
        ...state,
        sessions: sortByUpdated(sessions),
        currentSessionId: action.session.id,
      };
    }
    case 'OPEN_SESSION':
      return { ...state, currentSessionId: action.id };
    case 'CLOSE_SESSION':
      return { ...state, currentSessionId: null };
    case 'DELETE_SESSION': {
      const next = state.sessions.filter((s) => s?.id !== action.id);
      return {
        ...state,
        sessions: next,
        currentSessionId:
          state.currentSessionId === action.id ? null : state.currentSessionId,
      };
    }
    case 'RENAME_SESSION': {
      const cur = state.sessions.find(bySessionId(action.id));
      if (!cur) return state;
      const updated = touch({ ...cur, name: action.name });
      return {
        ...state,
        sessions: sortByUpdated(
          upsert(state.sessions, updated, bySessionId(action.id)),
        ),
      };
    }
    case 'ADD_MEMBER': {
      const cur = state.sessions.find(bySessionId(action.sessionId));
      if (!cur) return state;
      const updated = touch({
        ...cur,
        members: [...(cur.members ?? []), action.member],
      });
      return {
        ...state,
        sessions: sortByUpdated(
          upsert(state.sessions, updated, bySessionId(action.sessionId)),
        ),
      };
    }
    case 'REMOVE_MEMBER': {
      const cur = state.sessions.find(bySessionId(action.sessionId));
      if (!cur) return state;
      const updated = touch({
        ...cur,
        members: (cur.members ?? []).filter((m) => m?.id !== action.memberId),
      });
      return {
        ...state,
        sessions: sortByUpdated(
          upsert(state.sessions, updated, bySessionId(action.sessionId)),
        ),
      };
    }
    case 'PATCH_SESSION': {
      const cur = state.sessions.find(bySessionId(action.id));
      if (!cur) return state;
      const updated = touch({ ...cur, ...action.patch });
      return {
        ...state,
        sessions: sortByUpdated(
          upsert(state.sessions, updated, bySessionId(action.id)),
        ),
      };
    }
    default:
      return state;
  }
}

/** 現在開いているセッションを返す。無ければ null。 */
export function selectCurrentSession(state) {
  if (!state || !state.currentSessionId) return null;
  return state.sessions.find(bySessionId(state.currentSessionId)) ?? null;
}
