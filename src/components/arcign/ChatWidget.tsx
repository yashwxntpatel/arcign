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
  "love", "girlfriend", "boyfriend", "boyfriend", "stock", "crypto", "bitcoin",
  "news", "sport", "football", "ipl", "celebrity", "bollywood", "netflix",
  "meaning of life", "gpt", "chatgpt", "openai", "google", "ai",
  "meme", "game", "gaming", "war", "astrology", "horoscope",
];

const isOffTopic = (text: string): boolean => {
  const t = normalize(text);
  // If it contains any business keyword, it's on-topic
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

If someone asks something completely unrelated to ARCIGN's business (weather, sports, jokes, politics, etc.), respond with a witty, classy one-liner and redirect back to ARCIGN topics. Do NOT answer the off-topic question.

Never say you are an AI. Never claim to have no knowledge. Respond as Suyash would — a real person who knows ARCIGN deeply.`;

// ─── Fallback Reply Engine ────────────────────────────────────────────────────

const fallbackReply = (
  input: string,
  memory: VisitorMemory,
  msgCount: number
): { text: string; chips?: string[] } => {
  const t = normalize(input);
  void msgCount;

  // Off-topic
  if (isOffTopic(t)) {
    return { text: pick(NON_BUSINESS_REDIRECTS), chips: smartChips(memory) };
  }

  // Greetings
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

  // Services
  if (has(t, ["services", "what do you do", "offer", "offerings", "work on", "specialize"])) {
    return {
      text: "ARCIGN works across architecture, interior design, bespoke joinery, material curation, and execution coordination. Each project is handled as a complete design exercise — not just aesthetics. Want me to walk you through any specific area?",
      chips: ["Architecture", "Interiors", "Joinery & furniture", "Execution support"],
    };
  }

  // Process
  if (has(t, ["process", "how do you work", "how does it work", "workflow", "steps", "how it works", "methodology"])) {
    return {
      text: pick([
        "Every project begins with a discovery session — understanding your goals, lifestyle, site, and budget. From there: concept development, detailed design, material selection, and execution if needed. What stage are you currently at?",
        "The process typically runs: brief → concept → design development → material curation → execution oversight. The depth varies based on what you need. Tell me about your project and I can map it out for you.",
      ]),
      chips: ["Early planning", "Design stage", "Execution", "Book consultation"],
    };
  }

  // Budget
  if (has(t, ["budget", "cost", "price", "fees", "charges", "how much", "rate", "pricing", "expensive"])) {
    return {
      text: pick([
        "Costs vary based on project type, area, scope, and finish level. If you share a rough range you're comfortable with, I can give you a much clearer picture of what's achievable.",
        "Budget depends on whether it's architecture, interiors, or renovation — and the scale involved. What kind of project are you planning?",
        `Design fees and execution budgets are two different conversations.${memory.projectType ? ` For a ${memory.projectType} project, let me explain how it typically works.` : " Which are you exploring right now?"}`,
      ]),
      chips: ["Architecture project", "Interior project", "Renovation", "Share project details"],
    };
  }

  // Timeline
  if (has(t, ["timeline", "how long", "duration", "when", "time frame", "how many months", "deadline"])) {
    return {
      text: `Timelines depend on scope.${memory.projectType === "Architecture" ? " Architecture projects typically run 12–24 months end to end." : memory.projectType === "Interiors" ? " Interior projects range from 3–8 months depending on the rooms in scope." : " Renovations can range from 6 weeks to 6 months based on what's being redone."} What's your target timeline?`,
      chips: ["Architecture timeline", "Interior timeline", "Renovation timeline", "Book consultation"],
    };
  }

  // Architecture
  if (has(t, ["architecture", "architect", "new build", "villa design", "house design", "bungalow", "facade", "construction", "structure"])) {
    return {
      text: pick([
        `For an architecture project, a few things help us scope it properly: site location, approximate built-up area, design direction, and target timeline.${memory.city ? ` Given you're in ${memory.city}, we can factor in local site conditions too.` : " Which city is the site in?"}`,
        "Architecture work here covers concept design, working drawings, approval drawings, and execution oversight. What kind of property are you building — villa, residence, or something else?",
      ]),
      chips: ["Villa", "Residence", "Site planning", "Facade design"],
    };
  }

  // Interiors
  if (has(t, ["interior", "interiors", "living room", "bedroom", "kitchen", "dining", "apartment", "flat", "furnish", "decor", "room"])) {
    return {
      text: pick([
        `Interiors work begins with which rooms are in scope, your preferred style direction, and budget range.${memory.propertyType ? ` For your ${memory.propertyType}, that gives us a good starting framework.` : " Is this for an apartment, villa, or another property type?"}`,
        "For interiors, the key inputs upfront are: rooms in scope, mood you're after, and whether you need design-only or full execution. What does your project look like?",
      ]),
      chips: ["Living room", "Bedroom", "Kitchen", "Full apartment"],
    };
  }

  // Renovation
  if (has(t, ["renovation", "remodel", "redo", "refurbish", "upgrade", "revamp", "gut"])) {
    return {
      text: "Renovation planning is much cleaner once we're clear on what's changing and what stays. Civil work vs soft upgrades have very different timelines and budgets. What's the scope you're thinking about?",
      chips: ["Civil renovation", "Soft upgrade", "Full redo", "Book consultation"],
    };
  }

  // Materials
  if (has(t, ["material", "materials", "finish", "finishes", "stone", "wood", "marble", "tile", "palette", "texture", "granite", "veneer"])) {
    return {
      text: "Material selection is where a project really comes to life. The key is building a cohesive language — stone, wood, metal, plaster, light — rather than picking individual pieces. Do you have a style direction in mind, or should I help you find one?",
      chips: ["Warm & earthy", "Stone & wood", "Minimal & light", "Luxury palette"],
    };
  }

  // Furniture / Joinery
  if (has(t, ["furniture", "joinery", "wardrobe", "cabinet", "storage", "tv unit", "bookshelf", "shelf", "built-in", "custom"])) {
    return {
      text: "Bespoke joinery is a strong part of what ARCIGN does — when furniture is designed alongside the space, the outcome feels significantly more resolved. Are you looking at specific pieces or a full room approach?",
      chips: ["Wardrobes", "TV unit", "Kitchen joinery", "Full room joinery"],
    };
  }

  // Style
  if (has(t, ["style", "look", "aesthetic", "mood", "theme", "vibe", "feel", "reference", "inspiration"])) {
    return {
      text: "Rather than just a style name, think about how you want the space to feel — calm and quiet, warm and tactile, bold and refined, or light and airy. That gives us much stronger design direction. Any words that resonate with you?",
      chips: ["Warm minimal", "Luxury refined", "Clean modern", "Japandi calm"],
    };
  }

  // Execution
  if (has(t, ["execution", "on site", "supervision", "contractor", "implementation", "site management", "vendor"])) {
    return {
      text: "Execution support means staying involved through site visits, material approvals, and vendor coordination — to protect design intent. Some clients need full oversight, others just milestone reviews. What level of involvement are you thinking?",
      chips: ["Full execution", "Milestone reviews", "Design only", "Book consultation"],
    };
  }

  // Location
  if (has(t, ["city", "location", "where", "site", "place", "region", "which city"])) {
    return {
      text: "Location matters more than people expect — local vendors, site conditions, and approval bodies vary significantly. Which city is your project in?",
      chips: ["Bangalore", "Mumbai", "Delhi / Gurgaon", "Other city"],
    };
  }

  // Commercial
  if (has(t, ["commercial", "office", "workspace", "hospitality", "hotel", "restaurant", "retail", "showroom", "co-working"])) {
    return {
      text: "Commercial projects need early clarity around brand expression, functional zoning, footfall, and user experience goals. What type of space is this — office, hospitality, retail, or something else?",
      chips: ["Office", "Hospitality", "Retail", "Mixed use"],
    };
  }

  // Approvals
  if (has(t, ["approval", "permission", "sanction", "authority", "municipal", "bmrda", "bbmp", "permit"])) {
    return {
      text: "Approval requirements depend on city, site type, and the nature of work. Once I know your location and project scope, I can walk you through what typically applies. Where is the site?",
      chips: ["Share city", "Architecture project", "Book consultation"],
    };
  }

  // Lighting
  if (has(t, ["lighting", "light", "lamps", "fixtures", "ambience", "ambient", "pendant", "cove"])) {
    return {
      text: "Lighting is one of the most underestimated elements of a space — we treat it as layers. Ambient, task, and accent light all contribute differently to how a room reads at different times. What kind of space is this for?",
      chips: ["Living room", "Bedroom", "Kitchen", "Full project"],
    };
  }

  // Checklist / Documents
  if (has(t, ["send", "share", "checklist", "document", "what do you need", "start with", "what to bring"])) {
    return {
      text: "A useful starting set: project type, city, property type, approximate area, stage you're at, rough budget comfort, and 2–3 reference images if you have them. Even rough inputs work — we refine as we go.",
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  // Start / Begin
  if (has(t, ["start", "begin", "next step", "explore services", "start a project", "get started", "how to start"])) {
    return {
      text: pick([
        "The best first step is sharing the basics — project type, city, stage, style direction, and a rough budget comfort zone. That's enough for me to guide you properly.",
        "Let's start with what the project is, where it is, and how far along you are. From there I can point you in the right direction — or connect you with the team directly.",
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  // Contact / Speak to team
  if (has(t, ["speak", "talk", "contact", "reach", "connect", "call me", "get in touch", "whatsapp", "phone", "email", "team"])) {
    return {
      text: "Happy to connect you with the ARCIGN team. I can note down your details and have someone reach out — usually within a few hours. Want to go ahead?",
      chips: ["Yes, connect me", "Book consultation", "Tell me more first"],
    };
  }

  // Default
  return {
    text: pick([
      "Tell me a bit more about the project — I'll guide you from there.",
      "Happy to help — is this about architecture, interiors, or a renovation?",
      `I can help with scope, timelines, budget direction, materials, or booking a consultation.${memory.name ? ` What would be most useful right now, ${memory.name}?` : " What would be most useful right now?"}`,
    ]),
    chips: smartChips(memory),
  };
};

// ─── Typing Delay ─────────────────────────────────────────────────────────────

const typingDelay = (text: string): number => {
  const base = 650;
  const perChar = 14;
  const max = 2200;
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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 350);
      setUnreadCount(0);
    }
  }, [open]);

  // ── Unread badge ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open && messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "bot") setUnreadCount((c) => Math.min(c + 1, 9));
    }
  }, [messages, open]);

  // ── Add bot message ────────────────────────────────────────────────────────

  const addBot = useCallback((text: string, chips?: string[]) => {
    setMessages((prev) => [
      ...prev,
      { id: `b-${uid()}`, sender: "bot", text, chips, time: getTimeStr() },
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
            role: "Live support agent",
            timeOfDay: timeMeta.greeting,
            visitorMemory: mem,
            recentMessages: history.slice(-10),
            systemPrompt: ARCIGN_SYSTEM_PROMPT,
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

      const userMsg: Message = { id: `u-${uid()}`, sender: "user", text, time: getTimeStr() };
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
          addBot(
            `Thank you${name ? `, ${name}` : ""}. Could you share your WhatsApp or phone number so the team can reach out?`
          );
          setTyping(false);
        }, 700);
        return;
      }

      if (consultStage === "ask_phone") {
        if (!isValidPhone(text)) {
          setTyping(true);
          setTimeout(() => {
            addBot("Could you double-check that number? I want to make sure it reaches you correctly.");
            setTyping(false);
          }, 650);
          return;
        }
        const phone = cleanPhone(text);
        setMemory((m) => ({ ...m, phone }));
        setConsultStage("done");
        setTyping(true);
        setTimeout(() => {
          addBot(
            `Perfect${memory.name ? `, ${memory.name}` : ""}. Your details are noted. The ARCIGN team will be in touch shortly — looking forward to learning more about your project.`
          );
          setTyping(false);
        }, 750);
        return;
      }

      // ── Consultation trigger ──
      const consultTriggers = [
        "book consultation", "consultation", "book a call", "schedule",
        "book meeting", "start consultation", "book call", "speak to team",
        "get in touch", "contact me", "can someone call", "want to connect",
        "yes, connect me", "connect me",
      ];
      if (has(normalize(text), consultTriggers)) {
        setConsultStage("ask_name");
        setTyping(true);
        setTimeout(() => {
          addBot("Absolutely — I can help with that. May I have your name first?");
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
    setUnreadCount(0);
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
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes arcignPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
        }
        .arcign-scroll::-webkit-scrollbar { width: 0; }
        .arcign-chips::-webkit-scrollbar { height: 0; }
        .arcign-msg-bubble { word-break: break-word; }
        .arcign-chat-bg {
          background-color: #ece5dd;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c5b8ad' fill-opacity='0.18'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .arcign-input-bar {
          background: #ffffff;
          border-radius: 24px;
        }
        .arcign-send-btn {
          background: #25a560;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .arcign-send-btn:hover { background: #1e9452; }
        .arcign-send-btn:disabled { background: #b2dfcb; cursor: not-allowed; }
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
  className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 md:bottom-8 md:right-8"
  style={{
    background: "rgba(255, 255, 255, 0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderRadius: 60,
    padding: "10px 20px 10px 10px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
    border: "1px solid rgba(0,0,0,0.08)",
  }}
>
              
                {/* Avatar + online dot */}
                <span className="relative shrink-0">
                  <span
                    className="block overflow-hidden"
                    style={{ width: 44, height: 44, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.12)" }}
                  >
                    <img src={suyashPhoto} alt="Suyash" className="h-full w-full object-cover" />
                  </span>
                  <span
                    className="absolute"
                    style={{
                      bottom: 1, right: 1, width: 13, height: 13,
                      background: "#25d366", borderRadius: "50%",
                      border: "2px solid #1a1a1a",
                      animation: "arcignPulse 2s ease-in-out infinite",
                    }}
                  />
                </span>

                {/* Text */}
                <span className="hidden flex-col text-left sm:flex">
                  <span style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(0,0,0,0.5)", textTransform: "uppercase", lineHeight: 1, marginBottom: 3 }}>
                    ARCIGN Support
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "#111", lineHeight: 1.2 }}>
                    Suyash · Online
                  </span>
                </span>

                {/* Unread badge */}
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{
                      position: "absolute", top: -4, right: -4,
                      background: "#ef4444", color: "#fff",
                      borderRadius: "50%", width: 18, height: 18,
                      fontSize: 10, fontWeight: 700, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      border: "2px solid #1a1a1a",
                    }}
                  >
                    {unreadCount}
                  </motion.span>
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
                className="fixed bottom-6 right-6 z-[80] flex flex-col overflow-hidden md:bottom-8 md:right-8"
                style={{
                  width: "min(400px, calc(100vw - 20px))",
                  maxHeight: "min(680px, calc(100svh - 32px))",
                  borderRadius: 18,
                  boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >

                {/* ── WhatsApp-style Header ── */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #1a1a1a 0%, #222 100%)",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexShrink: 0,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* Back / close on mobile */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.65)", padding: 4, display: "flex",
                      alignItems: "center", borderRadius: 6,
                    }}
                    aria-label="Close"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: "50%",
                        overflow: "hidden", border: "1.5px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <img src={suyashPhoto} alt="Suyash" className="h-full w-full object-cover" />
                    </div>
                    <span
                      style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 11, height: 11, background: "#25d366",
                        borderRadius: "50%", border: "2px solid #1a1a1a",
                      }}
                    />
                  </div>

                  {/* Name + status */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
                      Suyash
                    </div>
                    <div style={{ fontSize: 11.5, color: "#25d366", marginTop: 2, lineHeight: 1 }}>
                      Online · ARCIGN Support
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <a
                      href="tel:+919999999999"
                      style={{
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8, width: 34, height: 34, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "rgba(255,255,255,0.65)", textDecoration: "none",
                        transition: "all 0.18s",
                      }}
                      aria-label="Call"
                      title="Call ARCIGN"
                    >
                      <Phone size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={reset}
                      style={{
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8, width: 34, height: 34, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "rgba(255,255,255,0.65)", cursor: "pointer",
                        transition: "all 0.18s",
                      }}
                      aria-label="Reset chat"
                      title="Reset conversation"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      style={{
                        background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8, width: 34, height: 34, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "rgba(255,255,255,0.65)", cursor: "pointer",
                        transition: "all 0.18s",
                      }}
                      aria-label="Close chat"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* ── Messages Area (WhatsApp chat bg) ── */}
                <div
                  className="arcign-scroll arcign-chat-bg flex-1 overflow-y-auto overscroll-contain"
                  style={{ padding: "16px 12px 8px" }}
                >
                  {/* Date chip */}
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <span style={{
                      background: "rgba(255,255,255,0.72)", backdropFilter: "blur(8px)",
                      borderRadius: 6, padding: "3px 10px",
                      fontSize: 11, color: "#5a5a5a", fontWeight: 500,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
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
                          initial={{ opacity: 0, y: 10, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25, delay: i === 0 ? 0 : 0.04 }}
                        >
                          <div
                            className="arcign-msg-bubble"
                            style={{
                              display: "flex",
                              flexDirection: isBot ? "row" : "row-reverse",
                              alignItems: "flex-end",
                              gap: 6,
                              marginBottom: 1,
                            }}
                          >
                            {/* Avatar for bot */}
                            {isBot ? (
                              <div style={{ width: 28, flexShrink: 0 }}>
                                {showAvatar && (
                                  <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(0,0,0,0.08)" }}>
                                    <img src={suyashPhoto} alt="Suyash" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  </div>
                                )}
                              </div>
                            ) : <div style={{ width: 0 }} />}

                            {/* Bubble */}
                            <div
                              style={{
                                maxWidth: "78%",
                                background: isBot ? "#ffffff" : "#dcf8c6",
                                borderRadius: isBot
                                  ? (showAvatar ? "0px 14px 14px 14px" : "14px 14px 14px 4px")
                                  : "14px 14px 4px 14px",
                                padding: "9px 13px 7px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                                position: "relative",
                              }}
                            >
                              {/* Bot name label */}
                              {isBot && showAvatar && (
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#075e54", marginBottom: 3, letterSpacing: "0.01em" }}>
                                  Suyash · ARCIGN
                                </div>
                              )}
                              <p style={{ fontSize: 13.5, lineHeight: 1.58, color: "#1a1a1a", margin: 0 }}>
                                {msg.text}
                              </p>
                              {/* Timestamp */}
                              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4, gap: 4, alignItems: "center" }}>
                                <span style={{ fontSize: 10.5, color: "#9aa3af" }}>{msg.time ?? ""}</span>
                                {!isBot && (
                                  <svg width="14" height="10" viewBox="0 0 16 11" fill="none">
                                    <path d="M1 6L5 10L15 1" stroke="#53bdeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M5 6L9 10L15 5" stroke="#53bdeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Chips */}
                          {isBot && msg.chips && msg.chips.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15, duration: 0.24 }}
                              style={{
                                display: "flex", flexWrap: "wrap", gap: 7,
                                marginTop: 8, marginLeft: 34, marginBottom: 6,
                              }}
                            >
                              {msg.chips.map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => void sendMessage(chip)}
                                  style={{
                                    background: "#fff", border: "1.5px solid #d1d5db",
                                    borderRadius: 20, padding: "6px 14px",
                                    fontSize: 12, color: "#075e54", fontWeight: 500,
                                    cursor: "pointer", transition: "all 0.15s",
                                    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                                    lineHeight: 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "#075e54";
                                    (e.currentTarget as HTMLButtonElement).style.color = "#fff";
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#075e54";
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                                    (e.currentTarget as HTMLButtonElement).style.color = "#075e54";
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
                                  }}
                                >
                                  {chip}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}

                    {/* Typing indicator */}
                    <AnimatePresence>
                      {typing && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.2 }}
                          style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 2 }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(0,0,0,0.08)" }}>
                            <img src={suyashPhoto} alt="Suyash" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div
                            style={{
                              background: "#fff", borderRadius: "0px 14px 14px 14px",
                              padding: "11px 16px", display: "flex", gap: 5,
                              alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.10)",
                            }}
                          >
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                style={{
                                  width: 7, height: 7, borderRadius: "50%",
                                  background: "#a0a0a0", display: "block",
                                  animation: `arcignDot 1.3s ease-in-out ${i * 0.2}s infinite`,
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={endRef} />
                  </div>
                </div>

                {/* ── Quick Chips bar ── */}
                <div
                  style={{
                    background: "#f0f0f0",
                    borderTop: "1px solid #e0e0e0",
                    padding: "8px 12px 6px",
                    flexShrink: 0,
                  }}
                >
                  <div className="arcign-chips" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                    {["Start a project", "Explore services", "Budget guidance", "Book consultation"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => void sendMessage(chip)}
                        style={{
                          flexShrink: 0, whiteSpace: "nowrap",
                          background: "#fff", border: "1px solid #d1d5db",
                          borderRadius: 16, padding: "6px 14px",
                          fontSize: 11.5, color: "#333", cursor: "pointer",
                          transition: "all 0.15s", fontWeight: 500,
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── WhatsApp-style Input ── */}
                <div
                  style={{
                    background: "#f0f0f0",
                    padding: "8px 10px 12px",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    className="arcign-input-bar"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      padding: "6px 16px",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
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
                      placeholder="Message"
                      autoComplete="off"
                      style={{
                        flex: 1, background: "none", border: "none", outline: "none",
                        fontSize: 14, color: "#1a1a1a", height: 38,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void sendMessage(input)}
                    disabled={!input.trim() || typing}
                    className="arcign-send-btn"
                    aria-label="Send message"
                  >
                    <Send size={15} color="#fff" />
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
