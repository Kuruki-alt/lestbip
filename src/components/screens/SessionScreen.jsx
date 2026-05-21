import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatAmount } from '@/lib/currency';
import { WAIVED_ICON } from '@/lib/icons';
import { calculateSettlement } from '@/lib/calculator';
import { useSessions } from '@/hooks/useSessions';

/**
 * セッション画面（メイン、v2.0.0 改善案 #2, #3）：
 * セッション名・メンバー、支払い記録一覧（追加/編集/削除）、
 * 精算結果サマリー（calculator でライブ算出）、URLシェアボタン。
 * メンバー追加・削除は MembersScreen へ分離（「メンバー編集へ」ボタンで遷移）。
 * 端数処理・通貨等の設定は SettingsDrawer へ集約（本画面の設定 Card は削除）。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {'ja'|'en'} props.lang
 * @param {import('@/lib/currency').CurrencyCode} props.currency
 * @param {() => void} props.onBack
 * @param {(paymentId: string|null) => void} props.onEditPayment
 * @param {() => void} props.onAddDirectPayment
 * @param {() => void} props.onEditMembers       メンバー編集画面へ
 * @param {() => void} props.onViewSettlement
 * @param {() => void} props.onShare
 */
function SessionScreen({
  t,
  lang,
  currency,
  onBack,
  onEditPayment,
  onAddDirectPayment,
  onEditMembers,
  onViewSettlement,
  onShare,
}) {
  const { currentSession, patchSession } = useSessions();

  // 派生配列を useMemo で安定化（参照変化による不要な再計算を防ぐ）
  const members = useMemo(
    () => currentSession?.members ?? [],
    [currentSession],
  );
  const payments = useMemo(
    () => currentSession?.payments ?? [],
    [currentSession],
  );
  const directPayments = useMemo(
    () => currentSession?.directPayments ?? [],
    [currentSession],
  );

  // Map で保持し動的プロパティアクセス（object injection）を回避
  const memberNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name])),
    [members],
  );

  const settlement = useMemo(
    () => (currentSession ? calculateSettlement(currentSession) : null),
    [currentSession],
  );

  const handleAdd = useCallback(() => onEditPayment(null), [onEditPayment]);

  const handleEdit = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id) onEditPayment(id);
    },
    [onEditPayment],
  );

  const handleDeletePayment = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (!id || !currentSession) return;
      patchSession(currentSession.id, {
        payments: payments.filter((p) => p.id !== id),
      });
    },
    [currentSession, payments, patchSession],
  );

  const handleDeleteDirect = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (!id || !currentSession) return;
      patchSession(currentSession.id, {
        directPayments: directPayments.filter((d) => d.id !== id),
      });
    },
    [currentSession, directPayments, patchSession],
  );

  // セッション未選択時の保険（通常は App ルーターがホームに戻すが念のため）
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
        <Button variant="secondary" onClick={onShare}>
          🔗 {t('session.share')}
        </Button>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="app-text text-lg font-bold">{currentSession.name}</h2>
        <div className="flex flex-wrap gap-2">
          {members.length === 0 ? (
            <span className="app-text-muted text-xs">
              {t('newSession.empty')}
            </span>
          ) : (
            members.map((m) => (
              <span
                key={m.id}
                className="app-card app-accent-soft px-2.5 py-1 text-xs font-medium"
              >
                {m.name}
              </span>
            ))
          )}
        </div>
        <Button variant="secondary" fullWidth onClick={onEditMembers}>
          {t('session.editMembers')} →
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="app-text-muted text-sm font-semibold">
            {t('session.payments')}
          </h3>
          <Button onClick={handleAdd}>+ {t('session.addPayment')}</Button>
        </div>

        {payments.length === 0 ? (
          <p className="app-text-muted text-sm">{t('session.paymentsEmpty')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {payments.map((p) => {
              const excluded = new Set(p.excludedMemberIds ?? []);
              const splitCount = members.filter(
                (m) => !excluded.has(m.id),
              ).length;
              return (
                <li key={p.id}>
                  <Card className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="app-text truncate font-semibold">
                          {p.name}
                        </p>
                        <p className="app-text-muted text-xs">
                          {t('session.paidBy')}:{' '}
                          {memberNameById.get(p.payerId) ?? '-'} ·{' '}
                          {t('session.splitAmong')}: {splitCount}
                        </p>
                      </div>
                      <p className="app-text shrink-0 font-bold">
                        {formatAmount(p.total, currency, lang)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        dataValue={p.id}
                        onClick={handleEdit}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="danger"
                        dataValue={p.id}
                        onClick={handleDeletePayment}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="app-text-muted text-sm font-semibold">
            {t('session.directPayments')}
          </h3>
          <Button variant="secondary" onClick={onAddDirectPayment}>
            + {t('session.addDirectPayment')}
          </Button>
        </div>
        <p className="app-text-muted text-xs">
          {t('session.directPaymentsHint')}
        </p>

        {directPayments.length === 0 ? (
          <p className="app-text-muted text-sm">
            {t('session.directPaymentsEmpty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {directPayments.map((d) => {
              const amt = formatAmount(d.amount, currency, lang);
              return (
                <li
                  key={d.id}
                  className="app-card app-accent-soft flex items-center justify-between gap-3 px-3 py-2"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="app-text flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span>{memberNameById.get(d.fromId) ?? '?'}</span>
                      <span className="app-danger-fg font-semibold">
                        −{amt}
                      </span>
                      <span className="app-text-muted">→</span>
                      <span>{memberNameById.get(d.toId) ?? '?'}</span>
                      {!d.waived ? (
                        <span className="app-accent-fg font-semibold">
                          +{amt}
                        </span>
                      ) : null}
                    </div>
                    {d.waived ? (
                      <span
                        title={t('session.waivedBadge')}
                        className="app-card app-happy inline-flex w-fit items-center gap-1 px-2 py-0.5 text-[11px] font-semibold"
                      >
                        <span aria-hidden="true">{WAIVED_ICON}</span>
                        {t('session.waivedShort')}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    variant="danger"
                    dataValue={d.id}
                    ariaLabel={`${t('common.delete')} ${
                      memberNameById.get(d.fromId) ?? ''
                    } → ${memberNameById.get(d.toId) ?? ''}`}
                    onClick={handleDeleteDirect}
                  >
                    {t('common.delete')}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Card className="flex flex-col gap-3">
        <h3 className="app-text-muted text-sm font-semibold">
          {t('session.summary')}
        </h3>
        <p className="app-text-muted text-xs">
          {t('session.summaryDeductNote')}
        </p>
        {!settlement || settlement.transfers.length === 0 ? (
          <p className="app-text-muted text-sm">{t('session.summaryEmpty')}</p>
        ) : (
          <ul className="app-text flex flex-col gap-1 text-sm">
            {settlement.transfers.map((tr) => (
              <li key={tr.id} className="flex justify-between">
                <span>
                  {memberNameById.get(tr.fromId) ?? '?'} →{' '}
                  {memberNameById.get(tr.toId) ?? '?'}
                </span>
                <span className="font-semibold">
                  {formatAmount(tr.amount, currency, lang)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button variant="secondary" fullWidth onClick={onViewSettlement}>
          {t('session.viewSettlement')} →
        </Button>
      </Card>
    </div>
  );
}

SessionScreen.propTypes = {
  t: PropTypes.func.isRequired,
  lang: PropTypes.oneOf(['ja', 'en']).isRequired,
  currency: PropTypes.oneOf(['JPY', 'USD', 'EUR', 'CAD']).isRequired,
  onBack: PropTypes.func.isRequired,
  onEditPayment: PropTypes.func.isRequired,
  onAddDirectPayment: PropTypes.func.isRequired,
  onEditMembers: PropTypes.func.isRequired,
  onViewSettlement: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
};

export default SessionScreen;
