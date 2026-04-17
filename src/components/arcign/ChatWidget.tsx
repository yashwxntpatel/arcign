import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, MessageCircle, X, Sparkles } from "lucide-react";
import suyashPhoto from "@/assets/suyash-agent.jpg";

type Message = {
  id: string;
  sender: "bot" | "user";
  text: string;
  chips?: string[];
};

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

const fallbackReply = (input: string) => {
  const text = input.toLowerCase().trim();

  if (["hi", "hello", "hey", "hii", "yo"].includes(text)) {
    return {
      text: randomPick([
        "Hey, let me know — what are you looking for?",
        "Hey there — happy to help. Are you exploring architecture, interiors, or a renovation?",
        "Hi — tell me a little about your space and I’ll guide you from there.",
      ]),
      chips: ["Architecture", "Interiors", "Renovation", "Budget"],
    };
  }

  if (text.includes("services") || text.includes("what do you do")) {
    return {
      text: "We usually help with architecture design, premium interiors, bespoke furniture/joinery, renovations, material curation, design development, and execution coordination. Which one are you exploring right now?",
      chips: ["Architecture", "Interiors", "Furniture", "Renovation"],
    };
  }

  if (text.includes("architecture") || text.includes("villa") || text.includes("house")) {
    return {
      text: "For architecture projects, the first things I’d want to know are your city, plot or site status, approximate built-up area, and the kind of lifestyle or mood you want the home to have.",
      chips: ["Villa", "Residence", "Modern home", "Book consultation"],
    };
  }

  if (
    text.includes("interior") ||
    text.includes("living room") ||
    text.includes("bedroom") ||
    text.includes("kitchen")
  ) {
    return {
      text: "For interiors, we usually start by understanding the space type, your aesthetic direction, materials you’re drawn to, and whether you want only design or full execution guidance as well.",
      chips: ["Apartment interiors", "Living room", "Kitchen", "Bedroom"],
    };
  }

  if (text.includes("budget") || text.includes("cost") || text.includes("price")) {
    return {
      text: "Budget usually depends on area, scope, material level, detailing depth, and whether this is architecture, interiors, or both. If you want, tell me the project type and I’ll help you structure the inquiry properly.",
      chips: ["Share project type", "Architecture budget", "Interior budget"],
    };
  }

  if (text.includes("timeline") || text.includes("how long") || text.includes("time")) {
    return {
      text: "Timelines depend on scope. Concept and design stages are usually quicker, while detailed drawings, approvals, interiors, and execution coordination extend the timeline. Share your project type and I’ll guide you better.",
      chips: ["Architecture timeline", "Interior timeline", "Renovation timeline"],
    };
  }

  if (
    text.includes("consultation") ||
    text.includes("meeting") ||
    text.includes("call") ||
    text.includes("book")
  ) {
    return {
      text: "Yes — the best next step is a consultation. Before that, it helps to share your city, project type, approximate size, budget range if available, and any visual references you like.",
      chips: ["Start a project", "What should I send?", "Go to contact"],
    };
  }

  if (
    text.includes("materials") ||
    text.includes("material") ||
    text.includes("finish") ||
    text.includes("furniture")
  ) {
    return {
      text: "Material and finish selection is a big part of the studio’s value. We look at how stone, wood, plaster, metal, furniture, and lighting all work together as one restrained design language.",
      chips: ["Material curation", "Bespoke furniture", "Finish palette"],
    };
  }

  if (text.includes("location") || text.includes("city") || text.includes("where")) {
    return {
      text: "You can share your city and project scope first. Once I know whether this is architecture, interiors, or renovation, I can guide you on the best next step.",
      chips: ["Architecture project", "Interior project", "Renovation project"],
    };
  }

  if (
    text.includes("contact") ||
    text.includes("email") ||
    text.includes("phone") ||
    text.includes("reach")
  ) {
    return {
      text: "You can use the contact section on this website to send your inquiry. A strong first message usually includes project type, city, size, budget range if known, and the design direction you want.",
      chips: ["Go to contact", "What should I send?", "Start my inquiry"],
    };
  }

  if (
    text.includes("project") ||
    text.includes("start") ||
    text.includes("begin") ||
    text.includes("next step")
  ) {
    return {
      text: "A great first step is telling me: what kind of project this is, where it’s located, what stage it’s in, and what kind of feeling or design outcome you want. From there I can guide you clearly.",
      chips: ["Architecture", "Interiors", "Renovation", "Budget"],
    };
  }

  return {
    text: randomPick([
      "I can help with architecture, interiors, renovation planning, budgets, timelines, materials, and how to structure your inquiry. What would you like to explore?",
      "Tell me what you’re planning, and I’ll help you move in the right direction.",
      "Happy to help — are you looking for architecture, interiors, pricing guidance, or next steps?",
    ]),
    chips: ["Services", "Budget", "Timeline", "Start a project"],
  };
};

export const ChatWidget = () => {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const timeMeta = useMemo(() => getTimeMeta(), []);
  const initialGreeting = useMemo(() => {
    return `${timeMeta.greeting} — I’m Suyash, Live agent. ${timeMeta.mood}. Tell me what kind of project you’re exploring, and I’ll guide you from there.`;
  }, [timeMeta]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      sender: "bot",
      text: initialGreeting,
      chips: ["Architecture", "Interiors", "Budget", "Start a project"],
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

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

  const getBotReply = async (text: string) => {
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
        }),
      });

      if (!res.ok) throw new Error("AI endpoint unavailable");

      const data = await res.json();

      if (data?.reply && typeof data.reply === "string") {
        return {
          text: data.reply,
          chips: Array.isArray(data.chips) ? data.chips : ["Services", "Budget", "Timeline"],
        };
      }

      throw new Error("Invalid AI response");
    } catch {
      return fallbackReply(text);
    }
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    const reply = await getBotReply(text);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: reply.text,
          chips: reply.chips,
        },
      ]);
      setTyping(false);
    }, 650);
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

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-foreground transition hover:bg-black/5"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
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
                    onClick={() => void sendMessage("Hi")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Say hi
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessage("Services")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Services
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessage("Budget")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendMessage("Timeline")}
                    className="rounded-full border border-black/10 bg-surface px-3 py-2 text-[12px] text-foreground transition hover:bg-black hover:text-white"
                  >
                    Timeline
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