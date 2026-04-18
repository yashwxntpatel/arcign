import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, Sparkles } from "lucide-react";
import suyashPhoto from "@/assets/suyash-agent.jpg";

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

const CHAT_STORAGE_KEY = "arcign_suyash_chat_history_v4";
const MEMORY_STORAGE_KEY = "arcign_suyash_memory_v4";
const CONSULTATION_STAGE_KEY = "arcign_suyash_consult_stage_v4";

const getTimeMeta = () => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return {
      greeting: "Good morning",
      mood: "a fresh start to your day",
    };
  }
  if (hour < 17) {
    return {
      greeting: "Good afternoon",
      mood: "a great time to plan your space clearly",
    };
  }
  return {
    greeting: "Good evening",
    mood: "a calm time to think about your project direction",
  };
};

const randomPick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const normalize = (text: string) => text.toLowerCase().trim();

const containsAny = (text: string, words: string[]) => {
  return words.some((word) => text.includes(word));
};

const looksLikePhoneNumber = (text: string) => {
  const cleaned = text.replace(/[^\d+]/g, "");
  return cleaned.length >= 10;
};

const cleanPhone = (text: string) => {
  return text.replace(/[^\d+\-\s]/g, "").trim();
};

const extractLikelyName = (text: string) => {
  const direct = text.match(/my name is\s+([a-zA-Z\s]{2,40})/i);
  if (direct?.[1]) return direct[1].trim();

  const simple = text.match(/^[a-zA-Z][a-zA-Z\s]{1,40}$/);
  if (simple?.[0]) return simple[0].trim();

  return undefined;
};

const extractMemoryFromText = (input: string, current: VisitorMemory): VisitorMemory => {
  const text = normalize(input);
  const next = { ...current };

  if (containsAny(text, ["architecture", "architect"])) next.projectType = "Architecture";
  if (containsAny(text, ["interior", "interiors"])) next.projectType = "Interiors";
  if (containsAny(text, ["renovation", "remodel", "redo"])) next.projectType = "Renovation";

  if (containsAny(text, ["villa"])) next.propertyType = "Villa";
  if (containsAny(text, ["apartment", "flat"])) next.propertyType = "Apartment";
  if (containsAny(text, ["residence", "home", "house"])) next.propertyType = "Residence";
  if (containsAny(text, ["office", "workspace", "commercial"])) next.propertyType = "Commercial";

  if (containsAny(text, ["living room"])) next.roomType = "Living room";
  if (containsAny(text, ["bedroom"])) next.roomType = "Bedroom";
  if (containsAny(text, ["kitchen"])) next.roomType = "Kitchen";
  if (containsAny(text, ["dining"])) next.roomType = "Dining";
  if (containsAny(text, ["bathroom"])) next.roomType = "Bathroom";

  if (containsAny(text, ["modern"])) next.style = "Modern";
  if (containsAny(text, ["minimal", "minimalist"])) next.style = "Minimal";
  if (containsAny(text, ["luxury", "premium"])) next.style = "Luxury";
  if (containsAny(text, ["warm", "warm minimal"])) next.style = "Warm minimal";
  if (containsAny(text, ["contemporary"])) next.style = "Contemporary";

  if (containsAny(text, ["planning stage", "early stage", "starting", "just starting"])) {
    next.stage = "Early stage";
  }
  if (containsAny(text, ["under construction", "construction started", "site started"])) {
    next.stage = "Under construction";
  }
  if (containsAny(text, ["design stage", "concept stage"])) {
    next.stage = "Design stage";
  }

  const budgetMatch = input.match(
    /\b(\d+\s?(lakh|lakhs|cr|crore|crores|k|m)|₹\s?\d[\d,\.]*)\b/i
  );
  if (budgetMatch) next.budget = budgetMatch[0];

  const cityMatch = input.match(
    /\b(bangalore|bengaluru|mumbai|delhi|gurgaon|gurugram|noida|pune|hyderabad|ahmedabad|chennai|kolkata|surat|jaipur|lucknow|goa|kochi|coimbatore)\b/i
  );
  if (cityMatch) next.city = cityMatch[0];

  if (
    containsAny(text, [
      "3 month",
      "three month",
      "4 month",
      "6 month",
      "8 month",
      "1 year",
      "12 month",
    ])
  ) {
    next.timeline = input;
  }

  const name = extractLikelyName(input);
  if (name && !next.name) next.name = name;

  if (looksLikePhoneNumber(input)) {
    next.phone = cleanPhone(input);
  }

  return next;
};

const buildHelpfulPromptChips = (memory: VisitorMemory) => {
  if (memory.projectType === "Architecture") {
    return ["Site requirements", "Timeline", "Budget planning", "Book consultation"];
  }
  if (memory.projectType === "Interiors") {
    return ["Room planning", "Material palette", "Execution support", "Book consultation"];
  }
  if (memory.projectType === "Renovation") {
    return ["Renovation scope", "Timeline", "Budget planning", "Book consultation"];
  }

  return ["Services", "Project process", "Budget guidance", "Book consultation"];
};

const addEmojiEveryAlternateBotReply = (
  text: string,
  messageCount: number,
  emojis: string[]
) => {
  const botReplyIndex = Math.floor(messageCount / 2) + 1;
  const shouldAddEmoji = botReplyIndex % 2 === 0;
  if (!shouldAddEmoji) return text;
  return `${text} ${randomPick(emojis)}`;
};

const fallbackReply = (input: string, memory: VisitorMemory, messageCount: number) => {
  const text = normalize(input);

  if (["hi", "hello", "hey", "hii", "yo", "good morning", "good afternoon", "good evening"].includes(text)) {
    return {
      text: addEmojiEveryAlternateBotReply(
        randomPick([
          "Hey, welcome — tell me what kind of space or project you're planning.",
          "Hey there — I'm Suyash. Are you looking at architecture, interiors, or a renovation?",
          "Hi — happy to help. Let me know what you're exploring and I'll guide you step by step.",
        ]),
        messageCount,
        ["👋", "😊", "✨"]
      ),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  if (containsAny(text, ["services", "what do you do", "what services"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "ARCIGN typically supports architecture design, interior design, bespoke furniture and joinery, material curation, design development, renovation guidance, and execution coordination. If you want, I can narrow this down based on your exact requirement.",
        messageCount,
        ["🏡", "🛋️", "📐"]
      ),
      chips: ["Architecture", "Interiors", "Furniture & joinery", "Execution support"],
    };
  }

  if (containsAny(text, ["process", "how do you work", "how does it work", "workflow"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "A typical project starts with understanding goals, lifestyle needs, site or space conditions, timeline, and budget. After that usually comes concept direction, planning, detailing, material decisions, and then execution support depending on scope.",
        messageCount,
        ["🧭", "📋", "✨"]
      ),
      chips: ["Concept stage", "Drawings", "Materials", "Execution support"],
    };
  }

  if (containsAny(text, ["budget", "cost", "price", "fees", "charges"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Costs depend on project type, area, scope, detailing depth, materials, and how involved the studio needs to be. The most useful first step is sharing project type, city, approximate size, and a rough budget comfort range so the scope can be structured correctly.",
        messageCount,
        ["💰", "📊", "🧾"]
      ),
      chips: ["Architecture budget", "Interior budget", "Share project details", "Book consultation"],
    };
  }

  if (containsAny(text, ["timeline", "how long", "how much time", "duration"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Timelines depend on whether this is architecture, interiors, or renovation, and whether you need concept only, detailed drawings, or execution coordination as well. Early clarity on scope usually helps avoid delays and keeps decisions cleaner.",
        messageCount,
        ["⏳", "📅", "🛠️"]
      ),
      chips: ["Architecture timeline", "Interior timeline", "Renovation timeline", "Project process"],
    };
  }

  if (containsAny(text, ["architecture", "architect", "villa", "house", "residence", "home design"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "For architecture projects, the key things I'd usually ask first are: city or location, site status, approximate built-up area, design direction, budget comfort, and timeline expectations. That gives enough context to guide the next step properly.",
        messageCount,
        ["📐", "🏡", "🧱"]
      ),
      chips: ["Site requirements", "Villa design", "Residence design", "Budget planning"],
    };
  }

  if (containsAny(text, ["interior", "interiors", "living room", "bedroom", "kitchen", "dining", "apartment"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "For interior projects, we usually need to understand the space type, rooms involved, your preferred mood or style, budget range, how detailed you want the work to go, and whether you need design only or design plus execution support.",
        messageCount,
        ["🛋️", "🎨", "✨"]
      ),
      chips: ["Living room", "Kitchen", "Bedroom", "Material palette"],
    };
  }

  if (containsAny(text, ["renovation", "remodel", "redo", "refurbish"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "For renovation projects, it helps to know what is staying, what is changing, whether civil work is involved, and how much disruption is acceptable during execution. Renovation planning works best when scope is defined clearly before site work starts.",
        messageCount,
        ["🔨", "🏠", "📋"]
      ),
      chips: ["Renovation scope", "Site visit", "Budget planning", "Execution support"],
    };
  }

  if (containsAny(text, ["materials", "material", "finish", "finishes", "palette", "stone", "wood"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Material curation is a major part of a strong project outcome. Usually the real quality comes from how stone, wood, metal, fabric, plaster, lighting, and furniture work together as one clear language, not from isolated choices.",
        messageCount,
        ["🪵", "🪨", "💡"]
      ),
      chips: ["Warm minimal palette", "Wood & stone", "Lighting", "Furniture & joinery"],
    };
  }

  if (containsAny(text, ["furniture", "joinery", "wardrobe", "cabinet", "storage"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Yes — bespoke furniture and joinery can be integrated into the design process. This usually helps the final space feel more resolved because storage, proportion, materials, and detailing are designed together rather than added later.",
        messageCount,
        ["🪑", "🗄️", "✨"]
      ),
      chips: ["Wardrobes", "TV unit", "Kitchen joinery", "Custom furniture"],
    };
  }

  if (containsAny(text, ["site", "site visit", "location", "city", "where"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Location matters because site conditions, vendors, timelines, and execution coordination can vary a lot by city. If you share your city and project type, I can guide you more precisely on the next step.",
        messageCount,
        ["📍", "🏙️", "🧭"]
      ),
      chips: ["Share city", "Architecture project", "Interior project", "Book consultation"],
    };
  }

  if (containsAny(text, ["approval", "permissions", "sanction", "authority"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Approval requirements depend on the location, project type, and scope of intervention. For architecture projects especially, it's best to discuss site details and local conditions early so the process can be planned clearly.",
        messageCount,
        ["📑", "🏛️", "📐"]
      ),
      chips: ["Site requirements", "Architecture project", "Consultation"],
    };
  }

  if (containsAny(text, ["what should i send", "what to send", "checklist", "documents"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "A strong first inquiry usually includes your city, project type, property type, approximate size, stage of project, target timeline, budget comfort if known, and a few inspiration images or references. Even rough information is enough to start.",
        messageCount,
        ["📁", "📝", "✨"]
      ),
      chips: ["City", "Project type", "Budget", "Inspiration references"],
    };
  }

  if (containsAny(text, ["style", "look", "aesthetic", "mood", "theme"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "The most useful way to define style is not just naming a look, but describing how you want the space to feel — calm, warm, minimal, tactile, bold, quiet, luxurious, earthy, or highly refined. That usually gives much better design clarity.",
        messageCount,
        ["🎨", "✨", "🧠"]
      ),
      chips: ["Warm minimal", "Modern", "Luxury", "Contemporary"],
    };
  }

  if (containsAny(text, ["execution", "site management", "contractor", "supervision", "on site"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Execution support can include detail clarification, material coordination, vendor alignment, site reviews, and helping protect the design intent during implementation. The exact involvement depends on project scope and location.",
        messageCount,
        ["🛠️", "📋", "🤝"]
      ),
      chips: ["Execution support", "Site reviews", "Vendor coordination", "Scope planning"],
    };
  }

  if (containsAny(text, ["commercial", "office", "workspace", "hospitality"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "Commercial projects usually need early clarity around function, brand expression, circulation, user experience, timeline pressure, and execution practicality. If this is a commercial project, tell me the space type and city.",
        messageCount,
        ["🏢", "📍", "🧭"]
      ),
      chips: ["Office", "Hospitality", "Retail", "Share city"],
    };
  }

  if (containsAny(text, ["start", "begin", "next step", "project"])) {
    return {
      text: addEmojiEveryAlternateBotReply(
        "The best next step is sharing your project basics clearly: what the project is, where it is, what stage it's in, how you want it to feel, and what kind of timeline and budget comfort you have. Once that's clear, everything else becomes easier.",
        messageCount,
        ["🚀", "📋", "✨"]
      ),
      chips: ["Architecture", "Interiors", "Renovation", "Book consultation"],
    };
  }

  return {
    text: addEmojiEveryAlternateBotReply(
      randomPick([
        "I can help with architecture, interiors, renovation planning, design process, budget clarity, timelines, materials, execution support, and how to structure your inquiry. What would you like to explore first?",
        "Tell me a little about your project and I'll guide you in a practical way.",
        "Happy to help — are you exploring a new build, interiors, a renovation, or just trying to understand the process?",
      ]),
      messageCount,
      ["😊", "✨", "🤝"]
    ),
    chips: buildHelpfulPromptChips(memory),
  };
};

export const ChatWidget = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [consultationStage, setConsultationStage] = useState<ConsultationStage>("idle");

  const timeMeta = useMemo(() => getTimeMeta(), []);
  const initialGreeting = useMemo(() => {
    return `${timeMeta.greeting} — I'm Suyash, Live agent. ${timeMeta.mood}. I can help with architecture, interiors, renovation planning, timelines, materials, scope clarity, and getting your inquiry ready. 😊`;
  }, [timeMeta]);

  const [memory, setMemory] = useState<VisitorMemory>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "bot",
      text: initialGreeting,
      chips: ["Start a project", "Services", "Project process", "Book consultation"],
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(CHAT_STORAGE_KEY);
      const savedMemory = localStorage.getItem(MEMORY_STORAGE_KEY);
      const savedConsultStage = localStorage.getItem(CONSULTATION_STAGE_KEY);

      if (savedMessages) {
        const parsed = JSON.parse(savedMessages) as Message[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }

      if (savedMemory) {
        const parsedMemory = JSON.parse(savedMemory) as VisitorMemory;
        if (parsedMemory && typeof parsedMemory === "object") {
          setMemory(parsedMemory);
        }
      }

      if (
        savedConsultStage === "idle" ||
        savedConsultStage === "ask_name" ||
        savedConsultStage === "ask_phone" ||
        savedConsultStage === "done"
      ) {
        setConsultationStage(savedConsultStage);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memory));
    } catch {
      // ignore
    }
  }, [memory]);

  useEffect(() => {
    try {
      localStorage.setItem(CONSULTATION_STAGE_KEY, consultationStage);
    } catch {
      // ignore
    }
  }, [consultationStage]);

  useEffect(() => {
    const handleScroll = () => {
      const triggerPoint = window.innerHeight * 0.82;
      setVisible(window.scrollY > triggerPoint);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  const getBotReply = async (text: string, memoryState: VisitorMemory, history: Message[]) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          agentName: "Suyash",
          company: "ARCIGN",
          role: "Live agent",
          timeOfDay: timeMeta.greeting,
          visitorMemory: memoryState,
          recentMessages: history.slice(-8),
          systemContext:
            "You are Suyash, a premium architecture and interiors support agent for ARCIGN. Be warm, practical, concise, tasteful, and helpful. Use occasional relevant emojis naturally. Guide users toward a consultation without sounding pushy.",
        }),
      });

      if (!res.ok) throw new Error("AI endpoint unavailable");

      const data = await res.json();

      if (data?.reply && typeof data.reply === "string") {
        return {
          text: addEmojiEveryAlternateBotReply(
            data.reply,
            history.length,
            ["😊", "✨", "🤝"]
          ),
          chips: Array.isArray(data.chips) ? data.chips : buildHelpfulPromptChips(memoryState),
        };
      }

      throw new Error("Invalid AI response");
    } catch {
      return fallbackReply(text, memoryState, history.length);
    }
  };

  const addBotMessage = (text: string, chips?: string[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender: "bot",
        text,
        chips,
      },
    ]);
  };

  const shouldStartConsultationFlow = (text: string) => {
    const normalized = normalize(text);
    return containsAny(normalized, [
      "book consultation",
      "consultation",
      "book a consultation",
      "schedule consultation",
      "book meeting",
      "book call",
      "start consultation",
    ]);
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const updatedMemory = extractMemoryFromText(text, memory);
    setMemory(updatedMemory);

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput("");

    if (consultationStage === "ask_name") {
      const detectedName = extractLikelyName(text);
      const finalName = detectedName || text.trim();

      const nextMemory = {
        ...updatedMemory,
        name: finalName,
      };
      setMemory(nextMemory);
      setConsultationStage("ask_phone");

      setTyping(true);
      setTimeout(() => {
        addBotMessage("Please send your Phone/Whatsapp Number 📱");
        setTyping(false);
      }, 550);
      return;
    }

    if (consultationStage === "ask_phone") {
      const finalPhone = cleanPhone(text);
      const nextMemory = {
        ...updatedMemory,
        phone: finalPhone,
      };
      setMemory(nextMemory);
      setConsultationStage("done");

      setTyping(true);
      setTimeout(() => {
        addBotMessage("Thanks for visiting our website. Our team will contact you at the earliest. 😎 👍🏻");
        setTyping(false);
      }, 550);
      return;
    }

    if (shouldStartConsultationFlow(text)) {
      setConsultationStage("ask_name");
      setTyping(true);
      setTimeout(() => {
        addBotMessage("Your Good Name sir 😊");
        setTyping(false);
      }, 550);
      return;
    }

    setTyping(true);
    const reply = await getBotReply(text, updatedMemory, nextHistory);

    setTimeout(() => {
      addBotMessage(reply.text, reply.chips);
      setTyping(false);
    }, 650);
  };

  const resetConversation = () => {
    const fresh = [
      {
        id: "m1",
        sender: "bot" as const,
        text: initialGreeting,
        chips: ["Start a project", "Services", "Project process", "Book consultation"],
      },
    ];
    setMessages(fresh);
    setMemory({});
    setConsultationStage("idle");
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      localStorage.removeItem(MEMORY_STORAGE_KEY);
      localStorage.removeItem(CONSULTATION_STAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {!open && (
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 rounded-full border border-white/10 bg-surface-deep px-4 py-3 text-background shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-md md:bottom-7 md:right-7"
            >
              <span className="relative h-11 w-11 overflow-hidden rounded-full border border-white/15">
                <img
                  src={suyashPhoto}
                  alt="Suyash"
                  className="h-full w-full object-cover"
                />
              </span>

              <span className="hidden text-left sm:block">
                <span className="flex items-center gap-2">
                  <span className="block text-[11px] uppercase tracking-[0.24em] text-black">
                    Suyash
                  </span>

                  <span className="relative inline-flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/50"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                  </span>
                </span>

                <span className="block text-sm text-black">Live agent</span>
              </span>
            </motion.button>
          )}

          {open && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
              className="fixed bottom-5 right-5 z-[80] w-[calc(100vw-24px)] max-w-[390px] overflow-hidden rounded-[28px] border border-black/10 bg-background shadow-[0_30px_90px_rgba(0,0,0,0.22)] md:bottom-7 md:right-7"
            >
              <div className="flex items-center justify-between border-b border-black/10 bg-surface px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full border border-black/10">
                    <img
                      src={suyashPhoto}
                      alt="Suyash"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      ARCIGN Support
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Suyash, Live agent
                      </span>
                      <span className="relative inline-flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500/50"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetConversation}
                    className="hidden rounded-full border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-foreground transition hover:bg-black/5 sm:inline-flex"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-foreground transition hover:bg-black/5"
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[58vh] min-h-[360px] overflow-y-auto bg-background px-4 py-4 md:min-h-[420px]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <div
                        className={`flex ${
                          message.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[88%] rounded-[22px] px-4 py-3 text-[14px] leading-relaxed ${
                            message.sender === "user"
                              ? "bg-surface-deep text-background"
                              : "border border-black/6 bg-surface text-foreground"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>

                      {message.sender === "bot" && message.chips && message.chips.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.chips.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => void sendMessage(chip)}
                              className="rounded-full border border-black/10 bg-background px-3 py-2 text-[12px] text-foreground transition hover:bg-surface"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {typing && (
                    <div className="flex justify-start">
                      <div className="rounded-[22px] border border-black/6 bg-surface px-4 py-3 text-[14px] text-foreground">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-bronze" />
                          <span>Suyash is typing…</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={endRef} />
                </div>
              </div>

              <div className="border-t border-black/10 bg-background px-4 py-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void sendMessage("Start a project")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Start a project
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessage("Project process")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Project process
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessage("Budget guidance")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Budget guidance
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessage("Book consultation")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Book consultation
                  </button>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-surface px-2 py-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void sendMessage(input);
                    }}
                    placeholder="Ask Suyash about your project..."
                    className="h-11 flex-1 bg-transparent px-3 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage(input)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-deep text-background transition hover:scale-[1.03]"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
