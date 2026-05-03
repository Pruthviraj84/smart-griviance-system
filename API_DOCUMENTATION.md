# Smart Hostel API Documentation

## Base URL
```
http://localhost:4000
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### 1. Student Registration
**POST** `/api/students/register`

Register a new student account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@hostel.com",
  "phone": "9876543210",
  "roomNo": "101",
  "hostelBlock": "A",
  "password": "SecurePass123"
}
```

**Response (201 Created):**
```json
{
  "message": "Registered successfully.",
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@hostel.com",
    "name": "John Doe",
    "role": "Student"
  }
}
```

**Errors:**
- 400: Email and password are required
- 400: Password must be at least 6 characters
- 409: Student already registered

---

### 2. Student Login
**POST** `/api/students/login`

Login as a student.

**Request Body:**
```json
{
  "email": "john@hostel.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@hostel.com",
    "name": "John Doe",
    "role": "Student"
  }
}
```

**Errors:**
- 400: Email and password are required
- 401: Invalid email or password

---

### 3. Worker Login
**POST** `/api/worker/login`

Login as a worker.

**Request Body:**
```json
{
  "email": "vikram@hostel.com",
  "password": "Worker@123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "vikram@hostel.com",
    "name": "Vikram",
    "role": "Worker"
  }
}
```

---

### 4. Admin Login
**POST** `/api/admin/login`

Login as admin.

**Request Body:**
```json
{
  "email": "admin@hostel.com",
  "password": "Admin@123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "admin-id",
    "email": "admin@hostel.com",
    "name": "Hostel Admin",
    "role": "Admin"
  }
}
```

---

### 5. Super Admin Login
**POST** `/api/superadmin/login`

Login as super admin.

**Request Body:**
```json
{
  "email": "superadmin@hostel.com",
  "password": "SuperAdmin@123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "superadmin-id",
    "email": "superadmin@hostel.com",
    "name": "Super Admin",
    "role": "SuperAdmin"
  }
}
```

---

## 📋 Complaint Endpoints

### 1. Get Complaints
**GET** `/api/complaints?role=Student&email=john@hostel.com`

Get complaints (filtered by user role).

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "John Doe",
    "email": "john@hostel.com",
    "title": "Leaking bathroom pipe",
    "description": "Bathroom pipe is leaking",
    "category": "Water",
    "priority": "High",
    "status": "Pending",
    "location": "Room 101",
    "images": ["/uploads/complaint-1234.jpg"],
    "createdAt": "2026-05-03T10:30:00Z",
    "assignedTo": "Not assigned"
  }
]
```

---

### 2. Create Complaint (with Image Upload)
**POST** `/api/complaints`

Submit a new complaint with image attachments.

**Request:**
- Form data with multipart/form-data
- Fields: `studentName`, `email`, `title`, `description`, `category`, `priority`, `location`, `contact`
- Files: `images` (up to 5 files)

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "studentName": "John Doe",
  "email": "john@hostel.com",
  "title": "Broken corridor light",
  "description": "Second floor corridor light not working",
  "category": "Electricity",
  "priority": "High",
  "status": "Pending",
  "location": "Corridor 2",
  "images": ["/uploads/complaint-5678.jpg"],
  "createdAt": "2026-05-03T10:35:00Z"
}
```

---

### 3. Update Complaint Status
**PATCH** `/api/complaints/:id/status`

Update complaint status.

**Request Body:**
```json
{
  "status": "Verified",
  "actor": "Admin Name"
}
```

**Valid Statuses:** Pending, Assigned, In Progress, Completed, Verified, Resolved, Solved

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "Verified",
  "lastUpdatedAt": "2026-05-03T11:00:00Z"
}
```

---

### 4. Assign Worker to Complaint
**PATCH** `/api/complaints/:id/assign`

Assign a worker to handle the complaint.

**Request Body:**
```json
{
  "assignedTo": "Vikram",
  "workerId": "507f1f77bcf86cd799439010"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "Assigned",
  "assignedTo": "Vikram",
  "assigned_at": "2026-05-03T11:05:00Z"
}
```

---

### 5. Update Complaint Priority
**PATCH** `/api/complaints/:id/priority`

Change complaint priority (Super Admin only).

**Request Body:**
```json
{
  "priority": "Urgent"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "priority": "Urgent"
}
```

---

### 6. Delete/Archive Complaint
**DELETE** `/api/complaints/:id`

Archive a solved complaint.

**Request Body:**
```json
{
  "actor": "Admin Name",
  "role": "Admin"
}
```

**Response (200 OK):**
```json
{
  "message": "Complaint archived and removed successfully.",
  "deletedCount": 1
}
```

**Errors:**
- 400: Only solved complaints can be removed
- 403: Only Admin or Super Admin can remove complaints

---

## 🛠 Worker Endpoints

### 1. Get All Workers
**GET** `/api/admin/workers`

Retrieve list of all workers with their workload.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439010",
    "id": "507f1f77bcf86cd799439010",
    "name": "Vikram",
    "email": "vikram@hostel.com",
    "phone": "9876543201",
    "role": "worker",
    "totalAssignedComplaints": 5,
    "pendingComplaints": 2,
    "completedComplaints": 3
  }
]
```

---

### 2. Create Worker
**POST** `/api/admin/workers`

Add a new worker (Admin/Super Admin only).

**Request Body:**
```json
{
  "name": "New Worker",
  "email": "newworker@hostel.com",
  "phone": "9876543205",
  "password": "WorkerPass123",
  "role": "Admin"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "name": "New Worker",
  "email": "newworker@hostel.com",
  "phone": "9876543205",
  "totalAssignedComplaints": 0,
  "pendingComplaints": 0,
  "completedComplaints": 0
}
```

**Errors:**
- 400: All fields required
- 400: Password must be at least 6 characters
- 403: Only Admin or Super Admin can add workers
- 409: Worker email already exists

---

### 3. Delete Worker
**DELETE** `/api/admin/workers/:id`

Remove a worker (Admin/Super Admin only).

**Request Body:**
```json
{
  "role": "Admin"
}
```

**Response (200 OK):**
```json
{
  "message": "Worker deleted. Assigned complaints were unassigned.",
  "deletedCount": 1
}
```

---

### 4. Get Worker's Complaints
**GET** `/api/admin/workers/:id/complaints`

Get all complaints assigned to a specific worker.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "studentName": "John Doe",
    "title": "Broken light",
    "status": "In Progress",
    "assignedTo": "Vikram"
  }
]
```

---

## ✅ Worker Task Endpoints

### 1. Submit Work Proof
**PATCH** `/api/workers/complaints/:id/complete`

Worker submits proof of completed work.

**Request:**
- Form data with multipart/form-data
- Files: `proofImages` (up to 5 files)
- Field: `remarks` (optional)

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "Completed",
  "workerProofImages": ["/uploads/proof-1234.jpg"],
  "workerRemarks": "Work completed successfully",
  "completed_at": "2026-05-03T15:00:00Z"
}
```

---

## 👨‍💼 Admin Verification Endpoints

### 1. Verify/Resolve Complaint
**PATCH** `/api/admin/complaints/:id/verify`

Admin verifies or resolves worker's submission.

**Request Body:**
```json
{
  "action": "verify"
}
```

**Valid Actions:**
- `verify` - Verify worker's proof
- `resolve` - Mark as resolved
- `reject` - Reject and send back to in progress

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "Verified",
  "verifiedAt": "2026-05-03T16:00:00Z"
}
```

---

## 👑 Super Admin Endpoints

### 1. Get Delayed Complaints
**GET** `/api/superadmin/delayed`

Get all complaints pending for more than 4 days.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Leaking pipe",
    "studentName": "John Doe",
    "status": "Pending",
    "delayed": true,
    "createdAt": "2026-04-28T10:00:00Z"
  }
]
```

---

### 2. Get Escalated Complaints
**GET** `/api/superadmin/escalated`

Get all escalated complaints.

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Critical issue",
    "priority": "Urgent",
    "escalated": true,
    "escalatedAt": "2026-05-02T00:00:00Z"
  }
]
```

---

### 3. Override Complaint Action
**PATCH** `/api/superadmin/complaints/:id/override`

Super Admin force action on complaint.

**Request Body:**
```json
{
  "action": "resolve",
  "priority": "High"
}
```

**Valid Actions:**
- `complete` - Force complete
- `resolve` - Force resolve
- `reopen` - Reopen complaint
- `changePriority` - Change priority (requires `priority` field)

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "status": "Resolved",
  "resolvedBy": "SuperAdmin"
}
```

---

## 📊 Super Admin Analytics

### 1. Get Complaints with Filters
**GET** `/api/superadmin/complaints?status=Pending&escalated=true&daysOld=4&category=Water`

Get filtered complaints for analytics.

**Query Parameters:**
- `status` - Complaint status
- `escalated` - Filter escalated (true/false)
- `daysOld` - Complaints older than X days
- `category` - Complaint category

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Leaking pipe",
    "status": "Pending",
    "category": "Water",
    "escalated": true
  }
]
```

---

## Error Response Format

All errors follow this format:

```json
{
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Server Error

---

## Rate Limiting

Currently no rate limiting. Implement in production for security.

---

## CORS

CORS is enabled for:
- `http://localhost:5173`
- `http://127.0.0.1:5173`
- Configurable via `CLIENT_ORIGIN` env variable

---

## File Upload Limits

- Maximum file size: 5 MB
- Maximum files per request: 5
- Supported formats: JPG, PNG
- Upload directory: `/uploads`

---

## Token Expiry

- Default expiry: 7 days
- Configurable via `JWT_EXPIRY` env variable

---

## Testing with cURL

### Register Student
```bash
curl -X POST http://localhost:4000/api/students/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@hostel.com",
    "phone": "9876543210",
    "password": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@hostel.com",
    "password": "SecurePass123"
  }'
```

### Get Complaints (with token)
```bash
curl -X GET http://localhost:4000/api/complaints \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Last Updated**: May 3, 2026
**API Version**: 2.0
