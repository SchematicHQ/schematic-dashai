"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Activity,
} from "lucide-react";

const revenueData = [
  { month: "Jan", revenue: 4200, target: 4000 },
  { month: "Feb", revenue: 3800, target: 4200 },
  { month: "Mar", revenue: 5100, target: 4400 },
  { month: "Apr", revenue: 4900, target: 4600 },
  { month: "May", revenue: 6200, target: 4800 },
  { month: "Jun", revenue: 5800, target: 5000 },
  { month: "Jul", revenue: 7100, target: 5200 },
  { month: "Aug", revenue: 6800, target: 5400 },
];

const userActivityData = [
  { day: "Mon", active: 2400, new: 400 },
  { day: "Tue", active: 1398, new: 300 },
  { day: "Wed", active: 9800, new: 500 },
  { day: "Thu", active: 3908, new: 480 },
  { day: "Fri", active: 4800, new: 380 },
  { day: "Sat", active: 3800, new: 430 },
  { day: "Sun", active: 4300, new: 340 },
];

const trafficSourceData = [
  { name: "Organic", value: 42, fill: "#6366f1" },
  { name: "Direct", value: 28, fill: "#22c55e" },
  { name: "Referral", value: 18, fill: "#f59e0b" },
  { name: "Social", value: 12, fill: "#ec4899" },
];

const conversionData = [
  { week: "W1", visitors: 1200, signups: 120, purchases: 45 },
  { week: "W2", visitors: 1400, signups: 150, purchases: 52 },
  { week: "W3", visitors: 1100, signups: 98, purchases: 38 },
  { week: "W4", visitors: 1600, signups: 180, purchases: 68 },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="text-muted-foreground">{data.name}:</span>
        <span className="font-medium">{data.value}%</span>
      </div>
    </div>
  );
}

export function GeneratedDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Generated Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Business performance overview
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live data
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">$43,900</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+12.5%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">8,234</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+8.2%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-2xl font-bold">1,429</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">-3.1%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold">3.24%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500">+0.4%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue vs Target</CardTitle>
            <CardDescription>Monthly performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "#6366f1" },
                target: { label: "Target", color: "#404040" },
              }}
              className="h-[250px] w-full"
            >
              <AreaChart data={revenueData} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="month"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="var(--color-target)"
                  fill="var(--color-target)"
                  fillOpacity={0.3}
                  name="Target"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="var(--color-revenue)"
                  fillOpacity={0.5}
                  name="Revenue"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">User Activity</CardTitle>
            <CardDescription>Daily active and new users</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                active: { label: "Active Users", color: "#22c55e" },
                new: { label: "New Users", color: "#6366f1" },
              }}
              className="h-[250px] w-full"
            >
              <BarChart data={userActivityData} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="day"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="active"
                  fill="var(--color-active)"
                  radius={[4, 4, 0, 0]}
                  name="Active Users"
                />
                <Bar
                  dataKey="new"
                  fill="var(--color-new)"
                  radius={[4, 4, 0, 0]}
                  name="New Users"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                Organic: { label: "Organic", color: "#6366f1" },
                Direct: { label: "Direct", color: "#22c55e" },
                Referral: { label: "Referral", color: "#f59e0b" },
                Social: { label: "Social", color: "#ec4899" },
              }}
              className="h-[200px] w-full"
            >
              <PieChart accessibilityLayer>
                <Pie
                  data={trafficSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {trafficSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {trafficSourceData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="text-xs font-medium ml-auto">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>
              Weekly visitor to purchase journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                visitors: { label: "Visitors", color: "#666" },
                signups: { label: "Signups", color: "#6366f1" },
                purchases: { label: "Purchases", color: "#22c55e" },
              }}
              className="h-[200px] w-full"
            >
              <LineChart data={conversionData} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="week"
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#666"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="var(--color-visitors)"
                  strokeWidth={2}
                  dot={false}
                  name="Visitors"
                />
                <Line
                  type="monotone"
                  dataKey="signups"
                  stroke="var(--color-signups)"
                  strokeWidth={2}
                  dot={false}
                  name="Signups"
                />
                <Line
                  type="monotone"
                  dataKey="purchases"
                  stroke="var(--color-purchases)"
                  strokeWidth={2}
                  dot={false}
                  name="Purchases"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
