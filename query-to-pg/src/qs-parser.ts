import qs from 'qs';

export const parseQueryString = (querystring: string): Record<string, any> => {
  const parsed = qs.parse(querystring, {
    decoder(str, defaultDecoder, charset, type) {
      if (type === 'value') {
        if (str === '') return '';

        if (str === 'true') return true;
        if (str === 'false') return false;

        if (str === 'null') return null;

        if (str === 'undefined') return undefined;

        if (/^[+-]?\d+(\.\d+)?$/.test(str) && Number.isFinite(Number(str))) return Number(str);

        return str;
      }

      return defaultDecoder(str, charset);
    }
  });

  return parsed;
};
