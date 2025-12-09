# GIDC LinkedIn-like Job Posting App

A full-stack web application similar to LinkedIn where users can post job opportunities and others can show interest in them.

## Features

1. **User Management**
   - User registration with name, email, phone, and optional profile photo
   - Simple email-based login
   - User profile management

2. **Job Posting**
   - Create job posts with custom messages
   - Include job title, description, company, location, and requirements
   - View all active job postings in a feed

3. **Job Management**
   - Mark jobs as closed
   - Closed jobs don't appear in the feed for job seekers
   - View and manage your own job postings

4. **Interest System**
   - Users can show interest in job postings
   - Track which jobs you've shown interest in

## Tech Stack

- **Frontend**: React.js with React Router
- **Backend**: Node.js with Express
- **Database**: Local file storage (JSON files) with loose coupling for future database integration
- **File Upload**: Multer for handling profile photo uploads

## Project Structure

```
GIDC-Linkedin/
├── backend/
│   ├── data/
│   │   ├── dataLayer.js      # Data abstraction layer
│   │   └── storage/           # JSON file storage (created at runtime)
│   ├── uploads/               # User uploaded photos (created at runtime)
│   ├── server.js              # Express server
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API service layer
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional but recommended) by creating a `.env.local` file:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email

### Users
- `GET /api/users/:userId` - Get user profile

### Jobs
- `POST /api/jobs` - Create a new job post
- `GET /api/jobs` - Get all active jobs
- `GET /api/jobs/:jobId` - Get a specific job
- `PATCH /api/jobs/:jobId/close` - Mark a job as closed
- `POST /api/jobs/:jobId/interest` - Show interest in a job
- `GET /api/users/:userId/jobs` - Get jobs posted by a user

## Data Storage

Currently, the application uses local JSON file storage:
- `backend/data/storage/users.json` - User data
- `backend/data/storage/jobs.json` - Job postings
- `backend/data/storage/interests.json` - Job interests

The data layer is abstracted in `backend/data/dataLayer.js`, making it easy to replace with a database (MongoDB, PostgreSQL, etc.) in the future.

## Future Database Integration

To integrate a database:

1. Replace the functions in `backend/data/dataLayer.js` with database queries
2. The API routes in `backend/server.js` will continue to work without changes
3. No changes needed in the frontend

## Usage

1. **Register/Login**: Create an account or login with your email
2. **Post a Job**: Navigate to "Post Job" and fill in the job details
3. **Browse Jobs**: View all active job postings in the feed
4. **Show Interest**: Click "Show Interest" on any job posting
5. **Manage Jobs**: View and close your job postings from "My Jobs"

## Notes

- Profile photos are stored in `backend/uploads/`
- All data is persisted in JSON files in `backend/data/storage/`
- Authentication is currently simple (email-based) - can be enhanced with JWT tokens
- The app uses localStorage to maintain user session
