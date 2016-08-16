import expect from 'expect';
import routerReducer from '../../src/reducers/router';
import routes from '../routes/match_function';
import foo from '../stub/foo';
import bar from '../stub/bar';

describe('Reducers', () => {
  describe('router', () => {
    beforeEach(function() {
      this.reducer = routerReducer(routes);
    });

    it('throws error if the land page is 404', function() {
      // hack current state in history
      history.replaceState(null, null, '/foobar');

      return Promise.resolve().then(() => {
        return this.reducer();
      }).catch((e) => {
        expect(() => {throw e;}).toThrow(/404/);
      });
    });

    it('initializes state', function() {
      // hack current state in history
      history.replaceState(null, null, '/?foo=bar');

      return Promise.resolve().then(() => {
        return this.reducer();
      }).then((result) => {
        expect(result).toEqual({
          components: [
            [ foo ],
            [ foo, bar ]
          ],
          args: {},
          search: { foo: 'bar' }
        });
      });
    });

    it('preforms a ROUTE action', function() {
      let state = null;

      return Promise.resolve().then(() => {
        return this.reducer({}, {
          type: 'ROUTE',
          path: '/foo123abc_bar',
          search: {
            bar: 'foo'
          }
        });
      }).then((result) => {
        state = result;

        expect(result).toEqual({
          components: [
            [ foo ],
            [ bar ]
          ],
          args: { bar: '123', foo: 'abc_' },
          search: { bar: 'foo' }
        });

        return this.reducer(state, {
          type: 'ROUTE',
          path: '/foobar'
        });
      }).then((result) => {
        expect(result.components).toBe(state.components);
        expect(result.args).toBe(state.args);
        expect(result.search).toBe(state.search);
        expect(result.notFound).toEqual('/foobar');
      });
    });

    it('preforms a ROUTE_BACK action', function() {
      // hack current state in history
      history.replaceState(null, null, '/');

      return Promise.resolve().then(() => {
        return this.reducer({}, {
          type: 'ROUTE',
          path: '/foo123bar',
          search: {
            foo: 'bar'
          }
        });
      }).then(() => {
        return this.reducer({}, {
          type: 'ROUTE_BACK'
        });
      }).then((result) => {
        expect(result).toEqual({
          components: [
            [ foo ],
            [ foo, bar ]
          ],
          args: {},
          search: {}
        });
      });
    });

    it('preforms a ROUTE_FORWARD action', function() {
      // hack current state in history
      history.replaceState(null, null, '/?foo=bar');

      return Promise.resolve().then(() => {
        return this.reducer({}, {
          type: 'ROUTE',
          path: '/foo123bar',
          search: {
            foo: 'bar'
          }
        });
      }).then(() => {
        return this.reducer({}, {
          type: 'ROUTE_BACK'
        });
      }).then(() => {
        return this.reducer({}, {
          type: 'ROUTE_FORWARD'
        });
      }).then((result) => {
        expect(result).toEqual({
          components: [
            [ foo ],
            [ bar ]
          ],
          args: { bar: '123' },
          search: { foo: 'bar' }
        });
      });
    });

    it('preserves the state for unknown action', function() {
      let state = {
        components: [
          [ foo ],
          [ bar ]
        ],
        args: { bar: '123' },
        search: { foo: 'bar' }
      };

      return Promise.resolve().then(() => {
        return this.reducer(state, {
          type: 'UNKNOWN'
        });
      }).then((result) => {
        expect(result).toBe(state);
      });
    });
  });
});
