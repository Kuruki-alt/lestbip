/**
 * mockData.js — ワイヤーフレーム用モックデータ。
 * 計算/永続化は未実装のため、画面確認用の固定データを提供する。
 * すべての配列要素は安定した id を持つ（key に index を使わないため）。
 */

/** @typedef {{ id: string, name: string }} Member */

/** @type {Member[]} */
export const MOCK_MEMBERS = [
  { id: 'm-1', name: 'あおい / Aoi' },
  { id: 'm-2', name: 'はると / Haruto' },
  { id: 'm-3', name: 'ゆい / Yui' },
  { id: 'm-4', name: 'そら / Sora' },
];

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} name
 * @property {string} payerId
 * @property {number} total
 * @property {string[]} memberIds  割り勘対象メンバーID
 */

/** @type {Payment[]} */
export const MOCK_PAYMENTS = [
  {
    id: 'p-1',
    name: '1次会 / Dinner',
    payerId: 'm-1',
    total: 24000,
    memberIds: ['m-1', 'm-2', 'm-3', 'm-4'],
  },
  {
    id: 'p-2',
    name: '2次会 / Bar',
    payerId: 'm-2',
    total: 12000,
    memberIds: ['m-1', 'm-2', 'm-3'],
  },
  {
    id: 'p-3',
    name: 'タクシー代 / Taxi',
    payerId: 'm-3',
    total: 3600,
    memberIds: ['m-1', 'm-3', 'm-4'],
  },
];

/**
 * @typedef {Object} SessionSummary
 * @property {string} id
 * @property {string} name
 * @property {number} memberCount
 * @property {number} paymentCount
 * @property {string} updatedAt
 */

/** @type {SessionSummary[]} */
export const MOCK_SESSIONS = [
  {
    id: 's-1',
    name: '渋谷ダンジョン攻略 / Shibuya Dungeon',
    memberCount: 4,
    paymentCount: 3,
    updatedAt: '2026-05-18',
  },
  {
    id: 's-2',
    name: '社員旅行クエスト / Company Trip Quest',
    memberCount: 6,
    paymentCount: 8,
    updatedAt: '2026-05-10',
  },
  {
    id: 's-3',
    name: 'BBQ遠征 / Barbecue Expedition',
    memberCount: 5,
    paymentCount: 4,
    updatedAt: '2026-04-29',
  },
];

/**
 * @typedef {Object} Transfer
 * @property {string} id
 * @property {string} fromId
 * @property {string} toId
 * @property {number} amount
 */

/** @type {Transfer[]} (モック: 個人間支払いを差し引いた後の最小送金リスト) */
export const MOCK_TRANSFERS = [
  { id: 't-1', fromId: 'm-2', toId: 'm-1', amount: 6900 },
  { id: 't-2', fromId: 'm-4', toId: 'm-1', amount: 7200 },
  { id: 't-3', fromId: 'm-3', toId: 'm-1', amount: 1500 },
];

/**
 * 「いいよいいよ〜^^」で完遂（免除）した記録を示すアイコン。
 * 履歴・精算リストでこのバッジを表示する。
 */
export const WAIVED_ICON = '🙆';

/**
 * @typedef {Object} DirectPayment
 * @property {string} id
 * @property {string} fromId  支払った人
 * @property {string} toId    受け取った人
 * @property {number} amount
 * @property {boolean} [waived] 「いいよいいよ〜^^」で金額不問の完遂（免除）扱い
 */

/**
 * 個人間の支払い（返済）。割り勘とは別種の記録で、履歴には残しつつ
 * 全体精算計算からは差し引く（計算ロジックは calculator.js の将来責務）。
 * waived:true は「いいよいいよ〜^^」ボタンで金額に関わらず完遂した記録。
 *
 * @type {DirectPayment[]} (モック: 当人同士で精算済み / 免除済みの送金)
 */
export const MOCK_DIRECT_PAYMENTS = [
  { id: 'd-1', fromId: 'm-3', toId: 'm-1', amount: 2000 },
  { id: 'd-2', fromId: 'm-4', toId: 'm-2', amount: 1500 },
  { id: 'd-3', fromId: 'm-2', toId: 'm-1', amount: 5000, waived: true },
];
