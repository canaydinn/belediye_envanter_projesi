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

  // Extract base table name from "table as alias" or "table"
  const getBaseTable = (table) => {
    const str = String(table);
    const match = str.match(/^(\w+)(?:\s+as\s+\w+)?/i);
    return match ? match[1] : str;
  };

  const getKey = (table, op) => `${getBaseTable(table)}::${op}`;
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
      where(...args) {
        // Support callback: where(function() { this.where(...).orWhere(...) })
        if (typeof args[0] === 'function') {
          const cb = args[0];
          const context = {
            where: function() { return this; },
            orWhere: function() { return this; },
            andOn: function() { return this; },
            on: function() { return this; },
          };
          cb.call(context);
        }
        return this;
      },
      andWhere() { return this; },
      andWhereNot() { return this; },
      whereNot() { return this; },
      whereNull() { return this; },
      whereNotNull() { return this; },
      orWhere() { return this; },
      whereRaw() { return this; },
      orWhereRaw() { return this; },
      whereILike() { return this; },
      orWhereILike() { return this; },
      ilike() { return this; },
      modify(callback) {
        if (typeof callback === 'function') {
          const context = {
            andWhere: () => this,
            where: () => this,
            orWhere: () => this,
          };
          callback.call(context, this);
        }
        return this;
      },
      join() { return this; },
      leftJoin(table, ...args) {
        // Support callback: leftJoin('table', function() { this.on(...).andOn(...) })
        if (args.length > 0 && typeof args[0] === 'function') {
          const cb = args[0];
          const context = {
            on: function() { return this; },
            andOn: function() { return this; },
          };
          cb.call(context);
        }
        return this;
      },
      innerJoin() { return this; },
      orderBy() { return this; },
      groupBy() { return this; },
      limit() { return this; },
      offset() { return this; },
      select() { return this; },
      count() { return this; },
      countDistinct() { return this; },
      havingRaw() { return this; },
      clearSelect() { return this; },
      clearOrder() { return this; },
      clone() { return this; }, // Clone returns same builder (shares state for mocking)

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

      update(payload, returningColumns) {
        state.lastUpdate = payload;
        // If returningColumns is provided, return a Promise directly (Knex behavior)
        if (returningColumns) {
          const q = getQueue(table, 'update:returning');
          const result = q.shift([]);
          return Promise.resolve(result);
        }
        // Otherwise return the number of affected rows (for remove function)
        const q = getQueue(table, 'update');
        const affected = q.shift(0);
        return Promise.resolve(affected);
      },

      // Make the builder awaitable: `await knex('table').select(...)`
      then(resolve, reject) {
        try {
          const q = getQueue(table, 'result');
          const value = q.shift([]);
          // If value is a Promise, return it directly; otherwise wrap it
          if (value && typeof value.then === 'function') {
            return value.then(resolve, reject);
          }
          return Promise.resolve(value).then(resolve, reject);
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
    trx.commit = async () => {};
    trx.rollback = async () => {};
    
    if (typeof cb === 'function') {
      return cb(trx);
    }
    // If called without callback (await knex.transaction()), return transaction object
    return Promise.resolve(trx);
  };

  // Test control surface
  knex.__queue = (table, op, values) => {
    const q = getQueue(String(table), String(op));
    values.forEach((v) => q.push(v));
  };

  return knex;
}

module.exports = { createMockKnex };

