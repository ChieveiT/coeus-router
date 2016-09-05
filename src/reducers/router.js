import searchParse from '../utils/searchParse';
import searchStringify from '../utils/searchStringify';

// a little hack to sync the popstate event
function syncPopState() {
  return new Promise((resolve) => {
    let restore = window.onpopstate;

    window.onpopstate = function() {
      window.onpopstate = restore;
      resolve();
    };
  });
}

export default function router(routes) {
  return function reducer(state, action) {
    if (state === undefined) {
      let path = window.location.pathname;
      let search = searchParse(window.location.search);

      return routes.match(path).then((result) => {
        if (result === false) {
          throw new Error(
            '404 Not Found: This should be handled in server. ' +
            'A land page rendered in browser should not be 404.'
          );
        }

        let { components, args } = result;
        args = { ...args, ...search };

        return {
          components,
          args
        };
      });
    }

    switch (action.type) {
      case 'ROUTE': {
        let { path, name } = action;

        // named route
        if (name !== undefined) {
          let args = action.args;
          path = routes.link(name, args);
        }

        return routes.match(path).then((result) => {
          if (result === false) {
            return {
              ...state,
              notFound: path
            };
          }

          let search = action.search || {};
          let { components, args } = result;
          args = { ...args, ...search };

          history.pushState(
            null,
            null,
            path + searchStringify(search)
          );

          return {
            components,
            args
          };
        });
      }
      case 'ROUTE_BACK': {
        let p = syncPopState();

        history.back();

        return p.then(() => {
          return routes.match(window.location.pathname);
        }).then((result) => {
          // All 404 will not be pushed in history
          // so it's impossible to get false result
          // here.

          let { components, args } = result;
          let search = searchParse(window.location.search);
          args = { ...args, ...search };

          return {
            components,
            args
          };
        });
      }
      case 'ROUTE_FORWARD': {
        let p = syncPopState();

        history.forward();

        return p.then(() => {
          return routes.match(window.location.pathname);
        }).then((result) => {
          // All 404 will not be pushed in history
          // so it's impossible to get false result
          // here.

          let { components, args } = result;
          let search = searchParse(window.location.search);
          args = { ...args, ...search };

          return {
            components,
            args
          };
        });
      }
      default:
        return state;
    }
  };
}
