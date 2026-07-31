"use server";

import { revalidatePath } from "next/cache";

import { getCheckoutApi } from "@/lib/checkout";
import { type SetupIntentResponseData } from "@/components/api/checkoutexternal";

const BILLING_PATH = "/billing";

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
