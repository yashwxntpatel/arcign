import { Reveal, SplitReveal } from "./Reveal";
import living from "@/assets/project-living.jpg";
import kitchen from "@/assets/project-kitchen.jpg";
import villa from "@/assets/project-villa.jpg";
import bedroom from "@/assets/project-bedroom.jpg";
import dining from "@/assets/project-dining.jpg";
import commercial from "@/assets/project-commercial.jpg";

const services = [
  { 
    t: "Luxury Living Spaces", 
    d: "Double-height interiors crafted with sculptural lighting, soft textures, and statement art for a grand yet inviting experience.", 
    img: villa 
  },
  { 
    t: "Modern Interior Design", 
    d: "Clean-lined spaces with warm lighting, textured finishes, and minimal detailing that balance elegance with everyday comfort.", 
    img: living 
  },
  { 
    t: "Outdoor & Landscape Design", 
    d: "Curated outdoor environments with water features, stone textures, and greenery for seamless indoor-outdoor living.", 
    img: kitchen 
  },
  { 
    t: "Bedroom Renovation", 
    d: "Thoughtfully redesigned bedrooms with layered materials, custom panels, and ambient lighting to elevate comfort and style.", 
    img: bedroom 
  },
  { 
    t: "Luxury Turnkey Interiors", 
    d: "End-to-end interior solutions from concept to completion, blending timeless design with flawless execution.", 
    img: dining 
  },
  { 
    t: "Boutique Design Advisory", 
    d: "Tailored design guidance to shape refined spaces through bold aesthetics, curated elements, and expert direction.", 
    img: commercial 
  },
];

export const Services = () => {
  return (
    <section id="services" className="py-24 md:py-32 bg-background border-t border-border">
      <div className="container-luxe">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <Reveal><p className="eyebrow mb-6">— Services</p></Reveal>
            <h2 className="font-display text-5xl md:text-7xl leading-[1]">
              <SplitReveal text="What we" />
              <br />
              <span className="italic"><SplitReveal text="design." delay={0.15} /></span>
            </h2>
          </div>
          <Reveal delay={0.2}>
            <p className="text-muted-foreground max-w-md">
              From a single room to an entire villa — every engagement is treated with the same depth of thought and detail.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
          {services.map((s, i) => (
            <Reveal key={s.t} delay={(i % 3) * 0.08}>
              <a href="#projects" className="group block">
                <div className="reveal-mask aspect-[4/5] mb-5 bg-secondary">
                  <img
                    src={s.img}
                    alt={s.t}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.6,0.05,0.1,1)] group-hover:scale-[1.06]"
                  />
                </div>
                <div className="flex items-baseline justify-between border-b border-foreground/15 pb-4">
                  <h3 className="font-display text-2xl md:text-3xl">{s.t}</h3>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground transition-transform duration-500 group-hover:translate-x-1">View →</span>
                </div>
                <p className="text-muted-foreground text-[14px] leading-relaxed mt-4 max-w-[36ch]">{s.d}</p>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
