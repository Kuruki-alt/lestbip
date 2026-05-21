import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { distanceToDiscountPct } from '@/lib/driverDiscount';
import { genId } from '@/lib/ids';
import { useSessions } from '@/hooks/useSessions';

/**
 * 支払い記録 追加/編集画面（v3.0.0 改修案 #1：3 入力を文章レイアウトに統合）。
 * 制御フォーム。編集時は currentSession.payments から該当 Payment を読み込み、
 * 保存時は patchSession で payments 配列を更新する。
 *
 * 上部の主要入力は「[立替えた仲間] が [出費名] に [金額] 支払った。」のように
 * 1 行の文章として表示する。英語時は「[payer] paid [total] for [name].」の
 * 語順に切り替える。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {'ja'|'en'} [props.lang='ja']
 * @param {string|null} props.editPaymentId
 * @param {boolean} [props.driverDiscountEnabled=false]
 * @param {() => void} props.onSave
 * @param {() => void} props.onCancel
 */
function PaymentFormScreen({
  t,
  lang = 'ja',
  editPaymentId = null,
  driverDiscountEnabled = false,
  onSave,
  onCancel,
}) {
  const { currentSession, patchSession } = useSessions();
  const members = useMemo(
    () => currentSession?.members ?? [],
    [currentSession],
  );
  const payments = useMemo(
    () => currentSession?.payments ?? [],
    [currentSession],
  );
  const editingPayment = useMemo(
    () =>
      editPaymentId
        ? (payments.find((p) => p.id === editPaymentId) ?? null)
        : null,
    [editPaymentId, payments],
  );
  const isEdit = editingPayment != null;

  // 制御フォームの初期値（編集時は対象 Payment から復元、新規時は既定）
  const [name, setName] = useState(editingPayment?.name ?? '');
  const [payerId, setPayerId] = useState(
    editingPayment?.payerId ?? members[0]?.id ?? '',
  );
  const [total, setTotal] = useState(
    editingPayment?.total != null ? String(editingPayment.total) : '',
  );
  const [includedIds, setIncludedIds] = useState(() => {
    if (editingPayment) {
      const excluded = new Set(editingPayment.excludedMemberIds ?? []);
      return members.filter((m) => !excluded.has(m.id)).map((m) => m.id);
    }
    return members.map((m) => m.id);
  });
  // 動的キー（memberId）アクセスを避けるため Map で保持
  const [fixedAmountMap, setFixedAmountMap] = useState(
    () => new Map(Object.entries(editingPayment?.fixedAmounts ?? {})),
  );
  const [coachmanId, setCoachmanId] = useState(
    editingPayment?.coachmanId ?? members[0]?.id ?? '',
  );
  const [distanceKm, setDistanceKm] = useState(
    editingPayment?.distanceKm != null ? String(editingPayment.distanceKm) : '',
  );

  const handleName = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => setName(e.target.value),
    [],
  );
  const handlePayer = useCallback(
    /** @param {React.ChangeEvent<HTMLSelectElement>} e */
    (e) => setPayerId(e.target.value),
    [],
  );
  const handleTotal = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => setTotal(e.target.value),
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

  // 個別金額: 0/空/非数値は未設定扱い（Map から削除）
  const handleFixedAmount = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      const raw = e.currentTarget.value;
      if (!id) return;
      setFixedAmountMap((prev) => {
        const next = new Map(prev);
        const n = Number(raw);
        if (raw === '' || !Number.isFinite(n) || n <= 0) {
          next.delete(id);
        } else {
          next.set(id, n);
        }
        return next;
      });
    },
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

  const totalNum = Number(total);
  const canSave =
    name.trim().length > 0 &&
    !!payerId &&
    Number.isFinite(totalNum) &&
    totalNum > 0 &&
    includedIds.length > 0;

  const handleSubmit = useCallback(
    /** @param {React.FormEvent} e */
    (e) => {
      e.preventDefault();
      if (!canSave || !currentSession) return;
      const excludedMemberIds = members
        .filter((m) => !includedIds.includes(m.id))
        .map((m) => m.id);
      /** @type {import('@/lib/calculator').Payment} */
      const payment = {
        id: editingPayment?.id ?? genId('p'),
        name: name.trim(),
        payerId,
        total: totalNum,
        excludedMemberIds,
        fixedAmounts: Object.fromEntries(fixedAmountMap),
      };
      const distNum = Number(distanceKm);
      if (driverDiscountEnabled && coachmanId && distNum > 0) {
        payment.coachmanId = coachmanId;
        payment.distanceKm = distNum;
      }
      const nextPayments = isEdit
        ? payments.map((p) => (p.id === payment.id ? payment : p))
        : [...payments, payment];
      patchSession(currentSession.id, { payments: nextPayments });
      onSave();
    },
    [
      canSave,
      currentSession,
      members,
      includedIds,
      editingPayment,
      name,
      payerId,
      totalNum,
      fixedAmountMap,
      driverDiscountEnabled,
      coachmanId,
      distanceKm,
      isEdit,
      payments,
      patchSession,
      onSave,
    ],
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

      <Card className="flex flex-col gap-2">
        <div className="app-text flex flex-wrap items-center gap-x-2 gap-y-2 text-base leading-relaxed">
          <select
            value={payerId}
            onChange={handlePayer}
            aria-label={t('payment.payer')}
            className="app-card app-field border px-2 py-1.5"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <span className="app-text-muted">{t('payment.sentenceP1')}</span>
          {lang === 'ja' ? (
            <>
              <input
                type="text"
                value={name}
                onChange={handleName}
                placeholder={t('payment.namePlaceholder')}
                aria-label={t('payment.name')}
                className="app-card app-field min-w-0 flex-1 border px-2 py-1.5"
              />
              <span className="app-text-muted">{t('payment.sentenceP2')}</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={total}
                onChange={handleTotal}
                placeholder="0"
                aria-label={t('payment.total')}
                className="app-card app-field w-28 border px-2 py-1.5 text-right"
              />
            </>
          ) : (
            <>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={total}
                onChange={handleTotal}
                placeholder="0"
                aria-label={t('payment.total')}
                className="app-card app-field w-28 border px-2 py-1.5 text-right"
              />
              <span className="app-text-muted">{t('payment.sentenceP2')}</span>
              <input
                type="text"
                value={name}
                onChange={handleName}
                placeholder={t('payment.namePlaceholder')}
                aria-label={t('payment.name')}
                className="app-card app-field min-w-0 flex-1 border px-2 py-1.5"
              />
            </>
          )}
          <span className="app-text-muted">{t('payment.sentenceP3')}</span>
        </div>
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
                value={fixedAmountMap.get(m.id) ?? ''}
                data-value={m.id}
                onChange={handleFixedAmount}
                placeholder="-"
                aria-label={`${t('payment.fixedAmounts')} ${m.name}`}
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
        <Button
          type="submit"
          fullWidth
          variant={canSave ? 'primary' : 'secondary'}
        >
          {t('common.save')}
        </Button>
      </div>
      {!canSave ? (
        <p className="app-text-muted text-center text-xs">
          {t('payment.saveHint')}
        </p>
      ) : null}
    </form>
  );
}

PaymentFormScreen.propTypes = {
  t: PropTypes.func.isRequired,
  lang: PropTypes.oneOf(['ja', 'en']),
  editPaymentId: PropTypes.string,
  driverDiscountEnabled: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default PaymentFormScreen;
