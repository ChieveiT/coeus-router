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
  match: function(target) {
    let _tmp = target.split('?');
    let path = _tmp.shift();
    let searchStr = _tmp.shift() || '';

    let self = this;
    return new Promise(function(resolve, reject) {
      let result = (function traverse(children, context) {
        for (let i = 0; i < children.length; i++) {
          let node = children[i];

          // create current context to avoid children's contexts
          // affect each other
          let remain = context.remain;
          let componentsPromises = context.componentsPromises.slice();
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
        Promise.all(result[0]).then(function(components) {
          // search parse
          let s = searchStr.split('&');
          let searchObj = {};
          for (let i in s) {
            let pair = s[i].split('=');
            let key = decodeURIComponent(pair.shift());
            let value = decodeURIComponent(pair.shift() || '');

            if (key !== '') {
              searchObj[key] = value;
            }
          }

          resolve({
            components: components,
            args: Object.assign(
              searchObj,
              result[1]
            )
          });
        }, function(e) {
          reject(e);
        });
      }
    });
  },
  check: function(target) {
    let path = target.split('?').shift();

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
  linkByName: function(name, args) {
    let named = this._names[name];
    args = args || {};

    if (named === undefined) {
      throw new Error('Unknown name \'' + name + '\'');
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

    // search stringify
    let search = [];
    for (let i in args) {
      if (named.paramsOptional[i] === undefined) {
        search.push(
          encodeURIComponent(i) + '=' +
          encodeURIComponent(args[i])
        );
      }
    }
    search = search.join('&');
    if (search !== '') {
      result += '?' + search;
    }

    return result;
  },
  linkByPath: function(path, args) {
    // search stringify
    let search = [];
    for (let i in args) {
      search.push(
        encodeURIComponent(i) + '=' +
        encodeURIComponent(args[i])
      );
    }
    search = search.join('&');
    if (search !== '') {
      path += '?' + search;
    }

    return path;
  }
};
