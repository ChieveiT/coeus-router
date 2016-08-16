var fs = require('fs');
var yaml = require('yaml-loader');
var routes = require('../src/routes-loader');
var js_beautify = require('js-beautify').js_beautify;

function beautify(content) {
  return js_beautify(content, { indent_size: 2 });
}

// mock this
var yamlLoader = yaml.bind({ });
var routeLoader = routes.bind({ });

var routeTree;
var source;

try {
  fs.mkdirSync('test/routes');
} catch (e) {}

// components
routeTree = `
path: /
components: 'foo'
children:
  - components: [ './foo', './bar' ]
`;
source = beautify(routeLoader(yamlLoader(routeTree)));
fs.writeFileSync('test/routes/components.js', source);

// regex_path
routeTree = `
path: /foo<?bar:\\d{1,2}>/bar.foo<foo:\\w{17}[abc]>_tail_
`;
source = beautify(routeLoader(yamlLoader(routeTree)));
fs.writeFileSync('test/routes/regex_path.js', source);

// named_routes
routeTree = `
path: /foo<?bar:\\d{1,2}>/bar.foo
children:
  - path: '_tail_'
    name: 'foo'
  - path: '<foo:\\w{17}[abc]>'
    name: 'bar'
`;
source = beautify(routeLoader(yamlLoader(routeTree)));
fs.writeFileSync('test/routes/named_routes.js', source);

// match_function
routeTree = `
path: '/'
components: '../stub/foo'
children:
  - components:
    - '../stub/foo'
    - '../stub/bar'
  - path: 'foo'
  - path: 'foo<bar:\\d+>'
    children: 
      - path: '<?foo:\\w+_>bar'
        components: '../stub/bar'
`;
source = beautify(routeLoader(yamlLoader(routeTree)));
fs.writeFileSync('test/routes/match_function.js', source);

// link_function
routeTree = `
path: /foo<?bar:\\d{1,2}>/bar.foo<foo:\\w{2}[abc]>_tail_
name: 'foo'
`;
source = beautify(routeLoader(yamlLoader(routeTree)));
fs.writeFileSync('test/routes/link_function.js', source);

// relative_path
routeTree = `
path: /
components: ':foo'
children:
  - components: ':foo'
  - path: mocha/mocha
    componentsPath: './components'
    components: ':foo'
    children:
      - components: ':foo'
`;
source = beautify(routeLoader(yamlLoader(routeTree)));
fs.writeFileSync('test/routes/relative_path.js', source);
