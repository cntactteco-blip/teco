var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/utils/body.js
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match3, index) => {
    const mark = `@${index}`;
    groups.push([mark, match3]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match3 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match3) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match3[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match3[1], new RegExp(`^${match3[2]}(?=/${next})`)] : [label, match3[1], new RegExp(`^${match3[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match3[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match3) => {
      try {
        return decoder(match3);
      } catch {
        return match3;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match22 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match22;
  return match22(method, path);
}
__name(match, "match");

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes2) {
  const trie = new Trie();
  const handlerData = [];
  if (routes2.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes2.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes2 = this.#routes;
    if (!middleware || !routes2) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes2].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes2).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes2[m]).forEach(
            (p) => re.test(p) && routes2[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes2).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes2[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes2[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes2 = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes2.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes2.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes2);
    }
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes2 = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes2.length; i2 < len2; i2++) {
          router.add(...routes2[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../../node_modules/.pnpm/hono@4.12.31/node_modules/hono/dist/adapter/cloudflare-pages/handler.js
var handle = /* @__PURE__ */ __name((app2) => (eventContext) => {
  return app2.fetch(
    eventContext.request,
    { ...eventContext.env, eventContext },
    {
      waitUntil: eventContext.waitUntil,
      passThroughOnException: eventContext.passThroughOnException,
      props: {}
    }
  );
}, "handle");

// api/[[path]].ts
function chisinauDate(offsetDays = 0) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Chisinau" }).format(
    new Date(Date.now() + offsetDays * 864e5)
  );
}
__name(chisinauDate, "chisinauDate");
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(esc, "esc");
var COUNTRY_NAME = {
  MD: "Moldova",
  RO: "Rom\xE2nia",
  DE: "Germania",
  IT: "Italia",
  FR: "Fran\u021Ba",
  GB: "Marea Britanie",
  US: "SUA",
  UA: "Ucraina",
  RU: "Rusia",
  IL: "Israel",
  ES: "Spania",
  PT: "Portugalia",
  NL: "Olanda",
  BE: "Belgia",
  AT: "Austria",
  CH: "Elve\u021Bia",
  CA: "Canada",
  AU: "Australia",
  PL: "Polonia",
  CZ: "Cehia",
  SK: "Slovacia",
  HU: "Ungaria",
  BG: "Bulgaria",
  GR: "Grecia",
  TR: "Turcia",
  AE: "Emirates",
  GB: "UK"
};
function flagFromCode(code) {
  if (!code || code.length !== 2) return "\u{1F30D}";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 127462 + c.charCodeAt(0) - 65)
  );
}
__name(flagFromCode, "flagFromCode");
function flag(countryOrCode) {
  if (!countryOrCode) return "\u{1F30D}";
  if (countryOrCode.length === 2) return flagFromCode(countryOrCode);
  const code = Object.entries(COUNTRY_NAME).find(([, n]) => n === countryOrCode)?.[0];
  if (code) return flagFromCode(code);
  return "\u{1F30D}";
}
__name(flag, "flag");
function countryDisplay(countryOrCode) {
  if (!countryOrCode) return "";
  if (countryOrCode.length === 2) return COUNTRY_NAME[countryOrCode.toUpperCase()] || countryOrCode;
  return countryOrCode;
}
__name(countryDisplay, "countryDisplay");
function formatSource(referrer, utmSource, utmMedium) {
  if (utmSource) return `${utmSource}${utmMedium ? ` (${utmMedium})` : ""}`;
  if (!referrer) return "Direct / Bookmark";
  try {
    const host = new URL(referrer).hostname;
    if (host.includes("google")) return "Google";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtube")) return "YouTube";
    return host;
  } catch {
    return "Direct";
  }
}
__name(formatSource, "formatSource");
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("ro-MD", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Chisinau"
  });
}
__name(formatTime, "formatTime");
function formatDur(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
__name(formatDur, "formatDur");
function cfGeo(req) {
  const cf = req.cf ?? {};
  const code = cf.country ?? "";
  const city = cf.city ?? "";
  const isp = cf.asOrganization ?? "";
  return { country: code, city, isp, countryName: countryDisplay(code) };
}
__name(cfGeo, "cfGeo");
function mergeGeo(session, geo) {
  return {
    ...session,
    country: geo.countryName || session.country || "",
    city: geo.city || session.city || "",
    isp: geo.isp || session.isp || ""
  };
}
__name(mergeGeo, "mergeGeo");
async function checkRateLimit(db, key, date, type, limit) {
  try {
    const result = await db.prepare(
      `INSERT INTO ip_rate_limits (ip, date, type, count) VALUES (?, ?, ?, 1)
         ON CONFLICT(ip, date, type) DO UPDATE SET count = count + 1
         RETURNING count`
    ).bind(key, date, type).first();
    return (result?.count ?? 1) <= limit;
  } catch {
    return true;
  }
}
__name(checkRateLimit, "checkRateLimit");
async function sendTelegram(env, text) {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4096),
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
    const data = await res.json();
    if (!data.ok) console.error("Telegram:", data.description);
  } catch (err) {
    console.error("Telegram send failed:", err);
  }
}
__name(sendTelegram, "sendTelegram");
async function notifyVisitor(env, session) {
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const dev = session.deviceType === "mobile" ? "\u{1F4F1} Mobil" : session.deviceType === "tablet" ? "\u{1F4CA} Tablet\u0103" : "\u{1F4BB} Desktop";
  const page = session.pages?.[0]?.path || "/";
  const time = formatTime(session.startedAt || Date.now());
  await sendTelegram(env, [
    `\u{1F514} <b>Vizitator Nou pe Teco.md</b>`,
    ``,
    `\u{1F550} ${time}  ${flag(session.country || "")} <b>${esc(loc || "Loca\u021Bie necunoscut\u0103")}</b>`,
    `\u{1F310} Surs\u0103: <b>${esc(src)}</b>`,
    `\u{1F4C4} Pagin\u0103: <code>${esc(page)}</code>`,
    `${dev}  |  ${esc(session.browser || "Browser")}`,
    session.isp ? `\u{1F50C} ${esc(session.isp)}` : ""
  ].filter(Boolean).join("\n"));
}
__name(notifyVisitor, "notifyVisitor");
async function notifyFirstMessage(env, payload) {
  const { message, page, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  await sendTelegram(env, [
    `\u{1F4AC} <b>TecoBot \u2014 Mesaj Nou</b>`,
    ``,
    `\u{1F550} ${formatTime(session.startedAt || Date.now())}  ${flag(session.country || "")} <b>${esc(loc || "Loca\u021Bie necunoscut\u0103")}</b>`,
    `\u{1F310} Surs\u0103: ${esc(src)}`,
    `\u{1F4C4} Pagina: <code>${esc(page)}</code>`,
    ``,
    `\u{1F464} <i>"${esc(message)}"</i>`
  ].join("\n"));
}
__name(notifyFirstMessage, "notifyFirstMessage");
async function notifyLeadChat(env, payload) {
  const { name, phone, messages, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const dur = formatDur(session.duration ?? 0);
  const dev = session.deviceType === "mobile" ? "\u{1F4F1}" : "\u{1F4BB}";
  const pagesText = (session.pages || []).map((p) => `\u2022 ${esc(p.path)}`).slice(0, 8).join("\n") || "\u2022 /";
  const transcript = messages.filter((m) => !m.content.includes("LEAD_CAPTURED")).slice(-20).map((m) => {
    const role = m.role === "user" ? "\u{1F464}" : "\u{1F916}";
    const text = m.content.replace(/LEAD_CAPTURED:[^\n]*/g, "").trim().slice(0, 300);
    return `${role} ${esc(text)}`;
  }).join("\n");
  await sendTelegram(env, [
    `\u{1F916} <b>Lead Nou \u2014 TecoBot AI</b>`,
    ``,
    `\u{1F464} <b>${esc(name)}</b>  |  \u{1F4DE} <code>${esc(phone)}</code>`,
    ``,
    `\u{1F550} ${formatTime(session.startedAt || Date.now())}  ${flag(session.country || "")} ${esc(loc || "?")}  ${dev}`,
    `\u{1F310} Surs\u0103: ${esc(src)}  |  \u23F1 ${dur} pe site`,
    ``,
    `\u{1F4C4} <b>Pagini vizitate:</b>`,
    pagesText,
    ``,
    `\u{1F4AC} <b>Conversa\u021Bie:</b>`,
    `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`,
    transcript,
    `\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`
  ].join("\n"));
}
__name(notifyLeadChat, "notifyLeadChat");
async function notifyLeadCalculator(env, payload) {
  const { name, phone, selections, equipmentCost, installCost, totalCost, session } = payload;
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const dur = formatDur(session.duration ?? 0);
  const pagesSummary = (session.pages || []).map((p) => p.path).slice(0, 5).join(" \u2192 ") || "/";
  await sendTelegram(env, [
    `\u{1F9EE} <b>Lead Nou \u2014 Calculator Cost</b>`,
    ``,
    `\u{1F464} <b>${esc(name || "Anonim")}</b>  |  \u{1F4DE} <code>${esc(phone)}</code>`,
    ``,
    `\u{1F550} ${formatTime(session.startedAt || Date.now())}  ${flag(session.country || "")} ${esc(loc || "?")}`,
    `\u{1F310} Surs\u0103: ${esc(src)}  |  \u23F1 ${dur} pe site`,
    ``,
    `\u{1F3AF} <b>Ce vrea clientul:</b>`,
    `\u2022 Obiectiv: ${esc(selections.objective || "\u2014")}`,
    `\u2022 Camere: ${esc(selections.cameras || "\u2014")}`,
    `\u2022 Stocare: ${esc(selections.storage || "\u2014")}`,
    `\u2022 Instalare: ${esc(selections.installation || "\u2014")}`,
    ``,
    `\u{1F4B0} <b>Estimare calculat\u0103:</b>`,
    `\u2022 Echipament: ~${equipmentCost.toLocaleString("ro-MD")} MDL`,
    `\u2022 Instalare: ~${installCost.toLocaleString("ro-MD")} MDL`,
    `\u2022 <b>Total: ~${totalCost.toLocaleString("ro-MD")} MDL</b>`,
    ``,
    `\u{1F4C4} Pagini: <i>${esc(pagesSummary)}</i>`
  ].join("\n"));
}
__name(notifyLeadCalculator, "notifyLeadCalculator");
var app = new Hono2().basePath("/api");
var notifiedSessions = /* @__PURE__ */ new Set();
var chatNotifyCounts = /* @__PURE__ */ new Map();
var CHAT_NOTIFY_LIMIT = 3;
var VISITOR_IP_DAILY_LIMIT = 1;
var LEAD_PHONE_DAILY_LIMIT = 1;
app.get("/settings", async (c) => {
  const row = await c.env.DB.prepare("SELECT data FROM settings WHERE id = 1").first();
  const data = row ? JSON.parse(row.data) : null;
  return c.json({ data });
});
app.post("/settings", async (c) => {
  const body = await c.req.json();
  await c.env.DB.prepare(
    `INSERT INTO settings (id, data) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data`
  ).bind(JSON.stringify(body)).run();
  return c.json({ ok: true });
});
app.get("/products", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM products ORDER BY id ASC").all();
  const data = results.map((r) => ({
    ...r,
    images: typeof r.images === "string" ? JSON.parse(r.images || "[]") : r.images ?? [],
    in_stock: r.in_stock === 1 || r.in_stock === true
  }));
  return c.json({ data });
});
app.post("/products", async (c) => {
  const body = await c.req.json();
  const items = Array.isArray(body) ? body : [body];
  const stmt = c.env.DB.prepare(
    `INSERT INTO products
       (id, name, model, brand, price, old_price, specs, badge, category, image_url,
        images, description, long_description, tech_specs, in_stock, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, model=excluded.model, brand=excluded.brand,
       price=excluded.price, old_price=excluded.old_price, specs=excluded.specs,
       badge=excluded.badge, category=excluded.category, image_url=excluded.image_url,
       images=excluded.images, description=excluded.description,
       long_description=excluded.long_description, tech_specs=excluded.tech_specs,
       in_stock=excluded.in_stock, icon=excluded.icon`
  );
  const stmts = items.map(
    (p) => stmt.bind(
      p.id,
      p.name ?? "",
      p.model ?? "",
      p.brand ?? "",
      p.price ?? 0,
      p.old_price ?? null,
      p.specs ?? "",
      p.badge ?? null,
      p.category ?? "",
      p.image_url ?? "",
      JSON.stringify(Array.isArray(p.images) ? p.images : []),
      p.description ?? "",
      p.long_description ?? null,
      p.tech_specs ?? null,
      p.in_stock === false || p.in_stock === 0 ? 0 : 1,
      p.icon ?? "camera"
    )
  );
  await c.env.DB.batch(stmts);
  return c.json({ ok: true });
});
app.put("/products/:id", async (c) => {
  const body = await c.req.json();
  const id = Number(c.req.param("id"));
  const p = { ...body, id };
  await c.env.DB.prepare(
    `INSERT INTO products
       (id, name, model, brand, price, old_price, specs, badge, category, image_url,
        images, description, long_description, tech_specs, in_stock, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, model=excluded.model, brand=excluded.brand,
       price=excluded.price, old_price=excluded.old_price, specs=excluded.specs,
       badge=excluded.badge, category=excluded.category, image_url=excluded.image_url,
       images=excluded.images, description=excluded.description,
       long_description=excluded.long_description, tech_specs=excluded.tech_specs,
       in_stock=excluded.in_stock, icon=excluded.icon`
  ).bind(
    p.id,
    p.name ?? "",
    p.model ?? "",
    p.brand ?? "",
    p.price ?? 0,
    p.old_price ?? null,
    p.specs ?? "",
    p.badge ?? null,
    p.category ?? "",
    p.image_url ?? "",
    JSON.stringify(Array.isArray(p.images) ? p.images : []),
    p.description ?? "",
    p.long_description ?? null,
    p.tech_specs ?? null,
    p.in_stock === false || p.in_stock === 0 ? 0 : 1,
    p.icon ?? "camera"
  ).run();
  return c.json({ ok: true });
});
app.delete("/products/:id", async (c) => {
  const id = Number(c.req.param("id"));
  await c.env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  return c.json({ ok: true });
});
app.get("/leads", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM leads ORDER BY timestamp DESC"
  ).all();
  const data = results.map((r) => ({
    ...r,
    selections: typeof r.selections === "string" ? JSON.parse(r.selections || "null") : r.selections
  }));
  return c.json({ data });
});
app.post("/leads", async (c) => {
  const lead = await c.req.json();
  if (!lead?.id) return c.json({ error: "Missing id" }, 400);
  await c.env.DB.prepare(
    `INSERT INTO leads (id, name, phone, message, source, timestamp, status, notes, selections)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, phone=excluded.phone, message=excluded.message,
       source=excluded.source, status=excluded.status, notes=excluded.notes,
       selections=excluded.selections`
  ).bind(
    lead.id,
    lead.name ?? "",
    lead.phone ?? "",
    lead.message ?? "",
    lead.source ?? "",
    lead.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
    lead.status ?? "new",
    lead.notes ?? null,
    lead.selections ? JSON.stringify(lead.selections) : null
  ).run();
  return c.json({ ok: true });
});
app.patch("/leads/:id/status", async (c) => {
  const { status } = await c.req.json();
  await c.env.DB.prepare("UPDATE leads SET status = ? WHERE id = ?").bind(status, c.req.param("id")).run();
  return c.json({ ok: true });
});
app.patch("/leads/:id/notes", async (c) => {
  const { notes } = await c.req.json();
  await c.env.DB.prepare("UPDATE leads SET notes = ? WHERE id = ?").bind(notes, c.req.param("id")).run();
  return c.json({ ok: true });
});
app.delete("/leads/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
app.get("/orders", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM orders ORDER BY timestamp DESC"
  ).all();
  const data = results.map((r) => ({
    ...r,
    customer: typeof r.customer === "string" ? JSON.parse(r.customer || "{}") : r.customer,
    items: typeof r.items === "string" ? JSON.parse(r.items || "[]") : r.items
  }));
  return c.json({ data });
});
app.post("/orders", async (c) => {
  const order = await c.req.json();
  if (!order?.id) return c.json({ error: "Missing id" }, 400);
  await c.env.DB.prepare(
    `INSERT INTO orders (id, customer, items, total, timestamp, status)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       customer=excluded.customer, items=excluded.items, total=excluded.total,
       status=excluded.status`
  ).bind(
    order.id,
    JSON.stringify(order.customer ?? {}),
    JSON.stringify(order.items ?? []),
    order.total ?? 0,
    order.timestamp ?? (/* @__PURE__ */ new Date()).toISOString(),
    order.status ?? "new"
  ).run();
  return c.json({ ok: true });
});
app.patch("/orders/:id/status", async (c) => {
  const { status } = await c.req.json();
  await c.env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, c.req.param("id")).run();
  return c.json({ ok: true });
});
app.delete("/orders/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
app.get("/blog-posts", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM blog_posts ORDER BY published_at DESC"
  ).all();
  return c.json({ data: results });
});
app.post("/blog-posts", async (c) => {
  const p = await c.req.json();
  if (!p?.id) return c.json({ error: "Missing id" }, 400);
  await c.env.DB.prepare(
    `INSERT INTO blog_posts
       (id, slug, title, title_ru, description, description_ru, content, content_ru,
        image_url, category, category_ru, published_at, updated_at, author,
        meta_title, meta_title_ru, meta_description, meta_description_ru,
        keywords, keywords_ru, published, reading_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug=excluded.slug, title=excluded.title, title_ru=excluded.title_ru,
       description=excluded.description, description_ru=excluded.description_ru,
       content=excluded.content, content_ru=excluded.content_ru,
       image_url=excluded.image_url, category=excluded.category, category_ru=excluded.category_ru,
       published_at=excluded.published_at, updated_at=excluded.updated_at, author=excluded.author,
       meta_title=excluded.meta_title, meta_title_ru=excluded.meta_title_ru,
       meta_description=excluded.meta_description, meta_description_ru=excluded.meta_description_ru,
       keywords=excluded.keywords, keywords_ru=excluded.keywords_ru,
       published=excluded.published, reading_time=excluded.reading_time`
  ).bind(
    p.id,
    p.slug ?? "",
    p.title ?? "",
    p.title_ru ?? null,
    p.description ?? "",
    p.description_ru ?? null,
    p.content ?? "",
    p.content_ru ?? null,
    p.image_url ?? null,
    p.category ?? null,
    p.category_ru ?? null,
    p.published_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    p.updated_at ?? (/* @__PURE__ */ new Date()).toISOString(),
    p.author ?? null,
    p.meta_title ?? null,
    p.meta_title_ru ?? null,
    p.meta_description ?? null,
    p.meta_description_ru ?? null,
    p.keywords ?? null,
    p.keywords_ru ?? null,
    p.published === false ? 0 : 1,
    p.reading_time ?? null
  ).run();
  return c.json({ ok: true });
});
app.delete("/blog-posts/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM blog_posts WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ ok: true });
});
app.post("/sessions", async (c) => {
  const s = await c.req.json();
  if (!s?.session_id && !s?.sessionId) return c.json({ ok: true });
  const sid = s.session_id ?? s.sessionId;
  const today = chisinauDate();
  await c.env.DB.prepare(
    `INSERT INTO sessions (session_id, date, referrer, utm_source, utm_medium, country, device_type, pages, is_lead, lead_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET
       pages=excluded.pages, is_lead=excluded.is_lead, lead_type=excluded.lead_type`
  ).bind(
    sid,
    today,
    s.referrer ?? null,
    s.utm_source ?? s.utmSource ?? null,
    s.utm_medium ?? s.utmMedium ?? null,
    s.country ?? null,
    s.device_type ?? s.deviceType ?? null,
    JSON.stringify(s.pages ?? []),
    s.is_lead ?? s.isLead ? 1 : 0,
    s.lead_type ?? s.leadType ?? null
  ).run();
  return c.json({ ok: true });
});
app.post("/sales", async (c) => {
  const s = await c.req.json();
  const today = chisinauDate();
  await c.env.DB.prepare(
    "INSERT INTO sales (date, amount_mdl, description, session_id) VALUES (?, ?, ?, ?)"
  ).bind(today, s.amount_mdl ?? 0, s.description ?? "", s.session_id ?? null).run();
  return c.json({ ok: true });
});
app.get("/stats/:date", async (c) => {
  const date = c.req.param("date");
  const [visitors, leads, sales] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ?").bind(date).first(),
    c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ? AND is_lead = 1").bind(date).first(),
    c.env.DB.prepare("SELECT COUNT(*) as cnt, SUM(amount_mdl) as total FROM sales WHERE date = ?").bind(date).first()
  ]);
  return c.json({
    visitors: visitors?.cnt ?? 0,
    leads: leads?.cnt ?? 0,
    sales: sales?.cnt ?? 0,
    salesTotalMdl: sales?.total ?? 0
  });
});
app.post("/notify/visitor", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const session = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
  const sessionId = session.sessionId;
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
  const today = chisinauDate();
  if (sessionId && notifiedSessions.has(sessionId)) {
    return c.json({ ok: true, skipped: "already notified" });
  }
  const allowed = await checkRateLimit(c.env.DB, ip, today, "visitor", VISITOR_IP_DAILY_LIMIT);
  if (!allowed) return c.json({ ok: false, skipped: "rate limited" }, 429);
  if (sessionId) notifiedSessions.add(sessionId);
  if (notifiedSessions.size > 1e4) notifiedSessions.clear();
  await notifyVisitor(c.env, session);
  return c.json({ ok: true });
});
app.post("/notify/first-message", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const session = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
  const sessionId = session.sessionId;
  const count = chatNotifyCounts.get(sessionId ?? "") ?? 0;
  if (count >= CHAT_NOTIFY_LIMIT) return c.json({ ok: true, skipped: "limit reached" });
  chatNotifyCounts.set(sessionId ?? "", count + 1);
  await notifyFirstMessage(c.env, {
    message: body.message ?? "",
    page: body.page ?? "/",
    session
  });
  return c.json({ ok: true });
});
app.post("/notify/lead-chat", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");
  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }
  await notifyLeadChat(c.env, {
    name: body.name ?? "",
    phone,
    messages: body.messages ?? [],
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw))
  });
  return c.json({ ok: true });
});
app.post("/notify/lead-calculator", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");
  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }
  await notifyLeadCalculator(c.env, {
    name: body.name ?? "",
    phone,
    selections: body.selections ?? {},
    equipmentCost: body.equipmentCost ?? 0,
    installCost: body.installCost ?? 0,
    totalCost: body.totalCost ?? 0,
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw))
  });
  return c.json({ ok: true });
});
app.post("/notify/chat-notify", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const session = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
  const sessionId = session.sessionId;
  const count = chatNotifyCounts.get(sessionId ?? "") ?? 0;
  if (count >= CHAT_NOTIFY_LIMIT) return c.json({ ok: true, skipped: "limit reached" });
  chatNotifyCounts.set(sessionId ?? "", count + 1);
  if (chatNotifyCounts.size > 1e4) chatNotifyCounts.clear();
  await notifyFirstMessage(c.env, {
    message: body.message ?? "",
    page: body.page ?? "/",
    session
  });
  return c.json({ ok: true });
});
app.post("/notify/chat-lead", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");
  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }
  await notifyLeadChat(c.env, {
    name: body.name ?? "",
    phone,
    messages: body.messages ?? [],
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw))
  });
  return c.json({ ok: true });
});
app.post("/notify/calculator", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const phone = body.phone ?? "";
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");
  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }
  await notifyLeadCalculator(c.env, {
    name: body.name ?? "",
    phone,
    selections: body.selections ?? {},
    equipmentCost: body.equipmentCost ?? 0,
    installCost: body.installCost ?? 0,
    totalCost: body.totalCost ?? 0,
    session: mergeGeo(body.session ?? {}, cfGeo(c.req.raw))
  });
  return c.json({ ok: true });
});
app.post("/notify/lead", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const { name = "", phone = "", source = "", notes = "" } = body;
  const session = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
  const today = chisinauDate();
  const normalized = phone.replace(/\D/g, "");
  if (normalized) {
    const allowed = await checkRateLimit(c.env.DB, normalized, today, "lead-notify", LEAD_PHONE_DAILY_LIMIT);
    if (!allowed) return c.json({ ok: true, skipped: "phone already notified today" });
  }
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const src = formatSource(session.referrer || "", session.utmSource || "", session.utmMedium || "");
  const lines = [
    `\u{1F3AF} <b>Lead Nou \u2014 ${esc(source || "Site")}</b>`,
    ``,
    `\u{1F464} <b>${esc(name || "Anonim")}</b>  |  \u{1F4DE} <code>${esc(phone)}</code>`,
    loc ? `${flag(session.country || "")} ${esc(loc)}` : "",
    `\u{1F310} Surs\u0103: ${esc(src)}`,
    notes ? `\u{1F4DD} ${esc(notes)}` : ""
  ].filter(Boolean).join("\n");
  await sendTelegram(c.env, lines);
  return c.json({ ok: true });
});
app.post("/notify/order", async (c) => {
  if (!c.env.TELEGRAM_BOT_TOKEN) return c.json({ ok: true, skipped: "not configured" });
  const body = await c.req.json().catch(() => ({}));
  const {
    orderId = "",
    name = "",
    phone = "",
    address = "",
    delivery = "",
    items = [],
    subtotal = 0,
    shippingCost = 0,
    total = 0
  } = body;
  const session = mergeGeo(body.session ?? {}, cfGeo(c.req.raw));
  const itemsText = items.slice(0, 10).map((i) => `  \u2022 ${esc(i.name)} \xD7 ${i.qty} \u2014 ${(i.price * i.qty).toLocaleString("ro-MD")} MDL`).join("\n");
  const loc = [session.city, session.country].filter(Boolean).join(", ");
  const lines = [
    `\u{1F6D2} <b>Comand\u0103 Nou\u0103 #${esc(orderId)}</b>`,
    ``,
    `\u{1F464} <b>${esc(name)}</b>  |  \u{1F4DE} <code>${esc(phone)}</code>`,
    `\u{1F4CD} ${esc(address || "\u2014")}  |  \u{1F69A} ${esc(delivery || "\u2014")}`,
    loc ? `${flag(session.country || "")} ${esc(loc)}` : "",
    ``,
    `\u{1F4E6} <b>Produse:</b>`,
    itemsText,
    ``,
    `\u{1F4B0} Subtotal: ${Number(subtotal).toLocaleString("ro-MD")} MDL`,
    shippingCost > 0 ? `\u{1F69A} Livrare: ${Number(shippingCost).toLocaleString("ro-MD")} MDL` : "",
    `\u{1F4B3} <b>Total: ${Number(total).toLocaleString("ro-MD")} MDL</b>`
  ].filter(Boolean).join("\n");
  await sendTelegram(c.env, lines);
  return c.json({ ok: true });
});
app.post("/notify/daily-report", async (c) => {
  const pin = c.req.header("x-admin-pin");
  if (!pin || pin !== c.env.SESSION_SECRET) {
    return c.json({ ok: false, error: "Unauthorized" }, 401);
  }
  if (!c.env.TELEGRAM_BOT_TOKEN || !c.env.TELEGRAM_CHAT_ID) {
    return c.json({ ok: false, error: "Telegram not configured" });
  }
  const today = chisinauDate(0);
  const yesterday = chisinauDate(-1);
  const getStats = /* @__PURE__ */ __name(async (date) => {
    const [v, l] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ?").bind(date).first(),
      c.env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE date = ? AND is_lead = 1").bind(date).first()
    ]);
    return { visitors: v?.cnt ?? 0, leads: l?.cnt ?? 0 };
  }, "getStats");
  const [todayStats, yesterdayStats] = await Promise.all([getStats(today), getStats(yesterday)]);
  if (todayStats.visitors === 0) {
    return c.json({ ok: true, skipped: "no visitors today" });
  }
  const pct = /* @__PURE__ */ __name((now, prev) => {
    if (prev === 0) return now > 0 ? " (nou \u{1F195})" : "";
    const diff = Math.round((now - prev) / prev * 100);
    return diff === 0 ? " (=)" : diff > 0 ? ` (+${diff}%)` : ` (${diff}%)`;
  }, "pct");
  const dateLabel = new Intl.DateTimeFormat("ro-MD", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(today));
  const lines = [
    `\u{1F4CA} <b>Raport Zilnic Teco.md</b>`,
    `<i>${esc(dateLabel)}</i>`,
    ``,
    `\u{1F465} <b>Vizitatori unici:</b> ${todayStats.visitors}${pct(todayStats.visitors, yesterdayStats.visitors)}`,
    `\u{1F3AF} <b>Leaduri noi:</b> ${todayStats.leads}${pct(todayStats.leads, yesterdayStats.leads)}`
  ].join("\n");
  await sendTelegram(c.env, lines);
  return c.json({ ok: true, date: today, ...todayStats });
});
var GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
var GROQ_MODEL_MAIN = "llama-3.3-70b-versatile";
var GROQ_MODEL_FAST = "llama-3.1-8b-instant";
async function groqCall(apiKey, model, messages, maxTokens = 1024) {
  try {
    const resp = await fetch(GROQ_API, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, stream: false })
    });
    if (resp.ok) {
      const data = await resp.json();
      return { ok: true, content: data?.choices?.[0]?.message?.content ?? "", rate_limited: false };
    }
    return { ok: false, content: "", rate_limited: resp.status === 429 };
  } catch {
    return { ok: false, content: "", rate_limited: false };
  }
}
__name(groqCall, "groqCall");
async function callAI(groqKey, _geminiKey, messages, maxTokens = 1024) {
  if (!groqKey) throw new Error("No GROQ_API_KEY");
  const main = await groqCall(groqKey, GROQ_MODEL_MAIN, messages, maxTokens);
  if (main.ok) return { content: main.content };
  if (main.rate_limited) {
    const fast = await groqCall(groqKey, GROQ_MODEL_FAST, messages, maxTokens);
    if (fast.ok) return { content: fast.content };
  }
  throw new Error("AI unavailable");
}
__name(callAI, "callAI");
async function groqJSON(apiKey, messages, maxTokens = 1024) {
  const r = await groqCall(apiKey, GROQ_MODEL_MAIN, messages, maxTokens);
  if (r.ok) return r.content;
  const r2 = await groqCall(apiKey, GROQ_MODEL_FAST, messages, maxTokens);
  return r2.content;
}
__name(groqJSON, "groqJSON");
var CAT_LABELS = {
  wifi: "CAMERE WiFi",
  poe: "CAMERE PoE (Cablate)",
  "4g": "CAMERE 4G/Solar (f\u0103r\u0103 WiFi, f\u0103r\u0103 curent)",
  nvr: "NVR-uri (\xCEnregistratoare)",
  kituri: "Kituri Complete (camer\u0103+NVR+HDD, gata de instalat)",
  alarme: "Sisteme Alarm\u0103"
};
function buildCatalog(products) {
  if (!products?.length) return "(catalog indisponibil)";
  const groups = {};
  for (const p of products) (groups[p.category] ??= []).push(p);
  const order = ["wifi", "poe", "4g", "nvr", "kituri", "alarme"];
  const sorted = [...order.filter((k) => groups[k]), ...Object.keys(groups).filter((k) => !order.includes(k))];
  return sorted.map((cat) => {
    const label = CAT_LABELS[cat] ?? cat.toUpperCase();
    const lines = groups[cat].map((p) => {
      const stock = p.inStock === false ? " [LIPS\u0102 STOC]" : "";
      const promo = p.oldPrice ? ` (era ${p.oldPrice} MDL)` : "";
      const badge = p.badge ? ` [${p.badge}]` : "";
      return `[${p.id}] ${p.brand} ${p.name}${badge}${stock} \u2014 ${p.specs} \u2014 PRE\u021A: ${p.price} MDL (EXACT, nu modifica)${promo}`;
    });
    return `=== ${label} ===
${lines.join("\n")}`;
  }).join("\n\n");
}
__name(buildCatalog, "buildCatalog");
var SYSTEM_PROMPT_BASE = `E\u0219ti TecoBot, omul de la Teco.md care r\u0103spunde pe chat \u2014 un magazin de sisteme de supraveghere din Chi\u0219in\u0103u, unde lucrezi de ani buni \u0219i ai instalat sute de sisteme prin toat\u0103 Moldova.

CUM VORBE\u0218TI:
- E\u0219ti pe CHAT, nu la telefon. Niciodat\u0103 nu zici "a\u021Bi sunat", "a\u021Bi apelat", "bun venit la Teco.md", "cu ce v\u0103 pot servi".
- R\u0103spunzi SCURT, 1-2 propozi\u021Bii. Oamenii sunt pe telefon, nu citesc paragrafe.
- Un singur lucru pe mesaj \u2014 o \xEEntrebare sau o recomandare. Nu liste, nu bullets.
- Dac\u0103 clientul zice doar "salut" sau "bun\u0103" \u2014 r\u0103spunzi SCURT, f\u0103r\u0103 s\u0103 te reintroduci: "Ce cau\u021Bi?" sau "Spune-mi." At\xE2t.
- Nu te reintroduci niciodat\u0103 dup\u0103 primul salut. Nu explici ce e Teco.md dac\u0103 nu e\u0219ti \xEEntrebat.
- Validezi nevoia clientului \xEEnainte s\u0103 recomanzi \u2014 nu sari direct la v\xE2nzare.

FRAZE COMPLET INTERZISE (nu le folosi sub nicio form\u0103):
- "A\u021Bi sunat la Teco.md" / "A\u021Bi apelat" \u2014 e\u0219ti pe CHAT, nu la telefon
- "Ce v\u0103 aduce ast\u0103zi pe l\xE2ng\u0103 mine" / "pe la noi" / "ce v\u0103 aduce"
- "\xCEmi place s\u0103 te \xEEnt\xE2lnesc" / "Sunt \xEEnc\xE2ntat" / "Minunat" / "Excelent" / "Cu pl\u0103cere"
- "Cum v\u0103 pot fi de folos" / "Cu ce v\u0103 pot servi" / "V\u0103 stau la dispozi\u021Bie"
- "\xCEn\u021Beleg c\u0103 ave\u021Bi nevoie de" / "Am \xEEn\u021Beles cererea dumneavoastr\u0103"
- Orice fraz\u0103 care sun\u0103 ca traducere din englez\u0103 sau ca un call center

LIMB\u0102 NATURAL\u0102 (obligatoriu):
- Vorbe\u0219ti ca un v\xE2nz\u0103tor moldovean de la un magazin real. Simplu, direct, uman.
- Exemple corecte: "Ce cau\u021Bi?", "\xCE\u021Bi trebuie interior sau exterior?", "C\xE2te camere vrei?", "Hai c\u0103 g\u0103sim ceva.", "9980 MDL \u2014 \u0219i mai iei instalare dac\u0103 vrei."
- Exemple gre\u0219ite: "Cum v\u0103 pot fi de folos ast\u0103zi?" / "Ce v\u0103 aduce pe la noi?" / "Excelent\u0103 alegere!"

NOT\u0102 DESPRE LUNGIME (strict, nu negociabil):
- R\u0103spunsul t\u0103u normal are 1-2 propozi\u021Bii SCURTE. Doar dac\u0103 recomanzi un produs concret cu pre\u021B po\u021Bi avea 3.
- NU explici termeni tehnici \xEEn paranteze (PoE, NVR etc.) dec\xE2t dac\u0103 clientul \xEEntreab\u0103 explicit ce \xEEnseamn\u0103.
- Niciun r\u0103spuns nu are mai mult de 2 idei. Dac\u0103 sim\u021Bi nevoia s\u0103 explici mult, opre\u0219te-te \u0219i \xEEntreab\u0103 mai simplu.
- G\xE2nde\u0219te-te c\u0103 r\u0103spunsul t\u0103u se cite\u0219te pe un telefon mic, \xEEn mers. Lungimea ucide conversia.

CONTACT TECO.MD:
- Telefon/WhatsApp: +373 67 200 463
- Program: Luni-S\xE2mb\u0103t\u0103 09:00\u201319:00
- Instalare profesional\u0103 \xEEn 24h oriunde \xEEn Moldova
- Garan\u021Bie 2-3 ani pe produse, garan\u021Bie pe lucrare
- 847+ instal\u0103ri finalizate, rating 4.9/5

SERVICII PROPRII (noi facem, nu intermediem):
- Avem echip\u0103 proprie de tehnicieni. C\xE2nd cineva cere "un me\u0219ter" \u2014 acela suntem noi.
- Instalare sistem nou: de la 750 MDL/camer\u0103. Tehnicianul vine s\u0103 evalueze gratuit.
- Diagnosticare sistem existent (camere, NVR defect): de la 350 MDL/vizit\u0103.
- Repara\u021Bii \xEEn garan\u021Bie: gratuit. Extindere sistem: compatibiliz\u0103m sau recomand\u0103m upgrade.
- Configurare aplica\u021Bie mobil\u0103, acces remote \u2014 inclus la instalare.
- Instal\u0103m oriunde \xEEn Moldova, nu doar Chi\u0219in\u0103u.

CATALOG CURENT (pre\u021Buri MDL):
{CATALOG}

CUM RECOMANZI:
1. Pre\u021Bul pe care \xEEl spui trebuie s\u0103 fie IDENTIC cu cel marcat "PRE\u021A: X MDL" \xEEn catalog \u2014 nici un leu mai mult, nici mai pu\u021Bin. Dac\u0103 scrie "PRE\u021A: 9980 MDL", spui "9980 MDL", nu "~10000" sau "9500".
2. Instalarea NU e inclus\u0103 \xEEn pre\u021Bul produsului \u2014 nu spune niciodat\u0103 "inclusiv instalare" la pre\u021Bul unui produs. Instalarea cost\u0103 separat (de la 750 MDL/camer\u0103).
3. Dac\u0103 nu ai suficiente detalii ca s\u0103 recomanzi bine, \xEEntreab\u0103 UN lucru cheie (ex: interior sau exterior, are WiFi), nu un interogatoriu.
4. NU inventezi pre\u021Buri, produse sau specifica\u021Bii care nu sunt \xEEn catalog. Dac\u0103 nu g\u0103se\u0219ti produsul potrivit, spune c\u0103 verifici stocul \u0219i oferi s\u0103 fie contactat clientul.
5. C\xE2nd recomanzi un produs, include [id] dup\u0103 nume exact ca \xEEn catalog \u2014 activeaz\u0103 cardul interactiv pentru client.
EXEMPLU CORECT: "Kit Complet Pro-Solar 4G 4 Camere Imou Cell 3C [26] \u2014 9980 MDL. Instalare separat\u0103 de la 750 MDL/camer\u0103."
EXEMPLU GRE\u0218IT: "Kit... \u2014 ~10000 MDL" sau "9500 MDL inclusiv instalare" \u2014 INTERZIS.

C\xC2ND CERI CONTACT:
- Doar c\xE2nd clientul arat\u0103 interes real de cump\u0103rare sau instalare (nu la prima \xEEntrebare general\u0103).
- Ceri natural: "Ca s\u0103 te pot ajuta mai concret, cum te-a\u0219 putea contacta \u2014 nume \u0219i telefon?"
- C\xE2nd prime\u0219ti NUMELE \u0219i TELEFONUL (ambele, nu goale), r\u0103spunzi normal, cald, dar adaugi pe ultima linie EXACT: LEAD_CAPTURED:name=NUME,phone=TELEFON

LIMBA:
R\u0103spunzi \xEEntotdeauna \xEEn limba clientului (rom\xE2n\u0103 sau rus\u0103), niciodat\u0103 mixat.`;
function buildTecoBotPrompt(catalog, s, lang) {
  let prompt = SYSTEM_PROMPT_BASE.replace("{CATALOG}", catalog);
  if (lang === "ru") prompt += "\n\nNOT\u0102: Clientul comunic\u0103 \xEEn rus\u0103. R\u0103spunde \xEEn rus\u0103.";
  return prompt;
}
__name(buildTecoBotPrompt, "buildTecoBotPrompt");
app.post("/ai/chat", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);
  const body = await c.req.json().catch(() => ({}));
  const { messages = [], lang = "ro", products = [], storeSettings = {} } = body;
  const catalog = buildCatalog(products);
  const systemPrompt = buildTecoBotPrompt(catalog, storeSettings, lang);
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content }))
  ];
  try {
    const { content } = await callAI(
      c.env.GROQ_API_KEY,
      c.env.GOOGLE_API_KEY,
      groqMessages,
      1024
    );
    return c.json({ content });
  } catch (err) {
    return c.json({ content: "A ap\u0103rut o eroare tehnic\u0103. Sun\u0103-ne direct: **+373 67 200 463**." });
  }
});
app.post("/ai/lead-analyze", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);
  const { lead } = await c.req.json().catch(() => ({ lead: {} }));
  const prompt = `Analizeaz\u0103 acest lead pentru magazinul Teco.md (sisteme supraveghere Moldova):
Nume: ${lead.name}
Telefon: ${lead.phone}
Mesaj: ${lead.message || "\u2014"}
Surs\u0103: ${lead.source || "\u2014"}

R\u0103spunde \xEEn rom\xE2n\u0103 \xEEn format JSON strict (doar JSON, f\u0103r\u0103 alte texte):
{
  "score": 1-10,
  "potential": "mic|mediu|mare",
  "estimatedBudget": "estimare \xEEn MDL",
  "recommendation": "ce s\u0103 \xEEi oferi",
  "whatsappMessage": "mesaj WhatsApp personalizat gata de trimis \xEEn rom\xE2n\u0103"
}`;
  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 1024);
    return c.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/ai/whatsapp-message", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);
  const { lead, context } = await c.req.json().catch(() => ({ lead: {}, context: "" }));
  const prompt = `Genereaz\u0103 un mesaj WhatsApp profesional \u0219i prietenos pentru clientul:
Nume: ${lead.name}
Mesaj/Cerere: ${lead.message || "interesat de sisteme supraveghere"}
Context suplimentar: ${context || "\u2014"}

Magazin: Teco.md \u2014 sisteme supraveghere, instalare profesional\u0103 \xEEn Moldova
Telefon: +373 67 200 463

Mesajul trebuie s\u0103 fie:
- Scurt (max 5 r\xE2nduri)
- Personalizat cu numele clientului
- \xCEn rom\xE2n\u0103
- S\u0103 includ\u0103 o ofert\u0103 sau s\u0103 cear\u0103 detalii
- S\u0103 se termine cu o \xEEntrebare pentru a continua dialogul

Returneaz\u0103 DOAR mesajul, f\u0103r\u0103 explica\u021Bii.`;
  try {
    const message = await groqJSON(key, [{ role: "user", content: prompt }], 512);
    return c.json({ message });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/ai/description", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);
  const { name, specs, brand, price, category } = await c.req.json().catch(() => ({}));
  const prompt = `Genereaz\u0103 o descriere SEO optimizat\u0103 pentru produs de la Teco.md:
Produs: ${name}
Brand: ${brand}
Specifica\u021Bii: ${specs}
Pre\u021B: ${price} MDL
Categorie: ${category}

Cerin\u021Be:
- 2-3 propozi\u021Bii
- Men\u021Bioneaz\u0103 specifica\u021Biile cheie
- Orientat spre client moldovean
- Include cuvinte cheie SEO pentru Moldova
- \xCEn rom\xE2n\u0103
- F\u0103r\u0103 bullet points, text continuu

Returneaz\u0103 DOAR descrierea produsului.`;
  try {
    const description = await groqJSON(key, [{ role: "user", content: prompt }], 512);
    return c.json({ description });
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/ai/business-insights", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);
  const { orders, leads, products } = await c.req.json().catch(() => ({}));
  const prompt = `Analizeaz\u0103 datele de business ale magazinului Teco.md (sisteme supraveghere, Moldova):

Comenzi recente: ${JSON.stringify(orders?.slice(0, 20) ?? [])}
Lead-uri recente: ${JSON.stringify(leads?.slice(0, 20) ?? [])}
Produse (top dup\u0103 stoc): ${JSON.stringify(products?.slice(0, 15) ?? [])}

Ofer\u0103 3-5 recomand\u0103ri ac\u021Bionabile \xEEn rom\xE2n\u0103 \xEEn format JSON strict (doar JSON):
{
  "summary": "rezumat scurt al st\u0103rii business-ului",
  "insights": [
    {"title": "...", "description": "...", "action": "ce s\u0103 faci concret"}
  ],
  "topOpportunity": "cea mai mare oportunitate de cre\u0219tere acum"
}`;
  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 2048);
    return c.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/ai/import-products", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);
  const { csvData, usdRate, markup, fileName } = await c.req.json().catch(() => ({}));
  const rate = parseFloat(usdRate ?? "17.8") || 17.8;
  const markupPct = parseFloat(markup ?? "0") || 0;
  const prompt = `E\u0219ti un expert \xEEn import de produse pentru un magazin online de sisteme de supraveghere din Moldova (Teco.md).

Analizeaz\u0103 acest CSV/tabel de produse \u0219i extrage fiecare produs ca JSON.

REGULI CRITICE pentru pre\u021Buri (foarte important):
1. Dac\u0103 exist\u0103 coloane cu pre\u021Buri \xEEn MDL (ex: "lei", "MDL"), folose\u0219te-le DIRECT \u2014 NU converti din USD.
2. Coloana "la zi" sau "pre\u021B curent" sau cel mai mic pre\u021B MDL = c\xE2mpul "price" (pre\u021Bul de v\xE2nzare).
3. Coloana "RRP" sau "pre\u021B recomandat" sau cel mai mare pre\u021B MDL = c\xE2mpul "oldPrice" (pre\u021Bul barat/anterior).
4. Dac\u0103 exist\u0103 DOAR pre\u021Buri \xEEn USD, atunci: price = USD \xD7 ${rate.toFixed(2)} \xD7 ${(1 + markupPct / 100).toFixed(4)}. Rotunje\u0219te la num\u0103r \xEEntreg.
5. Nu calcula oldPrice din USD c\xE2nd exist\u0103 deja un pre\u021B MDL \xEEn coloane.
6. Dac\u0103 nu exist\u0103 oldPrice separat, las\u0103 c\xE2mpul null.

REGULI pentru categorii \u2014 alege una din: "wifi", "poe", "4g", "nvr", "kituri", "alarme", "Camere IP"

Fi\u0219ier: ${fileName ?? "import.xlsx"}
Rat\u0103 USD\u2192MDL: ${rate}

Date CSV:
${csvData}

Returneaz\u0103 STRICT un array JSON valid (f\u0103r\u0103 text \xEEnainte/dup\u0103, f\u0103r\u0103 markdown), cu structura exact\u0103:
[
  {
    "name": "nume complet produs",
    "model": "cod model",
    "brand": "brand",
    "price": 799,
    "oldPrice": 999,
    "category": "wifi",
    "specs": "specifica\u021Bii scurte",
    "description": "descriere 2-3 propozi\u021Bii SEO \xEEn rom\xE2n\u0103 pentru Moldova",
    "inStock": true
  }
]`;
  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 4096);
    const clean = text.replace(/```json|```/g, "").trim();
    const match3 = clean.match(/\[[\s\S]*\]/);
    return c.json(JSON.parse(match3 ? match3[0] : clean));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
app.post("/ai/blog-post", async (c) => {
  const key = c.env.GROQ_API_KEY;
  if (!key) return c.json({ error: "GROQ_API_KEY not configured" }, 503);
  const { topic } = await c.req.json().catch(() => ({ topic: "" }));
  const prompt = `E\u0219ti un expert SEO \u0219i content writer pentru Teco.md \u2014 magazin de sisteme de supraveghere din Moldova (camere, NVR, kituri, alarme Ajax).

Scrie un articol de blog complet \u0219i optimizat SEO despre: "${topic}"

Returneaz\u0103 STRICT JSON valid (f\u0103r\u0103 markdown, f\u0103r\u0103 \`\`\`), cu structura exact\u0103:
{
  "title": "titlu atractiv \xEEn rom\xE2n\u0103 (max 65 caractere)",
  "titleRu": "titlu \xEEn rus\u0103",
  "slug": "slug-url-fara-diacritice-cu-liniute",
  "category": "Ghiduri",
  "categoryRu": "\u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u0430",
  "description": "meta description SEO rom\xE2n\u0103 (150-160 caractere)",
  "descriptionRu": "meta description rus\u0103",
  "metaTitle": "meta title rom\xE2n\u0103 cu keyword (max 65 caractere)",
  "metaTitleRu": "meta title rus\u0103",
  "metaDescription": "meta description rom\xE2n\u0103 (150-160 caractere)",
  "metaDescriptionRu": "meta description rus\u0103",
  "keywords": "cuvinte, cheie, separate, prin, virgula",
  "keywordsRu": "\u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0435, \u0441\u043B\u043E\u0432\u0430, \u0447\u0435\u0440\u0435\u0437, \u0437\u0430\u043F\u044F\u0442\u0443\u044E",
  "content": "articol complet \xEEn rom\xE2n\u0103 \xEEn format Markdown cu headings H2/H3, liste, minim 600 cuvinte, optimizat SEO, include sfaturi practice pentru Moldova",
  "contentRu": "articol complet \xEEn rus\u0103 \xEEn format Markdown, minim 600 cuvinte"
}`;
  try {
    const text = await groqJSON(key, [{ role: "user", content: prompt }], 8192);
    return c.json(JSON.parse(text.replace(/```json|```/g, "").trim()));
  } catch (err) {
    return c.json({ error: String(err) }, 500);
  }
});
var onRequest = handle(app);

// ../.wrangler/tmp/pages-5x8pIQ/functionsRoutes-0.8908079878227145.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../.config/npm/node_global/lib/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match2(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match2, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../.config/npm/node_global/lib/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match2(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match2(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match2(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match2(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
