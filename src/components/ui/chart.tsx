import * as React from "react";
import { Tooltip as RechartsTooltip } from "recharts";
import type { TooltipProps } from "recharts";

type ChartConfig = Record<string, { label?: string; color?: string }>;

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig;
}

function ChartContainer({ config = {}, className, children, ...props }: ChartContainerProps) {
  // Apply simple CSS variables for colors based on config
  const styleVars: React.CSSProperties & Record<string, any> = {};
  Object.entries(config).forEach(([key, value]) => {
    if (value?.color) {
      // expose as --color-<key>
      styleVars[`--color-${key}`] = value.color;
    }
  });

  return (
    <div
      className={className}
      style={{ ...styleVars }}
      {...props}
    >
      {children}
    </div>
  );
}

function ChartTooltip(props: TooltipProps<any, any>) {
  // Thin wrapper around Recharts Tooltip so callers can pass a `content` element
  return <RechartsTooltip {...props} />;
}

interface ChartTooltipContentProps {
  hideIndicator?: boolean;
}

function ChartTooltipContent({ hideIndicator }: ChartTooltipContentProps) {
  return (
    <div className="rounded-md border bg-card p-2 text-sm">
      {!hideIndicator && <div className="h-1 w-1 rounded-full bg-primary mr-2 inline-block align-middle" />}
      <div className="inline-block align-middle">{/* content filled by Recharts via cloneElement */}</div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
