'use strict';
// inspired by webpack/lib/Template
module.exports = {
  getFunction: function(fn) {
    return fn.toString();
  },
  _components: function() {
    return new Promise(function(resolve) {
      require.ensure([], function(require) {
        resolve(require());
      });
    });
  },
  match: function(path) {
    let self = this;

    return new Promise(function(resolve, reject) {
      let result = (function traverse(children, context) {
        for (let i = 0; i < children.length; i++) {
          let node = children[i];

          // create current context to avoid children's contexts
          // affect each other
          let remain = context.remain;
          let componentsPromises = context.componentsPromises.slice(0);
          let routeArguments = Object.assign({}, context.routeArguments);

          if (node._path) {
            let regex = new RegExp('^' + node._path, 'g');

            let match = null;
            if ((match = regex.exec(remain))) {
              if (node._components) {
                componentsPromises.push(node._components());
              }

              for (let j = 1; j < match.length; j++) {
                // optional arguments will be matched as
                // undefined, so filter them
                if (match[j]) {
                  routeArguments[node._params[j - 1]] = match[j];
                }
              }

              if (regex.lastIndex === remain.length) {
                if (node.children) {
                  // search for index route
                  for (let k = 0; k < node.children.length; k++) {
                    if (node.children[k]._path === undefined) {
                      let index = node.children[i];

                      if (index._components) {
                        componentsPromises.push(index._components());
                      }

                      break;
                    }
                  }
                }

                return [
                  componentsPromises,
                  routeArguments
                ];
              }

              if (node.children) {
                return traverse(node.children, {
                  remain: remain.substr(regex.lastIndex),

                  componentsPromises,
                  routeArguments
                });
              }
            }
          }
        }

        return false;
      })([ self ], {
        remain: path,

        componentsPromises: [],
        routeArguments: {}
      });

      // not match
      if (result === false) {
        resolve(false);
      } else {
        // It seems hard to support es6 syntax in meta programming.
        // _slicedToArray() will be missing.
        // If you can solve this, please give me a PR:)
        //
        // let [ componentsPromises, routeArguments ] = result;

        Promise.all(result[0]).then(function(components) {
          resolve({
            components: components,
            args: result[1]
          });
        }, function(e) {
          reject(e);
        });
      }
    });
  },
  check: function(path) {
    return (function traverse(children, context) {
      for (let i = 0; i < children.length; i++) {
        let node = children[i];

        // create current context to avoid children's contexts
        // affect each other
        let remain = context.remain;

        if (node._path) {
          let regex = new RegExp('^' + node._path, 'g');

          if (regex.exec(remain)) {
            if (regex.lastIndex === remain.length) {
              return true;
            }

            if (node.children) {
              return traverse(node.children, {
                remain: remain.substr(regex.lastIndex)
              });
            }
          }
        }
      }

      return false;
    })([ this ], {
      remain: path
    });
  },
  link: function(name, args) {
    let named = this._names[name];
    args = args || {};

    if (named === undefined) {
      throw new Error('Unknown name \'' + name + '\'');
    }

    for (let i in args) {
      if (named.paramsOptional[i] === undefined) {
        throw new Error('Unknown argument \'' + i + '\'');
      }
    }

    let result = named.pathTemplate;
    for (let i in named.paramsOptional) {
      if (named.paramsOptional[i] === false && args[i] === undefined) {
        throw new Error('Argument \'' + i + '\' is required');
      }

      let regex = new RegExp('^' + named.paramsRegex[i] + '$');
      if (args[i] && regex.test(String(args[i])) === false) {
        throw new Error('Argument \'' + i + '\' is illegal');
      }

      result = result.replace('<' + i + '>', args[i] || '');
    }

    return result;
  }
};
