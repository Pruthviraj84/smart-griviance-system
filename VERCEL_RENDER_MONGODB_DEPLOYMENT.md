# Deployment Guide: Vercel + Render + MongoDB Atlas

This project has three deployment parts:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

Project root path:

```txt
system/
```

Important files:

```txt
system/.env
system/.env.example
system/package.json
system/render.yaml
system/server.js
system/vite.config.js
system/src/utils/api.js
```

## 1. MongoDB Atlas Setup

Create a MongoDB Atlas database first.

### MongoDB Atlas Steps

1. Go to MongoDB Atlas.
2. Create a new project.
3. Create a free cluster.
4. Create a database user.
5. Allow network access.
6. Copy your connection string.

Use this database name:

```txt
smart-hostel
```

Your MongoDB connection string should look like this:

```txt
mongodb+srv://USERNAME:PASSWORD@CLUSTER_URL/?retryWrites=true&w=majority&appName=APP_NAME
```

Replace:

```txt
USERNAME = your MongoDB database username
PASSWORD = your MongoDB database password
CLUSTER_URL = your MongoDB cluster URL
APP_NAME = your MongoDB app name
```

Final MongoDB URL placeholder:

```txt
MONGODB_URI=PASTE_YOUR_MONGODB_ATLAS_URL_HERE
```

Example:

```txt
MONGODB_URI=mongodb+srv://hosteldb:yourPassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

Important: Do not commit your real MongoDB password to GitHub.

## 2. Backend Deployment On Render

Render will deploy the backend API from `server.js`.

### Render Service Settings

Create a new Web Service on Render.

Use these settings:

```txt
Root Directory: leave empty if repo root is this project, otherwise use system
Environment: Node
Build Command: npm ci && npm run build
Start Command: npm start
```

The project already has this file:

```txt
system/render.yaml
```

Current Render config:

```yaml
services:
  - type: web
    name: smart-hostel-grievance-system
    env: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm start
```

### Render Environment Variables

Add these environment variables in Render:

```txt
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
PORT=4000
DB_NAME=smart-hostel
MONGODB_URI=PASTE_YOUR_MONGODB_ATLAS_URL_HERE
JWT_SECRET=PASTE_A_STRONG_SECRET_HERE
JWT_EXPIRY=7d
CLIENT_ORIGIN=PASTE_YOUR_VERCEL_FRONTEND_URL_HERE
```

Before Vercel is deployed, you can temporarily use:

```txt
CLIENT_ORIGIN=http://localhost:5173
```

After Vercel deployment, update it to:

```txt
CLIENT_ORIGIN=https://YOUR-VERCEL-PROJECT.vercel.app
```

### Render Backend URL

After deployment, Render will give you a backend URL.

Paste it here:

```txt
RENDER_BACKEND_URL=https://PASTE_YOUR_RENDER_BACKEND_URL_HERE
```

Example:

```txt
RENDER_BACKEND_URL=https://smart-hostel-grievance-system.onrender.com
```

Test backend:

```txt
https://YOUR-RENDER-BACKEND-URL.onrender.com
```

Expected result:

The frontend HTML page or backend response should load without a server crash.

## 3. Frontend Deployment On Vercel

Vercel will deploy the React frontend.

### Vercel Project Settings

Use these settings:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

If your GitHub repository contains this project inside a nested `system/` folder, set:

```txt
Root Directory: system
```

If your GitHub repository root is already this project folder, leave Root Directory empty.

### Vercel Environment Variables

Add this environment variable in Vercel:

```txt
VITE_API_BASE=PASTE_YOUR_RENDER_BACKEND_URL_HERE
```

Example:

```txt
VITE_API_BASE=https://smart-hostel-grievance-system.onrender.com
```

Important: `VITE_API_BASE` must not end with `/api`.

Correct:

```txt
VITE_API_BASE=https://smart-hostel-grievance-system.onrender.com
```

Wrong:

```txt
VITE_API_BASE=https://smart-hostel-grievance-system.onrender.com/api
```

### Vercel Frontend URL

After deployment, Vercel will give you a frontend URL.

Paste it here:

```txt
VERCEL_FRONTEND_URL=https://PASTE_YOUR_VERCEL_FRONTEND_URL_HERE
```

Example:

```txt
VERCEL_FRONTEND_URL=https://smart-grievance-system.vercel.app
```

After getting this URL, go back to Render and update:

```txt
CLIENT_ORIGIN=https://YOUR-VERCEL-PROJECT.vercel.app
```

Then redeploy or restart the Render service.

## 4. Local `.env` Example

Use this only for local development:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=smart-hostel
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
VITE_API_BASE=http://localhost:4000
JWT_SECRET=change-this-secret-in-production
JWT_EXPIRY=7d
```

For production, do not depend on the local `.env` file. Add production values directly in Render and Vercel dashboards.

## 5. Production Environment Summary

### MongoDB Atlas

```txt
Database Name: smart-hostel
Connection String: PASTE_YOUR_MONGODB_ATLAS_URL_HERE
```

### Render Backend

```txt
Backend URL: PASTE_YOUR_RENDER_BACKEND_URL_HERE
Environment Variable:
MONGODB_URI=PASTE_YOUR_MONGODB_ATLAS_URL_HERE
CLIENT_ORIGIN=PASTE_YOUR_VERCEL_FRONTEND_URL_HERE
JWT_SECRET=PASTE_A_STRONG_SECRET_HERE
JWT_EXPIRY=7d
DB_NAME=smart-hostel
NODE_ENV=production
NPM_CONFIG_PRODUCTION=false
```

### Vercel Frontend

```txt
Frontend URL: PASTE_YOUR_VERCEL_FRONTEND_URL_HERE
Environment Variable:
VITE_API_BASE=PASTE_YOUR_RENDER_BACKEND_URL_HERE
```

## 6. Required URL Flow

Use this order:

```txt
MongoDB Atlas URL
        ↓
Paste into Render as MONGODB_URI
        ↓
Deploy Render backend
        ↓
Copy Render backend URL
        ↓
Paste into Vercel as VITE_API_BASE
        ↓
Deploy Vercel frontend
        ↓
Copy Vercel frontend URL
        ↓
Paste into Render as CLIENT_ORIGIN
        ↓
Restart Render backend
```

## 7. Login Accounts

Default admin:

```txt
Email: admin@hostel.com
Password: Admin@123
```

Default super admin:

```txt
Email: superadmin@hostel.com
Password: SuperAdmin@123
```

Default worker examples:

```txt
Email: vikram@hostel.com
Password: Worker@123
```

```txt
Email: rajesh@hostel.com
Password: Worker@123
```

Students can register from the frontend.

## 8. Common Deployment Problems

### Problem: Frontend loads but login/register fails

Check Vercel:

```txt
VITE_API_BASE=https://YOUR-RENDER-BACKEND.onrender.com
```

Check Render:

```txt
CLIENT_ORIGIN=https://YOUR-VERCEL-FRONTEND.vercel.app
```

Then redeploy Vercel and restart Render.

### Problem: Render cannot connect to MongoDB

Check MongoDB Atlas:

```txt
Database user exists
Password is correct
Network access allows Render
MONGODB_URI is pasted correctly
```

For testing, MongoDB Atlas Network Access can allow:

```txt
0.0.0.0/0
```

### Problem: Build fails on Render or Vercel

Check Node version.

This project expects:

```txt
Node: 20.x
npm: >=10
```

The project has:

```txt
system/.node-version
```

Expected content:

```txt
20
```

### Problem: CORS error in browser

Update Render environment variable:

```txt
CLIENT_ORIGIN=https://YOUR-VERCEL-FRONTEND.vercel.app
```

Then restart Render.

## 9. Final Checklist

Before final submission, confirm:

```txt
[ ] MongoDB Atlas cluster is active
[ ] MongoDB Atlas database user is created
[ ] MongoDB Atlas network access is configured
[ ] Render backend is deployed successfully
[ ] Render has MONGODB_URI
[ ] Render has CLIENT_ORIGIN with Vercel URL
[ ] Render has JWT_SECRET
[ ] Vercel frontend is deployed successfully
[ ] Vercel has VITE_API_BASE with Render URL
[ ] Login works
[ ] Student registration works
[ ] Complaint creation works
[ ] Admin dashboard works
[ ] Worker login works
[ ] SuperAdmin login works
```

## 10. Paste Your Final URLs Here

MongoDB Atlas:

```txt
MONGODB_URI=
```

Render:

```txt
RENDER_BACKEND_URL=
```

Vercel:

```txt
VERCEL_FRONTEND_URL=
```

Final production values:

```txt
Render CLIENT_ORIGIN=
Vercel VITE_API_BASE=
```
