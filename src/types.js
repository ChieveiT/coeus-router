import { PropTypes } from 'react';

export let routesShape = PropTypes.shape({
  match: PropTypes.func.isRequired,
  link: PropTypes.func.isRequired
});
