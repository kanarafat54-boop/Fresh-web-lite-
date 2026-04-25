const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/freshweblite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.log('❌ MongoDB connection error:', err);
});

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: null },
  bio: { type: String, default: '' },
  followers: [String],
  following: [String],
  createdAt: { type: Date, default: Date.now }
});

// Video Schema (for viral videos)
const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  uploadedBy: { type: String },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  tags: [String],
  category: { type: String, default: 'viral' },
  duration: { type: Number },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Search History Schema
const searchHistorySchema = new mongoose.Schema({
  userId: String,
  query: { type: String, required: true },
  category: { type: String, enum: ['all', 'i2p', 'tor', 'clearnet'], default: 'all' },
  results: Number,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Video = mongoose.model('Video', videoSchema);
const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

// ==================== PUBLIC ROUTES (No Login Required) ====================

// Home Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Fresh Web Lite!',
    status: 'Server is running successfully',
    version: '1.0.0',
    features: ['Viral Videos Feed', 'Search Engine (Clearnet/I2P/Tor)', 'User Authentication']
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==================== VIRAL VIDEOS FEED (PUBLIC) ====================

// Get viral videos feed (infinite scroll)
app.get('/api/videos/feed', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const videos = await Video.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalVideos = await Video.countDocuments({ isPublic: true });

    res.json({
      videos,
      totalVideos,
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit),
      hasMore: skip + videos.length < totalVideos
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos', message: error.message });
  }
});

// Get single video details
app.get('/api/videos/:videoId', async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId, isPublic: true });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video', message: error.message });
  }
});

// Increment video views
app.post('/api/videos/:videoId/view', async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { videoId: req.params.videoId },
      { $inc: { views: 1 } },
      { new: true }
    );
    res.json({ message: 'View counted', video });
  } catch (error) {
    res.status(500).json({ error: 'Failed to count view', message: error.message });
  }
});

// Like video
app.post('/api/videos/:videoId/like', async (req, res) => {
  try {
    const video = await Video.findOneAndUpdate(
      { videoId: req.params.videoId },
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json({ message: 'Video liked', video });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like video', message: error.message });
  }
});

// Get videos by category
app.get('/api/videos/category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const videos = await Video.find({ category, isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalVideos = await Video.countDocuments({ category, isPublic: true });

    res.json({
      category,
      videos,
      totalVideos,
      currentPage: page,
      totalPages: Math.ceil(totalVideos / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos', message: error.message });
  }
});

// ==================== SEARCH ENGINE (PUBLIC) ====================

// Universal search (Internet + I2P + Tor)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const type = req.query.type || 'all';
    const page = req.query.page || 1;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Save search history
    if (req.query.userId) {
      const searchRecord = new SearchHistory({
        userId: req.query.userId,
        query,
        category: type
      });
      await searchRecord.save();
    }

    let results = {
      query,
      type,
      page,
      results: []
    };

    // Search Videos
    if (type === 'all' || type === 'videos') {
      const videoResults = await Video.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ],
        isPublic: true
      }).limit(10);

      results.videos = videoResults;
    }

    // Clearnet Search Results
    if (type === 'all' || type === 'clearnet') {
      results.clearnetResults = [
        {
          title: `${query} - Wikipedia`,
          url: `https://wikipedia.org/search?q=${encodeURIComponent(query)}`,
          description: `Search Wikipedia for "${query}"`,
          source: 'Wikipedia'
        },
        {
          title: `${query} - Google Search`,
          url: `https://google.com/search?q=${encodeURIComponent(query)}`,
          description: `Google Search results for "${query}"`,
          source: 'Google'
        },
        {
          title: `${query} - YouTube`,
          url: `https://youtube.com/results?search_query=${encodeURIComponent(query)}`,
          description: `YouTube videos about "${query}"`,
          source: 'YouTube'
        }
      ];
    }

    // I2P Information
    if (type === 'all' || type === 'i2p') {
      results.i2pResults = [
        {
          title: 'What is I2P?',
          description: 'I2P (Invisible Internet Project) is an anonymous network for censorship-resistant communication.',
          url: 'https://geti2p.net',
          source: 'I2P Network',
          info: 'I2P is designed for internal networks and uses unidirectional tunnels for anonymous communication.'
        },
        {
          title: `${query} - I2P Search`,
          description: `Search within I2P network for "${query}". Requires I2P router.`,
          url: 'i2p://search.i2p',
          source: 'I2P Internal',
          info: 'I2P sites end with .i2p extension. Requires I2P router installed to access.'
        }
      ];
    }

    // Tor Information
    if (type === 'all' || type === 'tor') {
      results.torResults = [
        {
          title: 'What is Tor?',
          description: 'Tor (The Onion Router) enables anonymous communication by routing traffic through multiple relays.',
          url: 'https://www.torproject.org',
          source: 'Tor Project',
          info: 'Tor hides your IP and encrypts traffic. .onion sites are only accessible through Tor Browser.'
        },
        {
          title: `${query} - Tor Hidden Services`,
          description: `Search for "${query}" in Tor hidden services. Requires Tor Browser.`,
          url: 'http://thehiddenwiki.onion',
          source: 'Tor Hidden Wiki',
          info: 'The Hidden Wiki lists .onion sites. Requires Tor Browser to access.'
        },
        {
          title: 'Tor Browser Download',
          description: 'Download Tor Browser for secure, anonymous browsing',
          url: 'https://www.torproject.org/download',
          source: 'Tor Project',
          info: 'Official Tor Browser provides easiest way to access Tor network.'
        }
      ];
    }

    results.timestamp = new Date().toISOString();
    res.json(results);

  } catch (error) {
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Get search history
app.get('/api/search/history/:userId', async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ userId: req.params.userId, history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history', message: error.message });
  }
});

// Trending searches
app.get('/api/search/trending', async (req, res) => {
  try {
    const trending = await SearchHistory.aggregate([
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({ trending });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending', message: error.message });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.json({
      message: 'User registered successfully',
      userId: user._id,
      username: user.username
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user._id,
        username: user.username,
        email: user.email,
        profilePic: user.profilePic
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// Get user profile
app.get('/api/users/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      followers: user.followers.length,
      following: user.following.length,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user', message: error.message });
  }
});

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'This endpoint does not exist'
  });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════╗
  ║    🚀 Fresh Web Lite Server       ║
  ║    Running on http://localhost:${PORT}  ║
  ╚═══════════════════════════════════╝
  
  📺 Viral Videos Feed: /api/videos/feed
  🔍 Search Engine: /api/search?q=keyword
  👤 Register: /api/auth/register
  🔐 Login: /api/auth/login
  `);
});
