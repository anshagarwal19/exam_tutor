import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Nav() {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 pt-5">
      <Link href="/" className="font-display text-xl font-semibold tracking-tight">
        Concept<span className="text-accent">Compass</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm text-graphite">
        <Link href="/skill-map" className="hover:text-ink">Skill map</Link>
        <Link href="/practice" className="hover:text-ink">Practice</Link>
        <Link href="/mock-tests" className="hover:text-ink">Mock tests</Link>
        <Link href="/report" className="hover:text-ink">Report</Link>
        <Link href="/teacher" className="hover:text-ink">Teacher</Link>
        <Link href="/account" className="hover:text-ink">Account</Link>
        <ThemeToggle />
        <Link href="/onboarding" className="btn-primary !px-4 !py-2 text-sm">Start</Link>
      </nav>
    </header>
  );
}
