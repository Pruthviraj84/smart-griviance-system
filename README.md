# Smart Hostel Grievance System

## Overview

The **Smart Hostel Grievance System** is a full-stack application built to simplify hostel complaint management. It supports distinct roles for students, workers, admins, and super administrators, enabling efficient complaint submission, assignment, resolution, and monitoring.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, React Router |
| Styling | Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB |
| File Uploads | Multer / Local filesystem |
| Scheduling | node-cron |

---

## Core Functionality

### Student Portal
- Register and login as a student
- Submit complaints with title, description, category, priority, room/location, and contact details
- Upload up to 5 images per complaint
- View complaint history and current status updates
- Auto category detection based on complaint text
- Real-time status tracking

### Worker Portal
- Login as a worker
- View complaints assigned to the worker
- Upload proof images and work remarks
- Mark complaints as completed
- Track assigned workload

### Admin Portal
- Login as an admin
- View all registered complaints
- Filter and search by status, category, priority, and complaint text
- Assign complaints to workers
- Update complaint status and verify resolutions
- Remove only solved complaints from active dashboard

### SuperAdmin Portal
- Login as super administrator
- Monitor system-wide complaints and admin performance
- View delayed complaints older than configured days
- View escalated complaints flagged by the backend
- Control priority and resolve overdue cases

---

## Complaint & Monitoring Workflow

### Status Flow
- `Pending`
- `Assigned`
- `In Progress`
- `Awaiting Verification`
- `Solved`
- `Resolved`

### Categories
- Water
- Electricity
- Tiles
- Furniture
- Security
- Internet
- Cleaning
- Food
- Others

### Priority System
- **High** — urgent issues like water leaks, electricity faults, security breaches
- **Medium** — moderate issues like internet, cleaning, food service
- **Low** — minor issues like furniture or tiling repairs

### Delay Monitoring
- Complaints not processed within the configured delay window are marked as **Delayed**
- The delay threshold is set in `server.js` at the line:
  - `fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);`
- Delayed complaints are surfaced in the SuperAdmin dashboard
- A cron job runs daily at midnight to detect and escalate overdue complaints

---

## SuperAdmin Alerting
- Delayed complaints are highlighted in red on the SuperAdmin dashboard
- Escalated complaints are flagged with `escalated: true`
- SuperAdmin can view delayed issues and force resolve if needed

---

## API Summary

### Authentication & User APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/students/register` | Register student |
| POST | `/api/students/login` | Student login |
| POST | `/api/worker/login` | Worker login |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/superadmin/login` | SuperAdmin login |

### Complaint APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints` | Get complaints for current user/role |
| POST | `/api/complaints` | Create new complaint |
| PATCH | `/api/complaints/:id/status` | Update complaint status |
| PATCH | `/api/complaints/:id/assign` | Assign complaint to worker |
| PATCH | `/api/complaints/:id/priority` | Change complaint priority (SuperAdmin only) |
| DELETE | `/api/complaints/:id` | Remove solved complaint |

### Worker APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/workers` | Get all workers |
| POST | `/api/admin/workers` | Add a worker |
| DELETE | `/api/admin/workers/:id` | Remove a worker |
| GET | `/api/admin/workers/:id/complaints` | Get a worker's assigned complaints |

### SuperAdmin APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/superadmin/delayed` | Get delayed complaints |
| GET | `/api/superadmin/escalated` | Get escalated complaints |
| PATCH | `/api/superadmin/complaints/:id/override` | Override complaint state |

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | Register new account | — |
| Worker | `vikram@hostel.com` | `Worker@123` |
| Worker | `rajesh@hostel.com` | `Worker@123` |
| Admin | `admin@hostel.com` | `Admin@123` |
| SuperAdmin | `superadmin@hostel.com` | `SuperAdmin@123` |

---

## Installation & Run

```bash
npm install
npm run dev
npm run server
```

---

## Project Structure

```
system/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── index.css
│   ├── components/
│   └── utils/
├── server/
│   ├── routes/
│   ├── config/
│   ├── middleware/
│   └── utils/
├── uploads/
├── server.js
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Notes
- Image uploads are stored in `uploads/` and served via Express static middleware.
- Delay threshold can be changed in `server.js`.
- SuperAdmin has system-wide visibility for delayed and escalated complaints.

---

## Version History

- **v1.0.0** — Student, Worker, Admin portals with complaint lifecycle
- **v1.1.0** — Added SuperAdmin, image upload, and delayed complaint tracking

## System Architecture

### 1. Frontend

| Aspect | Technology |
|--------|------------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| Icons | Lucide React |
| Entry Point | `src/main.jsx` |
| Main Component | `src/App.jsx` |
| Global Styles | `src/index.css` |

### 2. Backend

| Aspect | Technology |
|--------|------------|
| Framework | Express.js |
| Database | MongoDB |
| Middleware | CORS, dotenv |
| Server Entry | `server.js` |
| Port | 4000 (default) |

### 3. API Endpoints

#### Student Routes
- `POST /api/students/register` — Register a new student
- `POST /api/students/login` — Student login

#### Admin Routes
- `POST /api/admin/login` — Admin login

#### SuperAdmin Routes
- `POST /api/superadmin/login` — SuperAdmin login
- `GET /api/superadmin/complaints` — Get all complaints with filters
- `GET /api/superadmin/delayed` — Get complaints pending > 4 days

#### Complaint Routes
- `GET /api/complaints` — Get all complaints (admin) or user's complaints (student)
- `POST /api/complaints` — Create a new complaint (multipart/form-data for images)
- `PATCH /api/complaints/:id/status` — Update complaint status
- `PATCH /api/complaints/:id/assign` — Assign worker to complaint
- `PATCH /api/complaints/:id/priority` — Update complaint priority (SuperAdmin)
- `DELETE /api/complaints/:id` — Delete a complaint

#### File Upload
- `GET /uploads/:filename` — Serve uploaded images

### 4. Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build and plugin configuration |
| `tailwind.config.js` | Tailwind CSS theme and paths |
| `postcss.config.js` | PostCSS plugins (Tailwind, Autoprefixer) |
| `.env.example` | Example environment variables template |
| `.env` | Actual environment variables (not committed) |

---

## Folder Structure

```
system/
├── index.html              # Main HTML entry point
├── package.json            # Project dependencies and npm scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── server.js               # Express backend server (API)
├── uploads/                # Uploaded complaint images (auto-created)
├── src/
│   ├── App.jsx             # Main React component (routes, UI logic)
│   ├── main.jsx            # React DOM rendering with BrowserRouter
│   └── index.css           # Global Tailwind CSS styles
├── .env.example            # Example environment variables
├── .env                    # Environment variables (create from example)
├── README.md               # Project documentation
└── dist/                   # Production build output (generated)
```

---

## Database Schema (Updated)

### Students Collection
```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "password": "string",
  "name": "string",
  "role": "Student | Admin | SuperAdmin",
  "createdAt": "Date"
}
```

### Complaints Collection (Updated)
```json
{
  "_id": "ObjectId",
  "studentName": "string",
  "email": "string",
  "title": "string",
  "description": "string",
  "category": "Water | Electricity | Tiles | Furniture",
  "priority": "High | Medium | Low",
  "status": "Pending | In Progress | Awaiting Confirmation | Completed",
  "assignedTo": "string",
  "location": "string",
  "contact": "string",
  "images": ["string"],           // NEW: Array of image paths
  "escalated": "boolean",         // NEW: Escalation flag
  "lastUpdatedAt": "Date",        // NEW: For auto-escalation
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | v18+ | LTS recommended |
| npm | v9+ | Comes with Node.js |
| MongoDB | v6+ | Local instance required |

---

## New Dependencies

The following packages were added in v1.1.0:

| Package | Purpose |
|---------|---------|
| `multer` | File upload handling for images |
| `node-cron` | Scheduled tasks for auto-escalation |

---

## How to Run the Project (Updated)

### Step 1: Navigate to Project Directory

```powershell
cd C:\Users\PRUTHVIRAJ\Desktop\system\system
```

### Step 2: Install Dependencies

```powershell
npm install
```

### Step 3: Configure Environment Variables

1. Copy the example env file:
```powershell
copy .env.example .env
```

2. Default `.env` contents (works for local development):
```env
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=smart-hostel
CLIENT_ORIGIN=http://localhost:5173
VITE_API_BASE=http://localhost:4000
PORT=4000
```

### Step 4: Start MongoDB

Ensure MongoDB is running locally on the default port:

```powershell
mongod
```

> If MongoDB is not installed, download from [mongodb.com](https://www.mongodb.com/try/download/community)

### Step 5: Start the Backend Server

```powershell
npm run server
```

The backend will start on `http://localhost:4000`

### Step 6: Start the Frontend Development Server

Open a **new terminal** and run:

```powershell
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 7: Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |

---

## Default Credentials (Updated)

### SuperAdmin Account (NEW)
| Field | Value |
|-------|-------|
| Email | `superadmin@hostel.com` |
| Password | `SuperAdmin@123` |

### Admin Account
| Field | Value |
|-------|-------|
| Email | `admin@hostel.com` |
| Password | `Admin@123` |

### Student Accounts
Students can register themselves through the registration form on the frontend.

---

## Available NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start frontend development server |
| `build` | `vite build` | Build for production |
| `preview` | `vite preview` | Preview production build |
| `server` | `node server.js` | Start Express backend server |

---

## Database Schema

### Students Collection
```json
{
  "_id": "ObjectId",
  "email": "string (unique)",
  "password": "string (hashed)",
  "name": "string",
  "role": "Student",
  "createdAt": "Date"
}
```

### Complaints Collection
```json
{
  "_id": "ObjectId",
  "studentName": "string",
  "email": "string",
  "title": "string",
  "description": "string",
  "category": "Water | Electricity | Tiles | Furniture",
  "priority": "High | Medium | Low",
  "status": "Pending | In Progress | Awaiting Confirmation | Completed",
  "assignedTo": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## Color Scheme (Tailwind CSS)

The application uses a dark theme with the following color mappings:

| Category | Background | Text |
|----------|------------|------|
| Water | `bg-cyan-500/10` | `text-cyan-200` |
| Electricity | `bg-amber-500/10` | `text-amber-200` |
| Tiles | `bg-violet-500/10` | `text-violet-200` |
| Furniture | `bg-emerald-500/10` | `text-emerald-200` |

| Priority | Background | Text |
|----------|------------|------|
| High | `bg-red-500/10` | `text-red-300` |
| Medium | `bg-orange-500/10` | `text-orange-300` |
| Low | `bg-emerald-500/10` | `text-emerald-300` |

| Status | Background | Text |
|--------|------------|------|
| Pending | `bg-amber-500/10` | `text-amber-300` |
| In Progress | `bg-sky-500/10` | `text-sky-300` |
| Awaiting Confirmation | `bg-violet-500/10` | `text-violet-300` |
| Completed | `bg-emerald-500/10` | `text-emerald-300` |

---

## About the Project

This project was created to modernize and digitize the hostel complaint process. It bridges the gap between students and administrators, providing:

- **Transparency** — Students can track their complaints at every stage
- **Accountability** — Admins can assign and verify resolutions
- **Efficiency** — Categorized and prioritized complaints are handled systematically
- **Accessibility** — Web-based interface works on any device

The system is modular, scalable, and easy to deploy in any hostel or institutional environment.

---

## License

This project is for educational purposes.

---

## Author

Created by **Pruthviraj84**  
GitHub: [https://github.com/Pruthviraj84/system](https://github.com/Pruthviraj84/system)