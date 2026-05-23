import PropTypes from 'prop-types';
import IconBackdrop from '@/components/layout/IconBackdrop';

/**
 * モバイルファーストの中央寄せレイアウト枠。
 * 背景に職業アイコンを薄く散りばめた装飾レイヤー(IconBackdrop)を敷く。
 *
 * @param {Object} props
 * @param {React.ReactNode} props.topBar
 * @param {React.ReactNode} props.children
 */
function AppLayout({ topBar, children }) {
  return (
    <div className="app-bg relative min-h-full">
      <IconBackdrop />
      <div className="relative z-10">
        {topBar}
        <main className="mx-auto max-w-2xl px-4 py-5 pb-16">{children}</main>
      </div>
    </div>
  );
}

AppLayout.propTypes = {
  topBar: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

export default AppLayout;
