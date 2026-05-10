# Smart Worker Assignment System - API Reference

## 🔌 Complete API Endpoint Reference

### Base URL
```
http://localhost:4004/api
```

### Authentication
All endpoints require JWT token in header:
```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## 📋 COMPLAINT ENDPOINTS

### 1. Auto-Assign Complaint (Smart Assignment)

**Endpoint:**
```
POST /complaints/:id/auto-assign
```

**Purpose:** Find best worker based on skills and workload, auto-assign

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```javascript
POST /api/complaints/507f1f77bcf86cd799439011/auto-assign
```

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Water leaking from ceiling",
  "description": "Water coming from ceiling in room 204",
  "status": "Assigned",
  "category": "Water",
  "priority": "High",
  "assignedTo": "Raj Kumar",
  "assigned_worker_id": "507f1f77bcf86cd799439012",
  "assignedAt": "2024-05-07T10:30:00Z",
  "assignmentInfo": {
    "workerName": "Raj Kumar",
    "activeTaskCount": 3,
    "maxWorkload": 5,
    "specializationMatch": "matched"
  }
}
```

**Error Response (400):**
```json
{
  "message": "No available worker currently. All workers are at/over max workload.",
  "status": "Pending",
  "details": {
    "worker": null,
    "reason": "No workers available within capacity. All workers are at/over max workload.",
    "availableWorkers": 5,
    "overloadedCount": 5
  }
}
```

**What Happens:**
1. Analyzes complaint category
2. Finds workers with matching specialization
3. Counts ONLY Assigned + In Progress tasks
4. Filters by worker capacity
5. If no worker available → Status stays "Pending", error returned
6. If worker found → Status changes to "Assigned", notifications sent

---

### 2. Get Delayed Complaints (4+ Days)

**Endpoint:**
```
GET /complaints/delayed/list
```

**Purpose:** Get complaints pending for more than 4 days

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```javascript
GET /api/complaints/delayed/list
```

**Success Response (200):**
```json
{
  "count": 2,
  "complaints": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Water leaking from ceiling",
      "status": "In Progress",
      "assignedTo": "Raj Kumar",
      "category": "Water",
      "priority": "High",
      "createdAt": "2024-05-02T10:30:00Z",
      "daysOpen": 5,
      "grnNumber": "GRN001"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Broken fan in room",
      "status": "Assigned",
      "assignedTo": "Priya Singh",
      "category": "Electricity",
      "priority": "Medium",
      "createdAt": "2024-05-03T10:30:00Z",
      "daysOpen": 4,
      "grnNumber": "GRN002"
    }
  ]
}
```

**Calculations:**
- Only complaints with status: "Assigned" OR "In Progress"
- Only if created more than 4 days ago (4 × 24 × 60 × 60 seconds)
- `daysOpen` = floor((now - createdAt) / 86400000)

---

### 3. Get Worker Workload Information

**Endpoint:**
```
GET /complaints/workers/workload
```

**Purpose:** Get all workers with real-time workload and performance metrics

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```javascript
GET /api/complaints/workers/workload
```

**Success Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Raj Kumar",
    "specializations": ["Electricity", "Water"],
    "activeTaskCount": 3,
    "maxWorkload": 5,
    "totalCompleted": 47,
    "rating": 4.8,
    "isActive": true,
    "workloadPercentage": 60,
    "completedToday": 2,
    "status": "Available"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Priya Singh",
    "specializations": ["Water", "Cleaning"],
    "activeTaskCount": 5,
    "maxWorkload": 5,
    "totalCompleted": 52,
    "rating": 4.9,
    "isActive": true,
    "workloadPercentage": 100,
    "completedToday": 1,
    "status": "Busy"
  }
]
```

**Field Explanations:**
- `activeTaskCount`: Current Assigned + In Progress tasks
- `maxWorkload`: Maximum allowed simultaneous tasks
- `totalCompleted`: All-time completed complaints
- `rating`: Average rating from student feedback
- `isActive`: Worker is available for assignment
- `workloadPercentage`: (activeTaskCount / maxWorkload) × 100
- `completedToday`: Tasks completed in last 24 hours
- `status`: "Available" (< max) | "Busy" (≥ max) | "Inactive" (not active)

---

### 4. Reassign Worker to Complaint

**Endpoint:**
```
PATCH /complaints/:id/reassign
```

**Purpose:** Change assigned worker, track reassignment history

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "workerId": "507f1f77bcf86cd799439012",
  "reason": "Previous worker overloaded"
}
```

**Request Example:**
```javascript
PATCH /api/complaints/507f1f77bcf86cd799439011/reassign
Content-Type: application/json
Authorization: Bearer <token>

{
  "workerId": "507f1f77bcf86cd799439014",
  "reason": "Faster resolution"
}
```

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Water leaking from ceiling",
  "status": "In Progress",
  "assignedTo": "Priya Singh",
  "assigned_worker_id": "507f1f77bcf86cd799439014",
  "lastUpdatedAt": "2024-05-07T11:00:00Z",
  "reassignmentHistory": [
    {
      "previousWorker": "Raj Kumar",
      "previousWorkerId": "507f1f77bcf86cd799439012",
      "newWorker": "Priya Singh",
      "newWorkerId": "507f1f77bcf86cd799439014",
      "reassignedBy": "Admin",
      "reason": "Faster resolution",
      "reassignedAt": "2024-05-07T11:00:00Z"
    }
  ]
}
```

**Error Responses:**

Cannot reassign Resolved complaint:
```json
{
  "message": "Resolved complaints cannot be reassigned."
}
```

Worker not found:
```json
{
  "message": "Worker not found."
}
```

---

### 5. Update Complaint Status

**Endpoint:**
```
PATCH /complaints/:id/status
PATCH /complaints/status/:id
```

**Purpose:** Change complaint status with validation (both patterns supported)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "In Progress"
}
```

**Valid Status Transitions:**
```
Pending → Assigned
Assigned → In Progress
In Progress → Completed (requires completion image)
Completed → Verified
Verified → Resolved
```

**Error - Invalid Transition:**
```json
{
  "message": "Invalid status transition from Assigned to Verified."
}
```

**Error - Missing Completion Image:**
```json
{
  "message": "Completion image is required before verification"
}
```

---

## 👷 WORKER ENDPOINTS

### 1. Get All Workers (with Workload)

**Endpoint:**
```
GET /admin/workers
```

**Purpose:** Get all workers (use `/complaints/workers/workload` for updated metrics)

---

### 2. Create Worker

**Endpoint:**
```
POST /admin/workers
```

**Purpose:** Create new worker with specializations

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Raj Kumar",
  "email": "raj@example.com",
  "phone": "9876543210",
  "password": "secure123",
  "specializations": ["Electricity", "Water"],
  "maxWorkload": 5,
  "isActive": true
}
```

**Success Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Raj Kumar",
  "specializations": ["Electricity", "Water"],
  "maxWorkload": 5,
  "isActive": true,
  "rating": 0,
  "totalCompleted": 0
}
```

---

### 3. Update Worker

**Endpoint:**
```
PATCH /admin/workers/:id
```

**Purpose:** Update worker details

**Request Body:**
```json
{
  "specializations": ["Electricity", "Water", "Security"],
  "maxWorkload": 6,
  "isActive": true
}
```

---

### 4. Toggle Worker Status

**Endpoint:**
```
PATCH /admin/workers/:id/toggle
```

**Purpose:** Toggle worker active/inactive status

---

## 🔄 SOCKET.IO REAL-TIME EVENTS

### Worker Notification: Task Assigned

**Event Name:** `notification`

**Data Sent:**
```json
{
  "type": "task_assigned",
  "message": "New complaint assigned to you: Water leaking from ceiling",
  "complaintId": "507f1f77bcf86cd799439011",
  "priority": "High",
  "category": "Water",
  "createdAt": "2024-05-07T10:30:00Z"
}
```

**When Sent:** When complaint is assigned (auto or manual)

---

### Student Notification: Complaint Assigned

**Event Name:** `notification`

**Data Sent:**
```json
{
  "type": "complaint_assigned",
  "message": "Your complaint has been assigned to Raj Kumar",
  "complaintId": "507f1f77bcf86cd799439011",
  "createdAt": "2024-05-07T10:30:00Z"
}
```

**When Sent:** When worker is assigned to student's complaint

---

### Complaint Room Update

**Event Name:** `complaint_updated`

**Data Sent:**
```json
{
  "type": "auto_assigned",
  "message": "Complaint auto-assigned to Raj Kumar (Active tasks: 3/5)",
  "complaint": { ...full complaint object }
}
```

**When Sent:** When complaint status or assignment changes

---

## 📊 DATA MODELS

### Complaint Document

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,  // Electricity, Water, Security, etc.
  priority: String,  // Urgent, High, Medium, Low
  status: String,    // Pending, Assigned, In Progress, Completed, Verified, Resolved
  
  // Student Info
  grnNumber: String,
  studentName: String,
  contact: String,
  hostel: String,
  roomNo: String,
  
  // Assignment Info
  assignedTo: String,
  assigned_worker_id: ObjectId,
  workerId: String,
  assignedAt: Date,
  autoAssigned: Boolean,
  
  // Work Details
  images: [String],  // Image URLs
  completionImage: String,
  workerRemarks: String,
  
  // Complaint Count (for duplicates)
  complaintCount: Number,
  reportedBy: [String],  // Array of GRNs
  
  // Tracking
  createdAt: Date,
  lastUpdatedAt: Date,
  verifiedAt: Date,
  resolvedAt: Date,
  
  // Reassignment History
  reassignmentHistory: [{
    previousWorker: String,
    previousWorkerId: ObjectId,
    newWorker: String,
    newWorkerId: ObjectId,
    reassignedBy: String,
    reason: String,
    reassignedAt: Date
  }]
}
```

### Worker Document

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  role: String,  // "Worker"
  
  // Skills & Capacity
  specializations: [String],  // ["Electricity", "Water"]
  maxWorkload: Number,  // 5
  
  // Status
  isActive: Boolean,
  rating: Number,
  totalCompleted: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 WORKFLOW EXAMPLES

### Example 1: Auto-Assign with Specialization Match

**Scenario:** New Electricity complaint, Electrician available with 2/5 workload

**Request:**
```
POST /api/complaints/507f1f77bcf86cd799439011/auto-assign
```

**Response:**
```json
{
  "status": "Assigned",
  "assignedTo": "Raj Kumar",
  "assignmentInfo": {
    "workerName": "Raj Kumar",
    "activeTaskCount": 2,
    "maxWorkload": 5,
    "specializationMatch": "matched"
  }
}
```

**Notifications Sent:**
- ✓ Worker: "New complaint assigned..."
- ✓ Student: "Your complaint has been assigned..."
- ✓ Admin: Socket update

---

### Example 2: Auto-Assign Fails (No Available Worker)

**Scenario:** Water complaint, all Plumbers at 5/5 workload (overloaded)

**Request:**
```
POST /api/complaints/507f1f77bcf86cd799439012/auto-assign
```

**Response:**
```json
{
  "message": "No available worker currently. All workers are at/over max workload.",
  "status": "Pending"
}
```

**What Happens:**
- ✗ Status remains "Pending"
- ✗ No assignment made
- ✓ Admin can manually assign later when capacity available

---

### Example 3: Check Delayed Complaints

**Request:**
```
GET /api/complaints/delayed/list
```

**Response:**
```json
{
  "count": 2,
  "complaints": [
    {
      "title": "Water leaking",
      "status": "In Progress",
      "daysOpen": 5
    }
  ]
}
```

**Action:**
- Check assigned worker's workload
- Consider reassigning if overloaded
- Expedite resolution

---

### Example 4: Reassign Worker

**Request:**
```
PATCH /api/complaints/507f1f77bcf86cd799439011/reassign
{
  "workerId": "507f1f77bcf86cd799439014"
}
```

**Response:**
```json
{
  "status": "In Progress",
  "assignedTo": "Priya Singh",
  "reassignmentHistory": [
    {
      "previousWorker": "Raj Kumar",
      "newWorker": "Priya Singh",
      "reassignedAt": "2024-05-07T11:00:00Z"
    }
  ]
}
```

**Notifications Sent:**
- ✓ New Worker (Priya): "You have been reassigned complaint..."
- ✓ Admin: Socket update with new assignment

---

## ✅ HTTP STATUS CODES

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful operation |
| 201 | Created | New resource created |
| 400 | Bad Request | No worker available, validation error |
| 404 | Not Found | Complaint or worker not found |
| 500 | Server Error | Unexpected error |

---

## 🔒 AUTHORIZATION

### Required Roles by Endpoint

| Endpoint | Roles |
|----------|-------|
| POST /auto-assign | Admin, SuperAdmin |
| GET /delayed/list | Admin, SuperAdmin |
| GET /workers/workload | Admin, SuperAdmin |
| PATCH /:id/reassign | Admin, SuperAdmin |
| PATCH /status/:id | Admin, SuperAdmin |

---

## 📝 BEST PRACTICES

### 1. Always Check Worker Workload Before Assignment
```javascript
// Get workload first
const workers = await GET /api/complaints/workers/workload
// Then make assignment decision
```

### 2. Handle "No Worker Available" Gracefully
```javascript
if (error.message.includes("No available worker")) {
  // Keep status Pending, notify admin
  // Try again later
}
```

### 3. Monitor Delayed Complaints Regularly
```javascript
// Check every 5-10 minutes
setInterval(() => {
  const delayed = await GET /api/complaints/delayed/list
  if (delayed.count > 0) {
    // Alert admin
  }
}, 5 * 60 * 1000)
```

### 4. Use Auto-Assign for Initial Assignment
```javascript
// For new complaints, try auto-assign first
const result = await POST /api/complaints/:id/auto-assign

// If it fails, fall back to manual
if (!result.ok) {
  // Show manual assignment modal
}
```

---

**Last Updated:** May 7, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready
