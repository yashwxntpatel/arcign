import { SmoothScroll } from "@/components/arcign/SmoothScroll";
import { Nav } from "@/components/arcign/Nav";
import { Hero } from "@/components/arcign/Hero";
import { Marquee } from "@/components/arcign/Marquee";
import { WhySection } from "@/components/arcign/WhySection";
import { Philosophy } from "@/components/arcign/Philosophy";
import { Reimagined } from "@/components/arcign/Reimagined";
import { Services } from "@/components/arcign/Services";
import { Projects } from "@/components/arcign/Projects";
import { Support } from "@/components/arcign/Support";
import { Testimonials } from "@/components/arcign/Testimonials";
import { Journal } from "@/components/arcign/Journal";
import { FinalCTA } from "@/components/arcign/FinalCTA";
import { Footer } from "@/components/arcign/Footer";
import { ChatWidget } from "@/components/arcign/ChatWidget";

const Index = () => {
  return (
    <main className="bg-background text-foreground overflow-x-hidden">
      <SmoothScroll />
      <Nav />
      <Hero />
      <Marquee />
      <WhySection />
      <Philosophy />
      <Reimagined />
      <Services />
      <Projects />
      <Support />
      <Testimonials />
      <Journal />
      <FinalCTA />
      <Footer />
      <ChatWidget />
    </main>
  );
};

export default Index;