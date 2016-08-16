import expect from 'expect';
import foo from './stub/foo';
import bar from './stub/bar';

describe('Routes generated from Routes Loader', () => {
  it('exports match function to match routes', () => {
    let routes = require('./routes/match_function');

    return Promise.all([
      routes.match('/').then(function({ components, args }) {
        expect(components).toEqual([
          [ foo ],
          [ foo, bar ]
        ]);

        expect(args).toEqual({ });
      }),
      routes.match('/foo').then(function({ components, args }) {
        expect(components).toEqual([
          [ foo ]
        ]);

        expect(args).toEqual({ });
      }),
      routes.match('/foo123abc_bar').then(function({
        components, args
      }) {
        expect(components).toEqual([
          [ foo ],
          [ bar ]
        ]);

        expect(args).toEqual({ bar: '123', foo: 'abc_' });
      }),
      routes.match('/foo123bar').then(function({
        components, args
      }) {
        expect(components).toEqual([
          [ foo ],
          [ bar ]
        ]);

        expect(args).toEqual({ bar: '123' });
      }),
      routes.match('/foobar').then(function(r) {
        expect(r).toEqual(false);
      })
    ]);
  });

  it('exports check function to check routes', () => {
    let routes = require('./routes/match_function');

    expect(routes.check('/')).toEqual(true);
    expect(routes.check('/foo')).toEqual(true);
    expect(routes.check('/foo123abc_bar')).toEqual(true);
    expect(routes.check('/foo123bar')).toEqual(true);
    expect(routes.check('/foobar')).toEqual(false);
    expect(routes.check('/not_found')).toEqual(false);
  });

  it('exports link function to return a named route\'s path', () => {
    let routes = require('./routes/link_function');

    expect(routes.link('foo', { bar: 1, foo: 'abc' })).toEqual(
      '/foo1/bar.fooabc_tail_'
    );

    expect(routes.link('foo', { foo: 'abc' })).toEqual(
      '/foo/bar.fooabc_tail_'
    );

    expect(() => {
      routes.link('name');
    }).toThrow(/Unknown name.*/);

    expect(() => {
      routes.link('foo', { arg: 666 });
    }).toThrow(/Unknown argument.*/);

    expect(() => {
      routes.link('foo');
    }).toThrow(/Argument.*required/);

    expect(() => {
      routes.link('foo', { foo: 233 });
    }).toThrow(/Argument.*illegal/);
  });
});
