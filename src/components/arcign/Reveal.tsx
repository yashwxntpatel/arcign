import { motion, useInView, Variants } from "framer-motion";
import { ReactNode, useRef } from "react";

const ease = [0.6, 0.05, 0.1, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.95, ease },
  },
};

export const Reveal = ({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const MotionTag = motion(Tag as any);

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
};

export const SplitReveal = ({
  text,
  className,
  stagger = 0.06,
  delay = 0,
}: {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const words = text.split(" ");

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: "inline-block",
        overflow: "visible",
        paddingTop: "0.08em",
        paddingBottom: "0.12em",
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          className="mr-[0.25em] inline-block overflow-hidden align-baseline pt-[0.08em] pb-[0.14em]"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "108%" }}
            animate={inView ? { y: "0%" } : { y: "108%" }}
            transition={{ duration: 0.95, ease, delay: delay + i * stagger }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
};

export const ImageReveal = ({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className ?? ""}`}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={inView ? { clipPath: "inset(0 0 0% 0)" } : { clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 1.2, ease }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`h-full w-full object-cover ${imgClassName ?? ""}`}
        initial={{ scale: 1.12 }}
        animate={inView ? { scale: 1 } : { scale: 1.12 }}
        transition={{ duration: 1.6, ease }}
      />
    </motion.div>
  );
};