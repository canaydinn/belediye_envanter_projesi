function createRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
    set(header, value) {
      this.headers[header] = value;
      return this;
    },
  };
  return res;
}

function createReq(overrides = {}) {
  return {
    headers: {},
    cookies: {},
    params: {},
    query: {},
    body: {},
    originalUrl: '/test',
    user: undefined,
    tenantMunicipalityId: undefined,
    ...overrides,
  };
}

function createNext() {
  const next = (...args) => {
    next.called = true;
    next.args = args;
  };
  next.called = false;
  next.args = [];
  return next;
}

module.exports = { createReq, createRes, createNext };
