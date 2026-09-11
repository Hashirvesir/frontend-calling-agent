import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type MetricCardProps = {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
  icon?: LucideIcon;
  accentClass?: string;
  index?: number;
};

export default function MetricCard({
  label,
  value,
  delta,
  positive,
  icon: Icon,
  accentClass,
  index = 0,
}: MetricCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        'metric-card relative overflow-hidden transition-colors duration-200 hover:ring-foreground/20',
        accentClass
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <CardHeader className="pb-0">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <CardAction>
            <div className="flex size-7 items-center justify-center rounded-md bg-muted/60">
              <Icon className="size-3.5 text-muted-foreground" />
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-3xl font-semibold tracking-tight tabular-nums leading-none text-foreground">
          {value}
        </p>
        <p
          className={cn(
            'mt-2 font-mono text-[11px] leading-none',
            positive ? 'text-chart-1' : 'text-muted-foreground'
          )}
        >
          {delta}
        </p>
      </CardContent>
    </Card>
  );
}
