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
      let result = (function traverse(node, context) {
        // to avoid children's contexts affect each other
        // copy context
        let remain = context.remain;
        let componentsPromises = context.componentsPromises.slice();
        let routeArguments = Object.assign({}, context.routeArguments);

        let regex = new RegExp('^' + node._path, 'g');

        if (node._path) {
          let match = null;
          if ((match = regex.exec(remain))) {
            if (node._components) {
              componentsPromises.push(node._components());
            }

            for (let i = 1; i < match.length; i++) {
              // optional arguments will be matched as undefined
              // filter them
              if (match[i] !== undefined) {
                routeArguments[node._params[i - 1]] = match[i];
              }
            }

            // if match has reached tail
            // search for default routes on the subtree
            if (regex.lastIndex === remain.length) {
              let _children = node.children;

              while (_children) {
                for (let i in _children) {
                  if (_children[i]._path === undefined) {
                    let _default = _children[i];

                    if (_default._components) {
                      componentsPromises.push(_default._components());
                    }

                    _children = _default.children;
                    break;
                  }
                }
              }

              return [
                componentsPromises,
                routeArguments
              ];
            }
          }
        } else {
          // a route without path (default route)
          // regarded as always matched
          if (node._components) {
            componentsPromises.push(node._components());
          }
        }

        if (node.children) {
          for (let i in node.children) {
            let _result = traverse(node.children[i], {
              remain: remain.substr(regex.lastIndex),

              componentsPromises,
              routeArguments
            });

            if (_result) {
              return _result;
            }
          }
        }

        return false;
      })(self, {
        remain: path,

        componentsPromises: [],
        routeArguments: {}
      });

      // not match
      if (result === false) {
        resolve(false);
        return;
      }

      let _componentsPromises = result[0];
      let _routeArguments = result[1];

      Promise.all(_componentsPromises).then(function(components) {
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
            _routeArguments
          )
        });
      }, function(e) {
        reject(e);
      });
    });
  },
  check: function(target) {
    let path = target.split('?').shift();

    return (function traverse(node, context) {
      // to avoid children's contexts affect each other
      // copy context
      let remain = context.remain;

      let regex = new RegExp('^' + node._path, 'g');

      if (node._path) {
        if (regex.exec(remain)) {
          if (regex.lastIndex === remain.length) {
            return true;
          }
        }
      }

      if (node.children) {
        for (let i in node.children) {
          let _result = traverse(node.children[i], {
            remain: remain.substr(regex.lastIndex)
          });

          if (_result) {
            return true;
          }
        }
      }

      return false;
    })(this, {
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
