import React from 'react';
import { storeShape } from 'coeux/lib/types';
import { routesShape } from './types';

export default function Link(props, context) {
  const { path, name, args, children, ...other } = props;
  const { store, routes } = context;

  let action = null;
  let href = null;

  if (name) {
    action = { type: 'ROUTE_TO', name, args };
    href = routes.linkByName(name, args);
  } else {
    action = { type: 'ROUTE_TO', path, args };
    href = routes.linkByPath(path, args);
  }

  return (
    <a
      {...other}
      href={href}
      onClick={function(e) {
        e.preventDefault();
        store.dispatch(action);
        return false;
      }}
    >{children}</a>
  );
}

Link.propTypes = {
  path: React.PropTypes.string,
  name: React.PropTypes.string,
  args: React.PropTypes.object,
  children: React.PropTypes.node
};

Link.contextTypes = {
  store: storeShape.isRequired,
  routes: routesShape.isRequired
};
