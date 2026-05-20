import PropTypes from 'prop-types';
import { useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { MOCK_SESSIONS } from '@/lib/mockData';

/**
 * ホーム画面：新規セッション作成CTA + 過去セッション履歴一覧。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {() => void} props.onCreateSession  セッション画面へ遷移
 * @param {(sessionId: string) => void} props.onOpenSession
 */
function HomeScreen({ t, onCreateSession, onOpenSession }) {
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

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-3">
        <h2 className="app-text text-base font-bold">{t('home.newSession')}</h2>
        <Button fullWidth onClick={onCreateSession}>
          + {t('home.newSession')}
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="app-text-muted text-sm font-semibold">
          {t('home.history')}
        </h2>

        {MOCK_SESSIONS.length === 0 ? (
          <Card>
            <p className="app-text-muted text-sm">{t('home.empty')}</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {MOCK_SESSIONS.map((s) => (
              <li key={s.id}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="app-text truncate font-semibold">{s.name}</p>
                    <p className="app-text-muted text-xs">
                      {s.memberCount} {t('common.members')} · {s.paymentCount}{' '}
                      {t('session.payments')} · {s.updatedAt}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    dataValue={s.id}
                    onClick={handleOpen}
                  >
                    {t('home.openSession')}
                  </Button>
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
