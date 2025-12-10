// Load environment variables first
require('dotenv').config();

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

// Import data layer and auth utilities
const dataLayer = require('./data/dataLayer');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAllUserTokens
} = require('./utils/auth');

// Initialize data storage
dataLayer.initialize();

// JWT Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    // Fallback to legacy user-id header for backward compatibility during transition
    const userId = req.headers['user-id'];
    if (userId) {
      const user = dataLayer.getUserById(userId);
      if (user) {
        req.userId = userId;
        req.user = user;
        return next();
      }
    }
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = dataLayer.getUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.userId = decoded.userId;
  req.user = user;
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
    const { name, email, phone, role } = req.body;
    
    if (!name || !email || !phone || !role) {
      return res.status(400).json({ error: 'Name, email, phone, and role are required' });
    }

    if (!['employer', 'employee'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "employer" or "employee"' });
    }

    // Check if user already exists
    const existingUser = dataLayer.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Parse role-specific data
    let roleData = {};
    if (role === 'employer') {
      const { companyName, companyLocation, companyDescription } = req.body;
      if (!companyName || !companyLocation) {
        return res.status(400).json({ error: 'Company name and location are required for employers' });
      }
      roleData = {
        companyName: companyName.trim(),
        companyLocation: companyLocation.trim(),
        companyDescription: companyDescription?.trim() || ''
      };
    } else if (role === 'employee') {
      // Parse experience data (JSON string or object)
      let experiences = [];
      if (req.body.experiences) {
        try {
          experiences = typeof req.body.experiences === 'string' 
            ? JSON.parse(req.body.experiences) 
            : req.body.experiences;
        } catch (e) {
          return res.status(400).json({ error: 'Invalid experiences format' });
        }
      }
      roleData = { experiences };
    }
    
    const user = dataLayer.createUser({
      name,
      email,
      phone,
      photo: photoUrl,
      role,
      ...roleData
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        photo: user.photo,
        role: user.role,
        ...roleData
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login
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

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Prepare user response (include role-specific data)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      role: user.role
    };

    if (user.role === 'employer') {
      userResponse.companyName = user.companyName;
      userResponse.companyLocation = user.companyLocation;
      userResponse.companyDescription = user.companyDescription;
    } else if (user.role === 'employee') {
      userResponse.experiences = user.experiences || [];
    }

    res.json({ 
      message: 'Login successful',
      user: userResponse,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Refresh token endpoint
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = dataLayer.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    res.json({
      accessToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticate, (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const { revokeRefreshToken } = require('./utils/auth');
      revokeRefreshToken(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
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

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      role: user.role
    };

    if (user.role === 'employer') {
      userResponse.companyName = user.companyName;
      userResponse.companyLocation = user.companyLocation;
      userResponse.companyDescription = user.companyDescription;
    } else if (user.role === 'employee') {
      userResponse.experiences = user.experiences || [];
    }

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create job post (employers only)
app.post('/api/jobs', authenticate, (req, res) => {
  try {
    // Check if user is an employer
    if (req.user.role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can post jobs' });
    }

    const { title, description, company, location, requirements } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const job = dataLayer.createJob({
      title,
      description,
      company: company || req.user.companyName || '',
      location: location || req.user.companyLocation || '',
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

// Get applicants for a job (employers only)
app.get('/api/jobs/:jobId/applicants', authenticate, (req, res) => {
  try {
    const job = dataLayer.getJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the job poster
    if (job.postedBy !== req.userId) {
      return res.status(403).json({ error: 'You can only view applicants for your own jobs' });
    }

    // Check if user is an employer
    const user = dataLayer.getUserById(req.userId);
    if (user.role !== 'employer') {
      return res.status(403).json({ error: 'Only employers can view applicants' });
    }

    const interests = dataLayer.getInterestsByJob(req.params.jobId);
    
    // Get full user profiles for each applicant
    const applicants = interests.map(interest => {
      const applicant = dataLayer.getUserById(interest.userId);
      if (!applicant) return null;
      
      return {
        interestId: interest.id,
        appliedAt: interest.createdAt,
        user: {
          id: applicant.id,
          name: applicant.name,
          email: applicant.email,
          phone: applicant.phone,
          photo: applicant.photo,
          role: applicant.role,
          experiences: applicant.experiences || []
        }
      };
    }).filter(Boolean);

    res.json(applicants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

