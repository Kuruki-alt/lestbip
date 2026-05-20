import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { genId } from '@/lib/ids';
import { useSessions } from '@/hooks/useSessions';

/**
 * 個人間の支払い（返済）記録画面：
 * 「支払う人 → 受け取る人 に 金額」を記録する。割り勘とは別種の記録で、
 * 履歴に残しつつ全体精算からは差し引く（計算は calculator.js の将来責務）。
 * ワイヤーフレームのため永続化は行わず、UI と遷移のみ。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {() => void} props.onSave    セッションへ戻る
 * @param {() => void} props.onCancel  セッションへ戻る
 * @param {() => void} props.onWaive   「いいよいいよ〜^^」金額不問で完遂（免除）
 */
function DirectPaymentScreen({ t, onSave, onCancel, onWaive }) {
  const { currentSession, patchSession } = useSessions();
  const members = useMemo(
    () => currentSession?.members ?? [],
    [currentSession],
  );
  const directPayments = useMemo(
    () => currentSession?.directPayments ?? [],
    [currentSession],
  );

  // ローカルUI状態: { fromId, toId, amount }
  const [fromId, setFromId] = useState(() => members[0]?.id ?? '');
  const [toId, setToId] = useState(
    () => members[1]?.id ?? members[0]?.id ?? '',
  );
  const [amount, setAmount] = useState('');

  const handleFrom = useCallback(
    /** @param {React.ChangeEvent<HTMLSelectElement>} e */
    (e) => setFromId(e.target.value),
    [],
  );

  const handleTo = useCallback(
    /** @param {React.ChangeEvent<HTMLSelectElement>} e */
    (e) => setToId(e.target.value),
    [],
  );

  const handleAmount = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => setAmount(e.target.value),
    [],
  );

  const samePerson = fromId === toId;
  const amountValue = Number(amount);
  const canSave =
    !samePerson && Number.isFinite(amountValue) && amountValue > 0;

  const handleSubmit = useCallback(
    /** @param {React.FormEvent} e */
    (e) => {
      e.preventDefault();
      if (!canSave || !currentSession) return;
      /** @type {import('@/lib/calculator').DirectPayment} */
      const dp = {
        id: genId('d'),
        fromId,
        toId,
        amount: amountValue,
      };
      patchSession(currentSession.id, {
        directPayments: [...directPayments, dp],
      });
      onSave();
    },
    [
      canSave,
      currentSession,
      directPayments,
      fromId,
      toId,
      amountValue,
      patchSession,
      onSave,
    ],
  );

  // 「いいよ！」: 金額不問で完遂（免除）扱い。
  // 当人同士は不可（from≠to）。amount は入力値（空なら 0）を記録する。
  const handleWaive = useCallback(() => {
    if (samePerson || !currentSession) return;
    const waivedAmount =
      Number.isFinite(amountValue) && amountValue > 0 ? amountValue : 0;
    /** @type {import('@/lib/calculator').DirectPayment} */
    const dp = {
      id: genId('d'),
      fromId,
      toId,
      amount: waivedAmount,
      waived: true,
    };
    patchSession(currentSession.id, {
      directPayments: [...directPayments, dp],
    });
    onWaive();
  }, [
    samePerson,
    currentSession,
    directPayments,
    fromId,
    toId,
    amountValue,
    patchSession,
    onWaive,
  ]);

  const memberOptions = useMemo(
    () =>
      members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      )),
    [members],
  );

  const selectClass = 'app-card app-field border px-3 py-2';

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
          {t('directPayment.title')}
        </h2>
      </div>

      <Card className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="app-text font-semibold">
            {t('directPayment.from')}
          </span>
          <select value={fromId} onChange={handleFrom} className={selectClass}>
            {memberOptions}
          </select>
        </label>

        <div className="app-text-muted text-center text-lg">↓</div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="app-text font-semibold">
            {t('directPayment.to')}
          </span>
          <select value={toId} onChange={handleTo} className={selectClass}>
            {memberOptions}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="app-text font-semibold">
            {t('directPayment.amount')}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={amount}
            onChange={handleAmount}
            placeholder="0"
            className={selectClass}
          />
        </label>

        {samePerson ? (
          <p className="app-danger-fg text-xs">
            {t('directPayment.sameWarning')}
          </p>
        ) : null}
      </Card>

      <p className="app-text-muted text-xs">{t('directPayment.deductHint')}</p>

      <div className="flex flex-col gap-1">
        <Button
          variant="happy"
          fullWidth
          onClick={handleWaive}
          ariaLabel={t('directPayment.waive')}
        >
          {t('directPayment.waive')}
        </Button>
        <p className="text-center app-text-muted text-xs">
          {t('directPayment.waiveHint')}
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" fullWidth onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          fullWidth
          variant={canSave ? 'primary' : 'secondary'}
        >
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}

DirectPaymentScreen.propTypes = {
  t: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onWaive: PropTypes.func.isRequired,
};

export default DirectPaymentScreen;
