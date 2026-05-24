import { describe, it, expect } from 'vitest';
import { calculateSettlement, minimumTransfers } from '@/lib/calculator';

const members = [
  { id: 'm-1', name: 'A' },
  { id: 'm-2', name: 'B' },
  { id: 'm-3', name: 'C' },
];

function makeSession(overrides = {}) {
  return {
    id: 's-1',
    name: 'test',
    members,
    currency: 'JPY',
    rounding: 'floor',
    payments: [],
    directPayments: [],
    ...overrides,
  };
}

describe('calculateSettlement — 均等割り基本', () => {
  it('総額を対象人数で均等に分配する', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'dinner', payerId: 'm-1', total: 3000 }],
      }),
    );
    expect(r.burdens['m-1']).toBe(1000);
    expect(r.burdens['m-2']).toBe(1000);
    expect(r.burdens['m-3']).toBe(1000);
    expect(r.paid['m-1']).toBe(3000);
    expect(r.net['m-1']).toBe(2000);
    expect(r.net['m-2']).toBe(-1000);
    expect(r.net['m-3']).toBe(-1000);
  });

  it('対象除外メンバーは負担しない', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [
          {
            id: 'p-1',
            name: 'taxi',
            payerId: 'm-1',
            total: 2000,
            excludedMemberIds: ['m-3'],
          },
        ],
      }),
    );
    expect(r.burdens['m-1']).toBe(1000);
    expect(r.burdens['m-2']).toBe(1000);
    expect(r.burdens['m-3']).toBe(0);
  });
});

describe('calculateSettlement — 通貨別小数桁数', () => {
  it('JPY は整数に丸める（従来どおり）', () => {
    const r = calculateSettlement(
      makeSession({
        currency: 'JPY',
        rounding: 'floor',
        payments: [{ id: 'p-1', name: 'x', payerId: 'm-1', total: 1000 }],
      }),
    );
    // 1000/3 = 333.33 → floor → 333（整数）
    expect(r.burdens['m-1']).toBe(333);
    expect(r.burdens['m-2']).toBe(333);
  });

  it('USD は小数2桁（セント）に丸める', () => {
    const r = calculateSettlement(
      makeSession({
        currency: 'USD',
        rounding: 'floor',
        payments: [{ id: 'p-1', name: 'x', payerId: 'm-1', total: 10 }],
      }),
    );
    // 10/3 = 3.3333 → floor(2桁) → 3.33
    expect(r.burdens['m-1']).toBe(3.33);
    expect(r.burdens['m-2']).toBe(3.33);
    expect(r.burdens['m-3']).toBe(3.33);
    // 端数 10 - 9.99 = 0.01
    expect(r.roundingDiff).toBeCloseTo(0.01, 5);
  });

  it('USD: 小数入力の合計を正しく分割する', () => {
    const r = calculateSettlement(
      makeSession({
        currency: 'USD',
        rounding: 'round',
        payments: [{ id: 'p-1', name: 'x', payerId: 'm-1', total: 30.5 }],
      }),
    );
    // 30.50/3 = 10.1666 → round(2桁) → 10.17
    expect(r.burdens['m-1']).toBe(10.17);
    expect(r.net['m-1']).toBeCloseTo(30.5 - 10.17, 5);
  });
});

describe('calculateSettlement — 固定金額式', () => {
  it('固定金額メンバーの残額を可変メンバーで均等割り', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [
          {
            id: 'p-1',
            name: 'mix',
            payerId: 'm-1',
            total: 10000,
            fixedAmounts: { 'm-1': 4000 },
          },
        ],
      }),
    );
    expect(r.burdens['m-1']).toBe(4000);
    expect(r.burdens['m-2']).toBe(3000);
    expect(r.burdens['m-3']).toBe(3000);
  });
});

describe('calculateSettlement — 端数処理', () => {
  it('floor: 端数切り捨て', () => {
    const r = calculateSettlement(
      makeSession({
        rounding: 'floor',
        payments: [{ id: 'p-1', name: 'x', payerId: 'm-1', total: 1000 }],
      }),
    );
    // 1000 / 3 = 333.33 → floor → 333
    expect(r.burdens['m-1']).toBe(333);
    expect(r.burdens['m-2']).toBe(333);
    expect(r.burdens['m-3']).toBe(333);
    // 1000 - 999 = 1 の差額
    expect(r.roundingDiff).toBe(1);
  });

  it('ceil: 端数切り上げ', () => {
    const r = calculateSettlement(
      makeSession({
        rounding: 'ceil',
        payments: [{ id: 'p-1', name: 'x', payerId: 'm-1', total: 1000 }],
      }),
    );
    // 1000 / 3 = 333.33 → ceil → 334
    expect(r.burdens['m-1']).toBe(334);
    expect(r.burdens['m-2']).toBe(334);
    expect(r.burdens['m-3']).toBe(334);
    expect(r.roundingDiff).toBe(-2);
  });

  it('round: 四捨五入', () => {
    const r = calculateSettlement(
      makeSession({
        rounding: 'round',
        payments: [{ id: 'p-1', name: 'x', payerId: 'm-1', total: 1000 }],
      }),
    );
    // 333.33 → round → 333
    expect(r.burdens['m-1']).toBe(333);
  });
});

describe('calculateSettlement — 御者割（全体>個別）', () => {
  it('全体御者割が個別より優先される', () => {
    const r = calculateSettlement(
      makeSession({
        rounding: 'round',
        driverDiscount: { enabled: true, coachmanId: 'm-2', distanceKm: 30 }, // 3%
        payments: [
          {
            id: 'p-1',
            name: 'drive',
            payerId: 'm-1',
            total: 3000,
            // 個別では m-3 を 10km(1%) 御者にしているが、全体が優先される
            coachmanId: 'm-3',
            distanceKm: 10,
          },
        ],
      }),
    );
    // 御者は m-2 で、3000/3=1000 から 3% 軽減 → 970
    expect(r.burdens['m-2']).toBe(970);
    // 残り 30 を m-1, m-3 に比例配分 → 各 +15 → 1015
    expect(r.burdens['m-1']).toBe(1015);
    expect(r.burdens['m-3']).toBe(1015);
  });

  it('個別御者割のみ設定でも動作する', () => {
    const r = calculateSettlement(
      makeSession({
        rounding: 'round',
        payments: [
          {
            id: 'p-1',
            name: 'drive',
            payerId: 'm-1',
            total: 3000,
            coachmanId: 'm-1',
            distanceKm: 20, // 2%
          },
        ],
      }),
    );
    expect(r.burdens['m-1']).toBe(980); // 1000 - 2% = 980
  });
});

describe('calculateSettlement — 個人間支払い', () => {
  it('通常の直接やり取りは net に反映される', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 3000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 500 },
        ],
      }),
    );
    // m-1: paid 3000, burdens 1000+500=1500, net=1500
    expect(r.net['m-1']).toBe(1500);
    // m-2: paid 500, burdens 1000, net=-500
    expect(r.net['m-2']).toBe(-500);
    // m-3: paid 0, burdens 1000, net=-1000
    expect(r.net['m-3']).toBe(-1000);
  });

  it('iiyo.md 本例: 残債は to(立替人) を除く他の債務者だけが肩代わり', () => {
    // A(m-1) が 30000 立替・3人均等。B(m-2) を「いいよ」3000 で完済扱い。
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 30000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 3000, waived: true },
        ],
      }),
    );
    // A: 立替を全額回収 → net 17000 (= C から)
    expect(r.net['m-1']).toBe(17000);
    // B: 3000 支払って net 0 → 見通しから消える
    expect(r.net['m-2']).toBe(0);
    // C: 自分の 10000 + B の残債 7000 = 17000 負担
    expect(r.net['m-3']).toBe(-17000);
    // 見通しは C → A 17000 の 1 件
    expect(r.transfers).toHaveLength(1);
    expect(r.transfers[0]).toMatchObject({
      fromId: 'm-3',
      toId: 'm-1',
      amount: 17000,
    });
  });

  it('iiyo amount=0: 残債全額を他の債務者が肩代わり', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 30000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 0, waived: true },
        ],
      }),
    );
    // B の負担 10000 全額が C へ → A 10000 / B 0 / C 20000
    expect(r.net['m-1']).toBe(20000);
    expect(r.net['m-2']).toBe(0);
    expect(r.net['m-3']).toBe(-20000);
  });

  it('iiyo: 複数の他の債務者で残債を等分 (4人)', () => {
    const four = [...members, { id: 'm-4', name: 'D' }];
    const r = calculateSettlement(
      makeSession({
        members: four,
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 40000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 3000, waived: true },
        ],
      }),
    );
    // B 残債 7000 を C・D で等分 (3500 ずつ) → C 13500 / D 13500
    expect(r.net['m-1']).toBe(27000);
    expect(r.net['m-2']).toBe(0);
    expect(r.net['m-3']).toBe(-13500);
    expect(r.net['m-4']).toBe(-13500);
  });

  it('iiyo: 他に債務者がいなければ to(立替人) がかぶる (2人)', () => {
    const two = [
      { id: 'm-1', name: 'A' },
      { id: 'm-2', name: 'B' },
    ];
    const r = calculateSettlement(
      makeSession({
        members: two,
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 20000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 3000, waived: true },
        ],
      }),
    );
    // B は 3000 で完済 net 0、残債 7000 の肩代わり先がいないので A が受取減
    expect(r.net['m-2']).toBe(0);
    // A: paid 20000, burdens 10000+3000(転送)=13000, net 7000 (= 受け取れるのは B の 3000 のみ、残りは A 負担)
    expect(r.net['m-1']).toBe(7000);
    // 見通しは空 (B は完済、他に債務者なし)
    expect(r.transfers).toHaveLength(0);
  });

  it('iiyo 対象が既に黒字なら何もしない', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-2', total: 3000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 500, waived: true },
        ],
      }),
    );
    // m-2 は paid 3000, burdens 1000 → 黒字なので waived 影響なし
    expect(r.net['m-2']).toBe(2000);
    expect(r.net['m-1']).toBe(-1000);
    expect(r.net['m-3']).toBe(-1000);
  });

  it('iiyo & Y >= D は Y を D にクランプし from を完済 (過払いなし)', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 3000 }],
        directPayments: [
          // Y=2000 > D=1000 → Y=1000 にクランプ。m-2 全額支払いで net 0、残債なし
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 2000, waived: true },
        ],
      }),
    );
    expect(r.net['m-1']).toBe(1000);
    expect(r.net['m-2']).toBe(0);
    expect(r.net['m-3']).toBe(-1000);
  });
});

describe('minimumTransfers', () => {
  it('正味残高から最小送金を貪欲法で算出', () => {
    const transfers = minimumTransfers({
      'm-1': 1300,
      'm-2': -500,
      'm-3': -800,
    });
    expect(transfers).toHaveLength(2);
    // 大きい債務者から大きい債権者へ
    expect(transfers[0]).toMatchObject({
      fromId: 'm-3',
      toId: 'm-1',
      amount: 800,
    });
    expect(transfers[1]).toMatchObject({
      fromId: 'm-2',
      toId: 'm-1',
      amount: 500,
    });
  });

  it('全員ゼロなら送金なし', () => {
    expect(minimumTransfers({ 'm-1': 0, 'm-2': 0 })).toEqual([]);
  });
});

describe('calculateSettlement — 手動差額調整', () => {
  it('manualDiffPayerId に diff を寄せる', () => {
    const r = calculateSettlement(
      makeSession({
        rounding: 'floor',
        manualDiffPayerId: 'm-1',
        payments: [{ id: 'p-1', name: 'x', payerId: 'm-1', total: 1000 }],
      }),
    );
    // diff=1 を m-1 に追加 → burdens m-1 = 333 + 1 = 334
    expect(r.burdens['m-1']).toBe(334);
  });
});
