# TaskFlow - Distributed Task Scheduler with Dependency Resolution

TaskFlow is a web-based application that simulates a distributed task scheduler. It processes tasks that form a **Directed Acyclic Graph (DAG)**, ensuring that dependencies are respected. It also handles **task failures**, supports **automatic retries**, detects **deadlocks**, and visualizes valid execution paths.

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

```bash
git clone https://github.com/shreyash0603/TaskFlow.git
cd TaskFlow
npm install




