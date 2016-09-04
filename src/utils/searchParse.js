import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import fromPairs from 'lodash/fromPairs';

export default function searchParse(str) {
  if (isEmpty(str)) {
    return { };
  }

  str = str.substr(1);
  return fromPairs(
    map(str.split('&'), (e) => {
      let [ key, value ] = e.split('=');
      return [
        decodeURIComponent(key),
        decodeURIComponent(value)
      ];
    })
  );
}
