import { SchematicClient } from "@schematichq/schematic-typescript-node";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function GET(_request: NextRequest) {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: "No Schematic key" }, { status: 400 });
  }

  try {
    const { userId } = await auth();
    const client = await clerkClient();
    const organizationMemeberships = await client.users.getOrganizationMembershipList({
      userId: userId!,
    })

    const orgId = organizationMemeberships.data[0].organization.id;

    const basePath = process.env.NEXT_PUBLIC_SCHEMATIC_API_URL;
    const schematicClient = new SchematicClient({ apiKey, basePath });

    const resp = await schematicClient.entitlements.getFeatureUsageByCompany({
      keys: {
        'id': 'demo',
      },
    });

    const { features } = resp.data;
    console.log(features)
    const feature = features.filter((feature) => feature.priceBehavior === "credit_burndown")[0];
    const response = feature ? { allocation: feature.creditTotal, usage: feature.creditUsed } : null;
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching credit balance", error);
    return NextResponse.json(
      { message: "Error fetching credit balance" },
      { status: 500 },
    );
  }
}