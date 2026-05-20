import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { distanceToDiscountPct } from '@/lib/driverDiscount';
import { useSessions } from '@/hooks/useSessions';

/**
 * 支払い記録 追加/編集画面：
 * 支払い名・立替者・合計金額・割り勘対象（除外トグル）・個別金額指定（任意）。
 * 現在のセッションメンバーを実 state から取得して描画する。
 * 保存処理は Phase 3 で結線するため、本フェーズでは onSave/onCancel で
 * セッション画面へ戻るのみ（永続化なし）。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {string|null} props.editPaymentId  編集対象ID（新規時 null）
 * @param {boolean} [props.driverDiscountEnabled=false]
 * @param {() => void} props.onSave
 * @param {() => void} props.onCancel
 */
function PaymentFormScreen({
  t,
  editPaymentId = null,
  driverDiscountEnabled = false,
  onSave,
  onCancel,
}) {
  const { currentSession } = useSessions();
  const members = useMemo(
    () => currentSession?.members ?? [],
    [currentSession],
  );
  const isEdit = editPaymentId != null;

  // ローカルUI状態: 割り勘対象に含まれるメンバーID（初期は全員対象）
  const [includedIds, setIncludedIds] = useState(() =>
    members.map((m) => m.id),
  );

  // ローカルUI状態: 御者と移動距離
  const [coachmanId, setCoachmanId] = useState(() => members[0]?.id ?? '');
  const [distanceKm, setDistanceKm] = useState('');

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
      members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      )),
    [members],
  );

  const discountPct = distanceToDiscountPct(distanceKm);

  const handleToggleMember = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (!id) return;
      setIncludedIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    },
    [],
  );

  const handleSubmit = useCallback(
    /** @param {React.FormEvent} e */
    (e) => {
      e.preventDefault();
      // Phase 3 でフォーム値を集めて patchSession に渡し payments を更新する
      onSave();
    },
    [onSave],
  );

  if (!currentSession) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="ghost" onClick={onCancel}>
          ← {t('common.cancel')}
        </Button>
        <Card>
          <p className="app-text-muted text-sm">{t('home.empty')}</p>
        </Card>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onCancel}>
          ← {t('common.cancel')}
        </Button>
        <h2 className="app-text text-base font-bold">
          {isEdit ? t('payment.titleEdit') : t('payment.titleNew')}
        </h2>
      </div>

      <Card className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="app-text font-semibold">{t('payment.name')}</span>
          <input
            type="text"
            placeholder={t('payment.namePlaceholder')}
            className="app-card app-field border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="app-text font-semibold">{t('payment.payer')}</span>
          <select
            defaultValue={members[0]?.id ?? ''}
            className="app-card app-field border px-3 py-2"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="app-text font-semibold">{t('payment.total')}</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
            className="app-card app-field border px-3 py-2"
          />
        </label>
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="text-sm app-text font-semibold">
          {t('payment.splitTargets')}
        </h3>
        <ul className="flex flex-col gap-2">
          {members.map((m) => {
            const included = includedIds.includes(m.id);
            return (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="app-text text-sm">{m.name}</span>
                <Button
                  variant={included ? 'secondary' : 'danger'}
                  dataValue={m.id}
                  onClick={handleToggleMember}
                >
                  {included ? t('payment.included') : t('payment.exclude')}
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="text-sm app-text font-semibold">
          {t('payment.fixedAmounts')}
        </h3>
        <p className="app-text-muted text-xs">{t('payment.fixedHint')}</p>
        <ul className="flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3">
              <span className="app-text text-sm">{m.name}</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="-"
                className="app-card app-field w-28 border px-3 py-1.5 text-right"
              />
            </li>
          ))}
        </ul>
      </Card>

      {driverDiscountEnabled ? (
        <Card className="app-border flex flex-col gap-3">
          <h3 className="text-sm app-text font-semibold">
            🐴 {t('payment.driverSection')}
          </h3>
          <p className="app-text-muted text-xs">{t('payment.driverHint')}</p>
          <p className="app-accent-fg text-xs">
            {t('payment.driverPriorityNote')}
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
              {t('payment.distance')}
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
              {discountPct}% {t('payment.driverReduced')}
            </span>
          </div>
        </Card>
      ) : null}

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" fullWidth>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

PaymentFormScreen.propTypes = {
  t: PropTypes.func.isRequired,
  editPaymentId: PropTypes.string,
  driverDiscountEnabled: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default PaymentFormScreen;
