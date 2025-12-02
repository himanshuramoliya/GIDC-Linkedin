const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Import data layer
const dataLayer = require('./data/dataLayer');

// Initialize data storage
dataLayer.initialize();

// Authentication middleware
const authenticate = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = dataLayer.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid user' });
  }
  
  req.userId = userId;
  next();
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// User Registration
app.post('/api/auth/register', upload.single('photo'), (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    // Check if user already exists
    const existingUser = dataLayer.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const user = dataLayer.createUser({
      name,
      email,
      phone,
      photo: photoUrl
    });

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login (simple email-based for now)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = dataLayer.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/users/:userId', authenticate, (req, res) => {
  try {
    const user = dataLayer.getUserById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create job post
app.post('/api/jobs', authenticate, (req, res) => {
  try {
    const { title, description, company, location, requirements } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const job = dataLayer.createJob({
      title,
      description,
      company: company || '',
      location: location || '',
      requirements: requirements || '',
      postedBy: req.userId
    });

    res.status(201).json({ 
      message: 'Job posted successfully',
      job 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all active jobs (not closed)
app.get('/api/jobs', authenticate, (req, res) => {
  try {
    const jobs = dataLayer.getActiveJobs();
    // Populate postedBy user info
    const jobsWithUserInfo = jobs.map(job => {
      const user = dataLayer.getUserById(job.postedBy);
      return {
        ...job,
        postedByUser: user ? {
          id: user.id,
          name: user.name,
          photo: user.photo
        } : null
      };
    });
    
    res.json(jobsWithUserInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
app.get('/api/jobs/:jobId', authenticate, (req, res) => {
  try {
    const job = dataLayer.getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const user = dataLayer.getUserById(job.postedBy);
    res.json({
      ...job,
      postedByUser: user ? {
        id: user.id,
        name: user.name,
        photo: user.photo
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark job as closed
app.patch('/api/jobs/:jobId/close', authenticate, (req, res) => {
  try {
    const job = dataLayer.getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.postedBy !== req.userId) {
      return res.status(403).json({ error: 'You can only close your own job posts' });
    }

    const updatedJob = dataLayer.closeJob(req.params.jobId);
    res.json({ 
      message: 'Job marked as closed',
      job: updatedJob 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Show interest in a job
app.post('/api/jobs/:jobId/interest', authenticate, (req, res) => {
  try {
    const job = dataLayer.getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.isClosed) {
      return res.status(400).json({ error: 'Cannot show interest in a closed job' });
    }

    const interest = dataLayer.addJobInterest(req.params.jobId, req.userId);
    res.status(201).json({ 
      message: 'Interest shown successfully',
      interest 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs posted by user
app.get('/api/users/:userId/jobs', authenticate, (req, res) => {
  try {
    const jobs = dataLayer.getJobsByUser(req.params.userId);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

