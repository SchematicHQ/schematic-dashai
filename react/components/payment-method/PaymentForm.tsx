"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  loadStripe,
  type Stripe,
  type StripeConstructorOptions,
} from "@stripe/stripe-js";

import type { SetupIntentResponseData } from "@/components/api/checkoutexternal";

interface PaymentFormProps {
  setupIntent: SetupIntentResponseData;
  onSaved: (paymentMethodId: string) => void;
  onCancel: () => void;
}

export function PaymentForm({
  setupIntent,
  onSaved,
  onCancel,
}: PaymentFormProps) {
  const [loadError, setLoadError] = useState<string>();

  const stripePromise = useMemo(() => {
    let publishableKey =
      setupIntent.publishableKey || setupIntent.schematicPublishableKey;

    const stripeOptions: StripeConstructorOptions = {};

    if (setupIntent.accountId) {
      publishableKey = setupIntent.schematicPublishableKey;
      stripeOptions.stripeAccount = setupIntent.accountId;
    }

    return loadStripe(publishableKey, stripeOptions);
  }, [setupIntent]);

  useEffect(() => {
    let active = true;

    stripePromise
      .then((instance: Stripe | null) => {
        if (active && !instance) {
          setLoadError("Unable to load payment form.");
        }
      })
      .catch(() => {
        if (active) {
          setLoadError("Unable to load payment form.");
        }
      });

    return () => {
      active = false;
    };
  }, [stripePromise]);

  const clientSecret = setupIntent.setupIntentClientSecret;

  if (loadError || !clientSecret) {
    return (
      <p className="text-sm text-red-400">
        {loadError ?? "Unable to load payment form."}
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: "night" } }}
    >
      <SetupForm onSaved={onSaved} onCancel={onCancel} />
    </Elements>
  );
}

function SetupForm({
  onSaved,
  onCancel,
}: Pick<PaymentFormProps, "onSaved" | "onCancel">) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setMessage(undefined);

    try {
      const { setupIntent, error } = await stripe.confirmSetup({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: "if_required",
      });

      if (error) {
        setMessage(
          error.message ??
            "A problem occurred while saving your payment method.",
        );
        return;
      }

      if (typeof setupIntent?.payment_method === "string") {
        onSaved(setupIntent.payment_method);
      } else {
        setMessage("A problem occurred while saving your payment method.");
      }
    } catch {
      setMessage("A problem occurred while saving your payment method.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />

      {message && <p className="text-sm text-red-400">{message}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="flex grow justify-center p-4 text-lg font-medium leading-none text-white bg-accent border border-accent rounded-lg transition-all disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : "Save payment method"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="p-4 font-medium leading-none text-muted-foreground transition-all hover:underline disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
