# TaskFlow - Distributed Task Scheduler with Dependency Resolution

TaskFlow is a web-based application that simulates a distributed task scheduler. It processes tasks that form a **Directed Acyclic Graph (DAG)**, ensuring that dependencies are respected. It also handles **task failures**, supports **automatic retries**, detects **deadlocks**, and visualizes valid execution paths.
![TaskFlow](https://github.com/user-attachments/assets/8b80a4d7-c181-4e44-a3c1-ea9038430b45)

---

## 🔧 Implementation Details & Approach

### 🎯 Core Features
- **DAG-based Execution**: Tasks are defined as nodes with dependencies (edges), and the scheduler ensures correct topological execution order.
- **Retry Mechanism**: If a task fails, it is retried up to **N** times (user-defined).
- **Deadlock/Cycle Detection**: If a persistent failure blocks further execution (e.g., all retries exhausted), it reports a deadlock.
- **Visualization**: Graph is rendered using `SVG` and animated with `Framer Motion` to show dynamic progress of task execution.

### ⚙️ Tech Stack
- **Frontend**: React.js + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Graph Visualization**: SVG-based custom rendering

---

## 🚀 Usage Instructions

### 1. 📦 Install Dependencies

Clone the repository and install packages:


### 2. 🏁 Start the Project
bash
Copy
Edit
npm run dev
Open http://localhost:3000 to view the app.

### 3. 🧪 How to Use
Add tasks and define dependencies using the UI.

Click “Start Execution” to simulate task execution.

Tasks will execute in correct topological order.

If a task fails, it retries up to N times.

The visualization updates dynamically as tasks run, succeed, fail, or get skipped due to dependency failure.

⚠️ Assumptions, Limitations & Edge Cases
✅ Assumptions
All tasks and dependencies are entered before execution begins.

DAG is valid (no cycles) at the time of creation.

Each task has a simulated success/failure randomly for demonstration.

❌ Limitations
No real distributed backend execution (currently simulated on frontend).

UI does not persist DAG across refresh.

Error handling is mostly for visualization and not backend-safe.

⚠️ Edge Cases Handled
Cycles: Cycles in input graph are detected and execution is halted with error.

Deadlocks: If a task fails beyond max retries, all dependent tasks are marked blocked.

Tasks without dependencies run independently.

### 📦 Dependencies
Package	Purpose
React	UI Framework
TypeScript	Static typing
Tailwind CSS	Styling
Framer Motion	Animations for graph elements
clsx	Conditional classNames
Zustand	State management

Install via:

bash
Copy
Edit
npm install framer-motion tailwindcss clsx zustand
📝 Additional Notes
SVG rendering is used instead of external libraries for fine control.

Framer Motion helps with smooth task transitions.

You can extend this project to connect with Firebase or a backend for real execution and persistence.

Contributions and feedback are welcome!

```bash
git clone https://github.com/shreyash0603/TaskFlow.git
cd TaskFlow
npm install





