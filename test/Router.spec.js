import React from 'react';
import { render } from 'react-dom';
import Router from '../src/Router';
import routes from './routes/match_function';

describe('Router', () => {
  it('renders land page', function() {
    // hack current state in history
    history.replaceState(null, null, '/?foo=bar');

    render(
      <Router routes={routes} />,
      document.getElementById('app')
    );
  });
});
