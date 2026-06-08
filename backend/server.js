const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const chartRoutes = require('./routes/chartRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/chart', chartRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Shivanetra V12 is running',
        timestamp: new Date().toISOString(),
        endpoints: ['POST /api/chart/calculate', 'GET /api/chart/health']
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server with port fallback
const startServer = (port) => {
    const server = app.listen(port, () => {
        console.log('╔═══════════════════════════════════════════════════╗');
        console.log('║   ⚡ MARDUKH SYSTEM™ - Shivanetra V12 ⚡          ║');
        console.log('║   Data-Driven Natal Astrology Engine             ║');
        console.log('╠═══════════════════════════════════════════════════╣');
        console.log(`║   Server: http://localhost:${port}                  ║`);
        console.log(`║   API:    http://localhost:${port}/api/health      ║`);
        console.log('╚═══════════════════════════════════════════════════╝');
    });
    
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is busy, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
};

startServer(PORT);
