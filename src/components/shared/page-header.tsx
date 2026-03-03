import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  rightSlot,
  className,
  titleClassName,
  descriptionClassName,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-sm uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>

      {rightSlot ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <h1
            className={cn(
              "text-3xl font-semibold text-foreground md:text-4xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
          {rightSlot}
        </div>
      ) : (
        <h1
          className={cn(
            "text-3xl font-semibold text-foreground md:text-4xl",
            titleClassName,
          )}
        >
          {title}
        </h1>
      )}

      {description ? (
        <p
          className={cn(
            "max-w-2xl text-muted-foreground",
            descriptionClassName,
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
