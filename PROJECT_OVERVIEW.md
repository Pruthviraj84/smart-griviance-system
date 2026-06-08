# Smart Hostel Grievance System Overview

## Project Summary
The Smart Hostel Grievance System is a full-stack web application for students, workers, admins, and super admins to manage hostel complaints. It provides an end-to-end workflow for raising complaints, assigning tasks, tracking progress, and resolving issues.

## Key Features
- Student complaint creation and tracking
- Admin complaint review and worker assignment
- Worker task management and status updates
- Real-time notifications using sockets
- Complaint analytics and reporting
- File upload support for complaint evidence
- Cloudinary integration for image storage

## Complaint Raise Flow
1. A student opens the complaint section.
2. The student fills in complaint details including title, description, category, priority, and location.
3. Optional contact information can be provided.
4. The student may attach photos or evidence to the complaint.
5. The complaint is submitted to the backend with form data.
6. The system stores complaint metadata in MongoDB.
7. The complaint appears in the student dashboard and can be reviewed by admins.

## File Upload and Cloudinary Integration
- The application supports uploading images with complaint submissions.
- Uploaded files are handled on the backend using multipart/form-data.
- Images are uploaded to Cloudinary instead of local storage.
- Cloudinary stores the images securely and returns public URLs.
- These URLs are saved in the complaint document and used by the frontend to display evidence.

### Benefits of Cloudinary
- Removes local image storage dependency
- Stores images reliably in the cloud
- Delivers optimized image URLs for fast rendering
- Simplifies file management and scaling

## Project Structure
- `server/` — Express backend, routes, middleware, controllers, Cloudinary integration
- `server/config/` — configuration files such as database and Cloudinary settings
- `server/routes/` — API route definitions for auth, complaints, users, notifications, and chat
- `server/middleware/` — request validation, upload handling, error handling
- `server/utils/` — helper utilities for auth, file handling, complaint logic, sockets
- `src/` — React frontend source code
- `src/components/` — reusable UI components and student/admin views
- `src/pages/` — page-level screens for student, admin, worker, superadmin
- `src/utils/` — frontend helpers, API wrappers, authentication utilities
- `uploads/` — local upload folder (not required when Cloudinary is used)

## Running the Project
- Install dependencies: `npm install`
- Run the backend server: `npm run server`
- Run the frontend: `npm run dev`
- Build for production: `npm run build`

## Notes
- This file is an additional overview and does not replace the existing documentation files located in the repository.
- Keep the other `.md` documentation files intact; they contain detailed guides, APIs, deployment notes, and testing instructions.
