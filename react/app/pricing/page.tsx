import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  SchematicClient,
  type Schematic,
} from "@schematichq/schematic-typescript-node";

import { PricingTable } from "@/components/pricing-table";

export type PricingTablePeriod = {
  label: string;
  value: string;
};

export default async function Page() {
  const publishableKey = process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY;
  const secretKey = process.env.SCHEMATIC_SECRET_KEY;
  const apiKey = secretKey || publishableKey;
  if (!apiKey) {
    return NextResponse.json({ message: "No Schematic key" }, { status: 400 });
  }

  const sessionId = crypto.randomUUID();
  const schematic = new SchematicClient({ apiKey });
  const res = await schematic.componentspublic.getPublicPlans({
    headers: {
      "X-Schematic-Components-Version":
        process.env.SCHEMATIC_COMPONENTS_VERSION || "unknown",
      "X-Schematic-Session-ID": sessionId,
    },
  });

  const catalog: Schematic.PublicPlansResponseData = await res.data;
  const periods = [
    { label: "Billed monthly", value: "month" },
    { label: "Billed yearly", value: "year" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <PricingTable catalog={catalog} periods={periods} />
      </div>
    </div>
  );
}
