// Load environment variables
require('dotenv').config();

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// JWT Configuration
// Generate secure random secrets if not provided (for development only)
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment. Using fallback (not secure for production!)');
  return 'your-secret-key-change-in-production';
})();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (() => {
  console.warn('⚠️  WARNING: JWT_REFRESH_SECRET not set in environment. Using fallback (not secure for production!)');
  return 'your-refresh-secret-key-change-in-production';
})();
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// File to store refresh tokens (in-memory for simplicity, use DB in production)
const REFRESH_TOKENS_FILE = path.join(__dirname, '../data/storage/refreshTokens.json');

// Initialize refresh tokens storage
function initRefreshTokensStorage() {
  const dir = path.dirname(REFRESH_TOKENS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(REFRESH_TOKENS_FILE)) {
    fs.writeFileSync(REFRESH_TOKENS_FILE, JSON.stringify([], null, 2));
  }
}

// Read refresh tokens
function readRefreshTokens() {
  try {
    const data = fs.readFileSync(REFRESH_TOKENS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write refresh tokens
function writeRefreshTokens(tokens) {
  fs.writeFileSync(REFRESH_TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

// Generate access token
function generateAccessToken(user) {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

// Generate refresh token
function generateRefreshToken(user) {
  const token = jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  // Store refresh token
  const tokens = readRefreshTokens();
  tokens.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString()
  });
  writeRefreshTokens(tokens);
  
  return token;
}

// Verify access token
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Verify refresh token
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    
    // Check if token exists in storage
    const tokens = readRefreshTokens();
    const tokenExists = tokens.some(t => t.token === token && t.userId === decoded.userId);
    
    if (!tokenExists) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

// Revoke refresh token
function revokeRefreshToken(token) {
  const tokens = readRefreshTokens();
  const filtered = tokens.filter(t => t.token !== token);
  writeRefreshTokens(filtered);
}

// Revoke all refresh tokens for a user
function revokeAllUserTokens(userId) {
  const tokens = readRefreshTokens();
  const filtered = tokens.filter(t => t.userId !== userId);
  writeRefreshTokens(filtered);
}

// Initialize storage on module load
initRefreshTokensStorage();

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  ACCESS_TOKEN_EXPIRY
};

