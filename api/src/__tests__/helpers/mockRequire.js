// Simple CommonJS module mocking helper for Node's built-in test runner.
// Usage:
//   const { withMockedModules } = require('./mockRequire');
//   await withMockedModules({
//     'jsonwebtoken': { verify: () => ({ id: 1 }) },
//     '../config/knex': mockKnex,
//   }, () => {
//     const auth = require('../../middleware/auth');
//     ...
//   })

async function withMockedModules(mocks, fn) {
  const entries = [];
  for (const [id, exports] of Object.entries(mocks)) {
    const resolved = id.startsWith('/') ? id : require.resolve(id, { paths: [process.cwd()] });
    entries.push({ resolved, had: Boolean(require.cache[resolved]), prev: require.cache[resolved] });
    require.cache[resolved] = {
      id: resolved,
      filename: resolved,
      loaded: true,
      exports,
    };
  }

  try {
    return await fn();
  } finally {
    // Cleanup: restore previous cache entries
    for (const e of entries.reverse()) {
      if (e.had) require.cache[e.resolved] = e.prev;
      else delete require.cache[e.resolved];
    }
  }
}

module.exports = { withMockedModules };

