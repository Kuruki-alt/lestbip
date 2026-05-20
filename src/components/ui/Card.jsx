import PropTypes from 'prop-types';

/**
 * 汎用カードコンテナ。
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
function Card({ children, className = '' }) {
  return (
    <section className={`app-card app-surface border p-4 ${className}`}>
      {children}
    </section>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default Card;
