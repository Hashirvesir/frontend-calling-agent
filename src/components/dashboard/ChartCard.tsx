'use client';

import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type ChartPoint = { day: string; calls: number };

const chartConfig: ChartConfig = {
  calls: {
    label: 'Calls',
    color: 'var(--chart-1)',
  },
};

export default function ChartCard({ data }: { data: ChartPoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Volume</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
        <CardAction>
          <Badge variant="outline" className="font-mono text-[10px]">
            7d
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-44 w-full">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                <stop offset="40%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fontFamily: 'var(--font-geist-mono)', fill: 'var(--muted-foreground)' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#gradCalls)"
              dot={{ fill: 'var(--chart-1)', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--chart-1)', strokeWidth: 2, stroke: 'var(--background)' }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
