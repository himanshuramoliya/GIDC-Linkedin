const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Data storage file path
const DATA_DIR = path.join(__dirname, 'storage');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const INTERESTS_FILE = path.join(DATA_DIR, 'interests.json');

// Initialize data storage
function initialize() {
  // Create storage directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Initialize files if they don't exist
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(INTERESTS_FILE)) {
    fs.writeFileSync(INTERESTS_FILE, JSON.stringify([], null, 2));
  }
}

// Helper functions to read/write data
function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readJobs() {
  try {
    const data = fs.readFileSync(JOBS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeJobs(jobs) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
}

function readInterests() {
  try {
    const data = fs.readFileSync(INTERESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeInterests(interests) {
  fs.writeFileSync(INTERESTS_FILE, JSON.stringify(interests, null, 2));
}

// User operations
function createUser(userData) {
  const users = readUsers();
  const user = {
    id: uuidv4(),
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    photo: userData.photo || null,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeUsers(users);
  return user;
}

function getUserById(userId) {
  const users = readUsers();
  return users.find(u => u.id === userId);
}

function getUserByEmail(email) {
  const users = readUsers();
  return users.find(u => u.email === email);
}

function getAllUsers() {
  return readUsers();
}

// Job operations
function createJob(jobData) {
  const jobs = readJobs();
  const job = {
    id: uuidv4(),
    title: jobData.title,
    description: jobData.description,
    company: jobData.company || '',
    location: jobData.location || '',
    requirements: jobData.requirements || '',
    postedBy: jobData.postedBy,
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  jobs.push(job);
  writeJobs(jobs);
  return job;
}

function getJobById(jobId) {
  const jobs = readJobs();
  return jobs.find(j => j.id === jobId);
}

function getActiveJobs() {
  const jobs = readJobs();
  return jobs.filter(j => !j.isClosed).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function getAllJobs() {
  return readJobs();
}

function getJobsByUser(userId) {
  const jobs = readJobs();
  return jobs.filter(j => j.postedBy === userId).sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function closeJob(jobId) {
  const jobs = readJobs();
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) {
    throw new Error('Job not found');
  }
  jobs[jobIndex].isClosed = true;
  jobs[jobIndex].updatedAt = new Date().toISOString();
  writeJobs(jobs);
  return jobs[jobIndex];
}

// Interest operations
function addJobInterest(jobId, userId) {
  const interests = readInterests();
  // Check if interest already exists
  const existingInterest = interests.find(
    i => i.jobId === jobId && i.userId === userId
  );
  if (existingInterest) {
    return existingInterest;
  }

  const interest = {
    id: uuidv4(),
    jobId,
    userId,
    createdAt: new Date().toISOString()
  };
  interests.push(interest);
  writeInterests(interests);
  return interest;
}

function getInterestsByJob(jobId) {
  const interests = readInterests();
  return interests.filter(i => i.jobId === jobId);
}

function getInterestsByUser(userId) {
  const interests = readInterests();
  return interests.filter(i => i.userId === userId);
}

// Export all functions
module.exports = {
  initialize,
  // Users
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  // Jobs
  createJob,
  getJobById,
  getActiveJobs,
  getAllJobs,
  getJobsByUser,
  closeJob,
  // Interests
  addJobInterest,
  getInterestsByJob,
  getInterestsByUser
};

