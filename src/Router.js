import React from 'react';
import createStore from 'coeux';
import map from 'lodash/map';
import reduceRight from 'lodash/reduceRight';
import { routesShape } from './types';
import { storeShape } from 'coeux/lib/types';
import routerReducer from './reducers/router';
import { abortable } from 'coeus-utils';

export default class Router extends React.Component {
  getChildContext() {
    return {
      store: this.store,
      routes: this.props.routes
    };
  }

  componentWillMount() {
    let { routes, middlewares } = this.props;

    let store = this.store = createStore(middlewares);

    this.unmount = store.mountReducer({
      router: routerReducer(routes)
    });

    // keep an abortable promise for routing
    // so we can stop it whenever we want
    this.routing = null;

    this.unsubscribe1 = store.subscribe({
      router: ({ status, location }) => {
        if (status === 'ROUTE_TO' || status === 'ROUTE_HISTORY') {
          if (this.routing) {
            this.routing.abort();
            this.routing = null;
          }

          this.routing = abortable(
            routes.match(location)
          );

          this.routing.then(({ components, args, name }) => {
            this.routing = null;

            store.dispatch({
              type: 'ROUTE_LOADED',
              args,
              name
            });

            if (status === 'ROUTE_TO') {
              history.pushState(null, null, location);
            }

            this.setState({ components });
          });
        }
      }
    });

    this.originPopState = window.onpopstate;
    window.onpopstate = function() {
      store.dispatch({
        type: 'ROUTE_HISTORY'
      });
    };

    this.setState({
      components: []
    });

    store.initState();
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.routes !== nextProps.routes) {
      throw new Error(
        '<Router> does not support changing \'routes\' on the fly.'
      );
    }
  }

  componentWillUnmount() {
    this.unmount();
    this.unsubscribe();
    window.onpopstate = this.originPopState;
  }

  render() {
    let { components } = this.state;

    let page = reduceRight(components, (children, types) => {
      return map(types, (type) => {
        return React.createElement(
          type, null, ...children
        );
      });
    }, []);

    return React.createElement(
      'div', this.props, ...page
    );
  }
}

Router.propTypes = {
  routes: routesShape.isRequired,
  middlewares: React.PropTypes.arrayOf(React.PropTypes.func)
};

Router.childContextTypes = {
  store: storeShape.isRequired,
  routes: routesShape.isRequired
};
