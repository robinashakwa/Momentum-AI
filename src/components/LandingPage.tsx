import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, ArrowRight, Sprout, Clock, BrainCircuit, Trophy, 
  Play, CheckCircle2, ChevronRight, Check, Leaf, Target, 
  Compass, ArrowUpRight, ShieldCheck, Zap
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

// Sample mock templates for goal decomposition
const MOCK_GOAL_TEMPLATES: Record<string, {
  title: string;
  milestones: {
    title: string;
    tasks: { title: string; desc: string }[];
  }[];
}> = {
  "Learn Rust Programming": {
    title: "Learn Rust Programming",
    milestones: [
      {
        title: "Setup & Syntax Fundamentals",
        tasks: [
          { title: "Install Rustup and configure VS Code editor", desc: "Set up the compiler and standard toolchain." },
          { title: "Write a classic 'Hello, Cargo!' program", desc: "Build familiarity with compiling via Cargo." },
          { title: "Complete variables and types Rustlings exercises", desc: "Understand immutable by default and core types." }
        ]
      },
      {
        title: "Understanding Ownership & Borrowing",
        tasks: [
          { title: "Draw stack vs. heap storage diagrams", desc: "Visualize how memory blocks are tracked by scopes." },
          { title: "Write reference and lifetime borrowing code", desc: "Synthesize the rules of borrow checker." }
        ]
      },
      {
        title: "Error Handling & Structs",
        tasks: [
          { title: "Define a User struct with impl block methods", desc: "Practice data modeling with standard structs." },
          { title: "Implement Option and Result match logic", desc: "Avoid panic calls through safe error propagation." }
        ]
      }
    ]
  },
  "Run a Half-Marathon": {
    title: "Run a Half-Marathon",
    milestones: [
      {
        title: "Aerobic Conditioning Base",
        tasks: [
          { title: "Complete a comfortable 3K baseline assessment jog", desc: "Measure average heart rate and pace limits." },
          { title: "Schedule a 3-day weekly recurring running plan", desc: "Dedicate fixed blocks for structural consistency." },
          { title: "Incorporate a 5-minute dynamic stretch routine", desc: "Warm up legs to prevent early joint friction." }
        ]
      },
      {
        title: "Distance Scaling & Stamina",
        tasks: [
          { title: "Scale weekend endurance run to a solid 8K", desc: "Focus purely on steady zone 2 breathing pace." },
          { title: "Perform one weekly interval speed session", desc: "Develop higher VO2 max capacity on short sprints." }
        ]
      },
      {
        title: "Peak Volume & Pre-Race Taper",
        tasks: [
          { title: "Conquer a continuous 16K long-distance jog", desc: "Build muscular stamina and practice energy gel timing." },
          { title: "Reduce total mileage by 40% for pre-race taper", desc: "Allow muscles to completely rest and replenish stores." }
        ]
      }
    ]
  },
  "Design an Indie Game": {
    title: "Design an Indie Game",
    milestones: [
      {
        title: "Core Mechanics Graybox Prototype",
        tasks: [
          { title: "Download game engine and draw 3 paper designs", desc: "Select the most engaging game loop idea." },
          { title: "Code player movement and collision boundaries", desc: "Make character control feel highly responsive." },
          { title: "Create a graybox blockout of level 1", desc: "Test level layout before adding visual art assets." }
        ]
      },
      {
        title: "Polish, Sound & Game Loop",
        tasks: [
          { title: "Code level start, win state, and defeat triggers", desc: "Establish basic rules and session endpoints." },
          { title: "Synthesize sound effects using 8-bit generators", desc: "Introduce sound feedback on jumps and power-ups." }
        ]
      },
      {
        title: "Distribution & itch.io Draft",
        tasks: [
          { title: "Add keyboard bindings configurations panel", desc: "Enable accessibility parameters for all players." },
          { title: "Export executable and upload draft to itch.io", desc: "Prepare store page with 3 high-contrast screenshots." }
        ]
      }
    ]
  },
  "Consistent Morning Meditation": {
    title: "Consistent Morning Meditation",
    milestones: [
      {
        title: "Establishing Space & Committing",
        tasks: [
          { title: "Designate a clean chair or floor cushion", desc: "Eliminate friction by prepping the physical spot." },
          { title: "Commit to a 3-minute breath check right after waking", desc: "Choose a tiny habit block that feels trivial to miss." },
          { title: "Mark completed days on a physical calendar sticker", desc: "Establish visual tracking feedback." }
        ]
      },
      {
        title: "Breathing & Anchoring Attention",
        tasks: [
          { title: "Practice counting breaths 1 to 10 consecutively", desc: "Refocus when thoughts wander from the rhythm." },
          { title: "Recognize thoughts as clouds without judging them", desc: "Strengthen the cognitive muscle of pure observation." }
        ]
      },
      {
        title: "Unshakable Daily Habit Loop",
        tasks: [
          { title: "Complete a 10-day streak of conscious breathing", desc: "Anchor the habit permanently in your morning ritual." }
        ]
      }
    ]
  }
};

export default function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [goalInput, setGoalInput] = useState("");
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [activeRoadmap, setActiveRoadmap] = useState<typeof MOCK_GOAL_TEMPLATES[string] | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Simulator steps simulation
  const stepsMessages = [
    "Analyzing target goal with AI Coach...",
    "Decomposing core milestones for optimal momentum...",
    "Injecting low-friction micro-tasks...",
    "Calibrating Achievement Garden seeds... Ready!"
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simulatorLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev >= stepsMessages.length - 1) {
            clearInterval(interval);
            setSimulatorLoading(false);
            // set actual mock roadmap
            const matchedKey = Object.keys(MOCK_GOAL_TEMPLATES).find(
              k => k.toLowerCase().includes(goalInput.toLowerCase()) || goalInput.toLowerCase().includes(k.toLowerCase())
            );
            if (matchedKey) {
              setActiveRoadmap(MOCK_GOAL_TEMPLATES[matchedKey]);
            } else {
              // Custom dynamic generator
              setActiveRoadmap({
                title: goalInput || "My Custom Goal Journey",
                milestones: [
                  {
                    title: "Initial Launchpad",
                    tasks: [
                      { title: `Identify first 3 micro-actions to begin: ${goalInput || "your goal"}`, desc: "Reduce initial startup friction to absolute zero." },
                      { title: "Allocate one focused 15-minute slot tomorrow", desc: "Commit physical time in your calendar for active progress." },
                      { title: "Prepare required materials and clear physical workspace", desc: "Remove ambient environmental distractions." }
                    ]
                  },
                  {
                    title: "Focused Execution Loop",
                    tasks: [
                      { title: "Perform first micro-task block with a 25m Focus Timer", desc: "Channel deep flow with structured Pomodoro breaks." },
                      { title: "Record 1 visual note summarizing what was learned", desc: "Solidify incremental mental takeaways immediately." }
                    ]
                  },
                  {
                    title: "Milestone Reflection",
                    tasks: [
                      { title: "Complete first milestone review with AI Coach", desc: "Formulate follow-up milestones dynamically." },
                      { title: "Celebrate your consistency with +5 Garden score", desc: "Let your virtual achievement seed blossom into reality." }
                    ]
                  }
                ]
              });
            }
            return 0;
          }
          return prev + 1;
        });
      }, 900);
    }
    return () => clearInterval(interval);
  }, [simulatorLoading, goalInput]);

  const handleDecompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) return;
    setSimulatorLoading(true);
    setLoadingStep(0);
    setActiveRoadmap(null);
    setCheckedTasks({});
  };

  const handleSelectQuickGoal = (goal: string) => {
    setGoalInput(goal);
    setSimulatorLoading(true);
    setLoadingStep(0);
    setActiveRoadmap(null);
    setCheckedTasks({});
  };

  const toggleTask = (key: string) => {
    setCheckedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Plant stats calculations
  const totalTasks = activeRoadmap ? activeRoadmap.milestones.flatMap(m => m.tasks).length : 0;
  const completedCount = Object.values(checkedTasks).filter(Boolean).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const getPlantStage = (percent: number) => {
    if (percent === 0) {
      return { emoji: "🌱", text: "Sleeping Seed", desc: "Ready to burst with focus." };
    } else if (percent < 34) {
      return { emoji: "🌿", text: "Young Sprout", desc: "Consistency is warming the soil!" };
    } else if (percent < 67) {
      return { emoji: "🌻", text: "Blossoming Bloom", desc: "Your daily consistency is shining bright!" };
    } else if (percent < 100) {
      return { emoji: "🌳", text: "Sturdy Oak Tree", desc: "Your focused efforts have deep roots!" };
    } else {
      return { emoji: "🏆✨🌻", text: "Mighty Garden Harvest", desc: "Absolute peak consistency achieved!" };
    }
  };

  const plantState = getPlantStage(completionPercentage);

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-900 font-sans selection:bg-emerald-100 overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/75 backdrop-blur-md border-b border-slate-100 z-50 px-6 sm:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-950 font-sans tracking-tight">Momentum AI</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-500">
          <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
          <a href="#simulator" className="hover:text-slate-900 transition-colors">Interactive Demo</a>
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">Methodology</a>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={onSignIn}
            className="text-xs font-bold text-slate-600 hover:text-slate-950 px-3 py-1.5 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={onGetStarted}
            className="text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 px-4 py-2 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Enter Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-6 sm:px-12 max-w-6xl mx-auto text-center space-y-8 relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        
        {/* Humble and pristine Badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100/60 text-emerald-800 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-tight shadow-xs">
          <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>Frictionless Goal Decomposition</span>
        </div>

        {/* Large balanced typography */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-950 max-w-4xl mx-auto leading-[1.08] font-sans">
          Build Momentum. <br className="hidden sm:inline" />
          <span className="text-emerald-600">One micro-step</span> at a time.
        </h1>

        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Struggling with overwhelming projects? Momentum AI instantly decomposes massive milestones into lightweight, trivial daily tasks. Pair structured focus with an AI Coach and cultivate a living virtual garden.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 px-8 py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Planning For Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#simulator"
            className="w-full sm:w-auto text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
            <span>Try Interactive Demo</span>
          </a>
        </div>

        {/* Visual mock dashboard */}
        <div className="pt-12 max-w-4xl mx-auto relative">
          <div className="absolute inset-0 bg-slate-200/20 rounded-[32px] scale-[0.98] blur-xl pointer-events-none"></div>
          
          <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl p-4 sm:p-6 text-left space-y-6 relative overflow-hidden">
            {/* Header elements inside the mockup */}
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-100"></div>
                <div className="w-16 h-2 bg-slate-100 rounded-full"></div>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              </div>
            </div>

            {/* Simulated app layout columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Col 1 */}
              <div className="md:col-span-2 space-y-4">
                <div className="h-4 w-40 bg-slate-950/5 rounded-full"></div>
                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <div className="h-3.5 w-32 bg-slate-950/10 rounded-full"></div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[65%] rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="h-3 w-28 bg-slate-950/5 rounded-full uppercase tracking-wider text-[9px] font-bold"></div>
                  <div className="border border-slate-100 rounded-2xl p-4 flex gap-3 items-start">
                    <div className="w-4.5 h-4.5 border border-slate-300 rounded-full shrink-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 w-3/4 bg-slate-900/10 rounded-full"></div>
                      <div className="h-2.5 w-1/2 bg-slate-900/5 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Col 2 */}
              <div className="bg-slate-50 rounded-[24px] p-4 flex flex-col items-center justify-center space-y-4 border border-slate-100">
                <div className="w-28 h-28 rounded-full border border-slate-200/60 bg-white flex flex-col items-center justify-center shadow-xs">
                  <span className="text-2xl font-bold font-mono text-slate-800">25:00</span>
                  <span className="text-[8px] font-bold text-slate-400 mt-0.5">READY</span>
                </div>
                <div className="h-2.5 w-24 bg-slate-950/5 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES BENTO GRID */}
      <section id="features" className="py-20 bg-slate-50/50 border-t border-b border-slate-100 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-sans">
              Designed to beat Decision Fatigue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-semibold">
              The brain thrives when the next task is simple enough that it feels silly to avoid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bento Card 1 */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-72">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-950 font-sans">AI Decomposer</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  Input any goal, large or small. Our customized decomposition agent builds a clear path of progressive, low-friction, small daily checklists.
                </p>
              </div>
            </div>

            {/* Bento Card 2 */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-72">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-950 font-sans">Flow Focus Timer</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  A serene, distraction-free space. Dedicate 25-minute Pomodoro cycles directly connected to your recommended next best step.
                </p>
              </div>
            </div>

            {/* Bento Card 3 */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-72">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-950 font-sans">24/7 Encouraging Coach</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  An AI Partner ready to brainstorm solutions, build customizable breaking hours, and act as your ultimate personal cheerleader.
                </p>
              </div>
            </div>

            {/* Bento Card 4 (Double Width) */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow md:col-span-2 min-h-72">
              <div className="flex-1 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-950 font-sans">The Achievement Garden</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Each active goal plants a seed in your digital backyard. Checking off sub-tasks feeds and waters your virtual flora, growing sprouts into grand majestic oaks as you build physical momentum.
                  </p>
                </div>
              </div>
              <div className="w-full md:w-48 bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl animate-bounce">🌻</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Fully Grown</span>
                <span className="text-[9px] text-slate-400 font-bold">Goal: Learn Rust</span>
              </div>
            </div>

            {/* Bento Card 5 */}
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow h-72">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-950 font-sans">Zero Friction Sandbox</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  No complex folders, no over-engineered settings. We keep layouts spacious and simple so your focus remains on execution.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* INTERACTIVE SIMULATOR (DASHBOARD EXPERIMENT) */}
      <section id="simulator" className="py-20 px-6 sm:px-12 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-sans">
            Decompose a Goal in Real-Time
            <span className="text-emerald-500">.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto font-semibold">
            Experience the core momentum engine. Type any goal or click a preset below to see how AI breaks down the path.
          </p>
        </div>

        {/* Simulator block */}
        <div className="bg-white border border-slate-100 rounded-[32px] shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Form control sidebar */}
          <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-50/75 border-b lg:border-b-0 lg:border-r border-slate-100 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Goal Engine Sandbox</span>
              <h3 className="text-base font-bold text-slate-900 font-sans">Let's build a plan</h3>
            </div>

            <form onSubmit={handleDecompose} className="space-y-4 font-sans">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">What do you want to accomplish?</label>
                <input 
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="e.g. Learn French, Plant a Vegetable Garden"
                  className="block w-full px-3 py-2.5 bg-white border border-slate-200 text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs rounded-xl transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={simulatorLoading || !goalInput.trim()}
                className="w-full flex justify-center items-center gap-2 py-3 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                {simulatorLoading ? (
                  <span>Decomposing roadmap...</span>
                ) : (
                  <>
                    <span>Decompose Instantly</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Presets */}
            <div className="space-y-3 pt-2">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Popular Presets</span>
              <div className="flex flex-wrap gap-2">
                {Object.keys(MOCK_GOAL_TEMPLATES).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSelectQuickGoal(preset)}
                    className="text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 border border-slate-200 rounded-full px-3.5 py-1.5 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result view column */}
          <div className="lg:col-span-7 p-6 sm:p-8 min-h-[380px] flex flex-col justify-center relative bg-white">
            <AnimatePresence mode="wait">
              
              {/* Case 1: Initial Empty Screen */}
              {!simulatorLoading && !activeRoadmap && (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4 py-8"
                >
                  <span className="text-4xl block animate-pulse">🌱</span>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 font-sans">Ready to bloom</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto font-semibold">
                      Type your primary goal on the left or select a preset to watch the AI Coach build a bespoke roadmap.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Case 2: Loading State */}
              {simulatorLoading && (
                <motion.div 
                  key="loading-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4 py-8"
                >
                  <div className="relative w-10 h-10 mx-auto">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 font-sans">Generating Schedule</h4>
                    <p className="text-xs text-slate-400 font-semibold animate-pulse">{stepsMessages[loadingStep]}</p>
                  </div>
                </motion.div>
              )}

              {/* Case 3: Completed Roadmap Display */}
              {!simulatorLoading && activeRoadmap && (
                <motion.div 
                  key="roadmap-display"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Miniature Top Plant Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl">{plantState.emoji}</span>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block leading-tight tracking-wider font-sans">Your Sandbox Garden</span>
                        <span className="text-xs font-bold text-slate-800 block">{plantState.text}</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-block">
                        {completionPercentage}% Growing Progress
                      </span>
                    </div>
                  </div>

                  {/* Active goal roadmap */}
                  <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                      Decomposed Micro-Checklist: {activeRoadmap.title}
                    </h4>

                    {activeRoadmap.milestones.map((milestone, mIdx) => (
                      <div key={milestone.title} className="space-y-2 border-l-2 border-dashed border-slate-100 pl-4 ml-1">
                        <h5 className="text-xs font-bold text-slate-800 font-sans">
                          M{mIdx + 1}: {milestone.title}
                        </h5>

                        <div className="space-y-2">
                          {milestone.tasks.map((task) => {
                            const uniqueKey = `${milestone.title}-${task.title}`;
                            const isChecked = !!checkedTasks[uniqueKey];
                            return (
                              <div 
                                key={task.title}
                                onClick={() => toggleTask(uniqueKey)}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                                  isChecked 
                                    ? "bg-slate-50/50 border-slate-200 text-slate-400" 
                                    : "bg-white border-slate-100 text-slate-800 hover:border-slate-200"
                                }`}
                              >
                                <button className="mt-0.5 shrink-0 text-slate-300">
                                  {isChecked ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                                  )}
                                </button>
                                <div className="space-y-0.5 min-w-0">
                                  <span className={`text-[11px] font-bold leading-tight block ${isChecked ? "line-through text-slate-400" : ""}`}>
                                    {task.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-medium truncate">{task.desc}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Interactive nudge */}
                  {completionPercentage > 0 && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-[10px] text-slate-500 text-center italic font-semibold"
                    >
                      💡 {plantState.desc} Create an account to save this and log focus hours!
                    </motion.p>
                  )}

                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* METHODOLOGY SECTION (HOW IT WORKS) */}
      <section id="how-it-works" className="py-20 bg-slate-50/50 border-t border-slate-100 px-6 sm:px-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">The Science of Momentum</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-sans">
              Tiny seeds. Grand milestones.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
              Psychology shows that cognitive overload is the #1 reason for procrastination. When you look at a goal like "Build an app," your brain gets stuck evaluating where to begin.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
              Momentum AI completely removes this startup friction. By instantly translating high-level ideas into atomic tasks under 20 minutes, your focus remains high and your stamina goes undisturbed.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step row */}
            <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0">1</div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 font-sans">Plant Intent</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-semibold">State what you intend to build or accomplish. AI formats your initial seed.</p>
              </div>
            </div>

            {/* Step row */}
            <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0">2</div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 font-sans">Log Atomic Steps</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Perform 25m Focus sessions mapped directly to atomic checklists.</p>
              </div>
            </div>

            {/* Step row */}
            <div className="flex items-start gap-4 p-4 bg-white border border-slate-100 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-800 shrink-0">3</div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 font-sans">Harvest Consistency</h4>
                <p className="text-[11px] text-slate-400 leading-normal font-semibold">Watch your garden bloom with massive oak trees tracking real-life habit streaks.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 text-center px-6 sm:px-12 max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 font-sans">
          Ready to build active consistency?
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
          Log in and launch your personalized digital garden. Overcome decision fatigue instantly.
        </p>
        <div className="pt-4">
          <button
            onClick={onGetStarted}
            className="text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 px-8 py-4 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Enter Momentum Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* MINI FOOTER */}
      <footer className="border-t border-slate-100 py-12 px-6 sm:px-12 text-center text-[11px] text-slate-400 font-medium">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold text-slate-950">Momentum AI</span>
            <span>• Build Consistency</span>
          </div>
          <div className="flex gap-4">
            <span>Focus First</span>
            <span>•</span>
            <span>Minimalist Flow</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
