import PropTypes from 'prop-types';
import { useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useSessions } from '@/hooks/useSessions';
import yuushaIcon from '@/assets/icons/yuusha.png';

/**
 * セッション更新日を「YYYY-MM-DD」形式で表示用に整形する。
 * @param {string} [iso]
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * ホーム画面：新規セッション作成CTA + 過去セッション履歴一覧。
 * 履歴は LocalStorage と同期した実 state から取得する。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {() => void} props.onCreateSession  新規セッション作成画面へ遷移
 * @param {(sessionId: string) => void} props.onOpenSession 既存セッションを開く
 */
function HomeScreen({ t, onCreateSession, onOpenSession }) {
  const { sessions, deleteSession } = useSessions();

  // リスト内インライン関数を避けるため data 属性で1ハンドラに集約
  const handleOpen = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id) {
        onOpenSession(id);
      }
    },
    [onOpenSession],
  );

  const handleDelete = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id && window.confirm(t('home.confirmDelete'))) {
        deleteSession(id);
      }
    },
    [deleteSession, t],
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col items-center gap-3 text-center">
        <img
          src={yuushaIcon}
          alt=""
          className="h-28 w-28 object-contain drop-shadow"
        />
        <h2 className="app-text text-base font-bold">{t('home.newSession')}</h2>
        <Button fullWidth onClick={onCreateSession}>
          + {t('home.newSession')}
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="app-text-muted text-sm font-semibold">
          {t('home.history')}
        </h2>

        {sessions.length === 0 ? (
          <Card>
            <p className="app-text-muted text-sm">{t('home.empty')}</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="app-text truncate font-semibold">{s.name}</p>
                    <p className="app-text-muted text-xs">
                      {(s.members ?? []).length} {t('common.members')} ·{' '}
                      {(s.payments ?? []).length} {t('session.payments')} ·{' '}
                      {formatDate(s.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="secondary"
                      dataValue={s.id}
                      onClick={handleOpen}
                    >
                      {t('home.openSession')}
                    </Button>
                    <Button
                      variant="danger"
                      dataValue={s.id}
                      ariaLabel={`${t('common.delete')} ${s.name}`}
                      onClick={handleDelete}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

HomeScreen.propTypes = {
  t: PropTypes.func.isRequired,
  onCreateSession: PropTypes.func.isRequired,
  onOpenSession: PropTypes.func.isRequired,
};

export default HomeScreen;
