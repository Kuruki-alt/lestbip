import { describe, it, expect } from 'vitest';
import {
  INITIAL_STATE,
  sessionsReducer,
  selectCurrentSession,
} from '@/store/sessionsReducer';

function makeSession(id, name = 'x', extra = {}) {
  return {
    id,
    name,
    members: [],
    currency: 'JPY',
    rounding: 'floor',
    payments: [],
    directPayments: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

describe('sessionsReducer', () => {
  it('HYDRATE は配列をセットし hydrated=true', () => {
    const s = sessionsReducer(INITIAL_STATE, {
      type: 'HYDRATE',
      sessions: [makeSession('s-1')],
    });
    expect(s.sessions).toHaveLength(1);
    expect(s.hydrated).toBe(true);
  });

  it('CREATE_SESSION で先頭に追加し currentSessionId を設定', () => {
    const s = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1'),
    });
    expect(s.sessions[0].id).toBe('s-1');
    expect(s.currentSessionId).toBe('s-1');
  });

  it('OPEN_SESSION / CLOSE_SESSION で current を切替', () => {
    const s1 = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1'),
    });
    const s2 = sessionsReducer(s1, { type: 'CLOSE_SESSION' });
    expect(s2.currentSessionId).toBe(null);
    const s3 = sessionsReducer(s2, { type: 'OPEN_SESSION', id: 's-1' });
    expect(s3.currentSessionId).toBe('s-1');
  });

  it('DELETE_SESSION で削除、current が一致なら null 化', () => {
    const s1 = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1'),
    });
    const s2 = sessionsReducer(s1, { type: 'DELETE_SESSION', id: 's-1' });
    expect(s2.sessions).toHaveLength(0);
    expect(s2.currentSessionId).toBe(null);
  });

  it('RENAME_SESSION で名前を変更し updatedAt を更新', () => {
    const old = '2020-01-01T00:00:00.000Z';
    const s1 = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1', '旧名', { updatedAt: old }),
    });
    const s2 = sessionsReducer(s1, {
      type: 'RENAME_SESSION',
      id: 's-1',
      name: '新名',
    });
    expect(s2.sessions[0].name).toBe('新名');
    expect(s2.sessions[0].updatedAt > old).toBe(true);
  });

  it('ADD_MEMBER / REMOVE_MEMBER で members を更新', () => {
    const s1 = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1'),
    });
    const s2 = sessionsReducer(s1, {
      type: 'ADD_MEMBER',
      sessionId: 's-1',
      member: { id: 'm-1', name: 'A' },
    });
    expect(s2.sessions[0].members).toEqual([{ id: 'm-1', name: 'A' }]);
    const s3 = sessionsReducer(s2, {
      type: 'REMOVE_MEMBER',
      sessionId: 's-1',
      memberId: 'm-1',
    });
    expect(s3.sessions[0].members).toEqual([]);
  });

  it('UPSERT_SESSION は同 id があれば上書き、無ければ追加し current に', () => {
    // 上書きケース
    const s1 = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1', '旧', {
        updatedAt: '2020-01-01T00:00:00.000Z',
      }),
    });
    const s2 = sessionsReducer(s1, {
      type: 'UPSERT_SESSION',
      session: makeSession('s-1', '新'),
    });
    expect(s2.sessions).toHaveLength(1);
    expect(s2.sessions[0].name).toBe('新');
    expect(s2.currentSessionId).toBe('s-1');

    // 追加ケース
    const s3 = sessionsReducer(s2, {
      type: 'UPSERT_SESSION',
      session: makeSession('s-2', 'X'),
    });
    expect(s3.sessions).toHaveLength(2);
    expect(s3.currentSessionId).toBe('s-2');
  });

  it('PATCH_SESSION で部分更新できる', () => {
    const s1 = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1'),
    });
    const s2 = sessionsReducer(s1, {
      type: 'PATCH_SESSION',
      id: 's-1',
      patch: { currency: 'USD', rounding: 'round' },
    });
    expect(s2.sessions[0].currency).toBe('USD');
    expect(s2.sessions[0].rounding).toBe('round');
  });

  it('updatedAt 降順でソートされる', () => {
    const a = makeSession('a', 'A', { updatedAt: '2020-01-01T00:00:00.000Z' });
    const b = makeSession('b', 'B', { updatedAt: '2025-01-01T00:00:00.000Z' });
    const s = sessionsReducer(INITIAL_STATE, {
      type: 'HYDRATE',
      sessions: [a, b],
    });
    expect(s.sessions.map((x) => x.id)).toEqual(['b', 'a']);
  });

  it('未知 action は state をそのまま返す', () => {
    const result = sessionsReducer(INITIAL_STATE, { type: 'UNKNOWN' });
    expect(result).toBe(INITIAL_STATE);
  });
});

describe('selectCurrentSession', () => {
  it('現在開いているセッションを返す', () => {
    const s = sessionsReducer(INITIAL_STATE, {
      type: 'CREATE_SESSION',
      session: makeSession('s-1', 'A'),
    });
    const cur = selectCurrentSession(s);
    expect(cur?.id).toBe('s-1');
  });

  it('無ければ null', () => {
    expect(selectCurrentSession(null)).toBe(null);
    expect(selectCurrentSession({ ...INITIAL_STATE })).toBe(null);
  });
});
