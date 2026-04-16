import { SchematicClient } from "@schematichq/schematic-typescript-node";
import { NextRequest, NextResponse } from "next/server";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function GET(_request: NextRequest) {
  const apiKey = process.env.SCHEMATIC_SECRET_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: "No Schematic key" }, { status: 400 });
  }

  try {
    const schematicClient = new SchematicClient({ apiKey });

    const resp = await schematicClient.accesstokens.issueTemporaryAccessToken({
      lookup: {
        'id': 'demo',
      },
    });

    const accessToken = resp.data?.token;
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error("Error issuing access token", error);
    return NextResponse.json(
      { message: "Failed to issue access token" },
      { status: 500 },
    );
  }
}