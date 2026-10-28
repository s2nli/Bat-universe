/* Local replacement for the Lovable Cloud (Supabase) backend.
   Answers the site's REST/RPC calls from the JSON files in /api_dump. */
(function () {
  var TOKEN_ENABLED = false; // false = token gate off (verify needs the original backend)
  var GET_KEY_URL = 'https://arolinks.com/zvEmU';
  var cache = {};
  var realFetch = window.fetch.bind(window);

  function load(name) {
    if (!cache[name]) {
      cache[name] = realFetch('/api_dump/' + name + '.json').then(function (r) { return r.json(); }).catch(function () { return []; });
    }
    return cache[name];
  }
  function json(body, status, extra) {
    var h = { 'content-type': 'application/json' };
    for (var k in (extra || {})) h[k] = extra[k];
    return new Response(JSON.stringify(body), { status: status || 200, headers: h });
  }
  function applyQuery(rows, params) {
    params.forEach(function (val, key) {
      if (['select', 'order', 'limit', 'offset', 'columns'].indexOf(key) > -1) return;
      var m = /^eq\.(.*)$/.exec(val);
      if (m) rows = rows.filter(function (r) { return String(r[key]) === m[1]; });
    });
    var order = params.get('order');
    if (order) {
      var p = order.split('.'), f = p[0], desc = p[1] === 'desc';
      rows = rows.slice().sort(function (a, b) {
        return (a[f] > b[f] ? 1 : a[f] < b[f] ? -1 : 0) * (desc ? -1 : 1);
      });
    }
    var lim = parseInt(params.get('limit'), 10);
    if (lim > 0) rows = rows.slice(0, lim);
    return rows;
  }

  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf('lovable.cloud') === -1) return realFetch(input, init);
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var headers = new Headers((init && init.headers) || (input && input.headers) || {});
    var u = new URL(url);
    var path = u.pathname;

    if (path.indexOf('/rest/v1/rpc/') === 0) {
      var fn = path.slice('/rest/v1/rpc/'.length);
      if (fn === 'site_settings_public') return Promise.resolve(json([{ get_key_url: GET_KEY_URL, token_enabled: TOKEN_ENABLED }]));
      if (fn === 'device_is_verified') return Promise.resolve(json({ verified: false, expires_at: null }));
      if (fn === 'assign_app_link') return Promise.resolve(json(Math.floor(Math.random() * 4) + 1));
      return Promise.resolve(json({ message: 'Not available offline' }, 400));
    }
    if (path.indexOf('/rest/v1/') === 0) {
      var table = path.slice('/rest/v1/'.length);
      if (method !== 'GET' && method !== 'HEAD') return Promise.resolve(json({ message: 'Read-only copy' }, 401));
      return load(table).then(function (all) {
        var rows = applyQuery(all, u.searchParams);
        if ((headers.get('accept') || '').indexOf('vnd.pgrst.object') > -1) {
          if (rows.length === 1) return json(rows[0]);
          return json({ code: 'PGRST116', details: 'The result contains ' + rows.length + ' rows', hint: null, message: 'Cannot coerce the result to a single JSON object' }, 406);
        }
        return json(rows, 200, { 'content-range': '0-' + Math.max(rows.length - 1, 0) + '/' + rows.length });
      });
    }
    return Promise.resolve(json({ message: 'Not available offline' }, 400));
  };
})();
