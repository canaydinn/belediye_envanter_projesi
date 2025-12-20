function createRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    cookies: {},
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
    setHeader(header, value) {
      this.headers[header] = value;
      return this;
    },
    cookie(name, value, options) {
      this.cookies[name] = { value, options };
      return this;
    },
    clearCookie(name, options) {
      this.cookies[name] = { value: undefined, options };
      return this;
    },
  };
  return res;
}

function createReq(overrides = {}) {
  const req = {
    headers: {},
    cookies: {},
    params: {},
    query: {},
    body: {},
    originalUrl: '/test',
    user: undefined,
    tenantMunicipalityId: undefined,
    ip: '127.0.0.1',
    get(header) {
      return this.headers[header.toLowerCase()] || null;
    },
    ...overrides,
  };
  // If get is provided in overrides, use it; otherwise use default
  if (overrides.get) {
    req.get = overrides.get;
  }
  return req;
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

