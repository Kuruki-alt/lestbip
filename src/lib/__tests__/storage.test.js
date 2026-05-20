import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSessions,
  loadSession,
  saveSession,
  deleteSession,
  loadPrefs,
  savePrefs,
} from '@/lib/storage';

// Node 25 の experimental localStorage と jsdom が混在し .clear が無いことがあるため
// 既知キーのみを removeItem で初期化する。
beforeEach(() => {
  try {
    window.localStorage.removeItem('lestbip/sessions/v1');
    window.localStorage.removeItem('lestbip/prefs/v1');
  } catch {
    // 環境によっては localStorage が無い／読み取り専用の場合があるが本番コードでは safeStorage が守る
  }
});

const sessionA = {
  id: 's-1',
  name: 'A',
  members: [],
  currency: 'JPY',
  rounding: 'floor',
  payments: [],
  directPayments: [],
};

describe('storage: sessions', () => {
  it('初期は空配列', () => {
    expect(loadSessions()).toEqual([]);
  });

  it('saveSession で追加され loadSession で取得できる', () => {
    saveSession(sessionA);
    const list = loadSessions();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('s-1');
    expect(list[0].updatedAt).toBeDefined();
    expect(loadSession('s-1')?.id).toBe('s-1');
  });

  it('同 id を再保存すると更新（重複しない）', () => {
    saveSession(sessionA);
    saveSession({ ...sessionA, name: 'A2' });
    const list = loadSessions();
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('A2');
  });

  it('複数件は updatedAt 降順で並ぶ', async () => {
    saveSession({ ...sessionA, id: 's-1' });
    await new Promise((r) => setTimeout(r, 5));
    saveSession({ ...sessionA, id: 's-2' });
    const list = loadSessions();
    expect(list.map((s) => s.id)).toEqual(['s-2', 's-1']);
  });

  it('deleteSession で削除できる', () => {
    saveSession(sessionA);
    deleteSession('s-1');
    expect(loadSessions()).toEqual([]);
  });
});

describe('storage: prefs', () => {
  it('部分マージで保存される', () => {
    savePrefs({ lang: 'ja', currency: 'JPY' });
    savePrefs({ currency: 'USD' });
    expect(loadPrefs()).toEqual({ lang: 'ja', currency: 'USD' });
  });

  it('未設定時は空オブジェクト', () => {
    expect(loadPrefs()).toEqual({});
  });
});
