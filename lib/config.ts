// Edit this file to change: diagnostic lengths, which simulator each chapter uses, and reading resources.

export type Resource = { title: string; url: string; why: string };

export type ChapterConfig = {
  simulator: "circuit" | "magnet" | "light";
  resources: Resource[];
};

export const CHAPTERS: Record<string, ChapterConfig> = {
  Electricity: {
    simulator: "circuit",
    resources: [
      { title: "NCERT Class 10 Science textbook", url: "https://ncert.nic.in/textbook.php", why: "Official Electricity chapter and back-exercise numericals." },
      { title: "PhET Circuit Construction Kit (DC)", url: "https://phet.colorado.edu/en/simulation/circuit-construction-kit-dc", why: "Build series and parallel circuits and watch current change." },
      { title: "Khan Academy: Physics", url: "https://www.khanacademy.org/science/physics", why: "Short videos on Ohm's law and power." },
    ],
  },
  Magnetism: {
    simulator: "magnet",
    resources: [
      { title: "NCERT Class 10 Science textbook", url: "https://ncert.nic.in/textbook.php", why: "Magnetic effects of current, right-hand thumb rule, and coils." },
      { title: "PhET Magnets and Electromagnets", url: "https://phet.colorado.edu/en/simulation/magnets-and-electromagnets", why: "See field lines around magnets and current-carrying wires." },
    ],
  },
  Light: {
    simulator: "light",
    resources: [
      { title: "NCERT Class 10 Science textbook", url: "https://ncert.nic.in/textbook.php", why: "Reflection, refraction, and the sign-convention worked examples." },
      { title: "PhET Geometric Optics", url: "https://phet.colorado.edu/en/simulation/geometric-optics", why: "Move lenses and mirrors and watch the image change." },
      { title: "Khan Academy: Physics", url: "https://www.khanacademy.org/science/physics", why: "Short videos on lens and mirror formulas." },
    ],
  },
  "Human Eye & Colourful World": {
    simulator: "light",
    resources: [
      { title: "NCERT Class 10 Science textbook", url: "https://ncert.nic.in/textbook.php", why: "Human eye, defects of vision, dispersion, and atmospheric effects." },
      { title: "PhET Geometric Optics", url: "https://phet.colorado.edu/en/simulation/geometric-optics", why: "Explore how lenses focus light and correct vision." },
    ],
  },
};

// Diagnostic lengths the student can choose from on the onboarding screen.
export const DIAGNOSTIC_OPTIONS = [5, 8] as const;
export type DiagnosticLength = (typeof DIAGNOSTIC_OPTIONS)[number];
