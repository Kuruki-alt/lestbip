/**
 * share.js — URLシェア用エンコード/デコード（要件 §3.9 / §6）
 *
 * 本ファイルはワイヤーフレーム段階の雛形です。実装はスコープ外。
 *
 * 将来の責務:
 *  - セッション状態を Base64 エンコードしてクエリパラメータへ格納
 *  - クエリパラメータからセッション状態を復元
 *
 * @returns {never} 未実装
 */
export function encodeSessionToUrl() {
  // TODO(wireframe): URL Base64 エンコードはワイヤーフレームのスコープ外
  throw new Error('share.encodeSessionToUrl is not implemented yet');
}

/**
 * @returns {never} 未実装
 */
export function decodeSessionFromUrl() {
  // TODO(wireframe): URL Base64 デコードはワイヤーフレームのスコープ外
  throw new Error('share.decodeSessionFromUrl is not implemented yet');
}
