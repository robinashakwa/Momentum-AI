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
  getSettings, updateSettings, getPendingTasks, deleteGoal, updateGoalStatus, deleteTask,
  addTaskManually
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

// Update Goal Status
app.patch("/api/goals/:id/status", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.id);
  const { status } = req.body; // 'active', 'completed', 'archived'

  if (!status) {
    res.status(400).json({ error: "Status is required" });
    return;
  }

  updateGoalStatus(goalId, user.id, status);
  res.json({ success: true });
});

// Delete Goal
app.delete("/api/goals/:id", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.id);

  deleteGoal(goalId, user.id);
  res.json({ success: true });
});

// Delete Task
app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const taskId = parseInt(req.params.id);

  deleteTask(taskId, user.id);
  res.json({ success: true });
});

// Create new goal with deadline enforcement
app.post("/api/goals", authenticateToken, async (req, res) => {
  const user = (req as any).user;
  const { title, targetDate, description, deadlineTime, estimatedHours, priority, milestones: clientMilestones } = req.body;

  if (!title || !targetDate || !deadlineTime) {
    res.status(400).json({ error: "Goal title, deadline date, and deadline time are required." });
    return;
  }

  try {
    const goalId = createGoal(
      user.id, 
      title, 
      targetDate, 
      clientMilestones || [], 
      description || '', 
      deadlineTime, 
      Number(estimatedHours) || 0, 
      priority || 'medium'
    );
    res.json({ success: true, goalId });
  } catch (dbError) {
    console.error("Failed to create goal database entries:", dbError);
    res.status(500).json({ error: "Failed to create goal database entries" });
  }
});

// Add Task Manually with deadline enforcement
app.post("/api/goals/:id/tasks", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const goalId = parseInt(req.params.id);
  const { title, description, deadlineDate, deadlineTime, estimatedHours, priority } = req.body;

  if (!title || !deadlineDate || !deadlineTime) {
    res.status(400).json({ error: "Task title, deadline date, and deadline time are required." });
    return;
  }

  try {
    const taskId = addTaskManually(
      user.id, 
      goalId, 
      title, 
      description || '', 
      deadlineDate, 
      deadlineTime, 
      Number(estimatedHours) || 1.0, 
      priority || 'medium'
    );
    res.json({ success: true, taskId });
  } catch (err) {
    console.error("Failed to add task manually:", err);
    res.status(500).json({ error: "Failed to add task manually" });
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

app.get("/api/focus/tasks", authenticateToken, (req, res) => {
  const user = (req as any).user;
  const tasks = getPendingTasks(user.id);
  res.json({ tasks });
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
    let goals = getGoals(user.id);
    const activeGoals = goals.filter(g => g.status === 'active');
    const mainGoal = activeGoals.length > 0 ? activeGoals[0] : null;

    // Get Today's Next Step (Feature 2)
    const nextStep = getNextAction(user.id);

    // Get all pending tasks to compute deadline stats
    const pendingTasks = getPendingTasks(user.id);

    // Calculate deadline states
    const now = new Date();
    
    const tasksDueToday: any[] = [];
    const tasksDueTomorrow: any[] = [];
    const overdueTasks: any[] = [];
    const upcomingThisWeek: any[] = [];
    const emergencyTasks: any[] = [];
    
    let nearestTask: any = null;
    let minDiffMs = Infinity;

    const getDeadlineDate = (t: any) => {
      const dateStr = t.dateScheduled || t.targetDate; // fallback
      const timeStr = t.deadlineTime || '18:00';
      return new Date(`${dateStr}T${timeStr}`);
    };

    pendingTasks.forEach((t: any) => {
      const deadline = getDeadlineDate(t);
      const diffMs = deadline.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Category assignment based on simple date check
      const deadlineDay = new Date(deadline).toDateString();
      const todayDay = now.toDateString();
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowDay = tomorrow.toDateString();

      if (diffMs < 0) {
        overdueTasks.push(t);
      } else {
        if (deadlineDay === todayDay) {
          tasksDueToday.push(t);
        } else if (deadlineDay === tomorrowDay) {
          tasksDueTomorrow.push(t);
        } else if (diffHours <= 168) { // within 7 days
          upcomingThisWeek.push(t);
        }

        if (diffHours > 0 && diffHours <= 24) {
          emergencyTasks.push(t);
        }
      }

      if (diffMs > 0 && diffMs < minDiffMs) {
        minDiffMs = diffMs;
        nearestTask = t;
      }
    });

    // Dynamic Progress Bar calculation
    let todayProgress = 0;
    if (mainGoal) {
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

    // Momentum stats (relabelled simplified below)
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
    let aiSuggestion = "Create a goal to activate your Deadline Rescue Engine!";
    let motivationQuote = "No active deadlines. Stay prepared and schedule your targets.";

    if (nearestTask) {
      const deadline = getDeadlineDate(nearestTask);
      const diffMs = deadline.getTime() - now.getTime();
      const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
      const diffMins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
      aiSuggestion = `Your nearest deadline is "${nearestTask.title}". You have only ${diffHours}h ${diffMins}m left! Est effort: ${nearestTask.estimatedHours || 1.0} hours. Finish this first!`;
      motivationQuote = `Deadline Alert: "${nearestTask.title}" is due on ${nearestTask.dateScheduled} at ${nearestTask.deadlineTime || '18:00'}.`;
    } else if (mainGoal) {
      aiSuggestion = `Your main goal "${mainGoal.title}" is active. Set tasks with precise deadlines to track them!`;
      motivationQuote = `Goal deadline is set for ${mainGoal.targetDate}. Keep driving forward.`;
    }

    res.json({
      greeting,
      focusGoal: mainGoal,
      todayProgress,
      nextStep: nearestTask || nextStep,
      aiSuggestion,
      motivationQuote,
      momentumScore: stats,
      weeklyJourney: stats.weeklyJourney,
      deadlineStats: {
        dueToday: tasksDueToday,
        dueTomorrow: tasksDueTomorrow,
        overdue: overdueTasks,
        upcoming: upcomingThisWeek,
        emergency: emergencyTasks,
        nearestTask,
        nearestTimeLeft: minDiffMs !== Infinity ? minDiffMs : null
      }
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
    const pendingTasks = getPendingTasks(user.id);
    
    // Sort by deadline date & time
    const sortedTasks = [...pendingTasks].sort((a: any, b: any) => {
      const dtA = new Date(`${a.dateScheduled}T${a.deadlineTime || '18:00'}`);
      const dtB = new Date(`${b.dateScheduled}T${b.deadlineTime || '18:00'}`);
      return dtA.getTime() - dtB.getTime();
    });

    const tasksCtx = sortedTasks.map(t => `- "${t.title}" (Due: ${t.dateScheduled} at ${t.deadlineTime || '18:00'}, Est Effort: ${t.estimatedHours || 1.0}h, Priority: ${t.priority})`).join("\n");

    const prompt = `You are "The Last-Minute Life Saver" schedule generator.
Your job is to generate a realistic, time-blocked daily plan based strictly on the user's upcoming deadlines.
The user's defined working hours are: "${settings.workingHours}".
Here is the list of pending tasks, SORTED BY NEAREST DEADLINE FIRST:
${tasksCtx || "No pending tasks."}

Create an hourly plan containing Morning, Afternoon, and Evening blocks. Each block must specify exact hours (e.g. "08:00 AM - 09:30 AM") and target the specific tasks to finish first before their deadlines. Include breaks and meals to maintain velocity. Do NOT use technical words like "Cognitive Planner" or "Pilot" or "Execution Matrix". Use simple human names like "Morning Schedule", "Today's Tasks", "Finish First".
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
                  time: { type: Type.STRING, description: "e.g. '08:00 AM - 09:00 AM'" },
                  activity: { type: Type.STRING, description: "e.g. 'Finish Chapter 1'" },
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
                  time: { type: Type.STRING, description: "e.g. '02:00 PM - 03:30 PM'" },
                  activity: { type: Type.STRING, description: "e.g. 'Assignment Submission'" },
                  type: { type: Type.STRING, description: "e.g. 'meal', 'work', 'break', 'relax'" },
                },
                required: ["time", "activity", "type"],
              },
            },
            evening: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING, description: "e.g. '07:00 PM - 08:30 PM'" },
                  activity: { type: Type.STRING, description: "e.g. 'Prepare Presentation'" },
                  type: { type: Type.STRING, description: "e.g. 'meal', 'work', 'break', 'relax'" },
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
        { time: "08:00 AM - 09:00 AM", activity: "Finish Chapter 1", type: "work" },
        { time: "09:15 AM - 10:30 AM", activity: "Prepare Presentation", type: "work" },
        { time: "10:30 AM - 11:00 AM", activity: "Stretch & Hydrate", type: "break" },
      ],
      afternoon: [
        { time: "12:00 PM - 01:00 PM", activity: "Lunch", type: "meal" },
        { time: "02:00 PM - 03:30 PM", activity: "Assignment Submission", type: "work" },
        { time: "03:30 PM - 04:00 PM", activity: "Reflection & Next Step check", type: "relax" },
      ],
      evening: [
        { time: "06:00 PM - 07:00 PM", activity: "Dinner", type: "meal" },
        { time: "08:00 PM - 09:00 PM", activity: "Review Next Deadlines", type: "relax" },
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
    const pendingTasks = getPendingTasks(user.id);
    const history = getChatHistory(user.id, 20);

    // Format active goals and tasks for the AI Coach context
    const goalsCtx = activeGoals.map(g => `- Goal: "${g.title}"\n  Deadline: ${g.targetDate} at ${(g as any).deadlineTime || '18:00'}\n  Est Effort: ${(g as any).estimatedHours || 0}h\n  Priority: ${(g as any).priority || 'medium'}`).join("\n");
    const tasksCtx = pendingTasks.map(t => `- Task: "${t.title}"\n  Deadline: ${t.dateScheduled} at ${(t as any).deadlineTime || '18:00'}\n  Est Effort: ${(t as any).estimatedHours || 1}h\n  Priority: ${(t as any).priority || 'medium'}`).join("\n");

    // 3. Setup Gemini prompt with historical context & user state
    const systemInstruction = `You are "The Last-Minute Life Saver" AI Deadline Coach.
Your mission is to help people defeat extreme procrastination and last-minute deadline panic by analyzing remaining hours, prioritizing task order, and crafting immediate action schedules.

Current Local Time is: ${new Date().toLocaleString()}

User's Active Goal Context:
${goalsCtx || "No active goals created yet."}

User's Pending Tasks Context (sorted by nearest deadline):
${tasksCtx || "No pending tasks."}

CRITICAL RULES FOR YOUR BEHAVIOR:
1. NEVER give generic, vague, or purely emotional motivational advice (e.g. "Just believe in yourself", "You've got this! Keep going"). Every piece of advice must be concrete, actionable, and tied directly to the time remaining.
2. ALWAYS analyze exact deadlines. Calculate DAYS, HOURS, and MINUTES remaining between the current local time and the task deadlines.
3. EVERY single response you send MUST reference the user's specific deadline date and time.
4. EVERY single recommendation you provide MUST clearly and explicitly answer these 4 crucial questions:
   - What should I finish first?
   - How much time is left?
   - Can I still finish before the deadline?
   - What should I do right now?
5. Generate an urgent recommended schedule (e.g., "Recommended schedule: 2 hours now, 2 hours tonight... Finish before 10:00 AM").
6. Keep your language simple and friendly, but highly focused and urgent. Do NOT use technical buzzwords like "Momentum Analysis", "Cognitive Planner", or "Execution Matrix". Use words like "Today's Tasks", "Due Soon", "Time Left", "Finish First".`;

    // Reconstruct Gemini chat history correctly
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

    const reply = response.text || "I am analyzing your deadlines. Let's make sure we finish before the time runs out! What should we finish first?";

    // 4. Save coach reply
    addChatMessage(user.id, "coach", reply);

    res.json({ reply });
  } catch (error) {
    console.error("AI Coach Chat Error:", error);
    const fallbackReply = "I'm calculating your remaining hours. Every minute matters right now. To finish before your deadline, let's open the single most important task and focus on it for 25 minutes. Can we do that right now?";
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
