import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  ComponentspublicApi,
  Configuration,
  type PlanViewPublicResponseData,
  type PublicPlansResponseData,
} from "../components/api/componentspublic";
import { PricingTable } from "./headless/pricing-table";

const getPrice = (plan: PlanViewPublicResponseData, period?: string) => {
  switch (period) {
    case "year":
      return plan.yearlyPrice;
    case "quarter":
      return plan.quarterlyPrice;
    case "month":
      return plan.monthlyPrice;
  }
};

export function PricingTableElement() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedCurrency, setSelectedCurrency] = useState("month");
  const [catalog, setCatalog] = useState<PublicPlansResponseData>();

  const periods = ["month", "year"];
  const currencies = ["usd"];

  const sessionId = useMemo(() => uuidv4(), []);
  const api = useMemo(
    () =>
      new ComponentspublicApi(
        new Configuration({
          apiKey: process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY,
          headers: {
            "X-Schematic-Components-Version":
              process.env.SCHEMATIC_COMPONENTS_VERSION || "unknown",
            "X-Schematic-Session-ID": sessionId,
          },
        }),
      ),
    [sessionId],
  );

  useEffect(() => {
    api.getPublicPlans().then((res) => {
      setCatalog(res.data);
    });
  }, []);

  return (
    <PricingTable.Root
      periods={periods}
      currencies={currencies}
      onPeriodChange={(period) => {
        setSelectedPeriod(period);
      }}
      onCurrencyChange={(currency) => {
        setSelectedCurrency(currency);
      }}
    >
      {currencies.length > 1 && (
        <PricingTable.CurrencyToggle>
          {currencies.map((currency) => (
            <PricingTable.CurrencyOption key={currency} value={currency}>
              {currency.toUpperCase()}
            </PricingTable.CurrencyOption>
          ))}
        </PricingTable.CurrencyToggle>
      )}

      {periods.length > 1 && (
        <PricingTable.PeriodToggle>
          {periods.map((period) => (
            <PricingTable.PeriodOption key={period} value={period}>
              {period}
            </PricingTable.PeriodOption>
          ))}
        </PricingTable.PeriodToggle>
      )}

      <PricingTable.Label>Plans</PricingTable.Label>
      <PricingTable.Section>
        {catalog?.activePlans.map((plan) => (
          <PricingTable.Card key={plan.id}>
            <PricingTable.Name>{plan.name}</PricingTable.Name>
            <PricingTable.Description>
              {plan.description}
            </PricingTable.Description>
            <PricingTable.Price>
              {getPrice(plan, selectedPeriod)?.price}
            </PricingTable.Price>

            <PricingTable.Entitlements>
              {plan.entitlements?.map((entitlement) => (
                <PricingTable.Entitlement key={entitlement.id}>
                  {entitlement.feature?.name}
                </PricingTable.Entitlement>
              ))}
            </PricingTable.Entitlements>

            <PricingTable.Footer>
              <PricingTable.CallToAction>Choose plan</PricingTable.CallToAction>
            </PricingTable.Footer>
          </PricingTable.Card>
        ))}
      </PricingTable.Section>

      <PricingTable.Label>Add-ons</PricingTable.Label>
      <PricingTable.Section>
        {catalog?.activeAddOns.map((addOn) => (
          <PricingTable.Card key={addOn.id}>
            <PricingTable.Name>{addOn.name}</PricingTable.Name>
          </PricingTable.Card>
        ))}
      </PricingTable.Section>
    </PricingTable.Root>
  );
}
