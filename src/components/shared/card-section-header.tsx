import type { ReactNode } from "react";

import { CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardSectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  titleClassName?: string;
};

export function CardSectionHeader({
  title,
  description,
  className,
  titleClassName,
}: CardSectionHeaderProps) {
  return (
    <CardHeader className={className}>
      <CardTitle className={cn("text-xl", titleClassName)}>{title}</CardTitle>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </CardHeader>
  );
}
