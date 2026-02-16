const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Simple upload test
const multer = require('multer');
const upload = multer({ dest: 'test-uploads/' });

app.post('/api/test-upload', upload.single('file'), (req, res) => {
    res.json({
        success: true,
        message: 'File uploaded!',
        file: req.file
    });
});

app.listen(PORT, () => {
    console.log(`✅ TEST SERVER RUNNING on http://localhost:${PORT}`);
    console.log(`📡 Test endpoint: http://localhost:${PORT}/api/health`);
});