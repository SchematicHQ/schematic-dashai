import {
  CheckoutexternalApi,
  Configuration as CheckoutConfiguration,
  type ComponentHydrateResponseData,
  type InvoiceResponseData,
  type Middleware,
} from "./api/checkoutexternal";
import {
  ComponentspublicApi,
  Configuration as PublicConfiguration,
  type PublicPlansResponseData,
} from "./api/componentspublic";
import { Resource, type ResourceOptions } from "./store";
import { TokenManager, type AccessTokenProvider } from "./token";

const DEFAULT_API_URL = "https://api.schematichq.com";
const API_KEY_HEADER = "X-Schematic-Api-Key";

export interface SchematicBillingClientOptions {
  /** Base URL of the Schematic API. Defaults to the production API. */
  apiUrl?: string;
  /** Publishable key (api_...). Enables the public catalog (GET /public/plans). */
  publishableKey?: string;
  /**
   * Callback that returns a temporary access token (token_...), minted by your
   * backend via POST /temporary-access-tokens. Enables all company-scoped data
   * (hydrate, invoices). Return { token, expiresAt } for exact refresh timing.
   */
  getAccessToken?: AccessTokenProvider;
  /** Optional catalog to hydrate (GET /components/hydrate?catalog_id=...). */
  catalogId?: string;
  /** Refresh the access token this long before expiry. Default 60s. */
  refreshMarginMs?: number;
  /**
   * How long a fetched result is served before a mounting hook revalidates it.
   * Default 30s; 0 revalidates on every mount.
   */
  staleTime?: number;
  /** Injectable fetch implementation (tests, SSR). Default globalThis.fetch. */
  fetchFn?: typeof fetch;
}

/**
 * Owns auth and data fetching for the Schematic consumer-facing APIs. Create
 * one instance per app; hooks (useCatalog/useBilling/useInvoices) subscribe to
 * its resources, so any number of mounted hooks share a single request per
 * endpoint. Construction is side-effect free: nothing is fetched until a hook
 * mounts (or a resource's ensure()/refetch() is called).
 */
export class SchematicBillingClient {
  readonly hasAccessTokenMode: boolean;
  readonly hasPublishableMode: boolean;

  private readonly tokens?: TokenManager;
  private readonly checkoutApi?: CheckoutexternalApi;
  private readonly publicApi?: ComponentspublicApi;
  private readonly catalogId?: string;
  private readonly resourceOptions: ResourceOptions;

  private hydrateResource?: Resource<ComponentHydrateResponseData>;
  private publicPlansResource?: Resource<PublicPlansResponseData>;
  private readonly invoiceResources = new Map<
    string,
    Resource<InvoiceResponseData[]>
  >();

  constructor(options: SchematicBillingClientOptions) {
    const { publishableKey, getAccessToken } = options;
    if (!publishableKey && !getAccessToken) {
      throw new Error(
        "SchematicBillingClient requires a publishableKey (public catalog), a getAccessToken callback (company data), or both.",
      );
    }

    const basePath = (options.apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");
    const fetchFn = options.fetchFn ?? ((...args) => globalThis.fetch(...args));
    this.catalogId = options.catalogId;
    this.resourceOptions = { staleTime: options.staleTime };
    this.hasAccessTokenMode = Boolean(getAccessToken);
    this.hasPublishableMode = Boolean(publishableKey);

    if (getAccessToken) {
      const tokens = new TokenManager({
        getAccessToken,
        refreshMarginMs: options.refreshMarginMs,
      });
      this.tokens = tokens;

      // On 401, assume the token expired early (or was revoked): drop it,
      // mint a fresh one, and retry the request exactly once. The retry uses
      // the raw fetch function — middleware `context.fetch` would re-enter
      // this middleware and could loop on a persistent 401.
      const retryOn401: Middleware = {
        post: async (context) => {
          if (context.response.status !== 401) {
            return undefined;
          }
          tokens.invalidate();
          const token = await tokens.getToken();
          const headers = {
            ...(context.init.headers as Record<string, string>),
          };
          headers[API_KEY_HEADER] = token;
          return fetchFn(context.url, { ...context.init, headers });
        },
      };

      this.checkoutApi = new CheckoutexternalApi(
        new CheckoutConfiguration({
          basePath,
          fetchApi: fetchFn,
          apiKey: () => tokens.getToken(),
          middleware: [retryOn401],
        }),
      );
    }

    if (publishableKey) {
      this.publicApi = new ComponentspublicApi(
        new PublicConfiguration({
          basePath,
          fetchApi: fetchFn,
          apiKey: publishableKey,
        }),
      );
    }
  }

  /** Shared company-context resource (GET /components/hydrate). */
  get hydrate(): Resource<ComponentHydrateResponseData> {
    const api = this.checkoutApi;
    if (!api) {
      throw new Error(
        "This SchematicBillingClient has no getAccessToken callback; company data (useBilling, company-mode useCatalog, useInvoices) is unavailable.",
      );
    }
    this.hydrateResource ??= new Resource(async () => {
      const response = await api.hydrate(
        this.catalogId ? { catalogId: this.catalogId } : {},
      );
      return response.data;
    }, this.resourceOptions);
    return this.hydrateResource;
  }

  /** Public catalog resource (GET /public/plans). */
  get publicPlans(): Resource<PublicPlansResponseData> {
    const api = this.publicApi;
    if (!api) {
      throw new Error(
        "This SchematicBillingClient has no publishableKey; the public catalog is unavailable.",
      );
    }
    this.publicPlansResource ??= new Resource(async () => {
      const response = await api.getPublicPlans();
      return response.data;
    }, this.resourceOptions);
    return this.publicPlansResource;
  }

  /**
   * Invoice list resource (GET /components/invoices). One resource per
   * limit/offset combination, so hook subscriptions stay referentially stable.
   */
  invoices(params?: {
    limit?: number;
    offset?: number;
  }): Resource<InvoiceResponseData[]> {
    const api = this.checkoutApi;
    if (!api) {
      throw new Error(
        "This SchematicBillingClient has no getAccessToken callback; invoices are unavailable.",
      );
    }
    const key = `${params?.limit ?? ""}:${params?.offset ?? ""}`;
    let resource = this.invoiceResources.get(key);
    if (!resource) {
      resource = new Resource(async () => {
        const response = await api.listInvoices({
          limit: params?.limit,
          offset: params?.offset,
        });
        return response.data;
      }, this.resourceOptions);
      this.invoiceResources.set(key, resource);
    }
    return resource;
  }

  /**
   * Mark all company-scoped data stale (e.g. after a future checkout or
   * payment-method change). Mounted hooks refetch immediately.
   */
  invalidate(): void {
    this.hydrateResource?.invalidate();
    for (const resource of this.invoiceResources.values()) {
      resource.invalidate();
    }
  }
}
