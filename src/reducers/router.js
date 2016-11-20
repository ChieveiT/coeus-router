
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
      let target = (
        window.location.pathname +
        window.location.search
      );

      if (routes.check(target) === false) {
        throw new Error(
          '[Router] ' +
          'A land page rendered in browser should not be 404. ' +
          'This should be handled in server.'
        );
      }

      state = {
        status: 'LOADING',
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
            notFound: path
          };
        }

        history.pushState(null, null, target);

        return {
          ...state,
          status: 'LOADING',
          location: target
        };
      }
      case 'ROUTE_BACK': {
        let popState = syncPopState();

        history.back();

        return popState.then(() => ({
          ...state,
          status: 'LOADING',
          location: (
            window.location.pathname +
            window.location.search
          )
        }));
      }
      case 'ROUTE_FORWARD': {
        let popState = syncPopState();

        history.forward();

        return popState.then(() => ({
          ...state,
          status: 'LOADING',
          location: (
            window.location.pathname +
            window.location.search
          )
        }));
      }
      case 'ROUTE_LOADED': {
        let { args } = action;

        return {
          ...state,
          status: 'LOADED',
          args
        };
      }
      default:
        return state;
    }
  };
}
