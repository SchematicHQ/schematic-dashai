import { SchematicClient } from "@schematichq/schematic-typescript-node";

import { COMPANY_LOOKUP } from "@/lib/constants";
import {
  CheckoutexternalApi,
  Configuration,
} from "@/components/api/checkoutexternal";

const TOKEN_REFRESH_MARGIN_MS = 60_000;

let cachedToken: { token: string; expiresAt: number } | undefined;

/**
 * The checkout API is company-scoped: it authenticates with a temporary access
 * token issued for a company rather than with the secret key.
 */
export async function getCheckoutApi(): Promise<CheckoutexternalApi> {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Missing SCHEMATIC_SECRET_KEY");
  }

  if (!cachedToken || cachedToken.expiresAt <= Date.now()) {
    const { data } = await new SchematicClient({
      apiKey,
    }).accesstokens.issueTemporaryAccessToken({ lookup: COMPANY_LOOKUP });

    cachedToken = {
      token: data.token,
      expiresAt: new Date(data.expiredAt).getTime() - TOKEN_REFRESH_MARGIN_MS,
    };
  }

  return new CheckoutexternalApi(
    new Configuration({ apiKey: cachedToken.token }),
  );
}
