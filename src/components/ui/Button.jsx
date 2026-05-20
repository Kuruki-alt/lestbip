import PropTypes from 'prop-types';

/** バリアント別クラス（Map で安全に参照） */
const VARIANT_CLASSES = new Map([
  ['primary', 'app-accent'],
  ['secondary', 'app-surface-2 app-border border'],
  ['ghost', 'app-ghost'],
  ['danger', 'app-danger'],
  ['happy', 'app-happy'],
]);

/**
 * 汎用ボタン。テーマ系統(pop)で角丸が変わる app-card クラスを利用。
 * リスト内で対象IDを渡したい場合は dataValue を使い、
 * ハンドラ側で e.currentTarget.dataset.value を参照する
 * （JSX内のインライン関数生成を避けるため / CLAUDE.md §2-1）。
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {(e: React.MouseEvent<HTMLButtonElement>) => void} [props.onClick]
 * @param {'primary'|'secondary'|'ghost'|'danger'|'happy'} [props.variant='primary']
 * @param {'button'|'submit'} [props.type='button']
 * @param {boolean} [props.fullWidth=false]
 * @param {string} [props.dataValue]  data-value 属性へ渡す識別子
 * @param {string} [props.ariaLabel]
 * @param {string} [props.className='']
 */
function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  fullWidth = false,
  dataValue,
  ariaLabel,
  className = '',
}) {
  const base =
    'app-card px-4 py-2.5 text-sm font-semibold transition-[filter,background-color] disabled:opacity-50';

  // Map で参照し動的プロパティアクセス（object injection）を回避
  const variantClass =
    VARIANT_CLASSES.get(variant) ?? VARIANT_CLASSES.get('primary');

  return (
    <button
      type={type === 'submit' ? 'submit' : 'button'}
      onClick={onClick}
      data-value={dataValue}
      aria-label={ariaLabel}
      className={`${base} ${variantClass} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'ghost',
    'danger',
    'happy',
  ]),
  type: PropTypes.oneOf(['button', 'submit']),
  fullWidth: PropTypes.bool,
  dataValue: PropTypes.string,
  ariaLabel: PropTypes.string,
  className: PropTypes.string,
};

export default Button;
