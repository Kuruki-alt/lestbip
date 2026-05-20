import PropTypes from 'prop-types';
import { useEffect, useMemo, useReducer } from 'react';
import { INITIAL_STATE, sessionsReducer } from '@/store/sessionsReducer';
import { SessionsContext } from '@/store/sessionsContextValue';
import { loadSessions } from '@/lib/storage';

/**
 * セッション state と dispatch を React Context で配信する Provider。
 * 初期マウント時に LocalStorage から HYDRATE。書き込みは useSessions 側で
 * dispatch と同時に storage を呼ぶ（reducer は純粋に保つ）。
 *
 * @param {{ children: React.ReactNode }} props
 */
function SessionsProvider({ children }) {
  const [state, dispatch] = useReducer(sessionsReducer, INITIAL_STATE);

  useEffect(() => {
    const list = loadSessions();
    dispatch({ type: 'HYDRATE', sessions: list });
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}

SessionsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SessionsProvider;
