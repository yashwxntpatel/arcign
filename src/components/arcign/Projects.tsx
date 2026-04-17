import { motion } from "framer-motion";
import { useState } from "react";
import { Reveal, SplitReveal } from "./Reveal";
import villa from "@/assets/project-villa.jpg";
import living from "@/assets/project-living.jpg";
import kitchen from "@/assets/project-kitchen.jpg";
import bedroom from "@/assets/project-bedroom.jpg";
import dining from "@/assets/project-dining.jpg";
import commercial from "@/assets/project-commercial.jpg";

const projects = [
  {
    id: 1,
    cat: "Residential · Villa",
    t: "Maison Travertine",
    loc: "Mountain ridge, IT",
    d: "A double-height villa defined by sculptural lighting, warm stone textures, and vertical detailing that creates a grand, gallery-like living experience.",
    img: villa,
  },
  {
    id: 2,
    cat: "Interior · Living",
    t: "Quiet Atelier",
    loc: "City apartment, FR",
    d: "A refined living space with layered lighting, textured stone walls, and bespoke shelving — designed for calm, understated luxury.",
    img: living,
  },
  {
    id: 3,
    cat: "Outdoor · Terrace",
    t: "Calacatta Hours",
    loc: "Townhouse, UK",
    d: "A sculpted outdoor retreat featuring reflective water elements, dark stone surfaces, and curated greenery for a serene, resort-like ambiance.",
    img: kitchen,
  },
  {
    id: 4,
    cat: "Interior · Bedroom",
    t: "Sand Light",
    loc: "Coastal residence, ES",
    d: "A contemporary bedroom with soft textures, panelled walls, and ambient lighting — crafted for warmth, comfort, and quiet sophistication.",
    img: bedroom,
  },
  {
    id: 5,
    cat: "Interior · Master Suite",
    t: "Brass & Burl",
    loc: "Country house, PT",
    d: "A classical master suite with ornate detailing, soft neutral tones, and a canopy bed — evoking timeless elegance and refined luxury.",
    img: dining,
  },
  {
    id: 6,
    cat: "Commercial · Boutique",
    t: "Travertine Lobby",
    loc: "Boutique hotel, AE",
    d: "A bold boutique interior blending rich textures, statement furniture, and curated décor — designed as an immersive and memorable brand space.",
    img: commercial,
  },
];

export const Projects = () => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="projects" className="bg-surface py-24 md:py-32">
      <div className="container-luxe">
        <div className="mb-14 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <Reveal>
              <p className="eyebrow mb-5">— Selected Work</p>
            </Reveal>
            <h2 className="font-display text-5xl leading-[0.95] md:text-7xl">
              <SplitReveal text="Selected" />
              <br />
              <span className="italic">
                <SplitReveal text="projects." delay={0.15} />
              </span>
            </h2>
          </div>

          <Reveal delay={0.2}>
            <a href="#contact" className="luxe-link text-[12px] uppercase tracking-[0.22em]">
              Discuss your project →
            </a>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:gap-8">
          {projects.map((p) => (
            <motion.article
              key={p.id}
              className="group overflow-hidden rounded-[28px] border border-foreground/10 bg-background shadow-[var(--shadow-elegant)]"
              onHoverStart={() => setHovered(p.id)}
              onHoverEnd={() => setHovered(null)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <motion.img
                  src={p.img}
                  alt={p.t}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  animate={{ scale: hovered === p.id ? 1.06 : 1 }}
                  transition={{ duration: 1.2, ease: [0.6, 0.05, 0.1, 1] }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-deep/45 via-transparent to-transparent" />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hovered === p.id ? 1 : 0 }}
                  transition={{ duration: 0.45 }}
                  className="absolute inset-0 flex items-center justify-center bg-surface-deep/22"
                >
                  <span className="border border-background/70 px-5 py-3 text-[11px] uppercase tracking-[0.28em] text-background">
                    View Project
                  </span>
                </motion.div>
              </div>

              <div className="p-6 md:p-7">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-bronze">
                      {p.cat}
                    </p>
                    <h3 className="font-display text-3xl md:text-4xl">{p.t}</h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">{p.loc}</p>
                  </div>
                  <span className="font-display text-xl text-muted-foreground md:text-2xl">
                    0{p.id}
                  </span>
                </div>

                <p className="max-w-[52ch] text-[14px] leading-relaxed text-muted-foreground">
                  {p.d}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};