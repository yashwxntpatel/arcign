import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import logo from "@/assets/arcign-logo.png";

type PreloaderProps = {
  onComplete?: () => void;
};

export const Preloader = ({ onComplete }: PreloaderProps) => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => setDone(true), 2000);

    return () => {
      clearTimeout(timer);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    if (!done) return;

    const unlock = setTimeout(() => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }, 200);

    const finish = setTimeout(() => {
      onComplete?.();
    }, 1050);

    return () => {
      clearTimeout(unlock);
      clearTimeout(finish);
    };
  }, [done, onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[99999] flex h-screen w-screen items-center justify-center bg-surface-deep"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 1.05, ease: [0.7, 0, 0.2, 1] }}
        >
          <div className="relative flex w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.95, ease: [0.6, 0.05, 0.1, 1] }}
              className="flex flex-col items-center"
            >
              <img
                src={logo}
                alt="ARCIGN logo"
                className="mb-6 h-auto w-[220px] max-w-[62vw] md:w-[300px] lg:w-[360px]"
              />
              <p className="text-background/62 text-[10px] md:text-[11px] uppercase tracking-[0.42em]">
                Architecture · Interior · Furniture
              </p>
            </motion.div>

            <motion.div
              className="absolute bottom-10 left-6 right-6 h-px bg-background/20 md:left-10 md:right-10"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ transformOrigin: "left center" }}
            />

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.8 }}
              className="absolute bottom-14 left-6 text-[9px] uppercase tracking-[0.34em] text-background/46 md:left-10"
            >
              Premium Architecture Studio
            </motion.span>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.8 }}
              className="absolute bottom-14 right-6 text-[9px] uppercase tracking-[0.34em] text-background/46 md:right-10"
            >
              ARCIGN Architects
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};