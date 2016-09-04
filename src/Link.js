import React from 'react';
import searchStringify from './utils/searchStringify';
import { storeShape } from 'coeux/lib/types';
import { routesShape } from './types';

export default function Link(props, context) {
  const { path, name, args, search, children, ...other } = props;
  const { store, routes } = context;

  let action = { type: 'ROUTE', path, search };
  let href = path;

  if (name !== undefined) {
    action = { type: 'ROUTE', name, args, search };
    href = routes.link(name, args);
  }

  if (search !== undefined) {
    href += searchStringify(search);
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
  search: React.PropTypes.object,
  children: React.PropTypes.node
};

Link.contextTypes = {
  store: storeShape.isRequired,
  routes: routesShape.isRequired
};
