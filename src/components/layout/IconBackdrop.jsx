import yuusha from '@/assets/icons/yuusha.png';
import sensi from '@/assets/icons/sensi.png';
import mahoutukai from '@/assets/icons/mahoutukai.png';
import souryo from '@/assets/icons/souryo.png';
import yumitukai from '@/assets/icons/yumitukai.png';
import sirhu from '@/assets/icons/sirhu.png';
import asobinin from '@/assets/icons/asobinin.png';

// 全ページ共通の装飾背景。職業アイコンを薄く散りばめる（要件: 各ページ背景）。
// 位置は viewport 相対(%)で固定し、低 opacity・rotate で「散りばめ」感を出す。
const ITEMS = [
  { src: yuusha, top: '6%', left: '4%', size: 104, rot: -10 },
  { src: sensi, top: '14%', left: '84%', size: 88, rot: 12 },
  { src: mahoutukai, top: '34%', left: '10%', size: 96, rot: 8 },
  { src: sirhu, top: '30%', left: '88%', size: 76, rot: -8 },
  { src: souryo, top: '54%', left: '80%', size: 92, rot: -12 },
  { src: yumitukai, top: '60%', left: '6%', size: 84, rot: 10 },
  { src: asobinin, top: '80%', left: '74%', size: 100, rot: 14 },
  { src: sensi, top: '86%', left: '14%', size: 80, rot: -6 },
  { src: yuusha, top: '46%', left: '46%', size: 88, rot: 6 },
];

/**
 * 装飾用の背景レイヤー（全ページ共通）。
 * pointer-events なし・aria-hidden で操作/読み上げに影響しない。
 */
function IconBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {ITEMS.map((it, i) => (
        <img
          // 静的な装飾配列のため index キーで問題ない
          key={`${it.top}-${it.left}-${i}`}
          src={it.src}
          alt=""
          style={{
            top: it.top,
            left: it.left,
            width: `${it.size}px`,
            transform: `rotate(${it.rot}deg)`,
          }}
          className="absolute select-none opacity-[0.07]"
        />
      ))}
    </div>
  );
}

export default IconBackdrop;
