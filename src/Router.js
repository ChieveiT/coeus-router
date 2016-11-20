import React from 'react';
import createStore from 'coeux';
import map from 'lodash/map';
import reduceRight from 'lodash/reduceRight';
import { routesShape } from './types';
import { storeShape } from 'coeux/lib/types';
import routerReducer from './reducers/router';

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

    this.unsubscribe = store.subscribe({
      router: ({ status, location }) => {
        if (status === 'LOADING') {
          routes.match(location).then(({ components, args }) => {
            store.dispatch({
              type: 'ROUTE_LOADED',
              args
            });

            this.setState({ components });
          });
        }
      }
    });

    // initState
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
      'div', null, ...page
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
