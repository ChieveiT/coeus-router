# coeus-router

[![Build Status](https://travis-ci.org/ChieveiT/coeus-router.svg?branch=master)](https://travis-ci.org/ChieveiT/coeus-router)
[![npm version](https://img.shields.io/npm/v/coeus-router.svg?style=flat-square)](https://www.npmjs.com/package/coeus-router)
[![npm downloads](https://img.shields.io/npm/dm/coeus-router.svg?style=flat-square)](https://www.npmjs.com/package/coeus-router)

A tiny router toolset to build SPA with webpack and [coeux](https://github.com/ChieveiT/coeux). It contains three parts:

* A loader for webpack.
* A Router component.
* A Link component.

## Quick Start
(editing...)

## Routes Loader

### _load components on demand_

define routes shape in yaml
```yaml
# save as ./routes.yml

path: '/'
components: 'foo'
children:
  - components: [ './foo', './bar' ]
```
load routes with webpack
```javascript
// es6
import routes from 'coeus/lib/utils/routes-loader!yaml!./routes.yml';

// commonjs
var routes = require('coeus/lib/utils/routes-loader!yaml!./routes.yml');

// webpack.config.js
module: {
  loaders: [
    { test: /routes\.yml$/, loaders: [ 'coeus/lib/utils/routes-loader', 'yaml' ], exclude: /node_modules/ }
  ]
}
import routes from './routes.yml';
var routes = require('./routes.yml');
```
console.log(routes) will show you something
```javascript
"path": "/",
"components": ["foo"],
"_components": function() {
  return new Promise(function(resolve) {
    require.ensure([], function(require) {
      resolve([require("foo").default || require("foo")]);
    });
  });
},
"children": [{
  "components": ["./foo", "./bar"],
  "_components": function() {
    return new Promise(function(resolve) {
      require.ensure([], function(require) {
        resolve([require("./foo").default || require("./foo"), require("./bar").default || require("./bar")]);
      });
    });
  }
}]
```
If you don't know what it exactly means above, it is recommended to read [webpack manual](http://webpack.github.io/docs/code-splitting.html) first.

### _regex path & named arguments_

define path
```yaml
path: /foo<?bar:\\d{1,2}>/bar.foo<foo:\\w{17}[abc]>_tail_
```
accordingly get two internal properties from routes module
```javascript
"_path": "/foo(\\d{1,2})?/bar\\.foo(\\w{17}[abc])_tail_",
"_params": ["bar", "foo"]
```
Things is clear. We can easily match path and capture named arguments with the internal properties.
The supported format for regex path & named arguments is
<table>
  <tr>
    <td>&lt;name:regex&gt;</td>
    <td>required</td>
  </tr>
  <tr>
    <td>&lt;?name:regex&gt;</td>
    <td>optional</td>
  </tr>
</table>

### _relative components path_

define routes
```yaml
path: /
components: ':foo'
children:
  - components: ':foo'
  - path: mocha/mocha
    componentsPath: './components'
    components: ':foo'
    children:
      - components: ':foo'
```
accordingly get
```javascript
"path": "/",
"components": [":foo"],
"_components": function() {
  return new Promise(function(resolve) {
    require.ensure([], function(require) {
      resolve([require("foo").default || require("foo")]);
    });
  });
}
"children": [{
  "components": [":foo"],
  "_components": function() {
    return new Promise(function(resolve) {
      require.ensure([], function(require) {
        resolve([require("foo").default || require("foo")]);
      });
    });
  }
}, {
  "path": "mocha/mocha",
  "componentsPath": "./components",
  "components": [":foo"],
  "_components": function() {
    return new Promise(function(resolve) {
      require.ensure([], function(require) {
        resolve([require("./components/foo").default || require("./components/foo")]);
      });
    });
  },
  "children": [{
    "components": [":foo"],
    "_components": function() {
      return new Promise(function(resolve) {
        require.ensure([], function(require) {
          resolve([require("./components/foo").default || require("./components/foo")]);
        });
      });
    }
  }]
}]
```
As you seen, routes loader support relative components with `componentsPath` property and `:` prefix. Two rules should be mentioned:

1. All `:` prefixes in components will be replaced to the closest `componentsPath` in itself, parent or ancestors;
2. If there is no `componentsPath` found, `:` will be replaced to an empty string.

### _named routes_

give the leaf node of routes a name
```yaml
path: /foo<?bar:\\d{1,2}>/bar.foo
children:
  - path: '_tail_'
    name: 'foo'
  - path: '<foo:\\w{17}[abc]>'
    name: 'bar'
```
an extra internal property `_names` will be found in the top level of routes
```javascript
"_names": {
  "foo": {
    "pathTemplate": "/foo<bar>/bar.foo_tail_",
    "paramsRegex": {
      "bar": "\\d{1,2}"
    },
    "paramsOptional": {
      "bar": true
    }
  },
  "bar": {
    "pathTemplate": "/foo<bar>/bar.foo<foo>",
    "paramsRegex": {
      "bar": "\\d{1,2}",
      "foo": "\\w{17}[abc]"
    },
    "paramsOptional": {
      "bar": true,
      "foo": false
    }
  }
}
```
With the `_names` property, it's easy to generate a path matching the named route when given the name and arguments. 

### _match & link_

Hoped the internal sight for routes module does not upset you. Talking about internal properties only help you understand what's going on in routes loading but should never bother you when using routes to match a path or generate a path given route's name and arguments. Two functions `match` and `link` exposed in routes module is designed to take the work.

* `[match(path): result] (Promise)`: Given a path, `match` will take a depth-first greedy matching on the routes tree. All `path` properties on every route path of the tree will be concated to match the given path. Once a route path is matched, the algorithm continously look for the tail node of the route path whether there is a node without `path` property in its children, in short, look for an _default child_. After that, matching is finished and the result generated during the traverse will be returned(wrapped in a Promise). If not match, false will be returned.

<p align="center"><img src="https://s19.postimg.org/u8u9vuv3n/routes.png" /></p>

* `[linkByPath(path, args): url] (String)`: To generate a url with path. If you provide args, args will be generated as query string.

* `[linkByName(name, args): url] (String)`: To generate a url with named route. If you provide args, arguments defined in named route will generated within path, the rest of them will be chained as query string.

## Router Component

A Router component as a app's entry.

### _props_

* `routes(Object)`: The routes module loaded from routes loader.
* `middlewares(Array)`: The middlewares array registered to redux store.

### _context_

Router will create coeux store and pass routes module to the components managed by it. There are two points:
* Use store in your components.
* Do not use routes module directly. It usually be considered as an internal dependency.

```javascript
import { storeShape } from 'coeus-router/lib/types';
// ...
class Foo extends React.Component {
  componentWillMount() {
    let store = this.context.store;
    store.mountReducer(reducer);
    store.subscribe(listener);
    store.initState();
  }
}
// ...
Foo.contextTypes = {
  store: storeShape.isRequired
};
export default Foo;
```

### _state in store_

* `router`
  * `status`: 'LOADING' or 'LOADED'.
  * `location`: Current location.
  * `args`: The arguments of current location.
  * `notFound(String)(only exists when routing to a 404 path)`: The 404 path which you have routed to just now.

### _actions_

* `{ type: 'ROUTE_TO', path: (String), name: (String), args: (Object) }`: Route to a path or a named route, `path` or `name` should not be passed at the same time.

## Link Component

A Stateless component wrapping &lt;a&gt; with 'ROUTE_TO' for convenient usage. `href` prop will be generated correctly in this wrapped &lt;a&gt;.

### _props_

* `path(String)`: The path passed to 'ROUTE_TO'.
* `name(String)`: The name passed to 'ROUTE_TO'.
* `name(String)`: The args passed to 'ROUTE_TO'.
