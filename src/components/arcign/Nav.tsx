import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/arcign-logo.png";

const links = [
  { label: "Projects", href: "#projects" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Journal", href: "#journal" },
  { label: "Contact", href: "#contact" },
];

export const Nav = () => {
  const { scrollY } = useScroll();
  const bg = useTransform(
    scrollY,
    [0, 120],
    ["hsla(36, 24%, 96%, 0)", "hsla(36, 24%, 96%, 0.88)"]
  );
  const border = useTransform(
    scrollY,
    [0, 120],
    ["hsla(30, 8%, 12%, 0)", "hsla(30, 8%, 12%, 0.08)"]
  );
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      style={{ backgroundColor: bg, borderColor: border }}
      className="fixed left-0 right-0 top-0 z-40 border-b backdrop-blur-md transition-colors"
    >
      <div className="container-luxe flex h-18 items-center justify-between md:h-20">
        <a href="#" className="flex items-center gap-3">
          <img
            src={logo}
            alt="ARCIGN logo"
            className="h-6 md:h-10 w-auto -ml-1"
          />
        </a>

        <nav className="hidden items-center gap-8 xl:gap-10 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="luxe-link-rev text-[12px] uppercase tracking-[0.22em]"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href="#contact"
          className="hidden lg:inline-flex items-center gap-3 border border-foreground/80 px-5 py-3 text-[11px] uppercase tracking-[0.22em] transition-colors duration-500 hover:bg-foreground hover:text-background"
        >
          Book Consultation
          <span className="inline-block h-2 w-2 rounded-full bg-bronze" />
        </a>

        <button onClick={() => setOpen(!open)} className="p-2 lg:hidden" aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden border-t border-border bg-background lg:hidden"
      >
        <div className="container-luxe flex flex-col gap-6 py-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-2xl sm:text-3xl"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setOpen(false)}
            className="mt-2 inline-block w-fit border border-foreground px-5 py-3 text-[12px] uppercase tracking-[0.22em]"
          >
            Book Consultation
          </a>
        </div>
      </motion.div>
    </motion.header>
  );
};