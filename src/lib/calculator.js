/**
 * calculator.js — 割り勘計算・最小送金回数アルゴリズム（独立モジュール）。
 *
 * 純粋関数のみ。React や LocalStorage に依存しない。
 * 仕様（warikan-app-requirements.md §3 / §6）:
 *  - 均等割り + 固定金額指定（固定者の残額を残り対象で均等割り）
 *  - 端数処理（floor / ceil / round）はセッション単位
 *  - 御者割（オプション）: 10km につき 1% で御者の負担を軽減。
 *    全体（セッション）設定が各支払いより優先。
 *  - 個人間支払い（返済）を全体集計から差し引き、最小送金リストは差し引き後で算出。
 *  - 「いいよ！」(waived) は完全免除：from の現時点の負債 (burdens - paid) を
 *    paid 側に積み増して net を 0 まで戻す。to への追加負担計上は行わない
 *    （v3.0.0 改修案 #3）。
 *
 * @typedef {Object} Member
 * @property {string} id
 * @property {string} name
 *
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} name
 * @property {string} payerId
 * @property {number} total
 * @property {string[]} [excludedMemberIds]                 割り勘対象から除外するメンバー
 * @property {Record<string, number>} [fixedAmounts]        メンバーID→固定額（指定時のみ）
 * @property {string} [coachmanId]                          個別の御者
 * @property {number} [distanceKm]                          個別の移動距離
 *
 * @typedef {Object} DirectPayment
 * @property {string} id
 * @property {string} fromId
 * @property {string} toId
 * @property {number} amount
 * @property {boolean} [waived]                             「いいよ！」で完遂扱い
 *
 * @typedef {'floor'|'ceil'|'round'} RoundingMode
 *
 * @typedef {Object} OverallDriverDiscount
 * @property {boolean} enabled
 * @property {string} [coachmanId]
 * @property {number} [distanceKm]
 *
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} name
 * @property {Member[]} members
 * @property {import('./currency').CurrencyCode} currency
 * @property {RoundingMode} rounding
 * @property {Payment[]} payments
 * @property {DirectPayment[]} directPayments
 * @property {OverallDriverDiscount} [driverDiscount]
 * @property {string} [manualDiffPayerId]                   端数差額の手動負担者
 *
 * @typedef {Object} Transfer
 * @property {string} id
 * @property {string} fromId
 * @property {string} toId
 * @property {number} amount
 *
 * @typedef {Object} SettlementResult
 * @property {Record<string, number>} burdens               メンバーID → 確定負担額
 * @property {Record<string, number>} paid                  メンバーID → 立替・直接支払い合計
 * @property {Record<string, number>} net                   メンバーID → 純差額（正=受取側）
 * @property {number} roundingDiff                          端数処理による差額（合計 - sum(burdens)）
 * @property {Transfer[]} transfers                         最小送金リスト
 */

/** 0 比較の許容誤差（浮動小数による微小誤差吸収） */
const EPSILON = 0.005;

/** 1人あたりの金額に対する端数処理 */
function applyRounding(value, mode) {
  if (mode === 'ceil') return Math.ceil(value);
  if (mode === 'round') return Math.round(value);
  return Math.floor(value);
}

/** Map 経由で動的キーアクセスし object injection を回避 */
function getNum(map, key, fallback = 0) {
  const v = map.get(key);
  return Number.isFinite(v) ? v : fallback;
}

/**
 * 御者割の軽減率(%)を返す。全体設定が個別より優先。
 * @returns {{ coachmanId: string, pct: number } | null}
 */
function resolveDriverDiscount(payment, overall) {
  // 全体（セッション）設定が有効かつ御者IDあり → 優先
  if (overall && overall.enabled && overall.coachmanId) {
    const pct = Math.floor((Number(overall.distanceKm) || 0) / 10);
    if (pct > 0) {
      return { coachmanId: overall.coachmanId, pct };
    }
  }
  // 個別（支払いごと）設定
  if (payment.coachmanId) {
    const pct = Math.floor((Number(payment.distanceKm) || 0) / 10);
    if (pct > 0) {
      return { coachmanId: payment.coachmanId, pct };
    }
  }
  return null;
}

/**
 * 1 支払いを、対象メンバーごとの負担額に分解する。
 * 固定金額 → 残額を残対象で均等割り → 端数処理 → 御者割（軽減分を非御者へ比例配分）。
 *
 * @returns {Record<string, number>} memberId → 負担額
 */
function allocatePayment(payment, allMembers, overall, rounding) {
  const excluded = new Set(payment.excludedMemberIds ?? []);
  const included = allMembers.filter((m) => !excluded.has(m.id));
  /** @type {Map<string, number>} */
  const shares = new Map();
  if (included.length === 0) return Object.fromEntries(shares);

  const total = Number(payment.total) || 0;
  const fixedMap = new Map(Object.entries(payment.fixedAmounts ?? {}));
  // 対象に含まれる固定金額のみ採用
  const fixedIncluded = included.filter((m) => fixedMap.has(m.id));
  const variable = included.filter((m) => !fixedMap.has(m.id));
  let fixedSum = 0;
  for (const m of fixedIncluded) {
    const v = getNum(fixedMap, m.id, 0);
    shares.set(m.id, v);
    fixedSum += v;
  }

  // 残額を可変メンバーで均等割り
  const remaining = total - fixedSum;
  if (variable.length > 0) {
    const perHead = remaining / variable.length;
    for (const m of variable) {
      shares.set(m.id, applyRounding(perHead, rounding));
    }
  } else if (Math.abs(remaining) > EPSILON) {
    // 全員固定で残額がある場合は、最初の対象に押し付ける（要件外のエッジ）
    const first = included[0];
    shares.set(first.id, getNum(shares, first.id, 0) + remaining);
  }

  // 御者割: 御者が対象に含まれる場合のみ、御者の負担を pct% 軽減し
  // 同額を非御者対象（御者以外の含まれているメンバー）に比例配分する。
  const dd = resolveDriverDiscount(payment, overall);
  if (dd && shares.has(dd.coachmanId)) {
    const before = getNum(shares, dd.coachmanId, 0);
    const reduction = (before * dd.pct) / 100;
    if (reduction > EPSILON) {
      shares.set(dd.coachmanId, applyRounding(before - reduction, rounding));
      const others = included.filter((m) => m.id !== dd.coachmanId);
      const othersSumBefore = others.reduce(
        (s, m) => s + getNum(shares, m.id, 0),
        0,
      );
      if (others.length > 0 && othersSumBefore > EPSILON) {
        // 既存の負担に比例配分
        for (const m of others) {
          const cur = getNum(shares, m.id, 0);
          const add = (cur / othersSumBefore) * reduction;
          shares.set(m.id, applyRounding(cur + add, rounding));
        }
      } else if (others.length > 0) {
        // 既存負担が0の場合は均等配分
        const add = reduction / others.length;
        for (const m of others) {
          shares.set(
            m.id,
            applyRounding(getNum(shares, m.id, 0) + add, rounding),
          );
        }
      }
    }
  }

  return Object.fromEntries(shares);
}

/**
 * 純差額（net）から最小送金リストを貪欲法で算出する。
 * 完全な最小化（NP困難）ではないが標準的なヒューリスティック。
 *
 * @param {Record<string, number>} net memberId → 残高（正=受取、負=支払い）
 * @returns {Transfer[]}
 */
export function minimumTransfers(net) {
  /** @type {{ id: string, bal: number }[]} */
  const creditors = [];
  /** @type {{ id: string, bal: number }[]} */
  const debtors = [];
  for (const [id, bal] of Object.entries(net)) {
    if (bal > EPSILON) creditors.push({ id, bal });
    else if (bal < -EPSILON) debtors.push({ id, bal: -bal });
  }
  creditors.sort((a, b) => b.bal - a.bal);
  debtors.sort((a, b) => b.bal - a.bal);

  const transfers = [];
  let i = 0;
  let j = 0;
  let seq = 0;
  while (i < creditors.length && j < debtors.length) {
    // 数値 index アクセスを .at() 化（security/detect-object-injection 回避）
    const c = creditors.at(i);
    const d = debtors.at(j);
    const amount = Math.min(c.bal, d.bal);
    if (amount > EPSILON) {
      seq += 1;
      transfers.push({
        id: `t-${seq}`,
        fromId: d.id,
        toId: c.id,
        amount: Math.round(amount * 100) / 100,
      });
    }
    c.bal -= amount;
    d.bal -= amount;
    if (c.bal <= EPSILON) i += 1;
    if (d.bal <= EPSILON) j += 1;
  }
  return transfers;
}

/**
 * セッション全体の精算結果を計算する。
 *
 * @param {Session} session
 * @returns {SettlementResult}
 */
export function calculateSettlement(session) {
  const members = Array.isArray(session.members) ? session.members : [];
  const rounding = session.rounding ?? 'floor';
  const payments = Array.isArray(session.payments) ? session.payments : [];
  const directs = Array.isArray(session.directPayments)
    ? session.directPayments
    : [];

  /** @type {Map<string, number>} */
  const burdens = new Map(members.map((m) => [m.id, 0]));
  /** @type {Map<string, number>} */
  const paid = new Map(members.map((m) => [m.id, 0]));

  let roundingDiff = 0;
  for (const p of payments) {
    const alloc = allocatePayment(p, members, session.driverDiscount, rounding);
    let sumAlloc = 0;
    for (const [mid, amt] of Object.entries(alloc)) {
      burdens.set(mid, getNum(burdens, mid, 0) + amt);
      sumAlloc += amt;
    }
    if (paid.has(p.payerId)) {
      paid.set(p.payerId, getNum(paid, p.payerId, 0) + (Number(p.total) || 0));
    }
    roundingDiff += (Number(p.total) || 0) - sumAlloc;
  }

  // 個人間支払いの反映（v3.0.0 改修案 #3）：
  // - 通常 (waived=false): paid[from]+=amount, burdens[to]+=amount で資金移動を反映
  // - waived=true:         完全免除。from の現時点の負債 (burdens - paid) を
  //   paid[from] に積み増し net を 0 まで戻す。to への計上は行わない（負債を
  //   to が肩代わりするわけではなく、全体支払いから消える挙動）。
  for (const d of directs) {
    if (d.waived) {
      if (!paid.has(d.fromId) || !burdens.has(d.fromId)) continue;
      const debt = getNum(burdens, d.fromId, 0) - getNum(paid, d.fromId, 0);
      if (debt > EPSILON) {
        paid.set(d.fromId, getNum(paid, d.fromId, 0) + debt);
      }
      continue;
    }
    const amt = Number(d.amount) || 0;
    if (paid.has(d.fromId)) {
      paid.set(d.fromId, getNum(paid, d.fromId, 0) + amt);
    }
    if (burdens.has(d.toId)) {
      burdens.set(d.toId, getNum(burdens, d.toId, 0) + amt);
    }
  }

  // 端数差額を手動負担者に押し付ける（任意。未指定なら net に未反映で残る）
  if (session.manualDiffPayerId && burdens.has(session.manualDiffPayerId)) {
    burdens.set(
      session.manualDiffPayerId,
      getNum(burdens, session.manualDiffPayerId, 0) + roundingDiff,
    );
  }

  // Map 経由で動的キー書込みを回避（security/detect-object-injection 対策）
  /** @type {Record<string, number>} */
  const net = Object.fromEntries(
    members.map((m) => [
      m.id,
      Math.round((getNum(paid, m.id, 0) - getNum(burdens, m.id, 0)) * 100) /
        100,
    ]),
  );

  return {
    burdens: Object.fromEntries(burdens),
    paid: Object.fromEntries(paid),
    net,
    roundingDiff: Math.round(roundingDiff * 100) / 100,
    transfers: minimumTransfers(net),
  };
}
