import { describe, it, expect } from 'vitest';
import { applyManualAdjustment, applyAdjustment } from '@/lib/adjustment';

describe('applyManualAdjustment', () => {
  it('指定メンバーの net 残高から diff を差し引く（diff は負担増分）', () => {
    const net = { 'm-1': 100, 'm-2': -100 };
    const r = applyManualAdjustment(net, 10, 'm-2');
    // diff=10 を m-2 が引き受ける → 負担が 10 増える → net は 10 下がる
    expect(r['m-2']).toBe(-110);
    // 元の net は破壊しない
    expect(net['m-2']).toBe(-100);
  });

  it('未知の payerId は no-op', () => {
    const net = { 'm-1': 100 };
    const r = applyManualAdjustment(net, 10, 'unknown');
    expect(r).toEqual(net);
  });

  it('null/undefined ガード', () => {
    expect(applyManualAdjustment(null, 0, 'x')).toEqual({});
    expect(applyManualAdjustment({}, 0, null)).toEqual({});
  });
});

describe('applyAdjustment（戦略レジストリ）', () => {
  it('manual 戦略は applyManualAdjustment と等価', () => {
    const net = { 'm-1': 100, 'm-2': -100 };
    const r = applyAdjustment('manual', net, 5, { payerId: 'm-2' });
    expect(r['m-2']).toBe(-105);
  });

  it('未対応戦略は net コピーを返す（no-op）', () => {
    const net = { 'm-1': 1 };
    const r = applyAdjustment('auto', net, 10);
    expect(r).toEqual(net);
    expect(r).not.toBe(net);
  });
});
