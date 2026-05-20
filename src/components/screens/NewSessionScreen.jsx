import PropTypes from 'prop-types';
import { useCallback, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useSessions } from '@/hooks/useSessions';

/**
 * 新規セッション作成画面：
 * セッション名を入力し、まずメンバーを追加してから作成する（要件 §3.1 / §3.2）。
 * 作成は useSessions.createSession を介して LocalStorage まで永続化される。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {import('@/lib/currency').CurrencyCode} [props.defaultCurrency='JPY']
 * @param {() => void} props.onBack    ホームへ戻る
 * @param {() => void} props.onCreate  セッション画面へ進む
 */
function NewSessionScreen({ t, defaultCurrency = 'JPY', onBack, onCreate }) {
  const { createSession } = useSessions();
  // ローカルUI状態: { name: string, members: {id,string}[], draft: string }
  const [sessionName, setSessionName] = useState('');
  const [members, setMembers] = useState(
    /** @type {{ id: string, name: string }[]} */ ([]),
  );
  const [draftMember, setDraftMember] = useState('');

  // 連番で安定 id を発行（key に配列 index を使わないため）
  const memberSeq = useRef(0);

  const handleSessionName = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => setSessionName(e.target.value),
    [],
  );

  const handleDraftChange = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => setDraftMember(e.target.value),
    [],
  );

  const handleAddMember = useCallback(() => {
    setDraftMember((draft) => {
      const name = draft.trim();
      if (!name) {
        return draft;
      }
      memberSeq.current += 1;
      const id = `nm-${memberSeq.current}`;
      setMembers((prev) => [...prev, { id, name }]);
      return '';
    });
  }, []);

  // 追加用入力での Enter は作成フォームを送信せずメンバー追加に割り当てる
  const handleDraftKeyDown = useCallback(
    /** @param {React.KeyboardEvent<HTMLInputElement>} e */
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddMember();
      }
    },
    [handleAddMember],
  );

  // リスト内インライン関数を避け data-value から id を取得して削除
  const handleRemoveMember = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id) {
        setMembers((prev) => prev.filter((m) => m.id !== id));
      }
    },
    [],
  );

  const canCreate = members.length > 0;

  const handleSubmit = useCallback(
    /** @param {React.FormEvent} e */
    (e) => {
      e.preventDefault();
      if (!canCreate) {
        return;
      }
      const name = sessionName.trim() || t('newSession.untitled');
      createSession(name, members, { currency: defaultCurrency });
      onCreate();
    },
    [
      canCreate,
      sessionName,
      members,
      createSession,
      defaultCurrency,
      onCreate,
      t,
    ],
  );

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        <h2 className="app-text text-base font-bold">
          {t('newSession.title')}
        </h2>
      </div>

      <Card className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="app-text font-semibold">
            {t('newSession.nameLabel')}
          </span>
          <input
            type="text"
            value={sessionName}
            onChange={handleSessionName}
            placeholder={t('newSession.namePlaceholder')}
            className="app-card app-field border px-3 py-2"
          />
        </label>
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="text-sm app-text font-semibold">
          {t('newSession.membersLabel')}
        </h3>

        <div className="flex gap-2">
          <input
            type="text"
            value={draftMember}
            onChange={handleDraftChange}
            onKeyDown={handleDraftKeyDown}
            placeholder={t('newSession.memberPlaceholder')}
            aria-label={t('newSession.memberPlaceholder')}
            className="app-card min-w-0 flex-1 app-field border px-3 py-2"
          />
          <Button variant="secondary" onClick={handleAddMember}>
            + {t('newSession.addMember')}
          </Button>
        </div>

        {members.length === 0 ? (
          <p className="app-text-muted text-sm">{t('newSession.empty')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="app-card app-surface-2 flex items-center justify-between px-3 py-2"
              >
                <span className="app-text text-sm">{m.name}</span>
                <Button
                  variant="danger"
                  dataValue={m.id}
                  ariaLabel={`${t('common.delete')} ${m.name}`}
                  onClick={handleRemoveMember}
                >
                  {t('common.delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Button
        type="submit"
        fullWidth
        variant={canCreate ? 'primary' : 'secondary'}
      >
        {t('newSession.create')}
      </Button>
      {!canCreate ? (
        <p className="app-text-muted text-center text-xs">
          {t('newSession.needMember')}
        </p>
      ) : null}
    </form>
  );
}

NewSessionScreen.propTypes = {
  t: PropTypes.func.isRequired,
  defaultCurrency: PropTypes.oneOf(['JPY', 'USD', 'EUR', 'CAD']),
  onBack: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};

export default NewSessionScreen;
