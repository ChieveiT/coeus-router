import expect from 'expect';
import foo from './stub/foo';
import bar from './stub/bar';

describe('Routes generated from Routes Loader', () => {
  it('exports match function to match routes', () => {
    let routes = require('./routes/match_function');

    return Promise.all([
      routes.match('/').then(function({ components, args, name }) {
        expect(components).toEqual([
          [ foo ],
          [ foo, bar ],
          [ bar ]
        ]);

        expect(args).toEqual({ });

        expect(name).toEqual('default');
      }),
      routes.match('/default_child_one').then(function({
        components, args, name
      }) {
        expect(components).toEqual([
          [ foo ],
          [ foo, bar ],
          [ foo ]
        ]);

        expect(args).toEqual({ });

        expect(name).toEqual('default1');
      }),
      routes.match('/default_child_two').then(function({
        components, args, name
      }) {
        expect(components).toEqual([
          [ foo ],
          [ foo, bar ],
          [ bar ]
        ]);

        expect(args).toEqual({ });

        expect(name).toEqual('default2');
      }),
      routes.match('/foo').then(function({ components, args, name }) {
        expect(components).toEqual([
          [ foo ]
        ]);

        expect(args).toEqual({ });

        expect(name).toEqual(undefined);
      }),
      routes.match('/foo123abc_bar').then(function({
        components, args, name
      }) {
        expect(components).toEqual([
          [ foo ],
          [ bar ]
        ]);

        expect(args).toEqual({ bar: '123', foo: 'abc_' });

        expect(name).toEqual(undefined);
      }),
      routes.match('/foo123bar?banana%26=123%3D321').then(function({
        components, args, name
      }) {
        expect(components).toEqual([
          [ foo ],
          [ bar ]
        ]);

        expect(args).toEqual({ bar: '123', 'banana&': '123=321' });

        expect(name).toEqual(undefined);
      }),
      routes.match('/foobar').then(function(r) {
        expect(r).toEqual(false);
      })
    ]);
  });

  it('exports check function to check routes', () => {
    let routes = require('./routes/match_function');

    expect(routes.check('/')).toEqual(true);
    expect(routes.check('/default_child_one')).toEqual(true);
    expect(routes.check('/default_child_two')).toEqual(true);
    expect(routes.check('/foo')).toEqual(true);
    expect(routes.check('/foo123abc_bar')).toEqual(true);
    expect(routes.check('/foo123bar')).toEqual(true);
    expect(routes.check('/foobar')).toEqual(false);
    expect(routes.check('/not_found')).toEqual(false);
  });

  it('exports linkByName function to return a named route\'s link', () => {
    let routes = require('./routes/link_function');

    expect(routes.linkByName('foo', { bar: 1, foo: 'abc' })).toEqual(
      '/foo1/bar.fooabc_tail_'
    );

    expect(routes.linkByName('foo', {
      foo: 'abc', 'banana&': '123=321'
    })).toEqual(
      '/foo/bar.fooabc_tail_?banana%26=123%3D321'
    );

    expect(() => {
      routes.linkByName('name');
    }).toThrow(/Unknown name.*/);

    expect(() => {
      routes.linkByName('foo');
    }).toThrow(/Argument.*required/);

    expect(() => {
      routes.linkByName('foo', { foo: 233 });
    }).toThrow(/Argument.*illegal/);
  });

  it('exports linkByPath function to return a path\'s link', () => {
    let routes = require('./routes/link_function');

    expect(routes.linkByPath('/foo/bar', { bar: 1, foo: 'abc' })).toEqual(
      '/foo/bar?bar=1&foo=abc'
    );

    expect(routes.linkByPath('/foo/bar', { 'banana&': '123=321' })).toEqual(
      '/foo/bar?banana%26=123%3D321'
    );
  });
});
