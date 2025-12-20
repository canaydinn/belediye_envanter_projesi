// A tiny, configurable Knex mock that supports the subset of the query builder
// used in this project (controllers + middleware). It is intentionally simple
// and designed for unit tests where DB is fully mocked.

function createQueue() {
  return {
    items: [],
    push(v) {
      this.items.push(v);
    },
    shift(defaultValue) {
      return this.items.length ? this.items.shift() : defaultValue;
    },
  };
}

function createMockKnex() {
  const queues = new Map();

  const getKey = (table, op) => `${table}::${op}`;
  const getQueue = (table, op) => {
    const key = getKey(table, op);
    if (!queues.has(key)) queues.set(key, createQueue());
    return queues.get(key);
  };

  const makeBuilder = (table) => {
    const state = { table };

    const builder = {
      _state: state,

      // chaining (no-ops for our tests)
      where() { return this; },
      andWhere() { return this; },
      andWhereNot() { return this; },
      leftJoin() { return this; },
      innerJoin() { return this; },
      orderBy() { return this; },
      groupBy() { return this; },
      limit() { return this; },
      select() { return this; },
      count() { return this; },
      countDistinct() { return this; },
      havingRaw() { return this; },

      // terminal-ish helpers
      first() {
        const q = getQueue(table, 'first');
        return Promise.resolve(q.shift(null));
      },

      del() {
        const q = getQueue(table, 'del');
        return Promise.resolve(q.shift(0));
      },

      insert(payload) {
        // Keep last insert payload for assertions if needed
        state.lastInsert = payload;
        return {
          returning: () => {
            const q = getQueue(table, 'insert:returning');
            return Promise.resolve(q.shift([]));
          },
        };
      },

      update(payload) {
        state.lastUpdate = payload;
        return {
          returning: () => {
            const q = getQueue(table, 'update:returning');
            return Promise.resolve(q.shift([]));
          },
        };
      },

      // Make the builder awaitable: `await knex('table').select(...)`
      then(resolve, reject) {
        try {
          const q = getQueue(table, 'result');
          return Promise.resolve(q.shift([])).then(resolve, reject);
        } catch (e) {
          return Promise.reject(e).then(resolve, reject);
        }
      },
    };

    return builder;
  };

  function knex(table) {
    return makeBuilder(String(table));
  }

  // Minimal knex extras used by controllers
  knex.fn = {
    now: () => new Date('2025-01-01T00:00:00.000Z'),
  };

  knex.raw = (sql) => ({ __raw: sql });

  knex.transaction = async (cb) => {
    // Provide a trx which is basically another knex instance sharing queues.
    const trx = (table) => makeBuilder(String(table));
    trx.fn = knex.fn;
    trx.raw = knex.raw;
    return cb(trx);
  };

  // Test control surface
  knex.__queue = (table, op, values) => {
    const q = getQueue(String(table), String(op));
    values.forEach((v) => q.push(v));
  };

  return knex;
}

module.exports = { createMockKnex };
