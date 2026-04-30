# 📋 Boardify – Trello-like Task Management

> Full-stack Kanban board application inspired by Trello.
> Built with **MERN stack** (MongoDB, Express, React, Node.js) and packaged via **Docker**.

![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Bundler-Vite-B73C9D?logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/UI-MUI-0081CB?logo=mui&logoColor=white)
![Redux](https://img.shields.io/badge/State-Redux%20Toolkit-593D88?logo=redux&logoColor=white)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/DB-MongoDB-47A248?logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/DevOps-Docker-0db7ed?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📖 Overview

Boardify is a Trello-style productivity app that helps you:

- Organize work into **boards**, **lists (columns)** and **cards**
- Collaborate with teammates via **members, labels, checklists, due dates**
- Track progress visually using **drag & drop** on a Kanban board
- Log in with **email/password** or **Google OAuth**
- Recover access via **forgot password** email flow

This repository is a **monorepo** containing both backend and frontend.

---

## 🏗️ Architecture

```text
[ React + Vite (MUI, Redux) ]  <--->  [ Express API ]  <--->  [ MongoDB ]
              ^                                ^
              |                                |
        Google OAuth                     Nodemailer
           (client)                    (reset password,
                                        invitations)
```

- Frontend calls the REST API via **Axios**
- Backend handles auth, boards, columns, cards, invitations, etc.
- MongoDB stores users, boards, columns, cards, activities…
- **Docker Compose** starts MongoDB + API + Web in one command

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Material UI (MUI), Redux Toolkit, React Router v6, @dnd-kit (drag & drop), Framer Motion, Axios |
| **Backend** | Node.js, Express, MongoDB (native driver), JWT (access + refresh), Babel, Joi validation |
| **Auth** | Email/Password, Google OAuth 2.0, Forgot/Reset Password via Nodemailer |
| **DevOps** | Docker & Docker Compose, Nginx (production), ESLint |

---

## ✨ Features

### 🔐 Authentication & Security
- Register / Login with email & password
- Login with Google (OAuth 2.0)
- Protected routes with JWT (access + refresh tokens)
- Forgot password via email link
- Reset password screen (new password + confirm)
- Basic profile & security settings

### 📌 Boards & Collaboration
- Create / update / delete boards
- Board templates (Sprint board, Study plan, Marketing campaign, etc.)
- Invite members to boards via email
- Role-based access: board members vs. non-members

### 🗂️ Kanban Board
- Columns (To do / Doing / Done…) with custom titles
- Cards inside columns
- **Drag & drop:**
  - Reorder columns
  - Move cards inside the same column
  - Move cards between columns

### 🃏 Card Details
- Description (rich text-like UX)
- Labels (colored tags)
- Members (assign people to card)
- Checklists with progress
- Due date & completion status
- Attachments & card cover
- Comment / activity history

### 🎨 User Experience
- Empty state onboarding (when user has no boards)
- Keyboard shortcuts modal
- Light / Dark mode switch
- Notifications dropdown
- Profile overview with stats and recent activity

---
## 📁 Project Structure

```
Boardify/
├── API_Trello/                # Backend (Express + MongoDB)
│   ├── src/
│   │   ├── config/            # environment, CORS, MongoDB
│   │   ├── controllers/       # auth, board, column, card, user, invitation
│   │   ├── middlewares/       # auth, validation, error handlers
│   │   ├── models/            # MongoDB schemas
│   │   ├── services/          # business logic
│   │   ├── routes/v1/         # REST endpoints (/v1/auth, /v1/boards, ...)
│   │   ├── utils/             # constants, helpers
│   │   └── server.js
│   ├── .env.example
│   └── Dockerfile
│
├── trello-web/trello-web/     # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── apis/              # Axios instance & API helpers
│   │   ├── components/        # AppBar, Board, Modals, Profile, ...
│   │   ├── pages/             # Auth, Boards, Profile, AcceptInvite, ...
│   │   ├── redux/             # Redux slices & store
│   │   ├── services/          # boardsService, profileService, ...
│   │   ├── utilities/         # boardTemplates, constants, formatters, ...
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   └── .env.example
│
├── docker-compose.yml         # Run Mongo + API + Web together
└── README.md
```

---

## 🚀 Getting Started

### Run with Docker (recommended)

**Requirements:** Docker & Docker Compose

```bash
# 1. Clone the repository
git clone https://github.com/NguyenManhNinh/Boardify.git
cd Boardify

# 2. Create environment files
# Backend
cd API_Trello
cp .env.example .env
# → Edit .env with your MongoDB URI, JWT secret, SMTP, Google keys...

# Frontend
cd ../trello-web/trello-web
cp .env.example .env.local
# → Edit VITE_API_ROOT, VITE_GOOGLE_CLIENT_ID, etc.

# 3. Back to project root & start all services
cd ../../
docker-compose up -d --build
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:8080` |
| API | `http://localhost:8017` |

```bash
# Stop all services
docker-compose down
```

### Run locally without Docker

**Backend (API_Trello):**
```bash
cd API_Trello
npm install
cp .env.example .env      # then edit values
npm run dev               # API → http://localhost:8017
```

**Frontend (trello-web):**
```bash
cd trello-web/trello-web
npm install
cp .env.example .env.local
# In .env.local, set VITE_API_ROOT=http://localhost:8017
npm run dev               # Vite dev server → http://localhost:5173
```

---

## 👨‍💻 Author

**Nguyễn Mạnh Ninh**

---

