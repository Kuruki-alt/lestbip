import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  MOCK_DIRECT_PAYMENTS,
  MOCK_MEMBERS,
  MOCK_TRANSFERS,
  WAIVED_ICON,
} from '@/lib/mockData';
import { distanceToDiscountPct } from '@/lib/driverDiscount';
import { formatAmount } from '@/lib/currency';

/**
 * 精算結果詳細画面：
 * 「誰が誰にいくら」最小送金リスト（モック）+ 差額調整（手動で負担者選択）。
 * 御者割が有効なときは「全体の御者割」をここで指定でき、各支払いの
 * 御者割より優先される。計算本体は未実装（ワイヤーフレームのスコープ外）。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {'ja'|'en'} props.lang
 * @param {import('@/lib/currency').CurrencyCode} props.currency
 * @param {boolean} [props.driverDiscountEnabled=false] 御者割が有効か
 * @param {() => void} props.onBack  セッションへ戻る
 */
function SettlementScreen({
  t,
  lang,
  currency,
  driverDiscountEnabled = false,
  onBack,
}) {
  // Map で保持し動的プロパティアクセス（object injection）を回避
  const memberNameById = useMemo(
    () => new Map(MOCK_MEMBERS.map((m) => [m.id, m.name])),
    [],
  );

  // ローカルUI状態: 端数差額の手動負担者（メンバーID）
  const [adjustMemberId, setAdjustMemberId] = useState(MOCK_MEMBERS[0].id);

  // ローカルUI状態: 全体の御者割（御者ID・全行程の移動距離 km, 文字列保持）
  const [coachmanId, setCoachmanId] = useState(MOCK_MEMBERS[0].id);
  const [distanceKm, setDistanceKm] = useState('');

  const handleSelectAdjust = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id) {
        setAdjustMemberId(id);
      }
    },
    [],
  );

  const handleCoachman = useCallback(
    /** @param {React.ChangeEvent<HTMLSelectElement>} e */
    (e) => setCoachmanId(e.target.value),
    [],
  );

  const handleDistance = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => setDistanceKm(e.target.value),
    [],
  );

  const coachmanOptions = useMemo(
    () =>
      MOCK_MEMBERS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      )),
    [],
  );

  const overallDiscountPct = distanceToDiscountPct(distanceKm);

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
              value={coachmanId}
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
              value={distanceKm}
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
        <ul className="flex flex-col gap-2">
          {MOCK_TRANSFERS.map((tr) => (
            <li
              key={tr.id}
              className="app-card app-surface-2 flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="app-text">
                {memberNameById.get(tr.fromId)} {t('settlement.pays')}{' '}
                {memberNameById.get(tr.toId)}
              </span>
              <span className="app-accent-fg font-bold">
                {formatAmount(tr.amount, currency, lang)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {MOCK_DIRECT_PAYMENTS.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <h3 className="app-text-muted text-sm font-semibold">
            {t('settlement.deducted')}
          </h3>
          <p className="app-text-muted text-xs">
            {t('settlement.deductedHint')}
          </p>
          <ul className="flex flex-col gap-2">
            {MOCK_DIRECT_PAYMENTS.map((d) => (
              <li
                key={d.id}
                className="app-card app-accent-soft flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 app-text">
                  {memberNameById.get(d.fromId)} {t('settlement.pays')}{' '}
                  {memberNameById.get(d.toId)}
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
            +{formatAmount(2, currency, lang)}
          </span>
        </div>
        <div>
          <p className="mb-2 app-text-muted text-xs font-semibold">
            {t('settlement.adjustmentTarget')}
          </p>
          <div className="flex flex-wrap gap-2">
            {MOCK_MEMBERS.map((m) => {
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
