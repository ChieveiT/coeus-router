import React from 'react';
import { storeShape } from 'coeux/lib/types';

export default function foo({ children }, { store }) {
  return (
    <div className="foo">
      {'foo'}
      <input type="button" value="route" onClick={function() {
        store.dispatch({
          type: 'ROUTE',
          path: '/foo123abc_bar',
          search: {
            foo: 'bar'
          }
        });
      }} />
      <input type="button" value="back" onClick={function() {
        store.dispatch({
          type: 'ROUTE_BACK'
        });
      }} />
      <input type="button" value="forward" onClick={function() {
        store.dispatch({
          type: 'ROUTE_FORWARD'
        });
      }} />
      {children}
    </div>
  );
}

foo.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.element,
    React.PropTypes.arrayOf(React.PropTypes.element)
  ])
};

foo.contextTypes = {
  store: storeShape.isRequired
};
