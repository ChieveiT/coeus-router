import { PropTypes } from 'react';

export let routesShape = PropTypes.shape({
  match: PropTypes.func.isRequired,
  linkByName: PropTypes.func.isRequired,
  linkByPath: PropTypes.func.isRequired
});
