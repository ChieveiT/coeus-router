import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import fromPairs from 'lodash/fromPairs';

function searchParse(str) {
  if (isEmpty(str)) {
    return { };
  }

  str = str.substr(1);
  return fromPairs(
    map(str.split('&'), (e) => {
      let [ key, value ] = e.split('=');
      return [
        decodeURIComponent(key),
        decodeURIComponent(value)
      ];
    })
  );
}

function searchStringify(obj) {
  if (isEmpty(obj)) {
    return '';
  }

  return '?' + map(obj, (v, k) => {
    return [
      encodeURIComponent(k),
      encodeURIComponent(v)
    ].join('=');
  }).join('&');
}

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
        return {
          components,
          args,
          search
        };
      });
    }

    switch (action.type) {
      case 'ROUTE': {
        let path = action.path;

        return routes.match(path).then((result) => {
          if (result === false) {
            let { components, args, search } = state;
            return {
              components,
              args,
              search,
              notFound: path
            };
          }

          let search = action.search || {};

          history.pushState(
            null,
            null,
            path + searchStringify(search)
          );

          let { components, args } = result;
          return {
            components,
            args,
            search
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
          return {
            components,
            args,
            search
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
          return {
            components,
            args,
            search
          };
        });
      }
      default:
        return state;
    }
  };
}
