# 📋 Boardify – Trello-like Task Management Application

<p align="center">
  <strong>A full-stack Kanban board web application inspired by Trello, featuring real-time collaboration, drag-and-drop task management, and Google OAuth authentication.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5-B73C9D?logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Material%20UI-5-0081CB?logo=mui&logoColor=white" alt="MUI"/>
  <img src="https://img.shields.io/badge/Redux%20Toolkit-2-593D88?logo=redux&logoColor=white" alt="Redux Toolkit"/>
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.IO-4-010101?logo=socket.io&logoColor=white" alt="Socket.IO"/>
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/License-MIT-22c55e" alt="MIT License"/>
</p>

---

## 📖 Overview

**Boardify** is a Trello-inspired project management application that helps individuals and teams organize work visually using a Kanban board. Users can manage boards, columns, and cards with real-time updates via Socket.IO.

Core capabilities:
- Organize work into **Boards → Columns → Cards** hierarchy
- **Drag & drop** to reorder columns and move cards within or between columns
- Invite team members and collaborate in real time
- Authenticate with **email/password** or **Google OAuth 2.0**
- Recover account via **forgot/reset password** email flow

---

## 🏗️ Architecture

```
[ React + Vite (MUI, Redux Toolkit) ]
             ↕ REST API (Axios)
[ Node.js + Express REST API ]  ←→  [ Socket.IO (real-time) ]
             ↕
         [ MongoDB ]
             ↕
    [ Nodemailer (email) ]    [ Google OAuth 2.0 ]
```

- **Frontend** communicates with backend via Axios REST calls
- **Socket.IO** handles real-time board updates (card/column changes)
- **MongoDB** (native driver) stores all application data
- **Docker Compose** runs MongoDB + API + Web in one command

---

## 🛠️ Tech Stack

### Frontend
| Library / Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool & dev server |
| Material UI (MUI) | 5 | Component library |
| Redux Toolkit | 2 | Global state management |
| React Router | 6 | Client-side routing |
| @dnd-kit | 6/10 | Drag & drop (columns & cards) |
| Framer Motion | 12 | UI animations |
| Axios | 1 | HTTP client |
| React Toastify | 9 | Toast notifications |
| date-fns | 4 | Date formatting |

### Backend
| Library / Tool | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18 | Runtime |
| Express | 4 | Web framework |
| MongoDB (native) | 6 | Database driver |
| Socket.IO | 4 | Real-time communication |
| JWT (jsonwebtoken) | 9 | Access & refresh token auth |
| Joi | 17 | Request validation |
| Bcryptjs | 2 | Password hashing |
| Nodemailer | 7 | Transactional email |
| Multer | 2 | File / image uploads |
| Helmet | 8 | HTTP security headers |
| Express-rate-limit | 8 | API rate limiting |
| Babel | 7 | ES module transpilation |

### DevOps & Infra
| Tool | Purpose |
|---|---|
| Docker & Docker Compose | Containerized deployment |
| Nginx | Frontend reverse proxy (production) |
| ESLint | Code linting |

---

## ✨ Features

### 🔐 Authentication & Security
- Register / Login with email & password (JWT access + refresh tokens)
- Login with **Google OAuth 2.0**
- Protected routes with automatic token refresh
- Forgot password via email link
- Reset password screen with confirmation
- Account settings & profile management

### 📌 Boards & Collaboration
- Create, update, and delete boards
- Board templates (Sprint, Study Plan, Marketing Campaign, etc.)
- Invite members via email
- Role-based access: board owner vs. members

### 🗂️ Kanban Board
- Create and manage columns with custom titles
- Cards inside each column
- **Drag & drop:**
  - Reorder columns on the board
  - Move cards within a column
  - Move cards across different columns
- Real-time sync: changes broadcast instantly to all board members via Socket.IO

### 🃏 Card Details
- Title & rich description
- Colored labels / tags
- Assign members to cards
- Checklists with completion progress
- Due dates & completion status
- File attachments & card cover image
- Comment & activity history

### 🎨 User Experience
- Light / Dark mode toggle
- Empty state onboarding
- Notifications dropdown
- Keyboard shortcuts modal
- Profile overview with activity stats
- Responsive layout

---

## 📁 Project Structure

```
Boardify/
├── API_Trello/                        # Backend – Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/                    # MongoDB connection, CORS, env config
│   │   ├── controllers/               # Route handler functions
│   │   ├── middlewares/               # Auth, validation, error handling
│   │   ├── models/                    # MongoDB collection schemas
│   │   ├── providers/                 # Third-party integrations (Google, email)
│   │   ├── routes/v1/                 # REST API routes (/v1/boards, /v1/cards, ...)
│   │   ├── services/                  # Business logic layer
│   │   ├── sockets/                   # Socket.IO event handlers
│   │   ├── utils/                     # Helper functions & constants
│   │   ├── validations/               # Joi request schemas
│   │   └── server.js                  # App entry point
│   ├── .env.example                   # Environment variable template
│   ├── docker-compose.yml             # MongoDB service definition
│   └── Dockerfile
│
├── trello-web/
│   └── trello-web/                    # Frontend – React + Vite + TypeScript
│       ├── src/
│       │   ├── apis/                  # Axios instance & API call functions
│       │   ├── components/            # Shared UI components (AppBar, Modals, ...)
│       │   ├── customHooks/           # Reusable React hooks
│       │   ├── pages/                 # Auth, Boards, Profile, AcceptInvitation
│       │   ├── redux/                 # Redux slices & store configuration
│       │   ├── services/              # Client-side service functions
│       │   ├── utilities/             # Constants, formatters, board templates
│       │   ├── App.jsx                # Root component & route definitions
│       │   └── main.jsx               # React entry point
│       ├── .env.example
│       ├── nginx.conf                 # Nginx config for production build
│       ├── vite.config.ts
│       └── Dockerfile
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker & Docker Compose](https://docs.docker.com/get-docker/) — for containerized setup *(recommended)*
- Node.js ≥ 18 — for local development without Docker

### Option 1: Run with Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/NguyenManhNinh/Boardify.git
cd Boardify

# 2. Configure backend environment
cd API_Trello
cp .env.example .env
# Edit .env → set MongoDB URI, JWT secret, SMTP, Google OAuth credentials

# 3. Configure frontend environment
cd ../trello-web/trello-web
cp .env.example .env.local
# Edit .env.local → set VITE_API_ROOT, VITE_GOOGLE_CLIENT_ID

# 4. Start all services
cd ../../
docker-compose up -d --build
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:8080` |
| Backend API | `http://localhost:8017` |

```bash
# Stop all services
docker-compose down
```

### Option 2: Run Locally (Without Docker)

**Backend:**
```bash
cd API_Trello
npm install
cp .env.example .env   # Edit values (MongoDB URI, JWT, SMTP, Google OAuth)
npm run dev            # Starts at http://localhost:8017
```

**Frontend:**
```bash
cd trello-web/trello-web
npm install
cp .env.example .env.local
# Set VITE_API_ROOT=http://localhost:8017 in .env.local
npm run dev            # Starts at http://localhost:5173
```

---

## 👨‍💻 Author

**Nguyen Manh Ninh**
