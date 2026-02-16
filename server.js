const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Middleware
app.use(cors({
  origin: true, // Allow all origins for local development ease
  credentials: true
}));
app.use(express.json());

// File upload configuration
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.csv', '.xlsx', '.xls', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}`));
    }
  }
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));
// Serve the frontend
app.use(express.static(__dirname));

// In-memory storage
let documents = [];

// Helper function to extract text
async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  console.log(`Processing file: ${originalName} (${ext})`);

  try {
    let text = '';
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      text = data.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (ext === '.txt' || ext === '.csv') {
      text = fs.readFileSync(filePath, 'utf8');
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      text = xlsx.utils.sheet_to_csv(workbook.Sheets[sheetName]);
    }

    console.log(`📝 Extracted ${text.length} chars from ${originalName}`);
    if (text.length < 100) console.log(`Preview: ${text.substring(0, 100)}`);
    return text;
  } catch (error) {
    console.error(`Error extracting text from ${originalName}:`, error);
    return '';
  }
}

// 1. HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'Document Analysis API',
    aiAvailable: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
    documents: documents.length,
    port: PORT
  });
});

// 2. GET ALL DOCUMENTS
app.get('/api/documents', (req, res) => {
  // Return documents without full content to keep payload light
  const docsList = documents.map(({ content, ...doc }) => doc);
  res.json({
    success: true,
    documents: docsList,
    count: documents.length
  });
});

// 3. UPLOAD DOCUMENTS (With AI Analysis)
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files selected'
      });
    }

    console.log('📤 Files received:', req.files.map(f => f.originalname));

    const processedDocs = [];

    // Process files sequentially
    for (const file of req.files) {
      // 1. Extract Text
      const textContent = await extractTextFromFile(file.path, file.originalname);
      const wordCount = textContent.split(/\s+/).length;

      // 2. Generate Analysis with Gemini
      let analysis = {
        summary: "Analysis pending...",
        key_topics: [],
        important_findings: [],
        recommendations: []
      };

      if (textContent.trim().length > 0) {
        try {
          const prompt = `
            Analyze the following document content properly.
            Document Content (truncated): "${textContent.substring(0, 15000)}"

            Return a valid JSON object with the following structure:
            {
              "summary": "A brief but comprehensive summary of the document (max 3 sentences)",
              "key_topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
              "important_findings": ["Finding 1", "Finding 2"], 
              "recommendations": ["Recommendation 1"]
            }
          `;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          // Clean up markdown code blocks if present
          const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
          analysis = JSON.parse(jsonString);

        } catch (aiError) {
          console.error('AI Analysis Error:', aiError);
          analysis.summary = "AI analysis failed/incomplete.";
        }
      } else {
        console.warn(`⚠️ Warning: No text extracted from ${file.originalname}`);
        analysis.summary = "Could not extract text from this document. It might be an image-based PDF or empty.";
      }

      const doc = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: file.originalname,
        serverFilename: file.filename,
        path: `/uploads/${file.filename}`,
        size: file.size,
        type: path.extname(file.originalname).substring(1).toUpperCase(),
        uploaded: new Date(),
        content: textContent,
        wordCount: wordCount,
        analysis: analysis
      };

      documents.push(doc);
      processedDocs.push(doc);
    }

    res.json({
      success: true,
      message: `Successfully uploaded and analyzed ${processedDocs.length} document(s)`,
      documents: processedDocs.map(({ content, ...doc }) => doc) // Exclude content from response
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// 4. CHAT WITH DOCUMENTS
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (documents.length === 0) {
      return res.json({
        success: true,
        response: "I don't have any documents to read yet. Please upload some files first."
      });
    }

    // Prepare Context from all documents
    // We truncate each doc to ensure we fit in the context window
    const context = documents.map((doc, index) => {
      const contentPreview = doc.content.substring(0, 5000);
      return `Document ${index + 1} (${doc.filename}):\n${contentPreview}\n...`;
    }).join('\n\n');

    const chatPrompt = `
      You are a helpful assistant analyzing the following documents:
      
      ${context}

      User Question: "${message}"

      Answer the user's question based ONLY on the provided documents. 
      If the answer is not in the documents, say "I couldn't find that information in the uploaded documents."
      Be concise and helpful. Format your answer with Markdown.
    `;

    const result = await model.generateContent(chatPrompt);
    const response = await result.response;
    const responseText = response.text();

    res.json({
      success: true,
      response: responseText,
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate chat response'
    });
  }
});

// 5. DELETE DOCUMENT
app.delete('/api/documents/:id', (req, res) => {
  try {
    // The previous bug was looking for ID but receiving filename. 
    // Now frontend sends ID strictly. But let's be robust and check both.
    const docIndex = documents.findIndex(d => d.id === req.params.id || d.serverFilename === req.params.id);

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const doc = documents[docIndex];

    // Delete file from disk
    const filePath = path.join(uploadsDir, doc.serverFilename);
    const originalFilePath = path.join(uploadsDir, doc.filename); // Legacy check

    // Try deleting known path
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } else {
      console.warn(`File not found on disk: ${filePath}`);
    }

    // Remove from memory
    documents.splice(docIndex, 1);

    res.json({
      success: true,
      message: `Document "${doc.filename}" deleted successfully`
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 6. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 50MB.'
    });
  }

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on http://localhost:${PORT}
  🤖 Gemini Model: gemini-1.5-flash
  � Uploads Directory: ${uploadsDir}
  `);
});