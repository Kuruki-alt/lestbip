import PropTypes from 'prop-types';
import { useCallback, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  MOCK_DIRECT_PAYMENTS,
  MOCK_MEMBERS,
  MOCK_PAYMENTS,
  WAIVED_ICON,
} from '@/lib/mockData';
import { formatAmount } from '@/lib/currency';

/**
 * セッション画面（メイン）：
 * セッション名・メンバー、支払い記録一覧（追加/編集/削除）、
 * 精算結果サマリー、URLシェアボタン。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {'ja'|'en'} props.lang
 * @param {import('@/lib/currency').CurrencyCode} props.currency
 * @param {() => void} props.onBack                ホームへ戻る
 * @param {(paymentId: string|null) => void} props.onEditPayment 支払いフォームへ
 * @param {() => void} props.onAddDirectPayment   個人間支払いの記録画面へ
 * @param {() => void} props.onViewSettlement      精算結果詳細へ
 * @param {() => void} props.onShare
 */
function SessionScreen({
  t,
  lang,
  currency,
  onBack,
  onEditPayment,
  onAddDirectPayment,
  onViewSettlement,
  onShare,
}) {
  // Map で保持し動的プロパティアクセス（object injection）を回避
  const memberNameById = useMemo(
    () => new Map(MOCK_MEMBERS.map((m) => [m.id, m.name])),
    [],
  );

  const handleAdd = useCallback(() => {
    onEditPayment(null);
  }, [onEditPayment]);

  // リスト内インライン関数を避けるため data-value から id を取得
  const handleEdit = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id) {
        onEditPayment(id);
      }
    },
    [onEditPayment],
  );

  // ワイヤーフレーム: 実削除は未実装（計算/永続化スコープ外）。
  // 押下可能であることだけ示すプレースホルダ。
  const handleDelete = useCallback(() => {}, []);

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

      <Card className="flex flex-col gap-2">
        <h2 className="app-text text-lg font-bold">
          渋谷ダンジョン攻略 / Shibuya Dungeon
        </h2>
        <div className="flex flex-wrap gap-2">
          {MOCK_MEMBERS.map((m) => (
            <span
              key={m.id}
              className="app-card app-accent-soft px-2.5 py-1 text-xs font-medium"
            >
              {m.name}
            </span>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="app-text-muted text-sm font-semibold">
            {t('session.payments')}
          </h3>
          <Button onClick={handleAdd}>+ {t('session.addPayment')}</Button>
        </div>

        <ul className="flex flex-col gap-3">
          {MOCK_PAYMENTS.map((p) => (
            <li key={p.id}>
              <Card className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="app-text truncate font-semibold">{p.name}</p>
                    <p className="app-text-muted text-xs">
                      {t('session.paidBy')}: {memberNameById.get(p.payerId)} ·{' '}
                      {t('session.splitAmong')}: {p.memberIds.length}
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
                    onClick={handleDelete}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
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

        {MOCK_DIRECT_PAYMENTS.length === 0 ? (
          <p className="app-text-muted text-sm">
            {t('session.directPaymentsEmpty')}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {MOCK_DIRECT_PAYMENTS.map((d) => (
              <li
                key={d.id}
                className="app-card app-accent-soft flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="app-text truncate text-sm">
                    {memberNameById.get(d.fromId)} {t('settlement.pays')}{' '}
                    {memberNameById.get(d.toId)}
                  </span>
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
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`font-semibold ${
                      d.waived ? 'app-text-muted line-through' : 'app-accent-fg'
                    }`}
                  >
                    {formatAmount(d.amount, currency, lang)}
                  </span>
                  <Button
                    variant="danger"
                    dataValue={d.id}
                    ariaLabel={`${t('common.delete')} ${memberNameById.get(
                      d.fromId,
                    )} → ${memberNameById.get(d.toId)}`}
                    onClick={handleDelete}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </li>
            ))}
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
        <ul className="app-text flex flex-col gap-1 text-sm">
          <li className="flex justify-between">
            <span>はると / Haruto → あおい / Aoi</span>
            <span className="font-semibold">
              {formatAmount(6900, currency, lang)}
            </span>
          </li>
          <li className="flex justify-between">
            <span>そら / Sora → あおい / Aoi</span>
            <span className="font-semibold">
              {formatAmount(7200, currency, lang)}
            </span>
          </li>
          <li className="flex justify-between">
            <span>ゆい / Yui → あおい / Aoi</span>
            <span className="font-semibold">
              {formatAmount(1500, currency, lang)}
            </span>
          </li>
        </ul>
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
  onViewSettlement: PropTypes.func.isRequired,
  onShare: PropTypes.func.isRequired,
};

export default SessionScreen;
