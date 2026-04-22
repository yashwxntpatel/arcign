import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X } from "lucide-react";
import suyashPhoto from "@/assets/suyash-agent.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  chips?: string[];
};

type VisitorMemory = {
  name?: string;
  city?: string;
  projectType?: string;
  propertyType?: string;
  budget?: string;
  timeline?: string;
  style?: string;
  stage?: string;
  roomType?: string;
  phone?: string;
};

type ConsultationStage = "idle" | "ask_name" | "ask_phone" | "done";

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const CHAT_KEY = "arcign_chat_v5";
const MEMORY_KEY = "arcign_memory_v5";
const CONSULT_KEY = "arcign_consult_v5";

// ─── Utilities ────────────────────────────────────────────────────────────────

const normalize = (text: string) => text.toLowerCase().trim();
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const has = (text: string, words: string[]) => words.some((w) => text.includes(w));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const isValidPhone = (text: string) => {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

const cleanPhone = (text: string) => text.replace(/[^\d+\-\s()]/g, "").trim();

const extractName = (text: string): string | undefined => {
  const m = text.match(/(?:my name is|i(?:'|'|`)m|call me)\s+([a-zA-Z][a-zA-Z\s]{1,30})/i);
  if (m?.[1]) return m[1].trim();
  if (/^[a-zA-Z][a-zA-Z\s]{1,35}$/.test(text.trim())) return text.trim();
  return undefined;
};

const getTimeMeta = () => {
  const h = new Date().getHours();
  if (h < 12) return { greeting: "Good morning", period: "morning" };
  if (h < 17) return { greeting: "Good afternoon", period: "afternoon" };
  return { greeting: "Good evening", period: "evening" };
};

// ─── Memory Extraction ────────────────────────────────────────────────────────

const extractMemory = (input: string, current: VisitorMemory): VisitorMemory => {
  const t = normalize(input);
  const next = { ...current };

  if (has(t, ["architecture", "architect", "new build", "construction"])) next.projectType = "Architecture";
  else if (has(t, ["interior", "interiors", "decor", "furnish"])) next.projectType = "Interiors";
  else if (has(t, ["renovation", "remodel", "redo", "refurbish", "upgrade"])) next.projectType = "Renovation";

  if (has(t, ["villa"])) next.propertyType = "Villa";
  else if (has(t, ["apartment", "flat", "condo"])) next.propertyType = "Apartment";
  else if (has(t, ["bungalow"])) next.propertyType = "Bungalow";
  else if (has(t, ["penthouse"])) next.propertyType = "Penthouse";
  else if (has(t, ["residence", "home", "house"])) next.propertyType = "Residence";
  else if (has(t, ["office", "workspace", "studio", "commercial", "retail", "hospitality"])) next.propertyType = "Commercial";

  if (has(t, ["living room", "living area", "lounge"])) next.roomType = "Living room";
  else if (has(t, ["master bedroom", "bedroom"])) next.roomType = "Bedroom";
  else if (has(t, ["kitchen"])) next.roomType = "Kitchen";
  else if (has(t, ["dining"])) next.roomType = "Dining";
  else if (has(t, ["bathroom", "toilet", "washroom"])) next.roomType = "Bathroom";
  else if (has(t, ["study", "home office", "library"])) next.roomType = "Study";

  if (has(t, ["modern"])) next.style = "Modern";
  else if (has(t, ["minimal", "minimalist", "clean"])) next.style = "Minimal";
  else if (has(t, ["luxury", "premium", "opulent"])) next.style = "Luxury";
  else if (has(t, ["warm", "cozy", "earthy"])) next.style = "Warm minimal";
  else if (has(t, ["contemporary"])) next.style = "Contemporary";
  else if (has(t, ["classic", "traditional", "heritage"])) next.style = "Classic";
  else if (has(t, ["japandi", "wabi"])) next.style = "Japandi";
  else if (has(t, ["industrial"])) next.style = "Industrial";

  if (has(t, ["planning", "early stage", "just starting", "idea stage"])) next.stage = "Early planning";
  else if (has(t, ["under construction", "site started", "construction started"])) next.stage = "Under construction";
  else if (has(t, ["design stage", "concept stage", "drawings"])) next.stage = "Design stage";
  else if (has(t, ["execution", "implementation", "site work"])) next.stage = "Execution";

  const budgetMatch = input.match(
    /\b(\d[\d,\.]*\s*(?:lakh|lakhs|lac|cr|crore|crores|k|m)|₹\s*\d[\d,\.]*(?:\s*(?:lakh|cr|k|m))?)\b/i
  );
  if (budgetMatch) next.budget = budgetMatch[0];

  const cityMatch = input.match(
    /\b(bangalore|bengaluru|mumbai|delhi|new delhi|gurgaon|gurugram|noida|pune|hyderabad|ahmedabad|chennai|kolkata|surat|jaipur|lucknow|goa|kochi|coimbatore|mysore|chandigarh|indore|bhopal|nagpur|vizag|visakhapatnam)\b/i
  );
  if (cityMatch) next.city = cityMatch[0];

  if (has(t, ["month", "year", "week", "quarter"])) next.timeline = input;

  if (!next.name) {
    const n = extractName(input);
    if (n) next.name = n;
  }

  if (isValidPhone(input)) next.phone = cleanPhone(input);

  return next;
};

// ─── Smart Chips ──────────────────────────────────────────────────────────────

const smartChips = (memory: VisitorMemory): string[] => {
  if (memory.projectType === "Architecture") return ["Site details", "Concept process", "Budget range", "Book consultation"];
  if (memory.projectType === "Interiors") return ["Room planning", "Style direction", "Materials", "Book consultation"];
  if (memory.projectType === "Renovation") return ["Scope clarity", "Timeline", "Budget range", "Book consultation"];
  return ["Architecture", "Interiors", "Renovation", "Book consultation"];
};

// ─── Fallback Reply Engine ────────────────────────────────────────────────────

const fallbackReply = (
  input: string,
  memory: VisitorMemory,
  msgCount: number
): { text: string; chips?: string[] } => {
  const t = normalize(input);
  void msgCount;

  const greetWords = ["hi", "hello", "hey", "hii", "yo", "hola", "sup", "good morning", "good afternoon", "good evening", "namaste"];
  if (greetWords.some((g) => t === g || t.startsWith(g + " "))) {
    return {
      text: pick([
        "Hey — welcome to ARCIGN. Tell me what kind of project you have in mind and I'll take it from there.",
        "Hi there — I'm Suyash. Are you exploring architecture, interiors, or a renovation?",
        "Hello — good to have you here. What space or project are you thinking about?",
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  if (has(t, ["services", "what do you do", "offer", "offerings", "work on"])) {
    return {
      text: "ARCIGN handles architecture, interior design, bespoke joinery, material curation, and execution coordination. Want me to walk you through any of these in more detail?",
      chips: ["Architecture", "Interiors", "Joinery & furniture", "Execution support"],
    };
  }

  if (has(t, ["process", "how do you work", "how does it work", "workflow", "steps", "how it works"])) {
    return {
      text: pick([
        "Every project starts with a discovery session — understanding your goals, lifestyle, site conditions, and budget. From there we move into concept, detailed design, and then execution if needed. What stage are you at?",
        "Typically: brief → concept → design development → material curation → execution. The depth depends on whether you need full service or design-only. What does your project look like?",
      ]),
      chips: ["Early planning", "Design stage", "Execution", "Book consultation"],
    };
  }

  if (has(t, ["budget", "cost", "price", "fees", "charges", "how much", "rate", "pricing"])) {
    return {
      text: pick([
        "Budget depends on project type, area, scope, and finish level. If you share a rough comfort range, I can give you a much clearer picture of what's possible.",
        "Costs vary quite a bit based on scope — a full architecture project is different from a single-room interior. What kind of project are you planning?",
      ]),
      chips: ["Architecture project", "Interior project", "Renovation", "Share project details"],
    };
  }

  if (has(t, ["timeline", "how long", "duration", "when", "time frame", "how many months"])) {
    return {
      text: "Timelines depend on scope — concept-only vs full execution are very different. For interiors, 3–6 months is typical for mid-scale projects. Architecture runs longer. What's your target date?",
      chips: ["Architecture timeline", "Interior timeline", "Renovation timeline", "Book consultation"],
    };
  }

  if (has(t, ["architecture", "architect", "new build", "villa design", "house design", "residence", "bungalow", "facade"])) {
    return {
      text: pick([
        `For an architecture project, I'd start by understanding your site location, built-up area, design direction, and timeline.${memory.city ? ` Since you're in ${memory.city}, we can discuss local site conditions too.` : " Which city is the site in?"}`,
        "Architecture projects here cover everything from concept design to working drawings and execution oversight. What kind of property are you building?",
      ]),
      chips: ["Villa", "Residence", "Site planning", "Facade design"],
    };
  }

  if (has(t, ["interior", "interiors", "living room", "bedroom", "kitchen", "dining", "apartment", "flat", "furnish", "decor"])) {
    return {
      text: pick([
        `Interiors work starts with space type, rooms in scope, style direction, and budget range.${memory.propertyType ? ` For your ${memory.propertyType}, that's a good starting point.` : " What kind of space is this — apartment, villa, or something else?"}`,
        "For interiors, the most useful things upfront are: which rooms, your preferred mood or style, and whether you need design-only or full execution support.",
      ]),
      chips: ["Living room", "Bedroom", "Kitchen", "Full apartment"],
    };
  }

  if (has(t, ["renovation", "remodel", "redo", "refurbish", "upgrade", "revamp"])) {
    return {
      text: "Renovation planning works best when we're clear on what's changing and what's staying. Civil work vs soft upgrades have very different timelines and budgets. What's the scope you have in mind?",
      chips: ["Civil renovation", "Soft upgrade", "Full redo", "Book consultation"],
    };
  }

  if (has(t, ["material", "materials", "finish", "finishes", "stone", "wood", "marble", "tile", "palette", "texture"])) {
    return {
      text: "Material selection is where a project really comes alive. The key is building a cohesive language — stone, wood, metal, plaster, lighting — rather than picking individual pieces. Do you have a style direction in mind?",
      chips: ["Warm palette", "Stone & wood", "Minimal palette", "Share references"],
    };
  }

  if (has(t, ["furniture", "joinery", "wardrobe", "cabinet", "storage", "tv unit", "bookshelf", "shelf"])) {
    return {
      text: "Bespoke joinery is a strong part of what we do — when furniture is designed alongside the space, the outcome feels much more resolved. Are you looking at specific pieces or full room joinery?",
      chips: ["Wardrobes", "TV unit", "Kitchen joinery", "Full room joinery"],
    };
  }

  if (has(t, ["style", "look", "aesthetic", "mood", "theme", "vibe", "feel"])) {
    return {
      text: "Rather than just naming a style, think about how you want the space to feel — calm and quiet, warm and tactile, bold and refined, or light and airy. That gives us much better design clarity. Any words that come to mind?",
      chips: ["Warm minimal", "Luxury", "Clean modern", "Japandi"],
    };
  }

  if (has(t, ["execution", "on site", "supervision", "contractor", "implementation", "site management"])) {
    return {
      text: "Execution support means we stay involved through site visits, material coordination, and vendor alignment to protect design intent. It varies by scope — some clients need full oversight, others just milestone reviews. What are you thinking?",
      chips: ["Full execution", "Milestone reviews", "Design only", "Book consultation"],
    };
  }

  if (has(t, ["city", "location", "where", "site", "place", "region"])) {
    return {
      text: "Location matters — local site conditions, vendors, and logistics vary significantly. Which city is your project in?",
      chips: ["Bangalore", "Mumbai", "Delhi", "Other city"],
    };
  }

  if (has(t, ["commercial", "office", "workspace", "hospitality", "hotel", "restaurant", "retail", "showroom"])) {
    return {
      text: "Commercial projects need early clarity around brand expression, footfall, function, and user experience. What type of space is this — office, hospitality, retail?",
      chips: ["Office", "Hospitality", "Retail", "Mixed use"],
    };
  }

  if (has(t, ["approval", "permission", "sanction", "authority", "municipal", "bmrda", "bbmp"])) {
    return {
      text: "Approval requirements depend on the city, site type, and scope. We can walk you through what's applicable once we know your location and project details. Where is the site?",
      chips: ["Share city", "Architecture project", "Book consultation"],
    };
  }

  if (has(t, ["send", "share", "checklist", "document", "what do you need", "start with"])) {
    return {
      text: "A good starting point: project type, city, property type, approximate area, stage you're at, rough budget range, and 2–3 reference images if you have them. Even rough info is enough to begin.",
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  if (has(t, ["lighting", "light", "lamps", "fixtures", "ambience", "ambient"])) {
    return {
      text: "Lighting defines mood more than most people realize. We approach it as layers — ambient, task, accent — designed alongside material choices. What kind of space are you planning this for?",
      chips: ["Living room", "Bedroom", "Kitchen", "Full project"],
    };
  }

  if (has(t, ["start", "begin", "next step", "explore services", "start a project"])) {
    return {
      text: pick([
        "The best first step is sharing the basics — project type, city, stage, style direction, and a rough budget range. Once I have that, I can guide you precisely.",
        "Let's start with what the project is, where it is, and how far along you are. That gives me enough to point you in the right direction.",
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  return {
    text: pick([
      "Tell me a bit more about the project — I'll guide you from there.",
      "Happy to help — is this about architecture, interiors, or a renovation?",
      "I can help with project scope, timelines, budget clarity, materials, or booking a consultation. What would be most useful right now?",
    ]),
    chips: smartChips(memory),
  };
};

// ─── Typing Delay ─────────────────────────────────────────────────────────────

const typingDelay = (text: string): number => {
  const base = 700;
  const perChar = 16;
  const max = 2400;
  return Math.min(base + text.length * perChar, max);
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatWidget = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [consultStage, setConsultStage] = useState<ConsultationStage>("idle");
  const [memory, setMemory] = useState<VisitorMemory>({});

  const timeMeta = useMemo(() => getTimeMeta(), []);

  const initialMessage = useMemo<Message>(
    () => ({
      id: "init",
      sender: "bot",
      text: pick([
        `${timeMeta.greeting} — I'm Suyash, from ARCIGN. Tell me about your project and I'll take it from there. 😊`,
        `${timeMeta.greeting} — welcome to ARCIGN. Whether it's architecture, interiors, or a renovation, I'm here to help you get started.`,
        `${timeMeta.greeting}. I'm Suyash — the first point of contact here at ARCIGN. What kind of space are you planning?`,
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    }),
    [timeMeta]
  );

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Restore from localStorage ──────────────────────────────────────────────

  useEffect(() => {
    try {
      const msgs = localStorage.getItem(CHAT_KEY);
      const mem = localStorage.getItem(MEMORY_KEY);
      const stage = localStorage.getItem(CONSULT_KEY);

      if (msgs) {
        const parsed = JSON.parse(msgs) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
      if (mem) {
        const parsedMem = JSON.parse(mem) as VisitorMemory;
        if (parsedMem && typeof parsedMem === "object") setMemory(parsedMem);
      }
      if (stage && ["idle", "ask_name", "ask_phone", "done"].includes(stage)) {
        setConsultStage(stage as ConsultationStage);
      }
    } catch { /* ignore */ }
  }, []);

  // ── Persist ────────────────────────────────────────────────────────────────

  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(messages)); } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem(MEMORY_KEY, JSON.stringify(memory)); } catch { /* ignore */ }
  }, [memory]);

  useEffect(() => {
    try { localStorage.setItem(CONSULT_KEY, consultStage); } catch { /* ignore */ }
  }, [consultStage]);

  // ── Scroll trigger ─────────────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  // ── Focus on open ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  // ── Add bot message ────────────────────────────────────────────────────────

  const addBot = useCallback((text: string, chips?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: `b-${uid()}`, sender: "bot", text, chips },
    ]);
  }, []);

  // ── API with fallback ──────────────────────────────────────────────────────

  const getBotReply = useCallback(
    async (
      text: string,
      mem: VisitorMemory,
      history: Message[]
    ): Promise<{ text: string; chips?: string[] }> => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            agentName: "Suyash",
            company: "ARCIGN",
            role: "Live agent",
            timeOfDay: timeMeta.greeting,
            visitorMemory: mem,
            recentMessages: history.slice(-8),
            systemContext:
              "You are Suyash, a warm, knowledgeable live support agent for ARCIGN Architects. Be concise, natural, and premium. Never sound robotic. Guide toward consultation without being pushy. Use emojis sparingly and only when natural.",
          }),
        });
        if (!res.ok) throw new Error("unavailable");
        const data = await res.json();
        if (data?.reply && typeof data.reply === "string") {
          return {
            text: data.reply,
            chips: Array.isArray(data.chips) ? data.chips : smartChips(mem),
          };
        }
        throw new Error("bad response");
      } catch {
        return fallbackReply(text, mem, history.length);
      }
    },
    [timeMeta]
  );

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || typing) return;

      const updatedMemory = extractMemory(text, memory);
      setMemory(updatedMemory);

      const userMsg: Message = { id: `u-${uid()}`, sender: "user", text };
      const nextHistory = [...messages, userMsg];
      setMessages(nextHistory);
      setInput("");

      // ── Consultation flow ──
      if (consultStage === "ask_name") {
        const name = extractName(text) ?? text.trim();
        setMemory((m) => ({ ...m, name }));
        setConsultStage("ask_phone");
        setTyping(true);
        setTimeout(() => {
          addBot(`Thanks${name ? `, ${name}` : ""}. Could you share your WhatsApp or phone number? 📱`);
          setTyping(false);
        }, 700);
        return;
      }

      if (consultStage === "ask_phone") {
        if (!isValidPhone(text)) {
          setTyping(true);
          setTimeout(() => {
            addBot("Could you double-check that number? I want to make sure the team can reach you. 😊");
            setTyping(false);
          }, 600);
          return;
        }
        const phone = cleanPhone(text);
        setMemory((m) => ({ ...m, phone }));
        setConsultStage("done");
        setTyping(true);
        setTimeout(() => {
          addBot(
            `Perfect${memory.name ? `, ${memory.name}` : ""}. Our team will reach out to you shortly. Thanks for choosing ARCIGN. 😎👍🏻`
          );
          setTyping(false);
        }, 750);
        return;
      }

      // ── Consultation trigger ──
      const consultTriggers = [
        "book consultation", "consultation", "book a call", "schedule",
        "book meeting", "start consultation", "book call",
      ];
      if (has(normalize(text), consultTriggers)) {
        setConsultStage("ask_name");
        setTyping(true);
        setTimeout(() => {
          addBot("Of course — happy to set that up. May I know your name? 😊");
          setTyping(false);
        }, 650);
        return;
      }

      // ── Normal reply ──
      setTyping(true);
      const reply = await getBotReply(text, updatedMemory, nextHistory);
      setTimeout(() => {
        addBot(reply.text, reply.chips);
        setTyping(false);
      }, typingDelay(reply.text));
    },
    [typing, memory, messages, consultStage, addBot, getBotReply]
  );

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = useCallback(() => {
    setMessages([initialMessage]);
    setMemory({});
    setConsultStage("idle");
    try {
      localStorage.removeItem(CHAT_KEY);
      localStorage.removeItem(MEMORY_KEY);
      localStorage.removeItem(CONSULT_KEY);
    } catch { /* ignore */ }
  }, [initialMessage]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes arcignDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.25; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .arcign-scroll::-webkit-scrollbar { width: 0; }
        .arcign-chips::-webkit-scrollbar { height: 0; }
      `}</style>

      <AnimatePresence>
        {visible && (
          <>
            {/* ── Launcher ── */}
            {!open && (
              <motion.button
                key="launcher"
                type="button"
                onClick={() => setOpen(true)}
                initial={{ opacity: 0, y: 20, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.88 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Open chat"
                className="fixed bottom-6 right-6 z-[70] flex items-center gap-3.5 rounded-full border border-white/10 bg-surface-deep px-4 py-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.30)] backdrop-blur-xl transition-transform hover:scale-[1.02] active:scale-[0.98] md:bottom-8 md:right-8"
              >
                <span className="relative shrink-0">
                  <span className="block h-11 w-11 overflow-hidden rounded-full ring-1 ring-white/18">
                    <img src={suyashPhoto} alt="Suyash" className="h-full w-full object-cover" />
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-surface-deep ring-[1.5px] ring-white/10">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                    </span>
                  </span>
                </span>

                <span className="hidden flex-col text-left sm:flex">
                  <span className="mb-0.5 text-[10px] uppercase leading-none tracking-[0.26em] text-black/55">
                    ARCIGN Support
                  </span>
                  <span className="text-[13px] font-medium leading-snug text-black">
                    Suyash · Live
                  </span>
                </span>
              </motion.button>
            )}

            {/* ── Chat panel ── */}
            {open && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 28, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 28, scale: 0.94 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-6 right-6 z-[80] flex w-[calc(100vw-20px)] max-w-[400px] flex-col overflow-hidden rounded-[22px] border border-black/8 bg-background shadow-[0_28px_72px_rgba(0,0,0,0.16)] md:bottom-8 md:right-8"
                style={{ maxHeight: "min(680px, calc(100svh - 32px))" }}
              >
                {/* ── Header ── */}
                <div className="flex shrink-0 items-center justify-between border-b border-black/8 bg-surface px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-black/10">
                        <img src={suyashPhoto} alt="Suyash" className="h-full w-full object-cover" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-[13px] w-[13px] items-center justify-center rounded-full bg-white ring-1 ring-black/8">
                        <span className="relative flex h-[7px] w-[7px]">
                          <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                          <span className="relative h-[7px] w-[7px] rounded-full bg-emerald-500" />
                        </span>
                      </span>
                    </div>
                    <div>
                      <p className="mb-0.5 text-[10px] uppercase leading-none tracking-[0.22em] text-muted-foreground">
                        ARCIGN
                      </p>
                      <p className="text-[13.5px] font-medium leading-snug text-foreground">
                        Suyash, Live agent
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={reset}
                      className="hidden h-9 items-center rounded-full border border-black/8 px-3.5 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground transition hover:border-black/16 hover:text-foreground sm:flex"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-black/8 text-muted-foreground transition hover:border-black/16 hover:text-foreground"
                    >
                      <X className="h-[15px] w-[15px]" />
                    </button>
                  </div>
                </div>

                {/* ── Messages ── */}
                <div className="arcign-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: i === 0 ? 0 : 0.04 }}
                      >
                        <div className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`
                              max-w-[85%] px-4 py-3 text-[13.5px] leading-[1.62]
                              ${msg.sender === "user"
                                ? "rounded-[18px] rounded-br-[5px] bg-surface-deep text-background"
                                : "rounded-[18px] rounded-bl-[5px] border border-black/7 bg-surface text-foreground"
                              }
                            `}
                          >
                            {msg.text}
                          </div>
                        </div>

                        {msg.sender === "bot" && msg.chips && msg.chips.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12, duration: 0.26 }}
                            className="mt-2.5 flex flex-wrap gap-2"
                          >
                            {msg.chips.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => void sendMessage(chip)}
                                className="rounded-full border border-black/10 bg-background px-3.5 py-[7px] text-[12px] leading-none text-foreground transition hover:border-black/18 hover:bg-surface active:scale-[0.96]"
                              >
                                {chip}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </motion.div>
                    ))}

                    <AnimatePresence>
                      {typing && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.22 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-center gap-[5px] rounded-[18px] rounded-bl-[5px] border border-black/7 bg-surface px-4 py-3.5">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="h-[6px] w-[6px] rounded-full bg-foreground/25"
                                style={{ animation: `arcignDot 1.3s ease-in-out ${i * 0.18}s infinite` }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={endRef} />
                  </div>
                </div>

                {/* ── Quick chips ── */}
                <div className="shrink-0 border-t border-black/7 bg-background px-4 pt-3 pb-1">
                  <div className="arcign-chips flex gap-2 overflow-x-auto pb-2">
                    {["Start a project", "Explore services", "Budget guidance", "Book consultation"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => void sendMessage(chip)}
                        className="shrink-0 whitespace-nowrap rounded-full border border-black/10 bg-surface px-3.5 py-[7px] text-[11.5px] leading-none text-foreground transition hover:border-black hover:bg-black hover:text-white active:scale-[0.96]"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Input ── */}
                <div className="shrink-0 px-4 pb-4 pt-2">
                  <div className="flex items-center gap-2 rounded-[13px] border border-black/10 bg-surface px-3 py-2 transition-colors focus-within:border-black/22">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void sendMessage(input);
                        }
                      }}
                      placeholder="Ask Suyash anything…"
                      autoComplete="off"
                      className="h-10 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground/65"
                    />
                    <button
                      type="button"
                      onClick={() => void sendMessage(input)}
                      disabled={!input.trim() || typing}
                      aria-label="Send"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-deep text-background transition hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
};
