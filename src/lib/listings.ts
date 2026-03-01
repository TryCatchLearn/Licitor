import type { ListingStatus } from "@/lib/db/schema";

type ListingTiming = {
  endAt: Date | null;
  now?: Date;
  startAt: Date | null;
  status: ListingStatus;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
});

const relativeDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const endedDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const getDurationParts = (targetDate: Date, now: Date) => {
  const milliseconds = targetDate.getTime() - now.getTime();

  if (milliseconds <= 0) {
    return null;
  }

  const totalHours = Math.floor(milliseconds / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;

  return { days, hours, minutes };
};

export const formatListingCurrency = (amountInCents: number) => {
  return currencyFormatter.format(amountInCents / 100);
};

export const formatBidCount = (bidCount: number) => {
  return `${bidCount} bid${bidCount === 1 ? "" : "s"}`;
};

export const getListingStatusTone = (status: ListingStatus) => {
  switch (status) {
    case "Active":
      return "border-emerald-300/65 bg-emerald-950/72 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.22),0_10px_30px_rgba(0,0,0,0.28)]";
    case "Scheduled":
      return "border-sky-300/65 bg-sky-950/72 text-sky-100 shadow-[0_0_0_1px_rgba(56,189,248,0.22),0_10px_30px_rgba(0,0,0,0.28)]";
    case "Ended":
      return "border-zinc-200/45 bg-zinc-950/72 text-zinc-100 shadow-[0_0_0_1px_rgba(244,244,245,0.1),0_10px_30px_rgba(0,0,0,0.28)]";
    default:
      return "border-amber-300/65 bg-amber-950/72 text-amber-100 shadow-[0_0_0_1px_rgba(252,211,77,0.2),0_10px_30px_rgba(0,0,0,0.28)]";
  }
};

export const getListingTimeLabel = ({
  endAt,
  now = new Date(),
  startAt,
  status,
}: ListingTiming) => {
  if (status === "Scheduled" && startAt) {
    const duration = getDurationParts(startAt, now);

    if (!duration) {
      return `Starts ${relativeDateFormatter.format(startAt)}`;
    }

    if (duration.days > 0) {
      return `Starts in ${duration.days}d ${duration.hours}h`;
    }

    return `Starts in ${Math.max(duration.hours, 0)}h ${duration.minutes}m`;
  }

  if (status === "Ended") {
    return endAt
      ? `Ended ${endedDateFormatter.format(endAt)}`
      : "Auction ended";
  }

  if (endAt) {
    const duration = getDurationParts(endAt, now);

    if (!duration) {
      return "Ending soon";
    }

    if (duration.days > 0) {
      return `Ends in ${duration.days}d ${duration.hours}h`;
    }

    return `Ends in ${Math.max(duration.hours, 0)}h ${duration.minutes}m`;
  }

  return "Timing pending";
};
