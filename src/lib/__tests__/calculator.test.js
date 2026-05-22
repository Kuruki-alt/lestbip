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

  it('waived & amount=0 は from の負債を完全に消し、他は変えない (v3.0.0 #3)', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 3000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 500 },
          // m-3 の負債を完全免除 (amount=0)
          { id: 'd-2', fromId: 'm-3', toId: 'm-1', amount: 0, waived: true },
        ],
      }),
    );
    // m-1: paid 3000, burdens 1500 (waived は加算しない)
    expect(r.net['m-1']).toBe(1500);
    // m-2: paid 500, burdens 1000, net=-500
    expect(r.net['m-2']).toBe(-500);
    // m-3: 負債 1000 を paid に積み増して net=0
    expect(r.net['m-3']).toBe(0);
  });

  it('waived & amount>0 は from が Y を支払って net 0 になり見通しから外れる (v3.2.1)', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 3000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 500 },
          // m-3 が 200 を m-1 に支払い、残債 800 を m-1/m-2 で等分 (400 ずつ)
          { id: 'd-2', fromId: 'm-3', toId: 'm-1', amount: 200, waived: true },
        ],
      }),
    );
    // m-1: paid 3000, burdens 1000+500+200(転送)+400(肩代わり)=2100, net=900
    expect(r.net['m-1']).toBe(900);
    // m-2: paid 500, burdens 1000+400=1400, net=-900
    expect(r.net['m-2']).toBe(-900);
    // m-3: 200 支払って net=0 → 見通しから外れる
    expect(r.net['m-3']).toBe(0);
    expect(r.net['m-1'] + r.net['m-2'] + r.net['m-3']).toBe(0);
  });

  it('waived 単独 (amount=0) で from の負債を完全に消す', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 3000 }],
        directPayments: [
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 0, waived: true },
        ],
      }),
    );
    expect(r.net['m-2']).toBe(0);
    // m-1 は 1000 を「肩代わり」する形になり受取超過のまま
    expect(r.net['m-1']).toBe(2000);
  });

  it('waived 単独 (amount>0) で from が Y 支払い net 0、差額を他全員で等分', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 3000 }],
        directPayments: [
          // m-2 が 400 を m-1 に支払い、残債 600 を m-1/m-3 で等分 (300 ずつ)
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 400, waived: true },
        ],
      }),
    );
    // m-1: paid 3000, burdens 1000+400(転送)+300(肩代わり)=1700, net=1300
    expect(r.net['m-1']).toBe(1300);
    // m-2: 400 支払って net=0
    expect(r.net['m-2']).toBe(0);
    // m-3: paid 0, burdens 1300, net=-1300
    expect(r.net['m-3']).toBe(-1300);
    expect(r.net['m-1'] + r.net['m-2'] + r.net['m-3']).toBe(0);
  });

  it('waived 対象が既に黒字なら何もしない (amount>0 でも)', () => {
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

  it('waived & Y >= D は Y を D にクランプし from を完全に支払い済みに', () => {
    const r = calculateSettlement(
      makeSession({
        payments: [{ id: 'p-1', name: 'd', payerId: 'm-1', total: 3000 }],
        directPayments: [
          // Y=2000 > D=1000 → Y=1000 にクランプ。m-2 は全額支払い済み net=0
          { id: 'd-1', fromId: 'm-2', toId: 'm-1', amount: 2000, waived: true },
        ],
      }),
    );
    // m-1: paid 3000, burdens 1000+1000(転送)=2000, net=1000
    expect(r.net['m-1']).toBe(1000);
    // m-2: 1000 支払って net=0 (過払いにはならない)
    expect(r.net['m-2']).toBe(0);
    // m-3: 元のまま
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
