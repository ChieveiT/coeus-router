
function browserLocation() {
  return (
    window.location.pathname +
    window.location.search
  );
}

export default function router(routes) {
  return function reducer(state, action) {
    if (state === undefined) {
      let target = browserLocation();

      if (routes.check(target) === false) {
        throw new Error(
          '[Router] ' +
          'A land page rendered in browser should not be 404. ' +
          'This should be handled in server.'
        );
      }

      state = {
        status: 'ROUTE_TO',
        location: target
      };
    }

    switch (action.type) {
      case 'ROUTE_TO': {
        let { path, name, args } = action;

        if (name && path) {
          throw new Error(
            '[Router] ' +
            "'name' and 'path' should not be passed " +
            'in action at the same time.'
          );
        }

        let target = null;
        if (name) {
          target = routes.linkByName(name, args);
        } else {
          target = routes.linkByPath(path, args);
        }

        if (routes.check(target) === false) {
          return {
            ...state,
            notFound: Symbol(path)
          };
        }

        return {
          ...state,
          status: 'ROUTE_TO',
          location: target
        };
      }
      case 'ROUTE_HISTORY': {
        let target = browserLocation();

        if (routes.check(target) === false) {
          throw new Error(
            '[Router] ' +
            'A history page rendered in browser should not be 404. ' +
            'This should be handled in server.'
          );
        }

        return {
          ...state,
          status: 'ROUTE_HISTORY',
          location: target
        };
      }
      case 'ROUTE_LOADED': {
        let { args, name } = action;

        return {
          ...state,
          status: 'ROUTE_LOADED',
          args,
          name
        };
      }
      default:
        return state;
    }
  };
}
