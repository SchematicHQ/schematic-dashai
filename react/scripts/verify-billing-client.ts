/**
 * Manual end-to-end check of lib/schematic against the live Schematic API.
 * Mints a temporary access token exactly like app/api/accessToken/route.ts,
 * then drives SchematicBillingClient's resources. Run: npx tsx scripts/verify-billing-client.ts
 */
import { SchematicClient } from "@schematichq/schematic-typescript-node";
import { config } from "dotenv";

import { SchematicBillingClient } from "../lib/schematic";

config({ path: ".env.local" });

async function main() {
  const secretKey = process.env.SCHEMATIC_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY;
  if (!secretKey) {
    throw new Error("SCHEMATIC_SECRET_KEY missing from .env.local");
  }

  const node = new SchematicClient({ apiKey: secretKey });
  const client = new SchematicBillingClient({
    publishableKey,
    getAccessToken: async () => {
      const resp = await node.accesstokens.issueTemporaryAccessToken({
        lookup: { id: "demo" },
      });
      console.log("[token] issued, expiredAt:", resp.data?.expiredAt);
      return { token: resp.data!.token, expiresAt: resp.data!.expiredAt };
    },
  });

  await client.hydrate.refetch();
  const hydrate = client.hydrate.getSnapshot();
  if (hydrate.error) throw hydrate.error;
  const d = hydrate.data!;
  console.log("[hydrate]", {
    plans: d.activePlans.map((p) => `${p.name}${p.current ? " (current)" : ""}`),
    company: d.company?.name,
    companyPlan: d.company?.plan?.name,
    planPrice: d.company?.plan?.planPrice,
    subscriptionStatus: d.subscription?.status,
    upcomingInvoiceDue: d.upcomingInvoice?.amountDue,
    features: (d.featureUsage?.features ?? []).map(
      (f) => `${f.feature?.name} [${f.feature?.featureType}] usage=${f.usage} alloc=${f.allocation} pb=${f.priceBehavior}`,
    ),
    creditGrants: d.creditGrants.map(
      (g) => `${g.creditName} ${g.quantityUsed}/${g.quantity} (${g.grantReason})`,
    ),
    displaySettings: d.displaySettings,
  });

  await client.invoices({ limit: 12 }).refetch();
  const invoices = client.invoices({ limit: 12 }).getSnapshot();
  if (invoices.error) throw invoices.error;
  console.log(
    "[invoices]",
    invoices.data!.map((i) => `${i.id} ${i.status} due=${i.amountDue} ${i.dueDate?.toISOString()}`),
  );

  if (publishableKey) {
    await client.publicPlans.refetch();
    const pub = client.publicPlans.getSnapshot();
    if (pub.error) throw pub.error;
    console.log(
      "[public plans]",
      pub.data!.activePlans.map((p) => `${p.name} monthly=${p.monthlyPrice?.price}`),
    );
  } else {
    console.log("[public plans] skipped — no publishable key");
  }
}

main().catch((error) => {
  console.error("VERIFY FAILED:", error);
  process.exit(1);
});
