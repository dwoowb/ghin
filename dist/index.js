// src/client/ghin/index.ts
import { z as z33 } from "zod";

// src/errors/index.ts
var GhinError = class extends Error {
  code;
  statusCode;
  cause;
  constructor(message, code, statusCode, cause) {
    super(message);
    this.name = "GhinError";
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
  }
};
var AuthenticationError = class extends GhinError {
  constructor(message, statusCode, cause) {
    super(message, "AUTHENTICATION_ERROR", statusCode, cause);
    this.name = "AuthenticationError";
  }
};
var NetworkError = class extends GhinError {
  constructor(message, statusCode, cause) {
    super(message, "NETWORK_ERROR", statusCode, cause);
    this.name = "NetworkError";
  }
};
var ValidationError = class extends GhinError {
  field;
  response;
  constructor(message, field, cause, response) {
    super(message, "VALIDATION_ERROR", void 0, cause);
    this.name = "ValidationError";
    this.field = field;
    this.response = JSON.stringify(response);
  }
};
var RateLimitError = class extends GhinError {
  retryAfter;
  constructor(message, retryAfter, cause) {
    super(message, "RATE_LIMIT_ERROR", 429, cause);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};
var ConfigurationError = class extends GhinError {
  constructor(message, cause) {
    super(message, "CONFIGURATION_ERROR", void 0, cause);
    this.name = "ConfigurationError";
  }
};
var CacheError = class extends GhinError {
  constructor(message, cause) {
    super(message, "CACHE_ERROR", void 0, cause);
    this.name = "CacheError";
  }
};
var ErrorCodes = {
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  CACHE_ERROR: "CACHE_ERROR"
};

// src/models/cache-client.ts
import { z } from "zod";
var schemaStringOrUndefined = z.union([z.string(), z.undefined()]);
var schemaPromiseOrNonPromiseStringOrUndefined = z.union([
  z.promise(schemaStringOrUndefined),
  schemaStringOrUndefined
]);
var schemaPromiseOrNonPromiseVoid = z.union([z.promise(z.void()), z.void()]);
var schemaCacheClient = z.object({
  read: z.function().args().returns(schemaPromiseOrNonPromiseStringOrUndefined),
  write: z.function().args(z.string()).returns(schemaPromiseOrNonPromiseVoid)
});

// src/models/client-config.ts
import { z as z3 } from "zod";

// src/models/validation.ts
import { isValid, parse, parseISO } from "date-fns";
import { z as z2 } from "zod";
var boolean = z2.union([z2.boolean(), z2.literal("true"), z2.literal("false"), z2.null()]).transform((value) => value === true || value === "true");
var date = z2.union([z2.date(), z2.string(), z2.null(), z2.undefined()]).refine(
  (value) => {
    if (value === null || value === void 0 || value === "") {
      return true;
    }
    if (value instanceof Date) {
      return isValid(value);
    }
    if (typeof value === "string") {
      let parsed = parseISO(value);
      if (isValid(parsed)) {
        return true;
      }
      const formats = [
        "yyyy-MM-dd",
        "yyyy/MM/dd",
        "MM/dd/yyyy",
        "dd/MM/yyyy",
        "MMMM dd, yyyy",
        // September 15, 2022
        "MMM dd, yyyy",
        // Sep 15, 2022
        "MMM dd yyyy",
        // Sep 15 2022
        "dd MMM yyyy"
        // 15 Sep 2022
      ];
      return formats.some((format) => {
        try {
          parsed = parse(value, format, /* @__PURE__ */ new Date());
          return isValid(parsed);
        } catch {
          return false;
        }
      });
    }
    return false;
  },
  {
    message: "Invalid date"
  }
).transform((value) => {
  if (value === null || value === void 0 || value === "") {
    return void 0;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    let parsed = parseISO(value);
    if (isValid(parsed)) {
      return parsed;
    }
    const formats = [
      "yyyy-MM-dd",
      "yyyy/MM/dd",
      "MM/dd/yyyy",
      "dd/MM/yyyy",
      "MMMM dd, yyyy",
      // September 15, 2022
      "MMM dd, yyyy",
      // Sep 15, 2022
      "MMM dd yyyy",
      // Sep 15 2022
      "dd MMM yyyy"
      // 15 Sep 2022
    ];
    for (const format of formats) {
      try {
        parsed = parse(value, format, /* @__PURE__ */ new Date());
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
      }
    }
  }
  return void 0;
});
var emptyString = z2.string().trim();
var emptyStringToNull = emptyString.nullable().transform((value) => value || null);
var float = z2.coerce.number();
var gender = z2.enum(["M", "F"]);
var handicap = z2.union([float, z2.string(), z2.null()]).refine((value) => {
  if (typeof value === "number") {
    return true;
  }
  if (typeof value === "string" && (value === "NH" || value === "-")) {
    return true;
  }
  return false;
}).transform((value) => {
  if (value === "NH" || value === "-") {
    return null;
  }
  return value;
});
var number = float.int();
var string = emptyString.min(1);
var teeSetSide = z2.enum(["All18", "F9", "B9"]);
var monthDay = string.or(emptyString).transform((value) => {
  if (!value) {
    return null;
  }
  const [month, day] = value.split("/");
  return `${month?.toString().padStart(2, "0")}-${day?.toString().padStart(2, "0")}`;
});
var shortDate = z2.union([z2.date(), z2.string(), z2.null()]).refine((value) => value ? !Number.isNaN(Date.parse(value.toString())) : true, {
  message: "Invalid date"
}).transform((value) => {
  if (typeof value !== "string") {
    return value;
  }
  const [year, month, day] = value.split("-");
  return /* @__PURE__ */ new Date(`${year}-${month}-${day}T00:00Z`);
});

// src/models/client-config.ts
var schemaClientConfig = z3.object({
  apiAccess: boolean.optional(),
  apiVersion: string.optional(),
  baseUrl: string.optional(),
  cache: schemaCacheClient.optional(),
  password: string,
  username: string
});

// src/client/in-memory-cache-client/index.ts
var InMemoryCacheClient = class {
  value = void 0;
  async read() {
    return this.value;
  }
  async write(value) {
    this.value = value;
  }
};

// src/client/request-client/index.ts
import { Mutex } from "async-mutex";
import { jwtDecode } from "jwt-decode";
import { err as err2, ok as ok2 } from "neverthrow";

// src/utils/retry.ts
import { err, ok } from "neverthrow";
var DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1e3,
  // 1 second
  maxDelay: 1e4,
  // 10 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504]
};
function isRetryableError(error) {
  if (error instanceof NetworkError) {
    return error.statusCode ? DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(error.statusCode) : true;
  }
  if (error instanceof RateLimitError) {
    return true;
  }
  return false;
}
function calculateDelay(attempt, config) {
  const delay = config.baseDelay * config.backoffMultiplier ** (attempt - 1);
  return Math.min(delay, config.maxDelay);
}
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function withRetry(operation, config = {}) {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    const result = await operation();
    if (result.isOk()) {
      return result;
    }
    const error = result.error;
    if (attempt === finalConfig.maxAttempts) {
      return result;
    }
    if (!isRetryableError(error)) {
      return result;
    }
    const delay = calculateDelay(attempt, finalConfig);
    const jitter = Math.random() * 0.1 * delay;
    const totalDelay = delay + jitter;
    await sleep(totalDelay);
  }
  return err(new Error("Retry exhausted"));
}

// src/client/request-client/models/access-token.ts
import { z as z4 } from "zod";
var schemaAccessToken = z4.object({
  expiresIn: string,
  token: string
}).transform(({ expiresIn: tmpExpiresIn, ...values }) => {
  const now = /* @__PURE__ */ new Date();
  const secondsUntilExpiry = Number(tmpExpiresIn.replace(/[^0-9]/g, ""));
  const millisecondsUntilExpiry = secondsUntilExpiry * 1e3;
  const expiresIn = new Date(now.getTime() + millisecondsUntilExpiry);
  return {
    ...values,
    expiresIn
  };
});

// src/client/request-client/models/session.ts
import { z as z5 } from "zod";
var schemaSession = z5.object({
  appId: string,
  authVersion: string,
  fid: string,
  sdkVersion: string
});
var schemaSessionResponse = z5.object({
  authToken: schemaAccessToken
});

// src/client/request-client/models/login.ts
import { z as z6 } from "zod";
var schemaLoginAPIRequest = z6.object({
  user: z6.object({
    email: string,
    password: string,
    remember_me: boolean
  })
});
var schemaLoginResponse = z6.object({
  golfer_user: z6.object({
    golfer_user_token: string
  })
});
var schemaLoginAPIResponse = z6.object({
  user: z6.object({
    id: string,
    email: emptyStringToNull.optional(),
    prefix: emptyStringToNull.optional(),
    first_name: emptyStringToNull.optional(),
    middle_name: emptyStringToNull.optional(),
    last_name: emptyStringToNull.optional(),
    suffix: emptyStringToNull.optional(),
    phone: emptyStringToNull.optional(),
    last_sign_in_at: emptyStringToNull.optional()
  }),
  token: string
});

// src/client/request-client/index.ts
var FIREBASE_SESSION_URL = new URL(
  "https://firebaseinstallations.googleapis.com/v1/projects/ghin-mobile-app/installations"
);
var GOOGLE_API_KEY = "AIzaSyBxgTOAWxiud0HuaE5tN-5NTlzFnrtyz-I";
var DEFAULT_USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";
var CLIENT_SOURCE = "GHINcom";
var SESSION_DEFAULTS = {
  appId: "1:884417644529:web:47fb315bc6c70242f72650",
  authVersion: "FIS_v2",
  fid: "fg6JfS0U01YmrelthLX9Iz",
  sdkVersion: "w:0.5.7"
};
var FETCH_HEADER_DEFAULTS = {
  "Content-Type": "application/json",
  "User-Agent": DEFAULT_USER_AGENT
};
var apiPathnames = {
  course_countries: "/get_countries_and_states.json",
  course_details: "/crsCourseMethods.asmx/GetCourseDetails.json",
  course_handicaps: "/playing_handicaps.json",
  course_search: "/crsCourseMethods.asmx/SearchCourses.json",
  facility_search: "/facilities/search.json",
  golfer: "/search_golfer.json",
  golfers_search: "/golfers/search.json",
  golfers_global_search: "/golfers.json",
  gpa_accesses: "/users/accesses.json",
  login: "/golfer_login.json",
  course_handicaps_get: "/course_handicaps.json",
  playing_handicaps_post: "/playing_handicaps.json",
  scores: "/scores.json",
  scores_hbh: "/scores/hbh.json",
  scores_adjusted: "/scores/adjusted.json",
  scores_18h9and9: "/scores/18h9and9.json",
  users_login: "/users/login.json"
};
var toFullApiUrl = (baseUrl, pathname) => new URL(`${baseUrl.pathname}${apiPathnames[pathname]}`, baseUrl);
var makeAuthHeaders = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`
});
var RequestClient = class {
  accessToken;
  baseUrl;
  config;
  lock;
  sessionToken;
  constructor(config) {
    const results = schemaClientConfig.safeParse(config);
    if (!results.success) {
      throw new ConfigurationError(`Invalid RequestClientConfig: ${results.error.message}`);
    }
    if (results.data.apiAccess === void 0) {
      results.data.apiAccess = false;
    }
    if (results.data.apiVersion === void 0) {
      results.data.apiVersion = "v1";
    }
    if (results.data.baseUrl === void 0) {
      results.data.baseUrl = "https://api2.ghin.com/api";
    }
    if (!results.data.cache) {
      results.data.cache = new InMemoryCacheClient();
    }
    this.lock = new Mutex();
    this.config = schemaClientConfig.parse(results.data);
    this.baseUrl = new URL(`${this.config.baseUrl}/${this.config.apiVersion}`);
  }
  async _fetch({
    options,
    schema,
    url
  }) {
    try {
      const response = await fetch(url.toString(), options);
      if (!response.ok || response.status >= 400) {
        let body;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        if (response.status === 401 || response.status === 403) {
          return err2(
            new AuthenticationError(
              `Authentication failed: ${response.status} ${response.statusText}`,
              response.status,
              new Error(JSON.stringify(body))
            )
          );
        }
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          const retryAfterSeconds = retryAfter ? Number.parseInt(retryAfter, 10) : void 0;
          return err2(
            new RateLimitError(
              `Rate limit exceeded: ${response.status} ${response.statusText}`,
              retryAfterSeconds,
              new Error(JSON.stringify(body))
            )
          );
        }
        if (response.status >= 500) {
          return err2(
            new NetworkError(
              `Server error: ${response.status} ${response.statusText}`,
              response.status,
              new Error(JSON.stringify(body))
            )
          );
        }
        return err2(
          new NetworkError(
            `Request failed: ${response.status} ${response.statusText}`,
            response.status,
            new Error(JSON.stringify(body))
          )
        );
      }
      const raw = await response.json();
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return err2(
          new ValidationError(
            `Response validation failed: ${JSON.stringify(parsed.error)}`,
            void 0,
            new Error(`URL: ${url.toString()}`),
            raw
          )
        );
      }
      return ok2(parsed.data);
    } catch (error) {
      if (error instanceof Error) {
        return err2(new NetworkError(`Network request failed: ${error.message}`, void 0, error));
      }
      return err2(new NetworkError(`Unknown network error: ${String(error)}`));
    }
  }
  async refreshSessionToken() {
    const url = new URL(FIREBASE_SESSION_URL);
    const body = JSON.stringify(SESSION_DEFAULTS);
    const result = await this._fetch({
      options: {
        body,
        headers: {
          ...FETCH_HEADER_DEFAULTS,
          "x-goog-api-key": GOOGLE_API_KEY
        },
        method: "POST"
      },
      schema: schemaSessionResponse,
      url
    });
    return result.map((response) => response.authToken);
  }
  isAccessTokenValid(accessToken) {
    if (!accessToken) {
      return false;
    }
    try {
      const decoded = jwtDecode(accessToken);
      const expirationDate = new Date(decoded.exp * 1e3);
      return expirationDate > /* @__PURE__ */ new Date();
    } catch {
      return false;
    }
  }
  async getAccessToken() {
    const isAccessTokenValid = this.isAccessTokenValid(this.accessToken);
    if (isAccessTokenValid) {
      return ok2(this.accessToken);
    }
    try {
      const cachedAccessToken = await this.config.cache?.read();
      const isCachedTokenValid = this.isAccessTokenValid(cachedAccessToken);
      if (isCachedTokenValid) {
        this.accessToken = cachedAccessToken;
        return ok2(cachedAccessToken);
      }
    } catch (error) {
      return err2(
        new CacheError(
          `Failed to read from cache: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error : void 0
        )
      );
    }
    const refreshResult = await this.refreshAccessToken();
    if (refreshResult.isErr()) {
      return refreshResult;
    }
    const accessToken = refreshResult.value;
    this.accessToken = accessToken;
    try {
      await this.config.cache?.write(accessToken);
    } catch (error) {
      return err2(
        new CacheError(
          `Failed to write to cache: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error : void 0
        )
      );
    }
    return ok2(accessToken);
  }
  async apiLogin() {
    const url = toFullApiUrl(this.baseUrl, "users_login");
    const body = JSON.stringify({
      user: {
        email: this.config.username,
        password: this.config.password,
        remember_me: true
      }
    });
    const response = await this._fetch({
      options: {
        body,
        headers: FETCH_HEADER_DEFAULTS,
        method: "POST"
      },
      schema: schemaLoginAPIResponse,
      url
    });
    return response.andThen((resp) => {
      if (resp && "token" in resp) {
        return ok2(resp.token);
      }
      return err2(new Error("Login response did not contain a token."));
    });
  }
  async refreshAccessToken() {
    if (this.config.apiAccess) {
      return this.apiLogin();
    }
    const sessionResult = await this.refreshSessionToken();
    if (sessionResult.isErr()) {
      return err2(sessionResult.error);
    }
    this.sessionToken = sessionResult.value;
    const url = toFullApiUrl(this.baseUrl, "login");
    const body = JSON.stringify({
      token: this.sessionToken.token,
      user: {
        email_or_ghin: this.config.username,
        password: this.config.password
      }
    });
    const response = await this._fetch({
      options: {
        body,
        headers: FETCH_HEADER_DEFAULTS,
        method: "POST"
      },
      schema: schemaLoginResponse,
      url
    });
    return response.map((resp) => {
      if ("golfer_user" in resp) {
        return resp.golfer_user.golfer_user_token;
      }
      return resp.token;
    });
  }
  async fetch({
    entity,
    schema,
    options = {}
  }) {
    const accessTokenResult = await this.lock.runExclusive(async () => this.getAccessToken());
    if (accessTokenResult.isErr()) {
      return err2(accessTokenResult.error);
    }
    const accessToken = accessTokenResult.value;
    const url = toFullApiUrl(this.baseUrl, entity);
    const { headers, searchParams, ...requestInitOptions } = options;
    const actualOptions = {
      ...requestInitOptions,
      headers: {
        ...FETCH_HEADER_DEFAULTS,
        source: CLIENT_SOURCE,
        ...makeAuthHeaders(accessToken),
        ...headers
      }
    };
    if (searchParams) {
      url.search = searchParams.toString();
    }
    return withRetry(() => this._fetch({ options: actualOptions, schema, url }));
  }
  async fetchCustomPath({
    path,
    schema,
    options = {}
  }) {
    const accessTokenResult = await this.lock.runExclusive(async () => this.getAccessToken());
    if (accessTokenResult.isErr()) {
      return err2(accessTokenResult.error);
    }
    const accessToken = accessTokenResult.value;
    const url = new URL(`${this.baseUrl.pathname}${path}`, this.baseUrl);
    const { headers, searchParams, ...requestInitOptions } = options;
    const actualOptions = {
      ...requestInitOptions,
      headers: {
        ...FETCH_HEADER_DEFAULTS,
        source: CLIENT_SOURCE,
        ...makeAuthHeaders(accessToken),
        ...headers
      }
    };
    if (searchParams) {
      url.search = searchParams.toString();
    }
    return withRetry(() => this._fetch({ options: actualOptions, schema, url }));
  }
};

// src/client/ghin/models/course/country.ts
import { z as z7 } from "zod";
var FOREIGN_COUNTRY_CODE = "Fo";
var schemaCourseCountryCode = string.refine((value) => {
  if (value === FOREIGN_COUNTRY_CODE) {
    return true;
  }
  return /^[A-Z]{3}$/.test(value);
}, 'Invalid country code. Expected format: ISO 3166-1 alpha-3 code or "Fo" for foreign countries');
var schemaCourseCountryState = z7.object({
  code: string,
  //schemaCourseCountryCode,
  course_code: string,
  //schemaCourseCountryCode.nullable(),
  name: string
});
var schemaCourseCountry = z7.object({
  code: string,
  crs_code: z7.string().trim().transform((value) => value || null).nullable(),
  name: string,
  states: z7.array(schemaCourseCountryState)
});

// src/client/ghin/models/course/request.ts
import { z as z8 } from "zod";

// src/client/ghin/models/course/state.ts
var FOREIGN_STATE_CODE = "*F";
var courseStateCodeRegex = /^[A-Z]{1,2}-[A-Z*0-9]{1,4}$/;
var schemaCourseSearchState = string.refine(
  (value) => {
    if (value === FOREIGN_STATE_CODE) {
      return true;
    }
    return courseStateCodeRegex.test(value);
  },
  {
    message: "Invalid state code format. Expected format: US-OH, LC-01, MX-*A, or *F"
  }
);

// src/client/ghin/models/course/request.ts
var schemaCourseSearchRequest = z8.object({
  country: schemaCourseCountryCode.optional(),
  facility_id: number.optional(),
  name: string.optional(),
  state: schemaCourseSearchState.optional(),
  updated_at: date.optional()
}).refine(
  ({ country, state, facility_id, updated_at, name }) => {
    switch (true) {
      case Boolean(name):
        return true;
      case Boolean(country && state):
        return true;
      case Boolean(facility_id):
        return true;
      case Boolean(updated_at):
        return true;
      default:
        return false;
    }
  },
  {
    message: "At least one of the following are required: name, country + state, facility_id, or updated_at must be provided"
  }
);
var schemaTeeSetStatus = z8.enum(["Active", "Deleted", "All"]);
var schemaCourseDetailsRequest = z8.object({
  course_id: number,
  gender: z8.enum(["M", "m", "F", "f"]).optional(),
  number_of_holes: z8.union([z8.literal(9), z8.literal(18)]).optional(),
  tee_set_status: schemaTeeSetStatus.optional()
}).transform((data) => ({
  ...data,
  tee_set_status: data.tee_set_status ?? "Active"
}));

// src/client/ghin/models/course/response.ts
import { z as z12 } from "zod";

// src/client/ghin/models/course/course.ts
import { z as z10 } from "zod";

// src/client/ghin/models/course/geolocation.ts
import { z as z9 } from "zod";
var schemaGeoCoordinate = z9.preprocess((value) => {
  if (value === void 0 || value === null || value === "") {
    return null;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }
  return null;
}, z9.number().nullable());
var schemaGeoAddress = z9.preprocess((value) => {
  if (value === void 0 || value === null || value === "") {
    return null;
  }
  return value;
}, z9.string().nullable());

// src/client/ghin/models/course/course.ts
var schemaStatus = string.transform((value) => value.toUpperCase()).pipe(z10.enum(["ACTIVE", "INACTIVE"]));
var schemaCourse = z10.object({
  Address1: string.nullable(),
  Address2: string.nullable(),
  City: string.nullable(),
  Country: string.nullable(),
  CourseID: number,
  CourseName: string,
  CourseStatus: schemaStatus,
  Email: z10.string().nullable().optional(),
  EntCountryCode: number.nullable(),
  EntStateCode: number.nullable(),
  FacilityID: number,
  FacilityName: string,
  FacilityStatus: schemaStatus,
  FullName: string,
  GeoLocationLatitude: schemaGeoCoordinate.nullable(),
  GeoLocationLongitude: schemaGeoCoordinate.nullable(),
  LegacyCRPCourseId: number.nullable(),
  Ratings: z10.array(z10.unknown()),
  State: string.nullable(),
  Telephone: string.nullable(),
  UpdatedOn: shortDate.nullable(),
  Zip: z10.string().trim().transform((zip) => zip?.trim() || null).nullable().or(z10.array(z10.unknown()))
});

// src/client/ghin/models/course/season.ts
import { z as z11 } from "zod";
var schemaSeasonDate = z11.preprocess((value) => {
  if (value === void 0 || value === null || value === "") {
    return null;
  }
  return value;
}, z11.string().nullable());
var schemaSeasonName = z11.preprocess((value) => {
  if (value === void 0 || value === null || value === "") {
    return null;
  }
  return value;
}, z11.string().nullable());

// src/client/ghin/models/course/response.ts
var schemaStatus2 = string.transform((value) => value.toUpperCase()).pipe(z12.enum(["ACTIVE", "INACTIVE"]));
var schemaCourseCountriesResponse = z12.object({
  countries: z12.array(schemaCourseCountry.passthrough())
});
var schemaCourseSearchResponse = z12.object({
  courses: z12.array(schemaCourse.passthrough())
});
var schemaCourseDetailsFacility = z12.object({
  FacilityId: number,
  FacilityName: string,
  FacilityNumber: number.nullable(),
  FacilityStatus: string,
  GeoLocationFormattedAddress: schemaGeoAddress,
  GeoLocationLatitude: schemaGeoCoordinate.nullable(),
  GeoLocationLongitude: schemaGeoCoordinate.nullable(),
  GolfAssociationId: number.nullable()
});
var schemaCourseDetailsSeason = z12.object({
  IsAllYear: boolean,
  SeasonEndDate: schemaSeasonDate.transform((value) => {
    if (!value) {
      return null;
    }
    const [month, day] = value.split("/");
    return `${month?.toString().padStart(2, "0")}-${day?.toString().padStart(2, "0")}`;
  }),
  SeasonName: schemaSeasonName,
  SeasonStartDate: schemaSeasonDate.transform((value) => {
    if (!value) {
      return null;
    }
    const [month, day] = value.split("/");
    return `${month?.toString().padStart(2, "0")}-${day?.toString().padStart(2, "0")}`;
  })
});
var schemaCourseDetailsTeeSetRatings = z12.object({
  BogeyRating: float,
  CourseRating: float,
  RatingType: z12.enum(["Front", "Back", "Total"]),
  SlopeRating: float
});
var schemaCourseDetailsTeeSetHole = z12.object({
  Allocation: number,
  HoleId: number,
  Length: number,
  Number: number,
  Par: number
});
var schemaCourseDetailsTeeSet = z12.object({
  EligibleSides: z12.unknown(),
  Gender: z12.enum(["Male", "Female", "Mixed"]).nullable(),
  Holes: z12.array(schemaCourseDetailsTeeSetHole),
  HolesNumber: number,
  IsShorter: boolean.nullable(),
  LegacyCRPTeeId: number,
  Ratings: z12.array(schemaCourseDetailsTeeSetRatings),
  StrokeAllocation: boolean,
  TeeSetRatingId: number,
  TeeSetRatingName: string,
  TotalMeters: number,
  TotalPar: number,
  TotalYardage: number
});
var schemaCourseDetailsResponse = z12.object({
  CourseCity: string,
  CourseId: number,
  CourseName: string,
  CourseNumber: number.nullable(),
  CourseState: schemaCourseSearchState,
  CourseStatus: schemaStatus2,
  Facility: schemaCourseDetailsFacility,
  Season: schemaCourseDetailsSeason.nullable(),
  TeeSets: z12.array(schemaCourseDetailsTeeSet)
});

// src/client/ghin/models/course/tee-set-rating.ts
import { z as z13 } from "zod";
var schemaStatus3 = string.transform((value) => value.toUpperCase()).pipe(z13.enum(["ACTIVE", "INACTIVE"]));
var schemaTeeSetRatingRequest = z13.object({
  tee_set_rating_id: number,
  include_altered_tees: boolean.optional().default(true)
});
var schemaTeeSetRatingSeason = z13.object({
  SeasonName: schemaSeasonName,
  SeasonStartDate: schemaSeasonDate.transform((value) => {
    if (!value) {
      return null;
    }
    const [month, day] = value.split("/");
    return `${month?.toString().padStart(2, "0")}-${day?.toString().padStart(2, "0")}`;
  }),
  SeasonEndDate: schemaSeasonDate.transform((value) => {
    if (!value) {
      return null;
    }
    const [month, day] = value.split("/");
    return `${month?.toString().padStart(2, "0")}-${day?.toString().padStart(2, "0")}`;
  }),
  IsAllYear: boolean
});
var schemaTeeSetRatingCourse = z13.object({
  CourseId: number,
  CourseStatus: schemaStatus3,
  CourseName: string,
  CourseNumber: number.nullable(),
  CourseCity: string,
  CourseState: schemaCourseSearchState
});
var schemaTeeSetRatingFacility = z13.object({
  FacilityId: number,
  FacilityStatus: string,
  FacilityName: string,
  FacilityNumber: number.nullable(),
  GolfAssociationId: number.nullable().optional(),
  GeoLocationFormattedAddress: schemaGeoAddress.optional(),
  GeoLocationLatitude: schemaGeoCoordinate.nullable().optional(),
  GeoLocationLongitude: schemaGeoCoordinate.nullable().optional()
});
var schemaTeeSetRatingHole = z13.object({
  HoleId: number,
  Number: number,
  Par: number,
  Length: number,
  Allocation: number
});
var schemaTeeSetRatingRating = z13.object({
  RatingType: z13.enum(["Front", "Back", "Total"]),
  CourseRating: float,
  SlopeRating: float,
  BogeyRating: float
});
var schemaTeeSetRatingResponse = z13.object({
  Season: schemaTeeSetRatingSeason.nullable(),
  Course: schemaTeeSetRatingCourse,
  Facility: schemaTeeSetRatingFacility,
  TeeSetRatingId: number,
  TeeSetRatingName: string,
  TeeSetStatus: z13.enum(["Active", "Inactive", "Deleted"]).transform((val) => val.toLowerCase()).optional(),
  Gender: z13.enum(["Male", "Female", "Mixed"]).nullable(),
  HolesNumber: number,
  TotalPar: number,
  TotalYardage: number,
  TotalMeters: number,
  StrokeAllocation: boolean,
  IsShorter: boolean.nullable(),
  LegacyCRPTeeId: number.nullable(),
  EligibleSides: z13.unknown(),
  Holes: z13.array(schemaTeeSetRatingHole),
  Ratings: z13.array(schemaTeeSetRatingRating)
});

// src/client/ghin/models/course/tee-set-rating-for-score-posting.ts
import { z as z14 } from "zod";
var schemaTeeSetRatingForScorePostingRequest = z14.object({
  course_id: number.positive()
});
var schemaTeeSetRatingForScorePostingEntry = z14.object({
  tee_set_id: number,
  tee_name: string,
  gender: string,
  course_rating: float,
  slope_rating: float,
  bogey_rating: float.nullable().optional(),
  par: number,
  holes_number: number,
  tee_set_side: teeSetSide
}).passthrough();
var schemaTeeSetRatingsForScorePostingResponse = z14.object({
  tee_set_ratings: z14.array(schemaTeeSetRatingForScorePostingEntry)
}).passthrough();

// src/client/ghin/models/facility/facility.ts
import { z as z15 } from "zod";
var schemaStatus4 = string.transform((value) => value.toUpperCase()).pipe(z15.enum(["ACTIVE", "INACTIVE"]));
var schemaFacilityCourse = z15.object({
  CourseId: number,
  CourseStatus: schemaStatus4,
  CourseName: string,
  NumberOfHoles: number
});
var schemaFacility = z15.object({
  Address1: string.nullable().optional(),
  Address2: string.nullable().optional(),
  Associations: z15.array(z15.unknown()).optional(),
  City: string.nullable(),
  Country: string.nullable(),
  Courses: z15.array(schemaFacilityCourse).optional(),
  Email: string.email().nullable().optional(),
  EntCountryCode: number.nullable(),
  EntStateCode: number.nullable(),
  FacilityId: number,
  FacilityName: string,
  FacilityStatus: schemaStatus4,
  GeoLocationLatitude: schemaGeoCoordinate.nullable().optional(),
  GeoLocationLongitude: schemaGeoCoordinate.nullable().optional(),
  State: string.nullable(),
  Telephone: string.nullable().optional(),
  UpdatedOn: shortDate.nullable().optional(),
  Zip: z15.string().trim().transform((zip) => zip?.trim() || null).nullable().optional().or(z15.array(z15.unknown()))
});

// src/client/ghin/models/facility/request.ts
import { z as z16 } from "zod";
var schemaFacilitySearchRequest = z16.object({
  country: schemaCourseCountryCode.optional(),
  facility_id: number.optional(),
  name: string.optional(),
  state: schemaCourseSearchState.optional()
}).refine(
  ({ country, state, facility_id, name }) => {
    return Boolean(country || state || facility_id || name);
  },
  {
    message: "At least one search parameter must be provided: country, state, facility_id, or name"
  }
);

// src/client/ghin/models/facility/response.ts
import { z as z17 } from "zod";
var schemaFacilitySearchResponse = z17.array(schemaFacility);

// src/client/ghin/models/golfers/search.ts
import { z as z18 } from "zod";
var schemaStatus5 = z18.enum(["Active", "Inactive"]);
var schemaGolfersGlobalSearchRequest = z18.object({
  country: string.transform((value) => value?.toUpperCase()),
  first_name: string,
  from_ghin: boolean,
  ghin: number,
  last_name: string.optional(),
  order: z18.enum(["asc", "desc"]),
  page: number,
  per_page: number.max(100),
  sorting_criteria: z18.enum(["country", "full_name", "handicap_index", "state", "status"]),
  state: string.transform((value) => value?.toUpperCase()),
  status: schemaStatus5
}).partial();
var schemaGolfersSearchRequest = z18.object({
  page: number,
  per_page: number.max(100),
  golfer_id: number.optional(),
  last_name: string.optional(),
  first_name: emptyStringToNull.optional(),
  state: emptyStringToNull.transform((value) => value?.toUpperCase()).optional(),
  country: string.transform((value) => value?.toUpperCase()).optional(),
  local_number: emptyStringToNull.optional(),
  email: emptyStringToNull.optional(),
  phone_number: emptyStringToNull.optional(),
  association_id: number.optional(),
  club_id: emptyStringToNull.optional(),
  sorting_criteria: z18.enum([
    "first_name",
    "last_name",
    "status",
    "id",
    "gender",
    "date_of_birth",
    "handicap_index",
    "status_date",
    "full_name",
    "home_club",
    "last_name_first_name"
  ]).optional(),
  order: z18.enum(["asc", "desc"]).optional(),
  status: schemaStatus5.optional(),
  updated_since: emptyStringToNull.optional()
}).partial();
var schemaGolfer = z18.object({
  ghin: number,
  first_name: string,
  last_name: string,
  association_id: number,
  association_name: string,
  handicap_index: handicap,
  club_affiliation_id: number,
  club_id: number,
  club_name: emptyStringToNull,
  country: emptyStringToNull,
  entitlement: boolean,
  gender,
  hard_cap: boolean,
  has_digital_profile: boolean,
  hi_display: string,
  hi_value: handicap,
  is_home_club: boolean,
  low_hi_date: date.nullable(),
  low_hi_display: string,
  low_hi_value: handicap,
  low_hi: handicap,
  message_club_authorized: string.nullable(),
  middle_name: emptyStringToNull.nullable().optional(),
  phone_number: emptyStringToNull.nullable().optional(),
  prefix: emptyStringToNull.optional(),
  rev_date: date.nullable(),
  soft_cap: boolean,
  state: emptyStringToNull,
  status: schemaStatus5,
  suffix: emptyStringToNull.optional()
});
var schemaGolfersSearchResponse = z18.object({
  golfers: z18.array(schemaGolfer)
});

// src/client/ghin/models/gpa/access.ts
import { z as z19 } from "zod";
var schemaGpaAccessStatus = z19.object({
  golfer_id: number,
  status: string
}).passthrough();
var schemaGpaAccessesResponse = z19.object({
  gpa_accesses: z19.array(schemaGpaAccessStatus)
});
var schemaGpaRequestAccessResponse = z19.object({
  golfer_id: number,
  status: string
}).passthrough();
var schemaGpaUpdateStatusRequest = z19.object({
  user_id: number,
  golfer_id: number,
  status: z19.enum(["approved", "denied"])
});
var schemaGpaUpdateStatusResponse = z19.object({
  golfer_id: number,
  status: string
}).passthrough();
var schemaGpaRevokeAccessResponse = z19.object({
  golfer_id: number
}).passthrough();

// src/client/ghin/models/handicaps/course-handicap.ts
import { z as z20 } from "zod";
var schemaCourseHandicapGetRequest = z20.object({
  golfer_id: number,
  course_id: number,
  tee_set_id: number,
  tee_set_side: teeSetSide,
  played_at: string,
  gender
});
var schemaCourseHandicapEntry = z20.object({
  golfer_id: number,
  course_handicap: float,
  handicap_index: float.nullable().optional()
}).passthrough();
var schemaCourseHandicapsGetResponse = z20.object({
  course_handicaps: z20.array(schemaCourseHandicapEntry)
});

// src/client/ghin/models/handicaps/course-player-handicap.ts
import { z as z21 } from "zod";
var schemaPlayerCourseHandicap = z21.object({
  playing_handicap: number,
  playing_handicap_display: string,
  shots_off: number
});
var schemaCoursePercentPlayerHandicap = z21.record(string, schemaPlayerCourseHandicap);

// src/client/ghin/models/handicaps/playing-handicap.ts
import { z as z22 } from "zod";
var schemaPlayingHandicapRequest = z22.object({
  golfer_id: number,
  course_id: number,
  tee_set_id: number,
  tee_set_side: teeSetSide,
  played_at: string,
  gender
});
var schemaPlayingHandicapEntry = z22.object({
  golfer_id: number,
  playing_handicap: number,
  course_handicap: float,
  handicap_index: float.nullable().optional()
}).passthrough();
var schemaPlayingHandicapsResponse = z22.object({
  playing_handicaps: z22.array(schemaPlayingHandicapEntry)
});

// src/client/ghin/models/handicaps/request.ts
import { z as z23 } from "zod";
var schemaTeeSetSide = z23.enum(["All 18", "F9", "B9"]);
var schemaGolferCourseHandicapBaseRequest = z23.object({
  ghin: number.optional(),
  handicap_index: number.optional(),
  tee_set_id: number,
  tee_set_side: schemaTeeSetSide
});
var schemaGolferCourseHandicapRequest = schemaGolferCourseHandicapBaseRequest.refine(({ ghin, handicap_index }) => {
  if (ghin && handicap_index) {
    throw new Error("Cannot provide both ghin and handicap_index");
  }
  if (!Number.isSafeInteger(ghin) && !Number.isSafeInteger(handicap_index)) {
    throw new Error("Must provide either ghin or handicap_index");
  }
  return true;
});
var schemaCourseHandicapsRequest = z23.object({
  golfers: z23.array(
    schemaGolferCourseHandicapBaseRequest.omit({
      ghin: true
    }).extend({
      golfer_id: number.optional()
    })
  ),
  source: z23.literal(CLIENT_SOURCE).default(CLIENT_SOURCE).optional()
});

// src/client/ghin/models/handicaps/response.ts
import { z as z24 } from "zod";
var schemaGolferHandicapClub = z24.object({
  active: boolean,
  association_id: number,
  club_name: string,
  id: number
});
var schemaGolferHandicapResponse = z24.object({
  golfer: z24.object({
    clubs: z24.array(schemaGolferHandicapClub),
    handicap_index: handicap
  })
}).passthrough();
var schemaCoursePlayerHandicapsResponse = z24.object({
  100: schemaCoursePercentPlayerHandicap,
  95: schemaCoursePercentPlayerHandicap,
  90: schemaCoursePercentPlayerHandicap,
  85: schemaCoursePercentPlayerHandicap,
  80: schemaCoursePercentPlayerHandicap,
  75: schemaCoursePercentPlayerHandicap,
  70: schemaCoursePercentPlayerHandicap,
  65: schemaCoursePercentPlayerHandicap,
  60: schemaCoursePercentPlayerHandicap,
  55: schemaCoursePercentPlayerHandicap,
  50: schemaCoursePercentPlayerHandicap,
  45: schemaCoursePercentPlayerHandicap,
  40: schemaCoursePercentPlayerHandicap,
  35: schemaCoursePercentPlayerHandicap,
  30: schemaCoursePercentPlayerHandicap,
  25: schemaCoursePercentPlayerHandicap,
  20: schemaCoursePercentPlayerHandicap,
  15: schemaCoursePercentPlayerHandicap,
  10: schemaCoursePercentPlayerHandicap,
  5: schemaCoursePercentPlayerHandicap
});

// src/client/ghin/models/scores/adjustment.ts
import { z as z25 } from "zod";
var schemaScoringAdjustment = z25.object({
  display: string,
  type: string,
  value: float
});

// src/client/ghin/models/scores/hole-detail.ts
import { z as z26 } from "zod";
var schemaHoleDetail = z26.object({
  adjusted_gross_score: number,
  approach_shot_accuracy: float.nullable().default(0),
  drive_accuracy: float.nullable(),
  fairway_hit: boolean.nullable(),
  gir_flag: z26.any(),
  hole_number: number,
  id: number,
  most_likely_score: number.nullable(),
  par: number,
  putts: number.nullable(),
  raw_score: number,
  stroke_allocation: number,
  x_hole: boolean
});

// src/client/ghin/models/scores/post-request.ts
import { z as z27 } from "zod";
var schemaScorePostHoleDetail = z27.object({
  hole_number: number.min(1).max(18),
  raw_score: number.min(1),
  x_hole: boolean.optional()
});
var schemaScoreType = z27.enum(["H", "A", "T"]);
var schemaNumberOfHoles = z27.enum(["9", "18"]);
var schemaScorePostHbhRequest = z27.object({
  golfer_id: string,
  course_id: string,
  tee_set_id: string,
  tee_set_side: teeSetSide,
  played_at: string,
  score_type: schemaScoreType,
  hole_details: z27.array(schemaScorePostHoleDetail).min(1),
  number_of_holes: schemaNumberOfHoles,
  number_of_played_holes: number.optional(),
  gender,
  override_confirmation: boolean.optional(),
  is_manual: boolean.optional()
});
var schemaScorePostAdjustedRequest = z27.object({
  golfer_id: string,
  course_id: string,
  tee_set_id: string,
  tee_set_side: teeSetSide,
  played_at: string,
  score_type: schemaScoreType,
  adjusted_gross_score: number,
  number_of_holes: schemaNumberOfHoles,
  number_of_played_holes: number.optional(),
  gender,
  override_confirmation: boolean.optional(),
  is_manual: boolean.optional()
});
var schemaScorePost18h9and9Request = z27.object({
  golfer_id: string,
  course_id: string,
  tee_set_id: string,
  played_at: string,
  score_type: schemaScoreType,
  front9_adjusted: number,
  back9_adjusted: number,
  number_of_holes: z27.literal("18"),
  gender,
  override_confirmation: boolean.optional(),
  is_manual: boolean.optional()
});

// src/client/ghin/models/scores/post-response.ts
import { z as z28 } from "zod";
var schemaScorePostResponseInner = z28.object({
  id: number,
  golfer_id: number,
  status: z28.enum(["Validated", "UnderReview"]),
  validation_message: string.nullable().optional(),
  adjusted_gross_score: number,
  number_of_holes: number,
  number_of_played_holes: number,
  differential: float,
  scaled_up_differential: float.nullable().optional(),
  adjusted_scaled_up_differential: float.nullable().optional(),
  course_id: string,
  course_name: string,
  facility_name: string,
  played_at: string,
  tee_name: string,
  tee_set_id: string,
  course_rating: float,
  slope_rating: float,
  score_type: string
}).passthrough();
var schemaScorePostResponse = z28.object({
  score: schemaScorePostResponseInner
});

// src/client/ghin/models/scores/request.ts
import { z as z31 } from "zod";

// src/client/ghin/models/scores/score.ts
import { z as z30 } from "zod";

// src/client/ghin/models/scores/statistics.ts
import { z as z29 } from "zod";
var schemaStatistics = z29.object({
  birdies_or_better_percent: float,
  bogeys_percent: float,
  double_bogeys_percent: float,
  fairway_hits_percent: float,
  gir_percent: float,
  last_stats_update_date: date,
  last_stats_update_type: emptyStringToNull,
  missed_general_approach_shot_accuracy_percent: float,
  missed_left_approach_shot_accuracy_percent: float,
  missed_left_percent: float,
  missed_long_approach_shot_accuracy_percent: float,
  missed_long_percent: float,
  missed_right_approach_shot_accuracy_percent: float,
  missed_right_percent: float,
  missed_short_approach_shot_accuracy_percent: float,
  missed_short_percent: float,
  one_putt_or_better_percent: float,
  par3s_average: float,
  par4s_average: float,
  par5s_average: float,
  pars_percent: float,
  putts_total: number,
  three_putt_or_worse_percent: float,
  triple_bogeys_or_worse_percent: float,
  two_putt_or_better_percent: float,
  two_putt_percent: float,
  up_and_downs_total: number
});

// src/client/ghin/models/scores/score.ts
var rawScoreTypes = ["A", "C", "E", "H", "N", "P", "T"];
var schemaRawScoreTypes = z30.enum(rawScoreTypes);
var scoreTypes = ["AWAY", "COMBINED", "EXCEPTIONAL", "HOME", "9_HOLE_ROUNDS", "PENALTY", "TOURNAMENT"];
var schemaScoreType2 = z30.enum(scoreTypes);
var scoreTypesMap = {
  A: "AWAY",
  C: "COMBINED",
  E: "EXCEPTIONAL",
  H: "HOME",
  N: "9_HOLE_ROUNDS",
  P: "PENALTY",
  T: "TOURNAMENT"
};
var schemaScoreTypeWithTransform = schemaRawScoreTypes.transform(
  (value) => scoreTypesMap[value]
);
var scoreStatuses = ["VALIDATED", "UNDER_REVIEW", "TEMPORARY"];
var schemaScoreStatus = z30.enum(scoreStatuses);
var rawScoreStatuses = ["Validated", "UnderReview", "Temporary"];
var schemaRawScoreStatus = z30.enum(rawScoreStatuses);
var scoreStatusesMap = {
  Validated: "VALIDATED",
  UnderReview: "UNDER_REVIEW",
  Temporary: "TEMPORARY"
};
var schemaScoreStatusWithTransform = schemaRawScoreStatus.transform(
  (value) => scoreStatusesMap[value]
);
var schemaScore = z30.object({
  adjusted_gross_score: number,
  adjustments: z30.array(schemaScoringAdjustment),
  back9_adjusted: number.nullable(),
  back9_course_rating: float.nullable(),
  back9_slope_rating: float.nullable(),
  course_id: string.nullable().optional(),
  course_name: string.optional(),
  facility_name: string.optional(),
  tee_name: string.optional(),
  course_rating: float,
  differential: float,
  edited: boolean,
  exceptional: boolean,
  front9_adjusted: number.nullable(),
  front9_course_rating: float.nullable(),
  front9_slope_rating: float.nullable(),
  gender,
  golfer_id: number,
  hole_details: z30.array(schemaHoleDetail),
  id: number,
  is_manual: boolean,
  is_recent: boolean,
  message_club_authorized: string.nullable(),
  net_score_differential: float.nullable(),
  number_of_holes: number,
  number_of_played_holes: number,
  order_number: number,
  parent_id: number.nullable(),
  pcc: float,
  penalty_method: string.nullable(),
  penalty_type: string.nullable(),
  penalty: boolean.optional(),
  played_at: date,
  posted_at: date,
  revision: boolean,
  score_day_order: number,
  score_type_display_full: string,
  score_type_display_short: string,
  score_type: schemaScoreTypeWithTransform,
  season_end_date_at: monthDay,
  season_start_date_at: monthDay,
  slope_rating: float,
  statistics: schemaStatistics.nullable().optional(),
  status: schemaScoreStatusWithTransform,
  unadjusted_differential: float,
  used: boolean
});

// src/client/ghin/models/scores/request.ts
var schemaScoresRequest = z31.object({
  course_id: number,
  from_date_played: date,
  limit: number.default(100),
  offset: number.default(0),
  score_types: z31.array(z31.enum(rawScoreTypes)),
  statuses: z31.array(string),
  tee_set_id: number,
  to_date_played: date
}).partial().default({}).optional();

// src/client/ghin/models/scores/response.ts
import { z as z32 } from "zod";
var schemaNumberOrDash = z32.union([number, z32.literal("-")]).transform((value) => value === "-" ? null : Number(value));
var schemaFloatOrDash = z32.union([float, z32.literal("-")]).transform((value) => value === "-" ? null : Number.parseFloat(value.toString()));
var schemaScoresResponse = z32.object({
  average: schemaFloatOrDash.default(0),
  highest_score: schemaNumberOrDash,
  lowest_score: schemaNumberOrDash,
  scores: z32.array(schemaScore),
  total_count: schemaNumberOrDash.default(0)
});

// src/client/ghin/index.ts
var searchParameters = {
  GOLFER_ID: "golfer_id",
  SOURCE: "source"
};
var GhinClient = class {
  httpClient;
  courses;
  facilities;
  golfers;
  gpa;
  handicaps;
  scores;
  constructor(config) {
    const results = schemaClientConfig.safeParse(config);
    if (!results.success) {
      throw new ConfigurationError(`Invalid GhinClientConfig: ${results.error.message}`);
    }
    this.httpClient = new RequestClient({
      ...results.data,
      cache: results.data.cache ?? new InMemoryCacheClient()
    });
    this.courses = {
      getCountries: this.coursesGetCountries.bind(this),
      getDetails: this.courseGetDetails.bind(this),
      search: this.courseSearch.bind(this),
      getTeeSetRating: this.courseGetTeeSetRating.bind(this),
      getTeeSetRatingsForScorePosting: this.courseGetTeeSetRatingsForScorePosting.bind(this)
    };
    this.facilities = {
      search: this.facilitySearch.bind(this)
    };
    this.gpa = {
      getAccesses: this.gpaGetAccesses.bind(this),
      requestAccess: this.gpaRequestAccess.bind(this),
      updateStatus: this.gpaUpdateStatus.bind(this),
      revokeAccess: this.gpaRevokeAccess.bind(this)
    };
    this.handicaps = {
      getOne: this.handicapsGetOne.bind(this),
      getCoursePlayerHandicaps: this.handicapsGetCoursePlayerHandicaps.bind(this),
      getCourseHandicaps: this.handicapsGetCourseHandicaps.bind(this),
      getPlayingHandicaps: this.handicapsGetPlayingHandicaps.bind(this)
    };
    this.golfers = {
      getOne: this.golfersGetOne.bind(this),
      getScores: this.golfersGetScores.bind(this),
      search: this.golfersSearch.bind(this),
      globalSearch: this.golfersGlobalSearch.bind(this)
    };
    this.scores = {
      postHoleByHole: this.scoresPostHoleByHole.bind(this),
      postAdjusted: this.scoresPostAdjusted.bind(this),
      post18h9and9: this.scoresPost18h9and9.bind(this)
    };
  }
  // ── Courses ──────────────────────────────────────────────────────────
  async coursesGetCountries() {
    try {
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "course_countries",
        options,
        schema: schemaCourseCountriesResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.countries;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async courseGetDetails(request) {
    try {
      const validRequest = schemaCourseDetailsRequest.parse(request);
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      for (const [key, value] of Object.entries(validRequest)) {
        searchParams.set(key, value.toString());
      }
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "course_details",
        options,
        schema: schemaCourseDetailsResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid course details request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async courseGetTeeSetRating(request) {
    try {
      const validRequest = schemaTeeSetRatingRequest.parse(request);
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      if (validRequest.include_altered_tees !== void 0) {
        searchParams.set("include_altered_tees", validRequest.include_altered_tees.toString());
      }
      const path = `/TeeSetRatings/${validRequest.tee_set_rating_id}.json`;
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetchCustomPath({
        path,
        options,
        schema: schemaTeeSetRatingResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid tee set rating request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async courseGetTeeSetRatingsForScorePosting(request) {
    try {
      const validRequest = schemaTeeSetRatingForScorePostingRequest.parse(request);
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      const path = `/Courses/${validRequest.course_id}/TeeSetRatingsForScorePosting.json`;
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetchCustomPath({
        path,
        options,
        schema: schemaTeeSetRatingsForScorePostingResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid tee set rating for score posting request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async courseSearch(request) {
    try {
      const validRequest = schemaCourseSearchRequest.parse(request);
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      for (const [key, value] of Object.entries(validRequest)) {
        searchParams.set(key, value.toString());
      }
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "course_search",
        options,
        schema: schemaCourseSearchResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.courses;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid course search request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  // ── Facilities ───────────────────────────────────────────────────────
  async facilitySearch(request) {
    try {
      const validRequest = schemaFacilitySearchRequest.parse(request);
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      for (const [key, value] of Object.entries(validRequest)) {
        searchParams.set(key, value.toString());
      }
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "facility_search",
        options,
        schema: schemaFacilitySearchResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid facility search request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  // ── GPA (Golfer Product Access) ──────────────────────────────────────
  async gpaGetAccesses() {
    try {
      const result = await this.httpClient.fetch({
        entity: "gpa_accesses",
        schema: schemaGpaAccessesResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.gpa_accesses;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async gpaRequestAccess(golferId) {
    try {
      const id = number.positive().parse(golferId);
      const path = `/users/golfers/${id}/request_golfer_product_access.json`;
      const result = await this.httpClient.fetchCustomPath({
        path,
        schema: schemaGpaRequestAccessResponse,
        options: {
          method: "POST"
        }
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid golfer ID: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async gpaUpdateStatus(request) {
    try {
      const validRequest = schemaGpaUpdateStatusRequest.parse(request);
      const path = `/users/${validRequest.user_id}/golfers/${validRequest.golfer_id}/update_golfer_product_access_status.json`;
      const result = await this.httpClient.fetchCustomPath({
        path,
        schema: schemaGpaUpdateStatusResponse,
        options: {
          method: "POST",
          body: JSON.stringify({ gpa_status: validRequest.status })
        }
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid GPA update status request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async gpaRevokeAccess(golferId) {
    try {
      const id = number.positive().parse(golferId);
      const path = `/users/golfers/${id}/revoke_golfer_product_access.json`;
      const result = await this.httpClient.fetchCustomPath({
        path,
        schema: schemaGpaRevokeAccessResponse,
        options: {
          method: "DELETE"
        }
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid golfer ID: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  // ── Handicaps ────────────────────────────────────────────────────────
  async handicapsGetOne(ghin) {
    try {
      const ghinNumber = number.parse(ghin);
      const searchParams = new URLSearchParams([
        ["source", CLIENT_SOURCE],
        ["ghin", ghinNumber.toString()]
      ]);
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "golfer",
        options,
        schema: schemaGolferHandicapResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.golfer;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid GHIN number: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async handicapsGetCoursePlayerHandicaps(request) {
    try {
      const golfers = z33.array(schemaGolferCourseHandicapRequest).parse(request).map(({ ghin, ...golfer }) => ({
        ...golfer,
        [searchParameters.GOLFER_ID]: ghin
      }));
      const searchParams = new URLSearchParams();
      const courseHandicapRequest = {
        golfers,
        source: CLIENT_SOURCE
      };
      const options = {
        body: JSON.stringify(courseHandicapRequest),
        method: "POST",
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "course_handicaps",
        options,
        schema: schemaCoursePlayerHandicapsResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid course handicap request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async handicapsGetCourseHandicaps(request) {
    try {
      const validRequest = schemaCourseHandicapGetRequest.parse(request);
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      for (const [key, value] of Object.entries(validRequest)) {
        searchParams.set(key, value.toString());
      }
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "course_handicaps_get",
        options,
        schema: schemaCourseHandicapsGetResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid course handicap request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async handicapsGetPlayingHandicaps(request) {
    try {
      const validRequest = schemaPlayingHandicapRequest.parse(request);
      const options = {
        method: "POST",
        body: JSON.stringify(validRequest)
      };
      const result = await this.httpClient.fetch({
        entity: "playing_handicaps_post",
        options,
        schema: schemaPlayingHandicapsResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid playing handicap request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  // ── Golfers ──────────────────────────────────────────────────────────
  async golfersSearch(request) {
    try {
      const params = schemaGolfersSearchRequest.parse(request);
      const searchParams = new URLSearchParams();
      const searchDefaults = {
        page: 1,
        per_page: 25,
        sorting_criteria: "last_name_first_name",
        status: "Active",
        order: "asc"
      };
      for (const [key, value] of Object.entries(searchDefaults)) {
        searchParams.set(key, value.toString());
      }
      for (const [key, value] of Object.entries(params)) {
        searchParams.set(key, value?.toString() ?? "");
      }
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "golfers_search",
        schema: schemaGolfersSearchResponse,
        options
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.golfers;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid golfer search request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async golfersGlobalSearch(request) {
    try {
      const { ghin } = schemaGolfersGlobalSearchRequest.parse(request);
      const searchParams = new URLSearchParams([["source", CLIENT_SOURCE]]);
      const searchDefaults = {
        from_ghin: true,
        per_page: 25,
        sorting_criteria: "full_name",
        order: "asc",
        page: 1
      };
      for (const [key, value] of Object.entries(searchDefaults)) {
        searchParams.set(key, value.toString());
      }
      if (ghin) {
        searchParams.set(searchParameters.GOLFER_ID, ghin.toString());
      }
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "golfers_global_search",
        schema: schemaGolfersSearchResponse,
        options
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.golfers;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid golfer search request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async golfersGetOne(ghinNumber) {
    try {
      const ghin = number.parse(ghinNumber);
      const results = await this.golfersGlobalSearch({
        ghin,
        status: "Active"
      });
      return results.find((golfer) => golfer.status === "Active");
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid GHIN number: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async golfersGetScores(ghinNumber, request) {
    try {
      const validRequest = schemaScoresRequest.parse(request) ?? {};
      const ghin = number.parse(ghinNumber);
      const searchParams = new URLSearchParams([
        [searchParameters.GOLFER_ID, ghin.toString()],
        ["source", CLIENT_SOURCE]
      ]);
      for (const [key, value] of Object.entries(validRequest)) {
        if (value === null) {
          continue;
        }
        if (Array.isArray(value)) {
          for (const v of value) {
            searchParams.append(key, v.toString());
          }
          continue;
        }
        if (typeof value === "object" && value instanceof Date) {
          searchParams.set(key, value.toISOString().split("T")[0]);
          continue;
        }
        searchParams.set(key, value.toString());
      }
      const options = {
        searchParams
      };
      const result = await this.httpClient.fetch({
        entity: "scores",
        options,
        schema: schemaScoresResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid scores request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  // ── Score Posting ────────────────────────────────────────────────────
  async scoresPostHoleByHole(request) {
    try {
      const validRequest = schemaScorePostHbhRequest.parse(request);
      const options = {
        method: "POST",
        body: JSON.stringify(validRequest)
      };
      const result = await this.httpClient.fetch({
        entity: "scores_hbh",
        options,
        schema: schemaScorePostResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.score;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid hole-by-hole score request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async scoresPostAdjusted(request) {
    try {
      const validRequest = schemaScorePostAdjustedRequest.parse(request);
      const options = {
        method: "POST",
        body: JSON.stringify(validRequest)
      };
      const result = await this.httpClient.fetch({
        entity: "scores_adjusted",
        options,
        schema: schemaScorePostResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.score;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid adjusted score request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
  async scoresPost18h9and9(request) {
    try {
      const validRequest = schemaScorePost18h9and9Request.parse(request);
      const options = {
        method: "POST",
        body: JSON.stringify(validRequest)
      };
      const result = await this.httpClient.fetch({
        entity: "scores_18h9and9",
        options,
        schema: schemaScorePostResponse
      });
      if (result.isErr()) {
        throw result.error;
      }
      return result.value.score;
    } catch (error) {
      if (error instanceof z33.ZodError) {
        throw new ValidationError(`Invalid 18h 9-and-9 score request: ${error.message}`);
      }
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
};
export {
  AuthenticationError,
  CacheError,
  ConfigurationError,
  ErrorCodes,
  GhinClient,
  GhinError,
  NetworkError,
  RateLimitError,
  ValidationError,
  boolean,
  date,
  emptyStringToNull,
  float,
  gender,
  handicap,
  monthDay,
  number,
  schemaCacheClient,
  schemaClientConfig,
  schemaCourseCountriesResponse,
  schemaCourseCountry,
  schemaCourseCountryCode,
  schemaCourseDetailsRequest,
  schemaCourseDetailsResponse,
  schemaCourseHandicapEntry,
  schemaCourseHandicapGetRequest,
  schemaCourseHandicapsGetResponse,
  schemaCourseHandicapsRequest,
  schemaCoursePercentPlayerHandicap,
  schemaCoursePlayerHandicapsResponse,
  schemaCourseSearchRequest,
  schemaCourseSearchResponse,
  schemaFacility,
  schemaFacilityCourse,
  schemaFacilitySearchRequest,
  schemaFacilitySearchResponse,
  schemaGolfer,
  schemaGolferCourseHandicapRequest,
  schemaGolferHandicapResponse,
  schemaGolfersGlobalSearchRequest,
  schemaGolfersSearchRequest,
  schemaGolfersSearchResponse,
  schemaGpaAccessStatus,
  schemaGpaAccessesResponse,
  schemaGpaRequestAccessResponse,
  schemaGpaRevokeAccessResponse,
  schemaGpaUpdateStatusRequest,
  schemaGpaUpdateStatusResponse,
  schemaHoleDetail,
  schemaPlayerCourseHandicap,
  schemaPlayingHandicapEntry,
  schemaPlayingHandicapRequest,
  schemaPlayingHandicapsResponse,
  schemaScorePost18h9and9Request,
  schemaScorePostAdjustedRequest,
  schemaScorePostHbhRequest,
  schemaScorePostHoleDetail,
  schemaScorePostResponse,
  schemaScoresRequest,
  schemaScoresResponse,
  schemaScoringAdjustment,
  schemaStatistics,
  schemaTeeSetRatingForScorePostingEntry,
  schemaTeeSetRatingForScorePostingRequest,
  schemaTeeSetRatingRequest,
  schemaTeeSetRatingResponse,
  schemaTeeSetRatingsForScorePostingResponse,
  schemaTeeSetSide,
  shortDate,
  string,
  teeSetSide
};
