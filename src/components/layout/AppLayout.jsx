import PropTypes from 'prop-types';

/**
 * モバイルファーストの中央寄せレイアウト枠。
 *
 * @param {Object} props
 * @param {React.ReactNode} props.topBar
 * @param {React.ReactNode} props.children
 */
function AppLayout({ topBar, children }) {
  return (
    <div className="app-bg min-h-full">
      {topBar}
      <main className="mx-auto max-w-2xl px-4 py-5 pb-16">{children}</main>
    </div>
  );
}

AppLayout.propTypes = {
  topBar: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

export default AppLayout;
