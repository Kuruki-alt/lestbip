import { useCallback, useReducer } from 'react';

/**
 * @typedef {'home' | 'newSession' | 'session' | 'members' | 'paymentForm' | 'directPayment' | 'settlement'} ScreenName
 */

/**
 * @typedef {Object} RouterState
 * @property {ScreenName} screen        現在の画面
 * @property {string|null} editPaymentId 編集中の支払いID（新規時は null）
 */

/** @type {RouterState} */
const INITIAL_STATE = { screen: 'home', editPaymentId: null };

/**
 * @param {RouterState} state
 * @param {{ type: string, payload?: object }} action
 * @returns {RouterState}
 */
function routerReducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return {
        ...state,
        screen: action.payload.screen,
        editPaymentId: action.payload.editPaymentId ?? null,
      };
    default:
      return state;
  }
}

/**
 * react-router を使わない簡易画面ルーター（useReducer ベース）。
 * 7画面（home / newSession / session / members / paymentForm / directPayment / settlement）の相互遷移を担う。
 */
export function useScreenRouter() {
  const [state, dispatch] = useReducer(routerReducer, INITIAL_STATE);

  const navigate = useCallback(
    /**
     * @param {ScreenName} screen
     * @param {{ editPaymentId?: string|null }} [opts]
     */
    (screen, opts = {}) => {
      dispatch({
        type: 'NAVIGATE',
        payload: { screen, editPaymentId: opts.editPaymentId ?? null },
      });
    },
    [],
  );

  return { screen: state.screen, editPaymentId: state.editPaymentId, navigate };
}
