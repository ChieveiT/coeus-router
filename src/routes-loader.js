'use strict';
let _ = require('lodash');
let template = require('./routes-template');

// Because path.join will eat '.' which make
// webpack's require works wrong, so we should
// create our own path.join
function pathJoin() {
  let paths = [];

  _.forEach(arguments, function(v, k) {
    if (k === 0) {
      paths.push(_.trimEnd(v, '/'));
    } else if (k === (arguments.length - 1)) {
      paths.push(_.trimStart(v, '/'));
    } else {
      paths.push(_.trim(v, '/'));
    }
  });

  return _.filter(paths, function(v) {
    return !_.isEmpty(v);
  }).join('/');
}

module.exports = function(source) {
  this.cacheable && this.cacheable();

  // convert to json so we can traverse routeTree
  let routeTree = JSON.parse(source);

  // for named routes
  let namedRoutes = {};

  (function traverse(node, context) {
    if (_.isString(node.components)) {
      node.components = [ node.components ];
    }
    if (node.components && !_.isArray(node.components)) {
      throw new Error('Components must be string or array');
    }

    let indexRoute = _.filter(node.children, function(child) {
      return _.isEmpty(child.path);
    });
    if (indexRoute.length > 1) {
      throw new Error('Duplicate index child of a route');
    }

    if (_.isEmpty(node.path) && !_.isEmpty(node.children)) {
      throw new Error('Index route is a leaf that can not has children');
    }

    if (node.name && !_.isEmpty(node.children)) {
      throw new Error('Named route is a leaf that can not has children');
    }

    // create current context to avoid children's contexts
    // affect each other
    let pathTemplate = context.pathTemplate;
    let paramsRegex = Object.assign({}, context.paramsRegex);
    let paramsOptional = Object.assign({}, context.paramsOptional);
    let componentsPath = context.componentsPath;

    // compile path to support regex and params
    if (node.path) {
      let regexMatch = /\<(\??[a-zA-Z_][a-zA-Z_0-9]*):(.*?)\>/g;
      let lastIndex = 0;
      let compiled = '';
      let params = [];

      let match = null;
      while ((match = regexMatch.exec(node.path))) {
        let notRegex = node.path.substr(lastIndex, match.index - lastIndex);
        lastIndex = regexMatch.lastIndex;
        compiled += _.escapeRegExp(notRegex);

        let name = match[1];
        let regex = match[2];

        if (paramsRegex[name]) {
          throw new Error('The names of params conflict');
        }

        if (name.substr(0, 1) === '?') {
          name = name.substr(1);

          compiled += '(' + regex + ')?';
          params.push(name);

          paramsRegex[name] = regex;
          paramsOptional[name] = true;
        } else {
          compiled += '(' + regex + ')';
          params.push(name);

          paramsRegex[name] = regex;
          paramsOptional[name] = false;
        }

        pathTemplate += notRegex;
        pathTemplate += '<' + name + '>';
      }

      // deal with tail
      if (lastIndex < node.path.length) {
        let notRegex = node.path.substr(
          lastIndex, node.path.length - lastIndex
        );
        compiled += _.escapeRegExp(notRegex);

        pathTemplate += notRegex;
      }

      node._path = compiled;
      node._params = params;
    }

    // for named routes
    if (node.name && _.isEmpty(node.children)) {
      namedRoutes[node.name] = {
        pathTemplate,
        paramsRegex,
        paramsOptional
      };
    }

    // for relative path
    if (!_.isEmpty(node.componentsPath)) {
      componentsPath = node.componentsPath;
    }

    // support relative path
    let components = _.map(node.components, function(v) {
      if (v.substr(0, 1) === ':') {
        return pathJoin(componentsPath, v.substr(1));
      }
      return v;
    });

    // add _components as placeholder, prepare for hack
    if (!_.isEmpty(node.components)) {
      node._components = components;
    }

    // recursive traverse to children
    if (!_.isEmpty(node.children)) {
      _.forEach(node.children, function(n) {
        traverse(n, {
          componentsPath,

          pathTemplate,
          paramsRegex,
          paramsOptional
        });
      });
    }
  })(routeTree, {
    // for relative path
    componentsPath: '',
    // for named routes
    pathTemplate: '',
    paramsRegex: {},
    paramsOptional: {}
  });

  // add match to the root of tree
  routeTree.match = '<match function>';
  // add check to the root of tree
  routeTree.check = '<check function>';
  // add _names and linkByName to the root of tree
  routeTree._names = namedRoutes;
  routeTree.linkByName = '<linkByName function>';
  // add linkByPath to the root of tree
  routeTree.linkByPath = '<linkByPath function>';

  // convert to source so we can hack it as string
  let routeSource = JSON.stringify(routeTree);

  // hack _components to be a require.ensure promise:)
  routeSource = routeSource.replace(
    /(["'])_components\1\s*?:\s*?(\[.*?\])/g,
    function() {
      let requireList = JSON.parse(arguments[2]);

      requireList = '[' +
        _.map(requireList, function(v) {
          return 'require("' + v + '").default || require("' + v + '")';
        }).join(',') +
      ']';

      let func = template.getFunction(template._components).replace(
        /require\(\)/g,
        requireList
      );

      return '"_components": ' + func;
    }
  );

  // hack match to be a real function:)
  routeSource = routeSource.replace(
    /(["'])match\1\s*?:\s*?(["'])\<match function\>\2/g,
    function() {
      let func = template.getFunction(template.match);

      return '"match": ' + func;
    }
  );

  // hack check to be a real function:)
  routeSource = routeSource.replace(
    /(["'])check\1\s*?:\s*?(["'])\<check function\>\2/g,
    function() {
      let func = template.getFunction(template.check);

      return '"check": ' + func;
    }
  );

  // hack linkByName to be a real function:)
  routeSource = routeSource.replace(
    /(["'])linkByName\1\s*?:\s*?(["'])\<linkByName function\>\2/g,
    function() {
      let func = template.getFunction(template.linkByName);

      return '"linkByName": ' + func;
    }
  );

  // hack linkByPath to be a real function:)
  routeSource = routeSource.replace(
    /(["'])linkByPath\1\s*?:\s*?(["'])\<linkByPath function\>\2/g,
    function() {
      let func = template.getFunction(template.linkByPath);

      return '"linkByPath": ' + func;
    }
  );

  return 'module.exports = ' + routeSource;
};
