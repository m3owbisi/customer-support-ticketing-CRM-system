const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - allow requests from localhost:5173 (Vite default) and production Vercel
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    const isLocalhost = origin && (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:')
    );

    if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Support CRM API Server is running. Access data at /api/tickets' });
});

// Routes
const ticketRouter = require('./routes/tickets');
app.use('/api/tickets', ticketRouter);

// Page Not Found (404) Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`Support CRM Backend listening on port ${PORT}`);
});
