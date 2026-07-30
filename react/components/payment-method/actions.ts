"use server";

import { revalidatePath } from "next/cache";
import { SchematicClient } from "@schematichq/schematic-typescript-node";

import { COMPANY_LOOKUP } from "@/lib/constants";
import {
  CheckoutexternalApi,
  Configuration,
  type SetupIntentResponseData,
} from "@/components/api/checkoutexternal";

const BILLING_PATH = "/billing";

const TOKEN_REFRESH_MARGIN_MS = 60_000;

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

let cachedToken: { token: string; expiresAt: number } | undefined;

async function getCheckoutApi(): Promise<CheckoutexternalApi> {
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

export async function createSetupIntent(): Promise<
  ActionResult<SetupIntentResponseData>
> {
  try {
    const checkoutApi = await getCheckoutApi();
    const response = await checkoutApi.createSetupIntent();
    return { ok: true, data: response.data };
  } catch (error) {
    console.error("Error creating setup intent", error);
    return {
      ok: false,
      error: "Error initializing payment method change. Please try again.",
    };
  }
}

export async function setDefaultPaymentMethod(
  paymentMethodId: string,
): Promise<ActionResult> {
  try {
    const checkoutApi = await getCheckoutApi();
    await checkoutApi.updatePaymentMethod({
      updatePaymentMethodRequestBody: { paymentMethodId },
    });

    revalidatePath(BILLING_PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error updating payment method", error);
    return { ok: false, error: "Error updating payment method." };
  }
}

export async function removePaymentMethod(
  paymentMethodId: string,
): Promise<ActionResult> {
  try {
    const checkoutApi = await getCheckoutApi();
    // The generated param is named `checkoutId`, but the path takes a payment
    // method id.
    await checkoutApi.deletePaymentMethod({ checkoutId: paymentMethodId });

    revalidatePath(BILLING_PATH);
    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error deleting payment method", error);
    return { ok: false, error: "Error removing payment method." };
  }
}
