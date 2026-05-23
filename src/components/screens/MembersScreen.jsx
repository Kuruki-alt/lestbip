import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useSessions } from '@/hooks/useSessions';
import asobininIcon from '@/assets/icons/asobinin.png';

/**
 * メンバー編集画面（v2.0.0 新設、改善案 #2）：
 * 現在のセッションに対するメンバーの追加・削除をライブで行う。
 * 操作は即時 LocalStorage 永続化、戻るボタンでセッション画面へ。
 *
 * @param {Object} props
 * @param {(key: string) => string} props.t
 * @param {() => void} props.onBack  セッションへ戻る
 */
function MembersScreen({ t, onBack }) {
  const { currentSession, addMember, removeMember } = useSessions();
  const [draft, setDraft] = useState('');

  const handleDraft = useCallback(
    /** @param {React.ChangeEvent<HTMLInputElement>} e */
    (e) => setDraft(e.target.value),
    [],
  );

  const handleAdd = useCallback(() => {
    if (!currentSession) return;
    const name = draft.trim();
    if (!name) return;
    addMember(currentSession.id, name);
    // v2.0.0 改善案 #1: 追加後は入力欄を空にする
    setDraft('');
  }, [currentSession, addMember, draft]);

  const handleKeyDown = useCallback(
    /** @param {React.KeyboardEvent<HTMLInputElement>} e */
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    },
    [handleAdd],
  );

  const handleRemove = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const id = e.currentTarget.dataset.value;
      if (id && currentSession) {
        removeMember(currentSession.id, id);
      }
    },
    [currentSession, removeMember],
  );

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

  const members = currentSession.members ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← {t('common.back')}
        </Button>
        <div className="flex items-center gap-2">
          <img
            src={asobininIcon}
            alt=""
            className="h-10 w-10 shrink-0 object-contain"
          />
          <h2 className="app-text text-base font-bold">{t('members.title')}</h2>
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <h3 className="app-text-muted text-sm font-semibold">
          {t('common.members')}
        </h3>
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
                  onClick={handleRemove}
                >
                  {t('common.delete')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h3 className="app-text-muted text-sm font-semibold">
          {t('session.addMember')}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={handleDraft}
            onKeyDown={handleKeyDown}
            placeholder={t('newSession.memberPlaceholder')}
            aria-label={t('session.addMember')}
            className="app-card app-field min-w-0 flex-1 border px-3 py-2 text-sm"
          />
          <Button variant="primary" onClick={handleAdd}>
            + {t('session.addMember')}
          </Button>
        </div>
      </Card>
    </div>
  );
}

MembersScreen.propTypes = {
  t: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default MembersScreen;
