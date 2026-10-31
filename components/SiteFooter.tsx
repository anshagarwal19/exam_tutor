import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-rule bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-2">
          <Link href="/" className="font-display text-xl font-semibold tracking-tight">
            Concept<span className="text-accent">Compass</span>
          </Link>
          <p className="max-w-md text-sm leading-6 text-graphite">
            An adaptive exam-prep tutor for Class 10 Physics. Build concept mastery with personalized
            practice, question-aligned simulators, spaced review, and weekly mock tests.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Study</h2>
          <ul className="space-y-2 text-sm text-graphite">
            <li><Link className="hover:text-ink" href="/onboarding">Diagnostic test</Link></li>
            <li><Link className="hover:text-ink" href="/skill-map">Concept skill map</Link></li>
            <li><Link className="hover:text-ink" href="/practice">Adaptive practice</Link></li>
            <li><Link className="hover:text-ink" href="/mock-tests">Weekly mock tests</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Your learning</h2>
          <ul className="space-y-2 text-sm text-graphite">
            <li><Link className="hover:text-ink" href="/report">Learning report</Link></li>
            <li><Link className="hover:text-ink" href="/teacher">Teacher dashboard</Link></li>
          </ul>
        </div>

        <div className="border-t border-rule pt-5 text-sm text-graphite sm:col-span-2 lg:col-span-4">
          Created by <span className="font-semibold text-ink">AI Jassus</span>
        </div>
      </div>
    </footer>
  );
}
