import React from 'react';

export default function bar({ children }) {
  return (
    <div className="bar">
      {'bar'}
      {children}
    </div>
  );
}

bar.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.element,
    React.PropTypes.arrayOf(React.PropTypes.element)
  ])
};
