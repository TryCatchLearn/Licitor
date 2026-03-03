import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateCardProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function EmptyStateCard({
  eyebrow,
  title,
  description,
  actions,
  className,
  contentClassName,
}: EmptyStateCardProps) {
  return (
    <Card
      className={cn(
        "border-dashed border-border/70 bg-card/70 py-0",
        className,
      )}
    >
      <CardHeader className="gap-3 px-6 py-6">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("px-6 pb-6", contentClassName)}>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        {actions}
      </CardContent>
    </Card>
  );
}
