"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";

import type {
  PaymentMethodResponseData,
  SetupIntentResponseData,
} from "@/components/api/checkoutexternal";
import {
  createSetupIntent,
  removePaymentMethod,
  setDefaultPaymentMethod,
} from "./actions";
import { getExpirationDate, getPaymentMethodDisplay } from "./utils";
import { PaymentForm } from "./PaymentForm";
import { PaymentMethodSummary } from "./PaymentMethodSummary";

export interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  currentMethod?: PaymentMethodResponseData;
  otherMethods: PaymentMethodResponseData[];
}

export function PaymentDialog({
  open,
  onClose,
  currentMethod,
  otherMethods,
}: PaymentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [setupIntent, setSetupIntent] = useState<SetupIntentResponseData>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const isBusy = isLoading || isPending;

  // Each call mints a real Stripe SetupIntent, so this hangs off the button
  // rather than off `open`.
  const initializePaymentMethod = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    const result = await createSetupIntent();
    if (result.ok) {
      setSetupIntent(result.data);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  }, []);

  // Stripe holds the card once the form confirms; this syncs it to Schematic.
  const handleSaved = useCallback(
    (paymentMethodId: string) => {
      startTransition(async () => {
        const result = await setDefaultPaymentMethod(paymentMethodId);
        if (!result.ok) {
          setError(result.error);
          return;
        }

        setSetupIntent(undefined);
        onClose();
      });
    },
    [onClose],
  );

  const handleSetDefault = useCallback((externalId: string) => {
    startTransition(async () => {
      const result = await setDefaultPaymentMethod(externalId);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }, []);

  const handleRemove = useCallback((id: string) => {
    startTransition(async () => {
      const result = await removePaymentMethod(id);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Don't carry a stale setup intent or error into the next open.
  useEffect(() => {
    if (!open) {
      setSetupIntent(undefined);
      setShowOtherMethods(false);
      setError(undefined);
    }
  }, [open]);

  const ChevronIcon = showOtherMethods ? ChevronUp : ChevronDown;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-lg rounded-xl border border-border bg-card p-0 text-white shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="text-lg font-semibold">Edit payment details</h3>
        <button type="button" aria-label="Close" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-4 rounded-full bg-border px-6 py-3">
          <PaymentMethodSummary paymentMethod={currentMethod} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {otherMethods.length > 0 && !setupIntent && (
          <button
            type="button"
            onClick={() => setShowOtherMethods((prev) => !prev)}
            className="flex items-center gap-2 self-start font-medium text-accent hover:underline"
          >
            Choose different payment method
            <ChevronIcon className="h-4 w-4" aria-hidden />
          </button>
        )}

        {showOtherMethods && !setupIntent && (
          <ul className="-mt-2 flex flex-col">
            {otherMethods.map((method) => {
              const display = getPaymentMethodDisplay(method);
              const expiration = getExpirationDate(method);

              return (
                <li
                  key={method.id}
                  className="flex items-center gap-2 border-b border-border py-2"
                >
                  <display.Icon className="h-5 w-5" aria-hidden />
                  <span className="grow leading-none">
                    {display.label}{" "}
                    {display.last4 && (
                      <span className="font-semibold">{display.last4}</span>
                    )}
                  </span>

                  {expiration && (
                    <span className="grow text-muted-foreground">
                      Expires {expiration}
                    </span>
                  )}

                  {/* Setting the default keys off the Stripe id, removal off
                      the Schematic id. */}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleSetDefault(method.externalId)}
                    className="font-medium text-accent hover:underline disabled:opacity-60"
                  >
                    Set default
                  </button>

                  <button
                    type="button"
                    aria-label="Remove payment method"
                    disabled={isBusy}
                    onClick={() => handleRemove(method.id)}
                    className="text-muted-foreground disabled:opacity-60"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {setupIntent ? (
          <PaymentForm
            setupIntent={setupIntent}
            onSaved={handleSaved}
            onCancel={() => setSetupIntent(undefined)}
          />
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onClick={initializePaymentMethod}
            className="flex justify-center w-full p-4 text-lg font-medium leading-none text-white bg-accent border border-accent rounded-lg transition-all disabled:opacity-60"
          >
            {isLoading ? "Loading…" : "Add new payment method"}
          </button>
        )}
      </div>
    </dialog>
  );
}
