export const Marquee = () => {
  const items = [
    "Residential",
    "Interiors",
    "Bespoke Joinery",
    "Renovation",
    "Villas",
    "Commercial",
    "Material Curation",
    "Spatial Design",
  ];

  const row = [...items, ...items, ...items];

  return (
    <div className="overflow-hidden border-y border-border bg-background py-4 md:py-5">
      <div className="marquee-track flex gap-12 whitespace-nowrap md:gap-14">
        {row.map((t, i) => (
          <span
            key={i}
            className="font-display text-xl text-foreground/80 md:text-3xl"
          >
            {t}
            <span className="ml-10 text-bronze md:ml-12">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
};