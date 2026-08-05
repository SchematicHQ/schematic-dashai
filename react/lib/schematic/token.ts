/**
 * Temporary access tokens issued by the Schematic API are opaque and expire
 * after 15 minutes. TokenManager caches the current token, refreshes it
 * proactively before expiry, and lets the request layer force a refresh when
 * the API rejects a token (401).
 */

export type AccessTokenResult =
  string | { token: string; expiresAt?: string | Date };

export type AccessTokenProvider = () => Promise<AccessTokenResult>;

export interface TokenManagerOptions {
  getAccessToken: AccessTokenProvider;
  /** Refresh this long before the token's actual expiry. Default 60s. */
  refreshMarginMs?: number;
  /** Assumed lifetime when the provider returns a bare string. Default 15min. */
  fallbackTtlMs?: number;
  /** Injectable clock for tests. */
  now?: () => number;
}

const DEFAULT_REFRESH_MARGIN_MS = 60_000;
const DEFAULT_FALLBACK_TTL_MS = 15 * 60_000;

export class TokenManager {
  private readonly getAccessToken: AccessTokenProvider;
  private readonly refreshMarginMs: number;
  private readonly fallbackTtlMs: number;
  private readonly now: () => number;

  private token: string | undefined;
  private expiresAtMs: number | undefined;
  private inFlight: Promise<string> | undefined;

  constructor(options: TokenManagerOptions) {
    this.getAccessToken = options.getAccessToken;
    this.refreshMarginMs = options.refreshMarginMs ?? DEFAULT_REFRESH_MARGIN_MS;
    this.fallbackTtlMs = options.fallbackTtlMs ?? DEFAULT_FALLBACK_TTL_MS;
    this.now = options.now ?? (() => Date.now());
  }

  getToken(): Promise<string> {
    if (
      this.token !== undefined &&
      this.expiresAtMs !== undefined &&
      this.now() < this.expiresAtMs - this.refreshMarginMs
    ) {
      return Promise.resolve(this.token);
    }
    return this.refresh();
  }

  /** Drop the cached token so the next getToken() fetches a fresh one. */
  invalidate(): void {
    this.token = undefined;
    this.expiresAtMs = undefined;
  }

  private refresh(): Promise<string> {
    if (this.inFlight) {
      return this.inFlight;
    }
    this.inFlight = this.getAccessToken()
      .then((result) => {
        const { token, expiresAt } =
          typeof result === "string"
            ? { token: result, expiresAt: undefined }
            : result;
        if (!token) {
          throw new Error("getAccessToken returned an empty token");
        }
        this.token = token;
        this.expiresAtMs = expiresAt
          ? new Date(expiresAt).getTime()
          : this.now() + this.fallbackTtlMs;
        return token;
      })
      .finally(() => {
        this.inFlight = undefined;
      });
    return this.inFlight;
  }
}
