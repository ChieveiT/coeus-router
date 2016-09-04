import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';

export default function searchStringify(obj) {
  if (isEmpty(obj)) {
    return '';
  }

  return '?' + map(obj, (v, k) => {
    return [
      encodeURIComponent(k),
      encodeURIComponent(v)
    ].join('=');
  }).join('&');
}
