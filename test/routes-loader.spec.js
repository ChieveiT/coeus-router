import expect from 'expect';
import yamlL from 'yaml-loader';
import routesL from '../src/routes-loader';

// mock this
let yamlLoader = yamlL.bind({ });
let routeLoader = routesL.bind({ });

describe('Routes Loader loads routes', () => {
  it('whose components must be string or array', () => {
    let routeTree = `
    path: '/'
    components: 123
    `;

    expect(() => {
      routeLoader(yamlLoader(routeTree));
    }).toThrow(/Components.*string or array/);

    routeTree = `
    path: '/'
    components: { foo: 'foo' }
    `;

    expect(() => {
      routeLoader(yamlLoader(routeTree));
    }).toThrow(/Components.*string or array/);
  });

  it('whose named routes should not have children', () => {
    let routeTree = `
    path: '/'
    components: 'foo'
    name: 'foo'
    children:
      - components: 'foo'
    `;

    expect(() => {
      routeLoader(yamlLoader(routeTree));
    }).toThrow(/Named route.*children/);
  });

  it('which should not have params\' names conflict', () => {
    let routeTree = `
    path: '/<foo:foo>'
    children:
      - path: '<foo:bar>'
    `;

    expect(() => {
      routeLoader(yamlLoader(routeTree));
    }).toThrow(/.*params conflict/);

    routeTree = `
    path: '/<foo:foo>'
    children:
      - path: '<bar:bar>'
      - path: '<bar:bar>'
    `;

    expect(() => {
      routeLoader(yamlLoader(routeTree));
    }).toNotThrow();
  });
});
