import { SchematicBillingClient } from "@/lib/schematic";

/**
 * App-wide Schematic billing client. Construction is side-effect free, so a
 * module singleton is safe: nothing is fetched until a hook mounts.
 *
 * The access token is minted by our backend (app/api/accessToken/route.ts)
 * using the secret key; the browser only ever sees the short-lived token.
 */
export const schematicBilling = new SchematicBillingClient({
  publishableKey: process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY,
  getAccessToken: async () => {
    const response = await fetch("/api/accessToken");
    if (!response.ok) {
      throw new Error(`Failed to fetch access token (${response.status})`);
    }
    const result: { accessToken?: string; expiredAt?: string } = await response.json();
    if (!result.accessToken) {
      throw new Error("Access token response was missing accessToken");
    }
    return { token: result.accessToken, expiresAt: result.expiredAt };
  },
});
