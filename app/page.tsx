import Link from "next/link";
import LearnerProgressCard from "@/components/LearnerProgressCard";
import HomeGreeting from "@/components/HomeGreeting";

export default function Landing() {
  return (
    <div className="space-y-28">
      {/* HERO */}
      <section className="grid items-center gap-12 pt-10 md:grid-cols-2">
        <div className="space-y-6">
          <HomeGreeting />
          <p className="annotation">"I got it right, why don't I understand it?"</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
            Most tutors check your answer.
            <span className="block text-accent">We check your thinking.</span>
          </h1>
          <p className="max-w-lg text-lg text-graphite">
            Five questions tell you where you stand. Every answer gets feedback on the reasoning behind it, a simulator for the chapter, and a report with a roadmap.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/onboarding" className="btn-primary">Take the 5-question diagnostic</Link>
            <Link href="/mock-tests" className="btn-ghost">Chapter mock tests</Link>
            <Link href="/skill-map" className="btn-ghost">See a sample map</Link>
          </div>
        </div>
        <LearnerProgressCard />
      </section>

      {/* STORY */}
      <section className="notebook-card space-y-6 md:p-12">
        <p className="annotation">Story, in three wrong answers</p>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            ["Round 1", "Riya gets 'f = +20 cm' for a concave mirror. Most tutors just say 'wrong, try again'."],
            ["Round 2", "Concept Compass reads her reasoning: 'Concave is always positive.' That's a sign-convention gap, not a formula gap."],
            ["Round 3", "The report flags sign convention as the focus. Her next questions, and the simulator, work on exactly that."],
          ].map(([k, v]) => (
            <div key={k} className="space-y-2">
              <h3 className="font-display text-xl">{k}</h3>
              <p className="text-graphite">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid gap-6 md:grid-cols-3">
        {[
          ["Feedback on every answer", "You see right or wrong at once, plus the likely reason you got it wrong."],
          ["A simulator for each question", "Interactive experiments follow the concept being tested, from current and fields to ray diagrams and the human eye."],
          ["A report with a roadmap", "Radar chart, strengths, gaps, top three focus areas, a weekly plan, and where to study next."],
        ].map(([t, d]) => (
          <div key={t} className="notebook-card transition hover:-translate-y-1">
            <h3 className="mb-2 font-display text-xl">{t}</h3>
            <p className="text-graphite">{d}</p>
          </div>
        ))}
      </section>

      <section className="text-center">
        <Link href="/onboarding" className="btn-primary !px-8 !py-4 text-lg">Start with your first 5 questions</Link>
      </section>
    </div>
  );
}
