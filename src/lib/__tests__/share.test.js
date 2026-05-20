import { describe, it, expect } from 'vitest';
import {
  encodeSession,
  decodeSession,
  encodeSessionToUrl,
  decodeSessionFromUrl,
} from '@/lib/share';

const sample = {
  id: 's-1',
  name: '渋谷ダンジョン攻略',
  members: [
    { id: 'm-1', name: 'あおい' },
    { id: 'm-2', name: 'はると' },
  ],
  currency: 'JPY',
  rounding: 'floor',
  payments: [],
  directPayments: [],
};

describe('encodeSession / decodeSession', () => {
  it('日本語含む JSON を URL-safe Base64 で往復できる', () => {
    const enc = encodeSession(sample);
    expect(enc).not.toMatch(/[+/=]/);
    const dec = decodeSession(enc);
    expect(dec).toEqual(sample);
  });

  it('壊れた入力は null を返す', () => {
    expect(decodeSession('not-base64-!!!')).toBe(null);
    expect(decodeSession('')).toBe(null);
  });
});

describe('encodeSessionToUrl / decodeSessionFromUrl', () => {
  it('baseUrl 指定で URL を組み立て、URL から復元できる', () => {
    const url = encodeSessionToUrl(sample, 'https://example.test/app');
    expect(url).toMatch(/^https:\/\/example\.test\/app\?s=/);
    const dec = decodeSessionFromUrl(url);
    expect(dec).toEqual(sample);
  });

  it('クエリ文字列のみからも復元できる', () => {
    const enc = encodeSession(sample);
    expect(decodeSessionFromUrl(`?s=${enc}`)).toEqual(sample);
    expect(decodeSessionFromUrl(`s=${enc}`)).toEqual(sample);
  });

  it('s= が無い URL は null', () => {
    expect(decodeSessionFromUrl('https://example.test/?x=1')).toBe(null);
  });
});
