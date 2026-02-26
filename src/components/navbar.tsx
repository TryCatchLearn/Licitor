import Link from "next/link";
import { NavbarAuth } from "@/components/navbar-auth";

export function Navbar() {
  return (
    <header className="border-b border-border/70 bg-card/60 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-semibold tracking-wide text-primary transition-opacity hover:opacity-80"
          >
            LICITOR
          </Link>
          <Link
            href="/listings"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            Listings
          </Link>
        </div>
        <NavbarAuth />
      </nav>
    </header>
  );
}
