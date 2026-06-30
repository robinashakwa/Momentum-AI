/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  initDb, createUser, verifyUser, createSession, getUserBySession, deleteSession,
  createGoal, getGoals, getGoalDetails, updateMiniTaskStatus, updateTaskStatus,
  getNextAction, addFocusSession, getFocusHistory, saveReflection, getReflections,
  addChatMessage, getChatHistory, clearChatHistory, getAchievements, getMomentumStats,
  getSettings, updateSettings
} from "./src/db.js";

// Load environment variables
dotenv.config();

// Initialize Database
initDb();

// Initialize Express
const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google Gemini Client (Server-side secret, with recommended User-Agent)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

/**
 * Session Auth Middleware
 */
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: Missing session token" });
    return;
  }

  const user = getUserBySession(token);
  if (!user) {
    res.status(403).json({ error: "Forbidden: Invalid or expired session" });
    return;
  }

  (req as any).user = user;
  next();
};

/**
 * ============================================================================
 * AUTHENTICATION ENDPOINTS
 * ============================================================================
 */

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.trim().length < 3 || password.trim().length < 4) {
    res.status(400).json({ error: "Username (min 3 chars) and password (min 4 chars) are required" });
    return;
  }

  try {
    const userId = createUser(username, password);
    const token = createSession(userId);
    res.json({ token, user: { id: userId, username: username.trim().toLowerCase() } });
  } catch (error: any) {
    if (error.message && error.message.includes("UNIQUE")) {
      res.status(400).json({ error: "Username is already taken" });
    } else {
      res.status(500).json({ error: "Failed to register user" });
    }
  }
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = verifyUser(username, password);
  if (!user) {
    res.status(400).json({ error: "Invalid username or password" });
    return;
  }

  const token = createSession(user.id);
  res.json({ token, user });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    deleteSession(token);
  }
  res.json({ success: true });
});

app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({ user: (req as any).user });
});

/**
 * ============================================================================
 * SETTINGS ENDPOINTS
 * ============================================================================
 */

app.get("/api/settings", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const settings = getSettings(user.id);
  res.json({ settings });
});

app.post("/api/settings", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { theme, workingHours, breakPreference, language } = req.body;
  const settings = updateSettings(user.id, theme, workingHours, breakPreference, language);
  res.json({ settings });
});

/**
 * ============================================================================
 * GOALS & JOURNEYS ENDPOINTS (WITH AI BREAKDOWN)
 * ============================================================================
 */

app.get("/api/goals", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const goals = getGoals(user.id);
  res.json({ goals });
});

app.get("/api/goals/:id", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.id);
  const details = getGoalDetails(goalId, user.id);
  if (!details) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }
  res.json({ goal: details });
});

// Create new goal with AI Goal Breakdown (Feature 1 & Feature 3)
app.post("/api/goals", authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const { title, targetDate } = req.body;

  if (!title || !targetDate) {
    res.status(400).json({ error: "Goal title and target date are required" });
    return;
  }

  try {
    // Call Gemini API to automatically break down the goal into Milestones, Tasks, and MiniTasks
    const prompt = `You are an AI Goal Breakdown assistant. Break down the user's high-level goal: "${title}" which has a target date of "${targetDate}". 
Generate a comprehensive structured roadmap containing 3 key Milestones.
For each Milestone, generate 2 realistic Tasks.
For each Task, generate 3 sequential, tiny, low-friction, concrete "Mini Tasks" that reduce cognitive load and prevent procrastination.
Your response MUST fit the specified JSON schema exactly. Ensure tasks are simple, encouraging, and highly actionable.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of milestones",
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Clean title of the milestone (e.g. 'Build Core Frontend UI')",
              },
              tasks: {
                type: Type.ARRAY,
                description: "The concrete tasks under this milestone",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: {
                      type: Type.STRING,
                      description: "The title of the task (e.g. 'Implement task lists component')",
                    },
                    miniTasks: {
                      type: Type.ARRAY,
                      description: "2-3 extremely small, bite-sized mini tasks to perform sequentially",
                      items: {
                        type: Type.STRING,
                      },
                    },
                  },
                  required: ["title", "miniTasks"],
                },
              },
            },
            required: ["title", "tasks"],
          },
        },
      },
    });

    const breakdownText = response.text || "[]";
    const milestones = JSON.parse(breakdownText);

    // Write to SQLite Database
    const goalId = createGoal(user.id, title, targetDate, milestones);

    res.json({ success: true, goalId });
  } catch (error: any) {
    console.error("AI Goal Breakdown Error:", error);
    // Fallback milestone creation if Gemini fails
    const fallbackMilestones = [
      {
        title: "Initial Launchpad",
        tasks: [
          {
            title: "Plan and map out starting requirements",
            miniTasks: ["Write down top 3 priorities", "Gather essential tools", "Set aside 20 minutes"],
          },
          {
            title: "Take first simple steps",
            miniTasks: ["Read introductory material", "Open workspace", "Write first item"],
          },
        ],
      },
      {
        title: "Core Execution",
        tasks: [
          {
            title: "Build out the foundational structure",
            miniTasks: ["Sketch design on paper", "Create basic outline", "Focus for 15 minutes"],
          },
        ],
      },
    ];
    try {
      const goalId = createGoal(user.id, title, targetDate, fallbackMilestones);
      res.json({ success: true, goalId, note: "Loaded with supportive default plan" });
    } catch (dbError) {
      res.status(500).json({ error: "Failed to create goal database entries" });
    }
  }
});

// Update Mini-Task Status
app.post("/api/mini-tasks/:id/status", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const miniTaskId = parseInt(req.params.id);
  const { status } = req.body; // 'pending' | 'completed'

  if (!status) {
    res.status(400).json({ error: "Status is required" });
    return;
  }

  updateMiniTaskStatus(miniTaskId, user.id, status);
  res.json({ success: true });
});

// Update Task Status
app.post("/api/tasks/:id/status", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const taskId = parseInt(req.params.id);
  const { status } = req.body; // 'pending' | 'completed'

  if (!status) {
    res.status(400).json({ error: "Status is required" });
    return;
  }

  updateTaskStatus(taskId, user.id, status);
  res.json({ success: true });
});

/**
 * ============================================================================
 * DAILY REFLECTIONS ENDPOINTS (FEATURE 5)
 * ============================================================================
 */

app.get("/api/reflections", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const reflections = getReflections(user.id);
  res.json({ reflections });
});

app.post("/api/reflections", authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const { date, wentWell, slowedDown, feeling } = req.body;

  if (!date || !wentWell || !slowedDown || !feeling) {
    res.status(400).json({ error: "Reflection components are required" });
    return;
  }

  try {
    // Generate Coach Advice using Gemini
    const advicePrompt = `You are Momentum, a friendly and empathetic AI productivity coach.
The user just completed their daily reflection for today (${date}):
- What went well: "${wentWell}"
- What slowed them down: "${slowedDown}"
- How they felt: "${feeling}"

Generate a 2-3 sentence response filled with warm, encouraging feedback. Acknowledge how they felt, celebrate what went well, and offer a practical, low-pressure, supportive tip for tomorrow. Keep the tone gentle, supportive, and kind. No jargon or complex formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: advicePrompt,
    });

    const tomorrowAdvice = response.text || "You did wonderful today. Rest up, take a deep breath, and remember that small consistent steps build incredible momentum.";

    saveReflection(user.id, date, wentWell, slowedDown, feeling, tomorrowAdvice);
    res.json({ success: true, tomorrowAdvice });
  } catch (error) {
    console.error("AI Reflection Advice Error:", error);
    const fallbackAdvice = "You did a great job reflecting on your day. Remember that taking notice of what slows you down is a step forward in itself! Focus on a small, supportive win tomorrow.";
    saveReflection(user.id, date, wentWell, slowedDown, feeling, fallbackAdvice);
    res.json({ success: true, tomorrowAdvice: fallbackAdvice });
  }
});

/**
 * ============================================================================
 * FOCUS SESSIONS ENDPOINTS (FEATURE 7)
 * ============================================================================
 */

app.get("/api/focus/history", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const history = getFocusHistory(user.id);
  res.json({ history });
});

app.post("/api/focus/session", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const { taskId, durationMinutes, completed } = req.body;

  if (!taskId || !durationMinutes) {
    res.status(400).json({ error: "Task ID and duration are required" });
    return;
  }

  const sessionId = addFocusSession(user.id, taskId, durationMinutes, completed ? 1 : 0);
  res.json({ success: true, sessionId });
});

/**
 * ============================================================================
 * STATS & DASHBOARD DATA (FEATURES 2, 4, 8, 10)
 * ============================================================================
 */

app.get("/api/dashboard", authenticateToken, async (req, res) => {
  const user = (req as any).user;

  try {
    const goals = getGoals(user.id);
    const activeGoals = goals.filter(g => g.status === 'active');
    const mainGoal = activeGoals.length > 0 ? activeGoals[0] : null;

    // Get Today's Next Step (Feature 2)
    const nextStep = getNextAction(user.id);

    // Dynamic Progress Bar calculation
    let todayProgress = 0;
    if (mainGoal) {
      // Fetch details of main goal to count tasks
      const details = getGoalDetails(mainGoal.id, user.id);
      if (details && details.milestones) {
        let total = 0;
        let completed = 0;
        details.milestones.forEach((m: any) => {
          m.tasks.forEach((t: any) => {
            total++;
            if (t.status === 'completed') completed++;
          });
        });
        todayProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
      }
    }

    // Momentum stats
    const stats = getMomentumStats(user.id);

    // Greeting Message based on time of day
    const hour = new Date().getHours();
    let greeting = "Good Morning 👋";
    if (hour >= 12 && hour < 17) {
      greeting = "Good Afternoon ☀️";
    } else if (hour >= 17) {
      greeting = "Good Evening 🌙";
    }

    // Generate dynamic AI Suggestion & Motivation Quote
    let aiSuggestion = "Create a goal to get your personalized, step-by-step guidance!";
    let motivationQuote = "The secret of getting ahead is getting started. Take one tiny step today.";

    if (nextStep) {
      aiSuggestion = `Focus on doing this one simple thing: "${nextStep.title}". You don't need to finish everything today, just take this next step.`;
      motivationQuote = `\"Focus on progress, not perfection. Today's action is your stepping stone.\"`;
    } else if (mainGoal) {
      aiSuggestion = "Great! Your goal is active. Ask your AI Coach to plan your next action, or add a milestone.";
      motivationQuote = "\"Every giant oak started as a tiny sprout. Your momentum is growing.\"";
    }

    res.json({
      greeting,
      focusGoal: mainGoal,
      todayProgress,
      nextStep,
      aiSuggestion,
      motivationQuote,
      momentumScore: stats,
      weeklyJourney: stats.weeklyJourney,
    });
  } catch (error) {
    console.error("Dashboard Loading Error:", error);
    res.status(500).json({ error: "Failed to load dashboard statistics" });
  }
});

app.get("/api/achievements", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const achievements = getAchievements(user.id);
  res.json({ achievements });
});

/**
 * ============================================================================
 * SMART SCHEDULE GENERATOR (FEATURE 6)
 * ============================================================================
 */

app.get("/api/smart-schedule", authenticateToken, async (req, res) => {
  const user = (req as any).user;

  try {
    const settings = getSettings(user.id);
    const nextStep = getNextAction(user.id);
    const taskTitle = nextStep ? nextStep.title : "Reflect on your current focus and set your goals";

    const prompt = `You are a gentle scheduling assistant. Design a balanced, supportive, calm daily schedule for a user.
Their working hours are: "${settings.workingHours}".
Their preferred break frequency is: "${settings.breakPreference}".
Their primary task to integrate is: "${taskTitle}".

Create a healthy plan with Morning, Afternoon, and Evening blocks. Integrate meals, breaks, work, study, and relaxation. Make it feel highly achievable, reducing decision fatigue.
Your response MUST match the JSON schema exactly.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            morning: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "e.g. '08:00 AM'" },
                  activity: { type: Type.STRING, description: "e.g. 'Light breakfast and tea'" },
                  type: { type: Type.STRING, description: "e.g. 'meal', 'work', 'break', 'relax'" },
                },
                required: ["time", "activity", "type"],
              },
            },
            afternoon: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ["time", "activity", "type"],
              },
            },
            evening: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  type: { type: Type.STRING },
                },
                required: ["time", "activity", "type"],
              },
            },
          },
          required: ["morning", "afternoon", "evening"],
        },
      },
    });

    const scheduleText = response.text || "{}";
    const schedule = JSON.parse(scheduleText);
    res.json({ schedule });
  } catch (error) {
    console.error("AI Smart Schedule Error:", error);
    // Fallback schedule
    const fallbackSchedule = {
      morning: [
        { time: "08:30 AM", activity: "Gentle Morning Warm-up & Coffee", type: "meal" },
        { time: "09:00 AM", activity: "Core focus block (Start next step)", type: "work" },
        { time: "10:30 AM", activity: "Relaxing Stretch & Hydration break", type: "break" },
      ],
      afternoon: [
        { time: "12:30 PM", activity: "Nourishing Lunch and light walk", type: "meal" },
        { time: "02:00 PM", activity: "Secondary focus block (Break down tasks)", type: "work" },
        { time: "03:30 PM", activity: "Mindfulness break or quiet pause", type: "break" },
      ],
      evening: [
        { time: "06:30 PM", activity: "Warm Dinner and unwinding", type: "meal" },
        { time: "08:00 PM", activity: "Achievement Garden check-in & reflection", type: "relax" },
        { time: "09:30 PM", activity: "Calm relaxation, reading or listening to music", type: "relax" },
      ],
    };
    res.json({ schedule: fallbackSchedule });
  }
});

/**
 * ============================================================================
 * AI COACH CHAT ENDPOINTS (FEATURE 9)
 * ============================================================================
 */

app.get("/api/coach/chat", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const history = getChatHistory(user.id);
  res.json({ history });
});

app.post("/api/coach/chat", authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const { message } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message content is required" });
    return;
  }

  try {
    // 1. Save user's message
    addChatMessage(user.id, "user", message);

    // 2. Load context (active goal and next action)
    const goals = getGoals(user.id);
    const activeGoals = goals.filter(g => g.status === 'active');
    const mainGoal = activeGoals.length > 0 ? activeGoals[0] : null;
    const nextStep = getNextAction(user.id);
    const history = getChatHistory(user.id, 20);

    // 3. Setup Gemini prompt with historical context & user state
    const systemInstruction = `You are Momentum, a friendly, ultra-supportive, empathetic AI productivity coach.
Your mission is to help people defeat procrastination, reduce decision fatigue, and gain positive momentum.
You focus entirely on the "smallest next step." You never make the user feel guilty about deadlines or missed tasks.
Instead, you encourage, motivate, break down goals, and celebrate active efforts.

Current User State:
- Active Goal: ${mainGoal ? `"${mainGoal.title}" (target: ${mainGoal.targetDate})` : "No goal created yet"}
- Next Best Action: ${nextStep ? `"${nextStep.title}"` : "All current tasks completed!"}

Guidelines:
- Keep responses relatively brief, friendly, warm, and highly conversational.
- Use rounded bullet points or friendly spacing when listing items.
- Suggest very small, actionable steps (e.g. "Just open the document," "Focus for 10 minutes").
- Celebrate small accomplishments. Avoid sounding technical, robotic, or clinical. Use gentle words.`;

    // Reconstruct Gemini chat history correctly
    // Convert to Gemini API format: [{role: "user" | "model", parts: [{text: string}]}]
    const contents = history.map(chat => ({
      role: chat.sender === "user" ? "user" : "model",
      parts: [{ text: chat.message }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || "I'm right here with you. What's one tiny step we can take together to make today a little lighter?";

    // 4. Save coach reply
    addChatMessage(user.id, "coach", reply);

    res.json({ reply });
  } catch (error) {
    console.error("AI Coach Chat Error:", error);
    const fallbackReply = "I'm experiencing a quick momentary pause, but I'm still cheering you on! Remember: any action, no matter how small, breaks procrastination. What's one simple thing you can open or view right now?";
    addChatMessage(user.id, "coach", fallbackReply);
    res.json({ reply: fallbackReply });
  }
});

app.delete("/api/coach/chat", authenticateToken, (req, res) => {
  const user = (req as any).user;
  clearChatHistory(user.id);
  res.json({ success: true });
});

/**
 * ============================================================================
 * VITE DEVELOPMENT / PRODUCTION STATIC SERVING
 * ============================================================================
 */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Momentum AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
