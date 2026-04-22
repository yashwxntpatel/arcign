import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, RotateCcw, Phone } from "lucide-react";
import suyashPhoto from "@/assets/suyash-agent.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  chips?: string[];
  time?: string;
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

const CHAT_KEY = "arcign_chat_v6";
const MEMORY_KEY = "arcign_memory_v6";
const CONSULT_KEY = "arcign_consult_v6";

// ─── Utilities ────────────────────────────────────────────────────────────────

const normalize = (text: string) => text.toLowerCase().trim();
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const has = (text: string, words: string[]) => words.some((w) => text.includes(w));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const getTimeStr = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const isValidPhone = (text: string) => {
  const digits = text.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

const cleanPhone = (text: string) => text.replace(/[^\d+\-\s()]/g, "").trim();

const extractName = (text: string): string | undefined => {
  const m = text.match(/(?:my name is|i(?:'|'|`)m|call me)\s+([a-zA-Z][a-zA-Z\s]{1,30})/i);
  if (m?.[1]) return m[1].trim();
  if (/^[a-zA-Z][a-zA-Z\s]{1,35}$/.test(text.trim()) && text.trim().split(" ").length <= 3)
    return text.trim();
  return undefined;
};

const getTimeMeta = () => {
  const h = new Date().getHours();
  if (h < 12) return { greeting: "Good morning", period: "morning" };
  if (h < 17) return { greeting: "Good afternoon", period: "afternoon" };
  return { greeting: "Good evening", period: "evening" };
};

// ─── Non-business detection ───────────────────────────────────────────────────

const NON_BUSINESS_REDIRECTS = [
  "That's genuinely above my pay grade — I'm assigned only for ARCIGN project queries. Tell me about your space and I'll be useful instantly.",
  "Tempting to chat, but I'm officially on ARCIGN duty 😄 Ask me anything about architecture, interiors, or your project.",
  "I'd love to help, but I'm a single-purpose agent — ARCIGN's architecture & interiors world is my whole universe. What project do you have in mind?",
  "I'm flattered by the question, but my expertise ends at design and spaces. Got a project to discuss?",
  "Ha — that's outside my brief. I'm here strictly for ARCIGN business. What kind of space are you planning?",
  "Not my territory, unfortunately. I'm laser-focused on architecture, interiors, renovation, and consultation. Something I can actually help with?",
];

const OFF_TOPIC_KEYWORDS = [
  "joke", "weather", "cricket", "politics", "movie", "song", "recipe",
  "love", "girlfriend", "boyfriend", "stock", "crypto", "bitcoin",
  "news", "sport", "football", "ipl", "celebrity", "bollywood", "netflix",
  "meaning of life", "gpt", "chatgpt", "openai", "google", "ai",
  "meme", "game", "gaming", "war", "astrology", "horoscope",
];

const isOffTopic = (text: string): boolean => {
  const t = normalize(text);
  const businessKeywords = [
    "architecture", "interior", "design", "renovation", "project", "space",
    "room", "apartment", "villa", "house", "office", "consultation", "budget",
    "material", "furniture", "joinery", "timeline", "floor", "wall", "ceiling",
    "kitchen", "bedroom", "bathroom", "living", "dining", "commercial",
    "arcign", "suyash", "start", "service", "work", "plan", "schedule", "book",
  ];
  if (businessKeywords.some((k) => t.includes(k))) return false;
  return OFF_TOPIC_KEYWORDS.some((k) => t.includes(k));
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

// ─── ARCIGN System Prompt ─────────────────────────────────────────────────────

const ARCIGN_SYSTEM_PROMPT = `You are Suyash, the live support representative for ARCIGN — a premium architecture and interiors studio known for refined, thoughtful design.

Your role: first point of contact for website visitors exploring architecture, interior design, renovation, bespoke joinery, and commercial space projects.

Personality: warm, intelligent, calm, concise, and genuinely helpful. You sound like a real, polished human support executive — not a chatbot. You never use generic phrases like "Great question!" or "Certainly!" or "As an AI". You are confident, not salesy.

Your core responsibilities:
1. Understand visitor intent quickly, even if their wording is imperfect
2. Give genuinely useful, relevant answers about architecture, interiors, renovation, materials, timelines, budgets, process, and consultation
3. Ask one smart follow-up question when you need more context — not several at once
4. Gently guide toward a consultation when the visitor seems ready — but never push
5. Use the visitor's name, city, project type, or budget naturally once you know them
6. Keep answers concise — 2–4 sentences max for most replies
7. Use emojis very sparingly — only when it feels completely natural

If someone asks something completely unrelated to ARCIGN's business, respond with a witty, classy one-liner and redirect back to ARCIGN topics.

Never say you are an AI. Respond as Suyash would — a real person who knows ARCIGN deeply.`;

// ─── Fallback Reply Engine ────────────────────────────────────────────────────

const fallbackReply = (
  input: string,
  memory: VisitorMemory,
  msgCount: number
): { text: string; chips?: string[] } => {
  const t = normalize(input);
  void msgCount;

  if (isOffTopic(t)) {
    return { text: pick(NON_BUSINESS_REDIRECTS), chips: smartChips(memory) };
  }

  const greetWords = ["hi", "hello", "hey", "hii", "yo", "hola", "sup", "good morning", "good afternoon", "good evening", "namaste"];
  if (greetWords.some((g) => t === g || t.startsWith(g + " "))) {
    return {
      text: pick([
        "Hey — welcome to ARCIGN. Tell me what kind of project you have in mind and I'll take it from there.",
        "Hi there. I'm Suyash. Are you exploring architecture, interiors, or a renovation?",
        "Hello — good to have you here. What space are you thinking about?",
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  if (has(t, ["services", "what do you do", "offer", "offerings", "work on", "specialize"])) {
    return {
      text: "ARCIGN works across architecture, interior design, bespoke joinery, material curation, and execution coordination. Each project is treated as a complete design exercise. Want me to walk you through any specific area?",
      chips: ["Architecture", "Interiors", "Joinery & furniture", "Execution support"],
    };
  }

  if (has(t, ["process", "how do you work", "how does it work", "workflow", "steps", "how it works", "methodology"])) {
    return {
      text: pick([
        "Every project begins with a discovery session — understanding your goals, lifestyle, site, and budget. From there: concept development, detailed design, material selection, and execution if needed. What stage are you currently at?",
        "The process typically runs: brief → concept → design development → material curation → execution oversight. Tell me about your project and I can map it out.",
      ]),
      chips: ["Early planning", "Design stage", "Execution", "Book consultation"],
    };
  }

  if (has(t, ["budget", "cost", "price", "fees", "charges", "how much", "rate", "pricing", "expensive"])) {
    return {
      text: pick([
        "Costs vary based on project type, area, scope, and finish level. If you share a rough range, I can give you a clearer picture of what's achievable.",
        "Budget depends on whether it's architecture, interiors, or renovation — and the scale involved. What kind of project are you planning?",
      ]),
      chips: ["Architecture project", "Interior project", "Renovation", "Share project details"],
    };
  }

  if (has(t, ["timeline", "how long", "duration", "when", "time frame", "how many months", "deadline"])) {
    return {
      text: `Timelines depend on scope.${memory.projectType === "Architecture" ? " Architecture projects typically run 12–24 months end to end." : memory.projectType === "Interiors" ? " Interior projects range from 3–8 months depending on rooms in scope." : " Renovations can range from 6 weeks to 6 months based on what's being redone."} What's your target timeline?`,
      chips: ["Architecture timeline", "Interior timeline", "Renovation timeline", "Book consultation"],
    };
  }

  if (has(t, ["architecture", "architect", "new build", "villa design", "house design", "bungalow", "facade", "construction", "structure"])) {
    return {
      text: pick([
        `For an architecture project, a few things help us scope it: site location, approximate built-up area, design direction, and target timeline.${memory.city ? ` Given you're in ${memory.city}, we can factor in local conditions too.` : " Which city is the site in?"}`,
        "Architecture work covers concept design, working drawings, approval drawings, and execution oversight. What kind of property are you building?",
      ]),
      chips: ["Villa", "Residence", "Site planning", "Facade design"],
    };
  }

  if (has(t, ["interior", "interiors", "living room", "bedroom", "kitchen", "dining", "apartment", "flat", "furnish", "decor", "room"])) {
    return {
      text: pick([
        `Interiors work begins with which rooms are in scope, your preferred style direction, and budget range.${memory.propertyType ? ` For your ${memory.propertyType}, that's a solid starting point.` : " Is this for an apartment, villa, or another property?"}`,
        "Key inputs upfront: rooms in scope, mood you're after, and whether you need design-only or full execution. What does your project look like?",
      ]),
      chips: ["Living room", "Bedroom", "Kitchen", "Full apartment"],
    };
  }

  if (has(t, ["renovation", "remodel", "redo", "refurbish", "upgrade", "revamp", "gut"])) {
    return {
      text: "Renovation planning is cleaner once we know what's changing vs what stays. Civil work and soft upgrades have very different timelines and budgets. What's the scope you're thinking about?",
      chips: ["Civil renovation", "Soft upgrade", "Full redo", "Book consultation"],
    };
  }

  if (has(t, ["material", "materials", "finish", "finishes", "stone", "wood", "marble", "tile", "palette", "texture", "granite", "veneer"])) {
    return {
      text: "Material selection is where a project really comes to life. The key is building a cohesive language — stone, wood, metal, plaster, light — rather than picking individual pieces. Do you have a style direction in mind?",
      chips: ["Warm & earthy", "Stone & wood", "Minimal & light", "Luxury palette"],
    };
  }

  if (has(t, ["furniture", "joinery", "wardrobe", "cabinet", "storage", "tv unit", "bookshelf", "shelf", "built-in", "custom"])) {
    return {
      text: "Bespoke joinery is a strong part of what ARCIGN does — furniture designed alongside the space feels significantly more resolved. Are you looking at specific pieces or a full room approach?",
      chips: ["Wardrobes", "TV unit", "Kitchen joinery", "Full room joinery"],
    };
  }

  if (has(t, ["style", "look", "aesthetic", "mood", "theme", "vibe", "feel", "reference", "inspiration"])) {
    return {
      text: "Think about how you want the space to feel — calm and quiet, warm and tactile, bold and refined, or light and airy. That gives us stronger design direction than just a style name. Any words that resonate?",
      chips: ["Warm minimal", "Luxury refined", "Clean modern", "Japandi calm"],
    };
  }

  if (has(t, ["execution", "on site", "supervision", "contractor", "implementation", "site management", "vendor"])) {
    return {
      text: "Execution support means staying involved through site visits, material approvals, and vendor coordination to protect design intent. Some clients need full oversight, others prefer milestone reviews. What are you thinking?",
      chips: ["Full execution", "Milestone reviews", "Design only", "Book consultation"],
    };
  }

  if (has(t, ["city", "location", "where", "site", "place", "region", "which city"])) {
    return {
      text: "Location matters more than people expect — local vendors, site conditions, and approval bodies vary. Which city is your project in?",
      chips: ["Bangalore", "Mumbai", "Delhi / Gurgaon", "Other city"],
    };
  }

  if (has(t, ["commercial", "office", "workspace", "hospitality", "hotel", "restaurant", "retail", "showroom"])) {
    return {
      text: "Commercial projects need early clarity around brand expression, functional zoning, footfall, and user experience. What type of space is this — office, hospitality, retail?",
      chips: ["Office", "Hospitality", "Retail", "Mixed use"],
    };
  }

  if (has(t, ["approval", "permission", "sanction", "authority", "municipal", "bmrda", "bbmp", "permit"])) {
    return {
      text: "Approval requirements depend on city, site type, and scope of work. Once I know your location and project details, I can walk you through what typically applies.",
      chips: ["Share city", "Architecture project", "Book consultation"],
    };
  }

  if (has(t, ["lighting", "light", "lamps", "fixtures", "ambience", "ambient", "pendant", "cove"])) {
    return {
      text: "Lighting defines mood more than most elements — we treat it as layers. Ambient, task, and accent light all read differently at different times of day. What kind of space is this for?",
      chips: ["Living room", "Bedroom", "Kitchen", "Full project"],
    };
  }

  if (has(t, ["send", "share", "checklist", "document", "what do you need", "start with", "what to bring"])) {
    return {
      text: "A good starting set: project type, city, property type, approximate area, stage you're at, rough budget range, and 2–3 reference images if you have them. Even rough inputs work — we refine as we go.",
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  if (has(t, ["start", "begin", "next step", "explore services", "start a project", "get started", "how to start"])) {
    return {
      text: pick([
        "The best first step is sharing the basics — project type, city, stage, style direction, and a rough budget. That's enough to guide you properly.",
        "Let's start with what the project is, where it is, and how far along you are. I can point you in the right direction from there.",
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  if (has(t, ["speak", "talk", "contact", "reach", "connect", "call me", "get in touch", "whatsapp", "phone", "email", "team"])) {
    return {
      text: "Happy to connect you with the ARCIGN team. I can note your details and have someone reach out — usually within a few hours. Want to go ahead?",
      chips: ["Yes, connect me", "Book consultation", "Tell me more first"],
    };
  }

  return {
    text: pick([
      "Tell me a bit more about the project — I'll guide you from there.",
      "Happy to help — is this about architecture, interiors, or a renovation?",
      `I can help with scope, timelines, budget direction, materials, or booking a consultation.${memory.name ? ` What would be most useful right now, ${memory.name}?` : " What would be most useful?"}`,
    ]),
    chips: smartChips(memory),
  };
};

// ─── Typing Delay ─────────────────────────────────────────────────────────────

const typingDelay = (text: string): number =>
  Math.min(650 + text.length * 14, 2200);

// ─── Glass Tokens ─────────────────────────────────────────────────────────────

const G = {
  panel:      "rgba(255,255,255,0.52)",
  header:     "rgba(255,255,255,0.42)",
  msgArea:    "rgba(255,255,255,0.20)",
  botBubble:  "rgba(255,255,255,0.75)",
  userBubble: "rgba(0,0,0,0.055)",
  chipBg:     "rgba(255,255,255,0.58)",
  inputBg:    "rgba(255,255,255,0.62)",
  footerBg:   "rgba(255,255,255,0.36)",
  border:     "rgba(0,0,0,0.08)",
  blur:       "blur(22px)",
  panelShadow:"0 24px 80px rgba(0,0,0,0.13), 0 2px 12px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.72)",
  launchShadow:"0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.65)",
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatWidget = () => {
  const [visible, setVisible]         = useState(false);
  const [open, setOpen]               = useState(false);
  const [input, setInput]             = useState("");
  const [typing, setTyping]           = useState(false);
  const [consultStage, setConsultStage] = useState<ConsultationStage>("idle");
  const [memory, setMemory]           = useState<VisitorMemory>({});
  const [unreadCount, setUnreadCount] = useState(0);

  const timeMeta = useMemo(() => getTimeMeta(), []);

  const initialMessage = useMemo<Message>(
    () => ({
      id: "init",
      sender: "bot",
      text: pick([
        `${timeMeta.greeting} — I'm Suyash, from ARCIGN. Tell me about your project and I'll take it from there.`,
        `${timeMeta.greeting} — welcome to ARCIGN. Whether it's architecture, interiors, or a renovation, I'm here to help you get started.`,
        `${timeMeta.greeting}. I'm Suyash — ARCIGN's first point of contact. What kind of space are you planning?`,
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
      time: getTimeStr(),
    }),
    [timeMeta]
  );

  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore
  useEffect(() => {
    try {
      const msgs  = localStorage.getItem(CHAT_KEY);
      const mem   = localStorage.getItem(MEMORY_KEY);
      const stage = localStorage.getItem(CONSULT_KEY);
      if (msgs)  { const p = JSON.parse(msgs)  as Message[];      if (Array.isArray(p) && p.length) setMessages(p); }
      if (mem)   { const p = JSON.parse(mem)   as VisitorMemory;  if (p && typeof p === "object")  setMemory(p); }
      if (stage && ["idle","ask_name","ask_phone","done"].includes(stage)) setConsultStage(stage as ConsultationStage);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { try { localStorage.setItem(CHAT_KEY,    JSON.stringify(messages));  } catch { /* ignore */ } }, [messages]);
  useEffect(() => { try { localStorage.setItem(MEMORY_KEY,  JSON.stringify(memory));    } catch { /* ignore */ } }, [memory]);
  useEffect(() => { try { localStorage.setItem(CONSULT_KEY, consultStage);              } catch { /* ignore */ } }, [consultStage]);

  useEffect(() => {
    const fn = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    fn(); window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing, open]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 350); setUnreadCount(0); }
  }, [open]);

  useEffect(() => {
    if (!open && messages.length > 1 && messages[messages.length - 1].sender === "bot")
      setUnreadCount((c) => Math.min(c + 1, 9));
  }, [messages, open]);

  const addBot = useCallback((text: string, chips?: string[]) => {
    setMessages((p) => [...p, { id: `b-${uid()}`, sender: "bot", text, chips, time: getTimeStr() }]);
  }, []);

  const getBotReply = useCallback(async (
    text: string, mem: VisitorMemory, history: Message[]
  ): Promise<{ text: string; chips?: string[] }> => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, agentName: "Suyash", company: "ARCIGN",
          role: "Live support agent", timeOfDay: timeMeta.greeting,
          visitorMemory: mem, recentMessages: history.slice(-10),
          systemPrompt: ARCIGN_SYSTEM_PROMPT }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data?.reply && typeof data.reply === "string")
        return { text: data.reply, chips: Array.isArray(data.chips) ? data.chips : smartChips(mem) };
      throw new Error();
    } catch { return fallbackReply(text, mem, history.length); }
  }, [timeMeta]);

  const sendMessage = useCallback(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || typing) return;

    const updatedMemory = extractMemory(text, memory);
    setMemory(updatedMemory);
    const userMsg: Message = { id: `u-${uid()}`, sender: "user", text, time: getTimeStr() };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");

    if (consultStage === "ask_name") {
      const name = extractName(text) ?? text.trim();
      setMemory((m) => ({ ...m, name }));
      setConsultStage("ask_phone");
      setTyping(true);
      setTimeout(() => { addBot(`Thank you${name ? `, ${name}` : ""}. Could you share your WhatsApp or phone number so the team can reach out?`); setTyping(false); }, 700);
      return;
    }

    if (consultStage === "ask_phone") {
      if (!isValidPhone(text)) {
        setTyping(true);
        setTimeout(() => { addBot("Could you double-check that number? I want to make sure it reaches you correctly."); setTyping(false); }, 650);
        return;
      }
      setMemory((m) => ({ ...m, phone: cleanPhone(text) }));
      setConsultStage("done");
      setTyping(true);
      setTimeout(() => { addBot(`Perfect${memory.name ? `, ${memory.name}` : ""}. Your details are noted. The ARCIGN team will be in touch shortly — looking forward to learning more about your project.`); setTyping(false); }, 750);
      return;
    }

    const consultTriggers = ["book consultation","consultation","book a call","schedule","book meeting",
      "start consultation","book call","speak to team","get in touch","contact me",
      "can someone call","want to connect","yes, connect me","connect me"];
    if (has(normalize(text), consultTriggers)) {
      setConsultStage("ask_name");
      setTyping(true);
      setTimeout(() => { addBot("Absolutely — I can help with that. May I have your name first?"); setTyping(false); }, 650);
      return;
    }

    setTyping(true);
    const reply = await getBotReply(text, updatedMemory, nextHistory);
    setTimeout(() => { addBot(reply.text, reply.chips); setTyping(false); }, typingDelay(reply.text));
  }, [typing, memory, messages, consultStage, addBot, getBotReply]);

  const reset = useCallback(() => {
    setMessages([initialMessage]); setMemory({}); setConsultStage("idle"); setUnreadCount(0);
    try { [CHAT_KEY, MEMORY_KEY, CONSULT_KEY].forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
  }, [initialMessage]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const iconBtn: React.CSSProperties = {
    background: "rgba(0,0,0,0.04)",
    border: `1px solid ${G.border}`,
    borderRadius: 8, width: 33, height: 33,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "rgba(0,0,0,0.45)", cursor: "pointer", transition: "background 0.15s",
    flexShrink: 0,
  };

  return (
    <>
      <style>{`
        @keyframes arcignDot {
          0%,60%,100% { transform:translateY(0); opacity:0.28; }
          30%          { transform:translateY(-4px); opacity:1; }
        }
        .arcign-scroll::-webkit-scrollbar { width:0; }
        .arcign-chips::-webkit-scrollbar  { height:0; }
        .arcign-msg-bubble { word-break:break-word; }
        .ag-chip:hover    { background:rgba(0,0,0,0.07)!important; border-color:rgba(0,0,0,0.16)!important; }
        .ag-icon:hover    { background:rgba(0,0,0,0.07)!important; }
        .ag-send:hover:not(:disabled) { background:rgba(0,0,0,0.88)!important; }
        .ag-launch:hover  { transform:scale(1.025); box-shadow:0 12px 40px rgba(0,0,0,0.18)!important; }
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
                initial={{ opacity: 0, y: 24, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.88 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Open chat with Suyash"
                className="ag-launch"
                style={{
                  position: "fixed", bottom: 24, right: 24, zIndex: 70,
                  display: "flex", alignItems: "center", gap: 12,
                  background: G.panel,
                  backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
                  border: `1px solid ${G.border}`,
                  borderRadius: 60, padding: "10px 20px 10px 10px",
                  boxShadow: G.launchShadow,
                  cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <span style={{ position: "relative", flexShrink: 0 }}>
                  <span style={{ display: "block", width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(0,0,0,0.10)" }}>
                    <img src={suyashPhoto} alt="Suyash" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </span>
                  <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, background: "#22c55e", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.85)" }} />
                </span>

                <span style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                  <span style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(0,0,0,0.38)", textTransform: "uppercase", lineHeight: 1, marginBottom: 3 }}>
                    ARCIGN Support
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0a0a0a", lineHeight: 1.2 }}>
                    Suyash · Online
                  </span>
                </span>

                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    style={{
                      position: "absolute", top: -4, right: -4,
                      background: "#ef4444", color: "#fff",
                      borderRadius: "50%", width: 18, height: 18,
                      fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid rgba(255,255,255,0.85)",
                    }}
                  >{unreadCount}</motion.span>
                )}
              </motion.button>
            )}

            {/* ── Chat Panel ── */}
            {open && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 32, scale: 0.93 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.93 }}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: "fixed", bottom: 24, right: 24, zIndex: 80,
                  width: "min(400px, calc(100vw - 20px))",
                  maxHeight: "min(680px, calc(100svh - 32px))",
                  display: "flex", flexDirection: "column",
                  borderRadius: 20, overflow: "hidden",
                  background: G.panel,
                  backdropFilter: G.blur, WebkitBackdropFilter: G.blur,
                  border: `1px solid ${G.border}`,
                  boxShadow: G.panelShadow,
                }}
              >

                {/* Header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "13px 14px",
                  background: G.header,
                  backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                  borderBottom: `1px solid ${G.border}`, flexShrink: 0,
                }}>
                  <button type="button" onClick={() => setOpen(false)} className="ag-icon"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(0,0,0,0.4)", padding: 4, display: "flex", alignItems: "center", borderRadius: 6, transition: "background 0.15s" }}
                    aria-label="Close">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>

                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(0,0,0,0.10)" }}>
                      <img src={suyashPhoto} alt="Suyash" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <span style={{ position: "absolute", bottom: 0, right: 0, width: 11, height: 11, background: "#22c55e", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.85)" }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "#0a0a0a", lineHeight: 1.2 }}>Suyash</div>
                    <div style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>Online · ARCIGN Support</div>
                  </div>

                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <a href="tel:+919999999999" className="ag-icon" style={{ ...iconBtn, textDecoration: "none" }} aria-label="Call">
                      <Phone size={13} />
                    </a>
                    <button type="button" onClick={reset} className="ag-icon" style={iconBtn} aria-label="Reset">
                      <RotateCcw size={12} />
                    </button>
                    <button type="button" onClick={() => setOpen(false)} className="ag-icon" style={iconBtn} aria-label="Close">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="arcign-scroll" style={{
                  flex: 1, overflowY: "auto", overscrollBehavior: "contain",
                  padding: "16px 12px 8px",
                  background: G.msgArea,
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                }}>
                  {/* Date pill */}
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <span style={{
                      background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)",
                      borderRadius: 6, padding: "3px 12px",
                      fontSize: 10.5, color: "rgba(0,0,0,0.40)", fontWeight: 500,
                      border: `1px solid ${G.border}`,
                    }}>
                      {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {messages.map((msg, i) => {
                      const isBot = msg.sender === "bot";
                      const prevMsg = messages[i - 1];
                      const showAvatar = isBot && (!prevMsg || prevMsg.sender !== "bot");

                      return (
                        <motion.div
                          key={msg.id}
                          className="arcign-msg-bubble"
                          initial={{ opacity: 0, y: 10, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.24, delay: i === 0 ? 0 : 0.04 }}
                        >
                          <div style={{ display: "flex", flexDirection: isBot ? "row" : "row-reverse", alignItems: "flex-end", gap: 6 }}>
                            {isBot ? (
                              <div style={{ width: 28, flexShrink: 0 }}>
                                {showAvatar && (
                                  <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
                                    <img src={suyashPhoto} alt="Suyash" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  </div>
                                )}
                              </div>
                            ) : <div style={{ width: 0 }} />}

                            <div style={{
                              maxWidth: "78%",
                              background: isBot ? G.botBubble : G.userBubble,
                              backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                              border: `1px solid ${isBot ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.08)"}`,
                              borderRadius: isBot
                                ? (showAvatar ? "2px 16px 16px 16px" : "16px 16px 16px 4px")
                                : "16px 16px 4px 16px",
                              padding: "9px 13px 7px",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            }}>
                              {isBot && showAvatar && (
                                <div style={{ fontSize: 10.5, fontWeight: 700, color: "#15803d", marginBottom: 4 }}>
                                  Suyash · ARCIGN
                                </div>
                              )}
                              <p style={{ fontSize: 13.5, lineHeight: 1.58, color: "#0a0a0a", margin: 0 }}>{msg.text}</p>
                              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, gap: 4, alignItems: "center" }}>
                                <span style={{ fontSize: 10, color: "rgba(0,0,0,0.32)" }}>{msg.time ?? ""}</span>
                                {!isBot && (
                                  <svg width="14" height="9" viewBox="0 0 16 11" fill="none">
                                    <path d="M1 6L5 10L15 1" stroke="rgba(0,0,0,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M5 6L9 10L15 5" stroke="rgba(0,0,0,0.18)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>

                          {isBot && msg.chips && msg.chips.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15, duration: 0.22 }}
                              style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 8, marginLeft: 34, marginBottom: 6 }}
                            >
                              {msg.chips.map((chip) => (
                                <button key={chip} type="button" onClick={() => void sendMessage(chip)}
                                  className="ag-chip"
                                  style={{
                                    background: G.chipBg,
                                    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                                    border: `1px solid rgba(0,0,0,0.09)`,
                                    borderRadius: 20, padding: "6px 14px",
                                    fontSize: 12, color: "#0a0a0a", fontWeight: 500,
                                    cursor: "pointer", transition: "all 0.15s",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)", lineHeight: 1,
                                  }}>
                                  {chip}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}

                    <AnimatePresence>
                      {typing && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.2 }}
                          style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 2 }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(0,0,0,0.08)" }}>
                            <img src={suyashPhoto} alt="Suyash" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div style={{
                            background: G.botBubble, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                            border: `1px solid rgba(0,0,0,0.07)`,
                            borderRadius: "2px 16px 16px 16px",
                            padding: "11px 16px", display: "flex", gap: 5, alignItems: "center",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                          }}>
                            {[0,1,2].map((i) => (
                              <span key={i} style={{
                                width: 6, height: 6, borderRadius: "50%", background: "rgba(0,0,0,0.28)", display: "block",
                                animation: `arcignDot 1.3s ease-in-out ${i * 0.2}s infinite`,
                              }} />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={endRef} />
                  </div>
                </div>

                {/* Quick chips */}
                <div style={{
                  background: G.footerBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                  borderTop: `1px solid ${G.border}`, padding: "8px 12px 6px", flexShrink: 0,
                }}>
                  <div className="arcign-chips" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                    {["Start a project","Explore services","Budget guidance","Book consultation"].map((chip) => (
                      <button key={chip} type="button" onClick={() => void sendMessage(chip)}
                        className="ag-chip"
                        style={{
                          flexShrink: 0, whiteSpace: "nowrap",
                          background: "rgba(255,255,255,0.50)",
                          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                          border: `1px solid rgba(0,0,0,0.09)`,
                          borderRadius: 16, padding: "6px 14px",
                          fontSize: 11.5, color: "#0a0a0a", cursor: "pointer",
                          transition: "all 0.15s", fontWeight: 500,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}>
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <div style={{
                  background: G.footerBg, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                  padding: "8px 10px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    flex: 1, display: "flex", alignItems: "center", padding: "6px 16px",
                    background: G.inputBg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                    borderRadius: 24, border: `1px solid rgba(0,0,0,0.09)`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  }}>
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(input); } }}
                      placeholder="Message Suyash…"
                      autoComplete="off"
                      style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13.5, color: "#0a0a0a", height: 36 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void sendMessage(input)}
                    disabled={!input.trim() || typing}
                    className="ag-send"
                    style={{
                      width: 40, height: 40, borderRadius: "50%", border: "none",
                      background: input.trim() && !typing ? "rgba(0,0,0,0.80)" : "rgba(0,0,0,0.12)",
                      cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "background 0.2s",
                    }}
                    aria-label="Send"
                  >
                    <Send size={15} color={input.trim() && !typing ? "#fff" : "rgba(0,0,0,0.30)"} />
                  </button>
                </div>

              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
};
