<div align="center">

# ⚡ Momentum AI

### Build Better Habits. Finish More Tasks. Never Lose Momentum.

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](#-license)

🏆 **Built for VIBE2SHIP — India's Biggest Vibe Coding Hackathon**
*Presented by Coding Ninjas × Google for Developers*
**Theme:** The Last-Minute Life Saver

**[🚀 Live Demo](https://momentum-ai-642865164918.asia-southeast1.run.app/)** &nbsp;·&nbsp; **[📂 Repository](https://github.com/robinashakwa/Momentum-AI)**

</div>

---

## 🧭 Project Overview

Students, professionals, freelancers, and entrepreneurs constantly juggle multiple deadlines across different aspects of their lives — coursework, client deliverables, personal projects, and everyday responsibilities.

Traditional task management applications only go as far as reminders. They tell users what is due, but offer no real guidance on what to prioritize, how to plan their time, or how to stay on track when work piles up.

This gap often results in last-minute stress, rushed output, and missed deadlines — even when users genuinely intend to stay organized.

**Momentum AI** was built to solve this problem at its root. Rather than passively reminding users of deadlines, it actively analyzes their workload and provides intelligent recommendations on what to do next — turning planning from a chore into a guided, achievable process.

---

## 💡 Solution

Momentum AI is an **intelligent productivity coach** powered by Google's Gemini AI.

Instead of simply tracking due dates, Momentum AI:

- 📊 **Analyzes workload** across all active tasks and commitments
- 🔮 **Predicts urgent work** before it becomes a last-minute emergency
- 🗓️ **Creates personalized daily plans** based on real deadlines and effort
- 🧱 **Breaks large work into manageable tasks** that are easy to start
- 🎯 **Suggests focus sessions** to encourage deep, uninterrupted work
- 📈 **Tracks productivity** to help users build sustainable habits

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Task Prioritization** | Ranks tasks intelligently based on urgency, deadline, and effort using Gemini AI. |
| 📅 **Smart Daily Planner** | Generates a realistic, achievable daily plan tailored to current workload. |
| ⚡ **Momentum Builder** | Encourages consistent daily progress through small, achievable wins. |
| 🔥 **Momentum Score** | A dynamic score that reflects consistency and ongoing productivity. |
| 📝 **AI Task Breakdown** | Splits complex, overwhelming tasks into clear, actionable sub-tasks. |
| 🤖 **AI Productivity Assistant** | A conversational AI coach to help plan, clarify, and stay accountable. |
| 📊 **Dashboard** | A visual snapshot of pending work, priorities, and overall progress. |
| 📆 **Calendar** | A unified view of deadlines, daily plans, and scheduled focus sessions. |
| 🎯 **Focus Mode** | A distraction-free environment designed for deep, single-task focus. |
| 📈 **Progress Reports** | Detailed insights into productivity trends and completion rates. |
| ⚙️ **User Settings** | Personalize planning preferences, notifications, and workflow style. |
| 🔐 **Secure Login System** | Reliable authentication to keep user data safe and private. |

---

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- React Router
- Framer Motion

**Backend**
- Node.js
- Express.js

**Database**
- SQLite

**Artificial Intelligence**
- Google Gemini API

**Charts**
- Recharts

**Deployment**
- Google Cloud Run

---

## ☁️ Google Technologies Used

| Technology | Usage |
|---|---|
| **Google AI Studio** | Used to design, test, and refine the prompts that power Momentum AI's planning intelligence. |
| **Gemini API** | Drives task prioritization, daily plan generation, task breakdown, and the AI assistant's responses. |
| **Google Cloud Run** | Hosts and serves the application with scalable, serverless deployment infrastructure. |

---

## 🏗️ Architecture

```
                   User
                     │
                     ▼
             React Frontend
                     │
                     ▼
            Express Backend
               │         │
               ▼         ▼
        SQLite Database  Gemini API
```

Gemini continuously analyzes user tasks and generates intelligent productivity recommendations, which flow back through the Express backend to the React frontend in real time.

---

## 📁 Project Structure

```
Momentum-AI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
├── server/                 # Node.js + Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── db/
│   └── index.js
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Installation

**1. Clone the repository**
```bash
git clone https://github.com/robinashakwa/Momentum-AI.git
```

**2. Navigate to the project**
```bash
cd Momentum-AI
```

**3. Install dependencies**
```bash
npm install
```

**4. Start the development server**
```bash
npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=
DATABASE_URL=
```

---

## 📸 Screenshots

| Page | Preview |
|---|---|
| 🏠 Landing Page | ![Landing Page](screenshots/landing-page.png) |
| 🔐 Login Page | ![Login Page](screenshots/login-page.png) |
| 📊 Dashboard | ![Dashboard](screenshots/dashboard.png) |
| 📝 My Tasks | ![My Tasks](screenshots/my-tasks.png) |
| 📆 Calendar | ![Calendar](screenshots/calendar.png) |
| 🤖 AI Assistant | ![AI Assistant](screenshots/ai-assistant.png) |
| 🎯 Focus Mode | ![Focus Mode](screenshots/focus-mode.png) |
| 📈 Reports | ![Reports](screenshots/reports.png) |
| ⚙️ Settings | ![Settings](screenshots/settings.png) |

---

## 🌟 Why Momentum AI?

Most productivity apps are passive — they wait for a deadline to get close before nudging the user. By then, it's often too late to plan properly, and the result is rushed, last-minute work.

Momentum AI takes a fundamentally different approach. By continuously analyzing workload and proactively recommending the next best action, it helps users build **consistent daily progress** instead of relying on last-minute pressure to get things done.

It's not just a task manager — it's a coach that keeps users moving forward, one achievable step at a time.

---

## 🚀 Future Scope

- 📆 Google Calendar Integration
- 🎙️ Voice Assistant
- 📱 Mobile App
- 🔔 Push Notifications
- 📈 Habit Tracking
- 🗓️ AI Weekly Reviews
- 🔥 Productivity Heatmaps
- 🔄 Cross-device Synchronization
- 👥 Team Collaboration

---

## 🙏 Open Source Credits

Heartfelt thanks to the open-source projects that made Momentum AI possible:

- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express](https://expressjs.com/)
- [SQLite](https://www.sqlite.org/)
- [React Router](https://reactrouter.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide React](https://lucide.dev/)
- [Recharts](https://recharts.org/)

All third-party libraries belong to their respective creators and maintainers. 🙌

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👤 Author

**Robina Shakwa**
🔗 GitHub: [@robinashakwa](https://github.com/robinashakwa)

---

<div align="center">

⭐ **Built with Google Gemini AI during the VIBE2SHIP Hackathon.**
If you found this project helpful, consider giving it a Star.

</div>
