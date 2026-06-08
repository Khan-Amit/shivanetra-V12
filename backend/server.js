const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const chartRoutes = require('./routes/chartRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

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

// Start server
app.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║   ⚡ MARDUKH SYSTEM™ - Shivanetra V12 ⚡          ║');
    console.log('║   Data-Driven Natal Astrology Engine             ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║   Server: http://localhost:${PORT}                  ║`);
    console.log(`║   API:    http://localhost:${PORT}/api/health      ║`);
    console.log('╚═══════════════════════════════════════════════════╝');
});
