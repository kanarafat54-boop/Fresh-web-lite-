const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Home Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Fresh Web Lite!',
    status: 'Server is running successfully',
    version: '1.0.0',
    author: 'kanarafat54-boop'
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// User Registration Route
app.post('/api/auth/register', (req, res) => {
  res.json({
    message: 'User registration endpoint',
    status: 'Ready for implementation'
  });
});

// User Login Route
app.post('/api/auth/login', (req, res) => {
  res.json({
    message: 'User login endpoint',
    status: 'Ready for implementation'
  });
});

// Get Feed Route
app.get('/api/feed', (req, res) => {
  res.json({
    message: 'Feed endpoint',
    posts: [],
    status: 'Ready for implementation'
  });
});

// Create Post Route
app.post('/api/posts', (req, res) => {
  res.json({
    message: 'Create post endpoint',
    status: 'Ready for implementation'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'This endpoint does not exist'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Fresh Web Lite server running on http://localhost:${PORT}`);
  console.log(`🌐 API Health Check: http://localhost:${PORT}/api/health`);
});
