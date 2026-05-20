import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { distanceToDiscountPct } from '@/lib/driverDiscount';
import { formatAmount } from '@/lib/currency';
import { WAIVED_ICON } from '@/lib/icons';
import { calculateSettlement } from '@/lib/calculator';
import { useSessions } from '@/hooks/useSessions';

/**
 * 精算結果詳細画面：
 * - 最小送金リストを calculator でライブ算出
 * - 差し引き済みの直接やり取りを表示
 * - 端数差額の手動負担者をセッションへ反映（patchSession）
 * - 御者割が有効なときは全体御者割（御者ID＋全行程距離）を編集可能（個別より優先）
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {'ja'|'en'} props.lang
 * @param {import('@/lib/currency').CurrencyCode} props.currency
 * @param {boolean} [props.driverDiscountEnabled=false]
 * @param {() => void} props.onBack
 */
function SettlementScreen({
  t,
  lang,
  currency,
  driverDiscountEnabled = false,
  onBack,
}) {
  const { currentSession, patchSession } = useSessions();
  const members = useMemo(
    () => currentSession?.members ?? [],
    [currentSession],
  );
  const directPayments = useMemo(
    () => currentSession?.directPayments ?? [],
    [currentSession],
  );

  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );

  // 端数差額の手動負担者と御者割の現在値はセッション側に置く（永続化される）
  const adjustMemberId = currentSession?.manualDiffPayerId ?? members[0]?.id;
  // overallDD は session の値 or 既定。参照を安定させ依存配列に乗せやすくする。
  const overallDD = useMemo(
    () =>
      currentSession?.driverDiscount ?? {
        enabled: false,
        coachmanId: members[0]?.id ?? '',
        distanceKm: '',
      },
    [currentSession, members],
  );

  // calculator は overallDD.enabled に基づき適用するため、UI トグルが ON のときだけ
  // セッションに enabled:true を伝える運用にする（Phase 2 の単純化）
  const sessionForCalc = useMemo(
    () =>
      currentSession
        ? {
            ...currentSession,
            driverDiscount: driverDiscountEnabled
              ? { ...overallDD, enabled: true }
              : { ...overallDD, enabled: false },
          }
        : null,
    [currentSession, driverDiscountEnabled, overallDD],
  );

  const settlement = useMemo(
    () => (sessionForCalc ? calculateSettlement(sessionForCalc) : null),
    [sessionForCalc],
  );

  const handleSelectAdjust = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id && currentSession) {
        patchSession(currentSession.id, { manualDiffPayerId: id });
      }
    },
    [currentSession, patchSession],
  );

  const handleCoachman = useCallback(
    /** @param {React.ChangeEvent<HTMLSelectElement>} e */
    (e) => {
      if (!currentSession) return;
      patchSession(currentSession.id, {
        driverDiscount: { ...overallDD, coachmanId: e.target.value },
      });
    },
    [currentSession, overallDD, patchSession],
  );

  const handleDistance = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => {
      if (!currentSession) return;
      patchSession(currentSession.id, {
        driverDiscount: { ...overallDD, distanceKm: e.target.value },
      });
    },
    [currentSession, overallDD, patchSession],
  );

  const coachmanOptions = useMemo(
    () =>
      members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      )),
    [members],
  );

  const overallDiscountPct = distanceToDiscountPct(overallDD.distanceKm);

  if (!currentSession) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        <Card>
          <p className="app-text-muted text-sm">{t('home.empty')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        <h2 className="app-text text-base font-bold">
          {t('settlement.title')}
        </h2>
      </div>

      {driverDiscountEnabled ? (
        <Card className="app-border flex flex-col gap-3">
          <h3 className="text-sm app-text font-semibold">
            🐴 {t('settlement.driverSection')}
          </h3>
          <p className="app-text-muted text-xs">{t('settlement.driverHint')}</p>
          <p className="app-accent-fg text-xs font-semibold">
            {t('settlement.driverPriority')}
          </p>

          <label className="flex flex-col gap-1 text-sm">
            <span className="app-text font-semibold">
              {t('payment.coachman')}
            </span>
            <select
              value={overallDD.coachmanId ?? ''}
              onChange={handleCoachman}
              className="app-card app-field border px-3 py-2"
            >
              {coachmanOptions}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="app-text font-semibold">
              {t('settlement.driverDistance')}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={overallDD.distanceKm ?? ''}
              onChange={handleDistance}
              placeholder="0"
              className="app-card app-field border px-3 py-2"
            />
          </label>

          <div className="app-card app-accent-soft flex items-center justify-between px-3 py-2 text-sm">
            <span className="app-text">{t('payment.driverResultLabel')}</span>
            <span className="app-accent-fg font-bold">
              {overallDiscountPct}% {t('payment.driverReduced')}
            </span>
          </div>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-3">
        <h3 className="app-text-muted text-sm font-semibold">
          {t('settlement.minTransfers')}
        </h3>
        {!settlement || settlement.transfers.length === 0 ? (
          <p className="app-text-muted text-sm">{t('session.summaryEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {settlement.transfers.map((tr) => (
              <li
                key={tr.id}
                className="app-card app-surface-2 flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="app-text">
                  {memberNameById.get(tr.fromId) ?? '?'} {t('settlement.pays')}{' '}
                  {memberNameById.get(tr.toId) ?? '?'}
                </span>
                <span className="app-accent-fg font-bold">
                  {formatAmount(tr.amount, currency, lang)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {directPayments.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <h3 className="app-text-muted text-sm font-semibold">
            {t('settlement.deducted')}
          </h3>
          <p className="app-text-muted text-xs">
            {t('settlement.deductedHint')}
          </p>
          <ul className="flex flex-col gap-2">
            {directPayments.map((d) => (
              <li
                key={d.id}
                className="app-card app-accent-soft flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 app-text">
                  {memberNameById.get(d.fromId) ?? '?'} {t('settlement.pays')}{' '}
                  {memberNameById.get(d.toId) ?? '?'}
                  {d.waived ? (
                    <span
                      title={t('session.waivedBadge')}
                      className="app-card app-happy inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold"
                    >
                      <span aria-hidden="true">{WAIVED_ICON}</span>
                      {t('session.waivedShort')}
                    </span>
                  ) : null}
                </span>
                <span className="app-accent-fg font-semibold line-through">
                  {formatAmount(d.amount, currency, lang)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {settlement && Math.abs(settlement.roundingDiff) > 0 ? (
        <Card className="flex flex-col gap-3">
          <h3 className="app-text-muted text-sm font-semibold">
            {t('settlement.adjustment')}
          </h3>
          <p className="app-text-muted text-xs">
            {t('settlement.adjustmentHint')}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="app-text">{t('settlement.diff')}</span>
            <span className="app-text font-semibold">
              {settlement.roundingDiff > 0 ? '+' : ''}
              {formatAmount(settlement.roundingDiff, currency, lang)}
            </span>
          </div>
          <div>
            <p className="mb-2 app-text-muted text-xs font-semibold">
              {t('settlement.adjustmentTarget')}
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const selected = m.id === adjustMemberId;
                return (
                  <Button
                    key={m.id}
                    variant={selected ? 'primary' : 'secondary'}
                    dataValue={m.id}
                    onClick={handleSelectAdjust}
                  >
                    {m.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

SettlementScreen.propTypes = {
  t: PropTypes.func.isRequired,
  lang: PropTypes.oneOf(['ja', 'en']).isRequired,
  currency: PropTypes.oneOf(['JPY', 'USD', 'EUR', 'CAD']).isRequired,
  driverDiscountEnabled: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
};

export default SettlementScreen;
