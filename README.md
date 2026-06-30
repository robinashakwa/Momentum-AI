# Momentum AI 🌱

> **The Last-Minute Life Saver** — An intelligent AI productivity coach that stops procrastination by transforming overwhelming goals into tiny, achievable daily actions.

Momentum AI is designed for the Google Developer Hackathon. Unlike traditional deadline managers or to-do list applications that cause anxiety, Momentum AI reduces decision fatigue. Instead of asking: *"Will I miss my deadline?"*, Momentum AI asks: **"What's the smallest next step I can take today?"**

---

## 🎨 Design Philosophy & Vibe

- **Apple Reminders & Notion Inspired**: Generous negative space, soft rounded borders, crisp typography, and high-contrast light slate theme.
- **Micro-Action Decompositions**: No massive, stressful tables. A simple spotlight card focusing on exactly **one** step.
- **Achievement Garden**: A digital plant collection that grows as you complete milestones, making productivity warm and gamified.
- **Zero Tech-Larping**: Humble, human language. Beautiful, calming illustrations and friendly feedback.

---

## 🏗️ Technical Architecture

Momentum AI is built with a highly cohesive, full-stack architecture running inside sandboxed containers:

```
┌────────────────────────────────────────────────────────┐
│                        CLIENT                          │
│  React 19 (Vite) + Tailwind CSS v4 + Framer Motion     │
└───────────┬────────────────────────────────┬───────────┘
            │ Auth / Goals                   │ Chats / Schedule
            ▼                                ▼
┌────────────────────────────────────────────────────────┐
│                        SERVER                          │
│  Node.js + Express + SQLite Database (better-sqlite3)  │
└───────────────────────────┬────────────────────────────┘
                            │ Structured Prompt Schemas
                            ▼
┌────────────────────────────────────────────────────────┐
│                       GOOGLE AI                        │
│  Gemini 3.5 Flash Model (via @google/genai SDK)       │
└────────────────────────────────────────────────────────┘
```

1. **Frontend**: React SPA utilizing modular components, custom timers, and Tailwind v4 theme bindings.
2. **Backend**: Custom Express.js server providing routing, custom PBKDF2 user authentication, and SQLite persistence.
3. **Database**: Robust local SQLite file storage (`momentum_ai.db`) executing inside the container.
4. **AI integration**: Seamless server-side calls utilizing the official `@google/genai` TypeScript SDK. Keeps credentials isolated and secure.

---

## 🌟 10 Core Features

1. **Home Dashboard**: Visually stunning dashboard showing your single progress spotlight, momentum stats, and daily motivation.
2. **Goal Journey**: Create a single focus goal. The AI automatically parses, designs, and seeds its roadmap.
3. **AI Goal Breakdown**: Automatic decomposition of high-level goals into sequential **Milestones** ➔ **Tasks** ➔ **Mini-Tasks**.
4. **Momentum Score**: Dynamic scoreboard based on consistency, streaks, and reflections. Status badges: `🌱 Growing`, `🚀 Strong Momentum`, or `🔥 Amazing Week`.
5. **Daily Reflection**: Calm end-of-day mindfulness check-in. Gemini generates customized advice for tomorrow.
6. **Smart Schedule**: Multi-block daily timeline (Morning, Afternoon, Evening) that integrates your tasks, breaks, meals, and relaxation.
7. **Focus Mode**: A dedicated 25-minute Pomodoro timer displaying active focus points and warm progress micro-quotes.
8. **Weekly Journey**: Elegant 7-day row representation of your daily consistency, inspired by GitHub contribution graphs.
9. **AI Coach**: Interactive conversational panel renamed "AI Coach" with quick suggestion chips for motivational advice.
10. **Achievement Garden**: A visual garden representing completed goals. Cultivate virtual plants like **Sprouty**, **Ivy**, **Oak**, or **Blossom**.

---

## 📦 Local Installation

To boot Momentum AI locally:

### 1. Prerequisite
Ensure you have Node.js 20+ installed.

### 2. Configure Credentials
Create a `.env` file in the root folder:
```env
GEMINI_API_KEY="YOUR_GOOGLE_AI_STUDIO_API_KEY"
PORT=3000
```

### 3. Install and Launch
```bash
# Install packages
npm install

# Run the full-stack development workspace
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚀 Container Deployment (Google Cloud Run)

Momentum AI is designed to compile into a lightweight container and deploy to Google Cloud Run:

```bash
# Build the container locally
gcloud builds submit --tag gcr.io/[PROJECT-ID]/momentum-ai

# Deploy to Cloud Run with port mapping
gcloud run deploy momentum-ai \
  --image gcr.io/[PROJECT-ID]/momentum-ai \
  --platform managed \
  --port 3000 \
  --set-env-vars="GEMINI_API_KEY=YOUR_API_KEY"
```

---

## 🔮 Future Roadmap

- [ ] **Google Calendar Integration**: Direct syncing of the AI Smart Schedule with your personal calendar.
- [ ] **Wear OS Support**: Quick spotlight alerts on your wrist to see your next action instantly.
- [ ] **AI Habit Tracking**: Automated analysis of streaks to form positive, lifelong habits.
- [ ] **Shared Workspace**: Collaborate with family members or team players on shared, supportive objectives.

---

## 🌸 Open Source Credits

- **Vite & React** — Lightning-fast compilation and robust client rendering.
- **Google Gemini API** — High-reasoning and structured JSON roadmap breakdowns.
- **Tailwind CSS v4** — Smooth, modern, and expressive styling utilities.
- **Framer Motion** — Premium tactile tab animations and modal transitions.
- **Lucide Icons** — Beautiful, consistent, and clean iconography.
