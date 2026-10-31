export type Chapter = "Electricity" | "Magnetism" | "Light" | "Human Eye & Colourful World";

export type Concept = {
  id: string;
  label: string;
  chapter: Chapter;
  prereqs: string[];
  remediation: string;
};

export const CONCEPTS: Concept[] = [
  { id: "electric_current", label: "Electric current", chapter: "Electricity", prereqs: [], remediation: "Current is the rate of flow of charge: I = Q/t." },
  { id: "potential_difference", label: "Potential difference", chapter: "Electricity", prereqs: ["electric_current"], remediation: "Potential difference is work done per unit charge: V = W/Q." },
  { id: "circuit_components", label: "Circuit components", chapter: "Electricity", prereqs: ["electric_current"], remediation: "Use a closed conducting path and connect an ammeter in series and a voltmeter in parallel." },
  { id: "resistance", label: "Resistance", chapter: "Electricity", prereqs: ["potential_difference", "electric_current"], remediation: "Resistance is the ratio V/I and is measured in ohms." },
  { id: "resistance_factors", label: "Factors affecting resistance", chapter: "Electricity", prereqs: ["resistance"], remediation: "Resistance increases with length and decreases with cross-sectional area; material and temperature also matter." },
  { id: "ohms_law", label: "Ohm's law", chapter: "Electricity", prereqs: ["resistance"], remediation: "At constant temperature, V = IR." },
  { id: "series_parallel", label: "Series & parallel", chapter: "Electricity", prereqs: ["ohms_law"], remediation: "Series resistances add; parallel branches add reciprocals." },
  { id: "electric_power", label: "Electrical power", chapter: "Electricity", prereqs: ["ohms_law"], remediation: "Electrical power is P = VI; use Ohm's law to derive equivalent forms." },
  { id: "heating_effect", label: "Heating effect of current", chapter: "Electricity", prereqs: ["electric_power"], remediation: "Joule heating is H = I^2Rt." },
  { id: "magnetic_field", label: "Magnetic field", chapter: "Magnetism", prereqs: [], remediation: "Magnetic field lines form closed curves and never intersect." },
  { id: "field_around_current", label: "Field around a current-carrying wire", chapter: "Magnetism", prereqs: ["magnetic_field", "electric_current"], remediation: "Use the right-hand thumb rule to find the circular magnetic-field direction." },
  { id: "solenoid", label: "Solenoid and electromagnet", chapter: "Magnetism", prereqs: ["field_around_current"], remediation: "A current-carrying solenoid produces a field like a bar magnet; an iron core strengthens it." },
  { id: "force_on_conductor", label: "Force on a current-carrying conductor", chapter: "Magnetism", prereqs: ["field_around_current"], remediation: "A conductor carrying current in a magnetic field experiences a force." },
  { id: "fleming_left_hand", label: "Fleming's left-hand rule", chapter: "Magnetism", prereqs: ["force_on_conductor"], remediation: "First finger is field, middle finger current, and thumb force; keep the three directions mutually perpendicular." },
  { id: "electric_motor", label: "Electric motor", chapter: "Magnetism", prereqs: ["force_on_conductor", "fleming_left_hand"], remediation: "A motor converts electrical energy to mechanical energy using force on a current-carrying coil; the split-ring commutator reverses current each half-turn." },
  { id: "electromagnetic_induction", label: "Electromagnetic induction", chapter: "Magnetism", prereqs: ["field_around_current"], remediation: "A changing magnetic field through a coil induces current; relative motion changes magnetic flux." },
  { id: "electric_generator", label: "Electric generator", chapter: "Magnetism", prereqs: ["electromagnetic_induction", "ac_dc"], remediation: "A generator converts mechanical energy to electrical energy by electromagnetic induction." },
  { id: "ac_dc", label: "AC and DC", chapter: "Magnetism", prereqs: ["electric_current"], remediation: "Direct current flows in one direction; alternating current reverses direction periodically." },
  { id: "domestic_circuits", label: "Domestic electric circuits", chapter: "Magnetism", prereqs: ["series_parallel", "electric_power"], remediation: "Domestic appliances are connected in parallel; fuses are placed in the live wire." },
  { id: "light_reflection", label: "Reflection of light", chapter: "Light", prereqs: [], remediation: "The angle of incidence equals the angle of reflection, measured from the normal." },
  { id: "spherical_mirrors", label: "Spherical mirrors and ray diagrams", chapter: "Light", prereqs: ["light_reflection"], remediation: "Use the principal rays and identify the pole, principal axis, focus, and centre of curvature." },
  { id: "sign_convention", label: "New Cartesian sign convention", chapter: "Light", prereqs: ["spherical_mirrors"], remediation: "Measure all distances from the pole or optical centre; distances opposite incident light are negative." },
  { id: "mirror_formula", label: "Mirror formula", chapter: "Light", prereqs: ["sign_convention"], remediation: "For mirrors, 1/f = 1/v + 1/u; substitute signed distances." },
  { id: "mirror_magnification", label: "Mirror magnification", chapter: "Light", prereqs: ["mirror_formula"], remediation: "For mirrors, magnification m = h_i/h_o = -v/u." },
  { id: "refraction", label: "Refraction of light", chapter: "Light", prereqs: [], remediation: "Light bends towards the normal when it enters a slower, optically denser medium." },
  { id: "refractive_index", label: "Refractive index", chapter: "Light", prereqs: ["refraction"], remediation: "Refractive index n = c/v; a higher index means a lower speed of light in the medium." },
  { id: "spherical_lenses", label: "Spherical lenses and ray diagrams", chapter: "Light", prereqs: ["refractive_index"], remediation: "A convex lens converges parallel rays; a concave lens diverges them." },
  { id: "lens_formula", label: "Lens formula", chapter: "Light", prereqs: ["spherical_lenses", "sign_convention"], remediation: "For lenses, 1/v - 1/u = 1/f; do not use the mirror formula." },
  { id: "lens_magnification", label: "Lens magnification", chapter: "Light", prereqs: ["lens_formula"], remediation: "For lenses, magnification m = h_i/h_o = v/u." },
  { id: "lens_power", label: "Power of a lens", chapter: "Light", prereqs: ["lens_formula"], remediation: "Lens power P = 1/f when focal length is in metres; the unit is the dioptre." },
  { id: "human_eye", label: "Human eye and accommodation", chapter: "Human Eye & Colourful World", prereqs: ["spherical_lenses"], remediation: "The eye lens changes focal length to focus images on the retina." },
  { id: "eye_defects", label: "Defects of vision and correction", chapter: "Human Eye & Colourful World", prereqs: ["human_eye"], remediation: "Myopia is corrected with a concave lens; hypermetropia with a convex lens." },
  { id: "dispersion", label: "Dispersion through a prism", chapter: "Human Eye & Colourful World", prereqs: ["refraction"], remediation: "A prism separates white light into colours; violet deviates most and red least." },
  { id: "atmospheric_refraction", label: "Atmospheric refraction", chapter: "Human Eye & Colourful World", prereqs: ["refraction"], remediation: "Atmospheric refraction explains effects such as twinkling stars and advanced sunrise." },
  { id: "scattering", label: "Scattering of light", chapter: "Human Eye & Colourful World", prereqs: ["refraction"], remediation: "Shorter wavelengths scatter more strongly; this helps explain the blue sky." },
];

export const CONCEPT_BY_ID = Object.fromEntries(CONCEPTS.map((concept) => [concept.id, concept]));
