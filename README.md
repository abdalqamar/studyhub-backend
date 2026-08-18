# StudyHub

📚 StudyHub – Learning Management System (LMS)

StudyHub is a modern, scalable Learning Management System (LMS) designed to manage courses, instructors, students, video lessons, authentication, and secure payments.
Built using Node.js, Express, MongoDB, Cloudinary, JWT, and Razorpay, StudyHub provides a complete backend for any e-learning platform.

🚀 Features Overview
🔐 Authentication

User signup/login

JWT-based authentication

Encrypted passwords (bcrypt)

Email verification & OTP support

👨‍🎓 Student Features

Browse and enroll in courses

View course content & videos

Track learning progress

Secure online payments

Access purchased courses anytime

Profile management

👨‍🏫 Instructor Features

Apply to become an instructor

Create & manage courses

Add modules, lessons, and videos

Upload media using Cloudinary

Monitor student enrollment

Instructor earnings tracking

🛡️ Admin Panel

StudyHub includes a powerful admin dashboard for full platform control.

📚 Course Management

Approve or reject instructor-submitted courses

Edit or delete any course

Manage course categories

Publish / Unpublish courses

👨‍🏫 Instructor Management

Approve instructor applications

Verify instructor identity

Suspend or remove instructors

Track instructor earnings & payouts

👥 User (Student) Management

View all students

Enable/disable user accounts

View purchase history

Resolve disputes or issues

📊 Platform Analytics

Real-time dashboard showing:

Total users (students + instructors)

Total courses

Revenue tracking

Daily/weekly/monthly sales

Best-selling courses

User activity

Instructor performance

💳 Payments & Transactions

Razorpay integration

Payment verification

Transaction logs

Refund support

Revenue breakdown (admin vs instructor)

📝 Content Moderation

Delete lessons/courses violating policy

Manage media files

Moderate user reports

🔐 Role-Based Access

Only admins can access dashboard

Secure admin authentication

🛠️ Tech Stack
Backend

Node.js

Express.js

MongoDB & Mongoose

Cloudinary (file hosting)

Multer (file upload)

Razorpay (payments)

JSON Web Token (JWT)

Nodemailer

Validator & Express Validator

📁 Folder Structure
StudyHub/
│
├── backend/
│ ├── controllers/
│ ├── models/
│ ├── routes/
│ ├── middlewares/
│ ├── utils/
│ ├── config/
│ └── index.js
│
└── README.md
