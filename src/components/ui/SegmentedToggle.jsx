import PropTypes from 'prop-types';
import { useCallback } from 'react';

/**
 * 2値セグメントトグル（テーマ/言語切替などに使用）。
 * リスト内インライン関数生成を避けるため、option ごとに
 * data 属性経由で 1 つのハンドラに集約する。
 *
 * @param {Object} props
 * @param {string} props.label                アクセシビリティ用ラベル
 * @param {{ value: string, label: string }[]} props.options 2要素想定
 * @param {string} props.value                現在値
 * @param {(value: string) => void} props.onChange
 */
function SegmentedToggle({ label, options, value, onChange }) {
  const handleClick = useCallback(
    /** @param {React.MouseEvent<HTMLButtonElement>} e */
    (e) => {
      const next = e.currentTarget.dataset.value;
      if (next && next !== value) {
        onChange(next);
      }
    },
    [onChange, value],
  );

  return (
    <div
      role="group"
      aria-label={label}
      className="app-card app-surface-2 inline-flex p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            data-value={opt.value}
            aria-pressed={active}
            onClick={handleClick}
            className={`app-card px-3 py-1 text-xs font-semibold transition-[filter] ${
              active ? 'app-accent' : 'app-text-muted'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

SegmentedToggle.propTypes = {
  label: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default SegmentedToggle;
