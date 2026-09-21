# Complaint Portal Workflow

## 1. Student Authentication Workflow
The process begins when a student accesses the portal to seek assistance.

```mermaid
sequenceDiagram
    actor Student
    participant Frontend
    participant Backend
    participant Database

    Student->>Frontend: Enter Roll No & Password
    Frontend->>Backend: POST /api/auth/student-login
    Backend->>Database: Verify Credentials
    alt Valid Credentials
        Database-->>Backend: User Data
        Backend-->>Frontend: JWT Token & User Info
        Frontend->>Student: Redirect to Student Dashboard
    else Invalid Credentials
        Backend-->>Frontend: 401 Unauthorized Error
        Frontend-->>Student: Display Error Message
    end
```

## 2. Complaint Creation Workflow
Once logged in, the student can create a new complaint.

```mermaid
sequenceDiagram
    actor Student
    participant Frontend
    participant Backend
    participant Cloudinary
    participant Database
    participant SocketIO

    Student->>Frontend: Fill Complaint Form (Dept, Subject, Desc, Files)
    Frontend->>Backend: POST /api/complaints (FormData)
    
    opt Has Attachments
        Backend->>Cloudinary: Upload Files
        Cloudinary-->>Backend: Secure URLs
    end
    
    Backend->>Database: Create Complaint Record
    Database-->>Backend: Saved Record
    
    Backend->>SocketIO: emit('staff_notification')
    SocketIO-->>Staff: Real-time Alert (New Complaint)
    
    Backend-->>Frontend: 201 Created
    Frontend-->>Student: Show Success & Redirect to Dashboard
```

## 3. Staff Review & Reply Workflow
Staff members receive the complaint and interact with the student.

```mermaid
sequenceDiagram
    actor Staff
    participant Frontend
    participant Backend
    participant Database
    participant SocketIO
    actor Student

    Staff->>Frontend: Open Ticket Detail
    Frontend->>Backend: PUT /api/complaints/:id/messages/read
    Backend->>Database: Update isRead=true
    Backend->>SocketIO: emit('messages_read')
    SocketIO-->>Student: Show "✓✓ Seen"
    
    Staff->>Frontend: Type Reply & Send
    Frontend->>Backend: POST /api/complaints/:id/messages
    Backend->>Database: Save New Message
    Backend->>SocketIO: notifyUser()
    SocketIO-->>Student: Real-time Message Notification
    
    Backend-->>Frontend: Return Message
    Frontend-->>Staff: Update UI Chat
```

## 4. End-to-End Complaint Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Open: Student Creates Complaint
    Open --> InReview: Staff Views Ticket
    InReview --> InProgress: Staff Replies / Working
    InProgress --> Resolved: Staff Marks as Resolved
    Resolved --> Closed: Student Gives Rating
    Resolved --> Open: Student Replies (Reopened)
    Closed --> [*]
```
