
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

      return routes.match(target).then(({
        components, args, name
      }) => ({
        location: target,
        components,
        args,
        name
      }));
    }

    switch (action.type) {
      case 'ROUTE_TO': {
        let { target } = action;

        if (routes.check(target) === false) {
          return {
            ...state,
            notFound: Symbol(target)
          };
        }

        return routes.match(target).then(({
          components, args, name
        }) => ({
          location: target,
          components,
          args,
          name
        }));
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

        return routes.match(target).then(({
          components, args, name
        }) => ({
          location: target,
          components,
          args,
          name
        }));
      }
      default:
        return state;
    }
  };
}
