import { PlanManager } from "@/components/plan-manager";
import { getCheckoutApi } from "@/lib/checkout";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!process.env.SCHEMATIC_SECRET_KEY) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        No Schematic key
      </div>
    );
  }

  const checkoutApi = await getCheckoutApi();
  const { data } = await checkoutApi.hydrate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <div className="max-w-xl pt-16">
          <PlanManager data={data} />
        </div>
      </div>
    </div>
  );
}
