import logo from "@/assets/arcign-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-surface-deep pt-16 pb-8 text-black md:pt-20">
      <div className="container-luxe">
        <div className="grid grid-cols-1 gap-12 border-b border-black/12 pb-12 md:grid-cols-12 md:gap-10 md:pb-14">
          
          {/* LEFT SECTION */}
          <div className="md:col-span-5">
            <img
              src={logo}
              alt="ARCIGN logo"
              className="h-8 md:h-16 w-auto"
            />

            <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-black/55">
              Architecture · Interior · Furniture
            </p>

            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-black/70">
              A premium architecture and interior design studio crafting bespoke homes and refined spatial experiences.
            </p>
          </div>

          {/* RIGHT GRID */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-7 md:pl-8">
            
            {/* STUDIO */}
            <div>
              <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/45">
                Studio
              </p>
              <ul className="space-y-3 text-[14px] text-black/85">
                <li><a href="#studio" className="hover:text-black transition-colors">About</a></li>
                <li><a href="#projects" className="hover:text-black transition-colors">Projects</a></li>
                <li><a href="#services" className="hover:text-black transition-colors">Services</a></li>
                <li><a href="#journal" className="hover:text-black transition-colors">Journal</a></li>
              </ul>
            </div>

            {/* CONTACT */}
            <div>
              <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/45">
                Contact
              </p>
              <ul className="space-y-3 text-[14px] text-black/85">
                <li>
                  <a href="mailto:studio@arcign.com" className="hover:text-black transition-colors">
                    studio@arcign.com
                  </a>
                </li>
                <li>+91 (0) 000 000 000</li>
                <li>India</li>
                <li className="text-black/55">By appointment only</li>
              </ul>
            </div>

            {/* CONNECT */}
            <div>
              <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-black/45">
                Connect
              </p>
              <ul className="space-y-3 text-[14px] text-black/85">
                <li>
                  <a
                    href="https://www.instagram.com/arcign.architects/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-black transition-colors"
                  >
                    Instagram
                  </a>
                </li>
                <li><a href="#contact" className="hover:text-black transition-colors">Start a Project</a></li>
                <li><a href="#projects" className="hover:text-black transition-colors">Selected Work</a></li>
              </ul>
            </div>

          </div>
        </div>

        {/* BOTTOM */}
        <div className="flex flex-col gap-3 pt-6 text-[11px] uppercase tracking-[0.22em] text-black/45 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} ARCIGN Architects. All rights reserved.</span>
          <span>Designed by Yashwant Patel.</span>
        </div>
      </div>
    </footer>
  );
};