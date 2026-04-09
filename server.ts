import express from 'express';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { GoogleGenAI } from '@google/genai';
import PDFDocument from 'pdfkit';
import { HfInference } from '@huggingface/inference';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'truthguard-secret-key-2026';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database Setup
const db = new Database('truthguard.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id INTEGER,
    authenticity_score REAL,
    confidence_level TEXT,
    risk_level TEXT,
    manipulation_type TEXT,
    explanation_text TEXT,
    heatmap_data TEXT,
    frame_timeline TEXT,
    metadata_analysis TEXT,
    references_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(upload_id) REFERENCES uploads(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role = 'public' } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
      const result = stmt.run(name, email, hashedPassword, role);
      res.status(201).json({ id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // Upload & Analysis
  app.post('/api/analyze', authenticateToken, upload.single('file'), async (req: any, res) => {

    const { id: userId } = req.user;

    // Check if we are handling a File, Text, or URL
    const isFile = !!req.file;
    const isText = !!req.body.text;
    const isUrl = !!req.body.url;

    if (!isFile && !isText && !isUrl) {
      return res.status(400).json({ error: 'No file, text, or url provided' });
    }

    let filePath = '';
    let fileName = '';
    let fileType = '';
    let base64Data = '';
    let rawTextContent = '';

    // Extract Input Data
    if (isFile) {
      filePath = req.file.path;
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
      const fileBuffer = fs.readFileSync(filePath);
      base64Data = fileBuffer.toString('base64');
    } else if (isText) {
      fileName = 'Raw Text Analysis';
      fileType = 'text/plain';
      rawTextContent = req.body.text;
    } else if (isUrl) {
      fileName = req.body.url;
      fileType = 'text/uri-list';
      try {
        const urlRes = await fetch(req.body.url);
        rawTextContent = await urlRes.text();
        // Basic scrape check, limiting size to avoid token overflow
        rawTextContent = rawTextContent.substring(0, 50000);
      } catch (e: any) {
        return res.status(400).json({ error: 'Failed to fetch URL content: ' + e.message });
      }
    }

    try {
      // 1. Save Upload Record
      const uploadStmt = db.prepare('INSERT INTO uploads (user_id, file_path, file_name, file_type, file_hash) VALUES (?, ?, ?, ?, ?)');
      // For text/url we don't have a real file path or hash.
      const dbFilePath = isFile ? filePath : 'null';
      const dbFileHash = isFile ? 'sha256-placeholder' : 'text-hash';
      const uploadResult = uploadStmt.run(userId, dbFilePath, fileName, fileType, dbFileHash);
      const uploadId = uploadResult.lastInsertRowid;

      const isImage = fileType.startsWith('image/');
      const isAudio = fileType.startsWith('audio/');
      let hfScores: any = null;

      // --- Hugging Face API Integration (Only for actual files) ---
      if (isFile) {
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const fileBlob = new Blob([fileBuffer], { type: fileType });
          const hfKey = process.env.HUGGINGFACE_API_KEY;

          if (hfKey && (isImage || isAudio)) {
            const hf = new HfInference(hfKey);

            if (isImage) {
              const result = await hf.imageClassification({
                data: fileBlob,
                model: 'dima806/deepfake_vs_real_image_detection'
              });
              hfScores = result;
            } else if (isAudio) {
              const result = await hf.audioClassification({
                data: fileBlob,
                model: 'ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition' // Or an actual audio deepfake model if available
              });
              hfScores = result;
            }
          }
        } catch (e: any) {
          console.error("Hugging Face API Error:", e.message);
          hfScores = { error: "HF API Failed or Timeout" };
        }
      }

      // 2. Perform AI Analysis using Gemini
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY or API_KEY environment variable is missing');
      }
      const genAI = new GoogleGenAI({ apiKey });

      // Build Gemini parts array dynamically
      const promptParts: any[] = [];

      if (isFile) {
        promptParts.push({
          inlineData: {
            data: base64Data,
            mimeType: fileType
          }
        });
        promptParts.push({
          text: `Analyze this ${fileType.split('/')[0]} for deepfake artifacts and authenticity. 
              Extract the main claim, person, or event into a short concise query suitable for Google Search.
              Provide a detailed report in JSON format including:
              - authenticity_score (0-100)
              - confidence_level (High, Medium, Low)
              - risk_level (Verified, Suspicious, High Risk)
              - manipulation_type (Face Swap, Lip Sync, Voice Clone, GAN Generated, None)
              - explanation_text (Natural language reasoning)
              - metadata_analysis (Object with findings)
              - frame_timeline (Array of scores if video, else null)
              - heatmap_regions (Description of areas with high manipulation probability)
              - search_query (A 2-4 word query of the main subject/claim for fact checking. e.g. "Joe Biden speech")
              
              Return ONLY valid JSON. Do not use markdown wrappers like \`\`\`json.`
        });
      } else {
        let contextType = isUrl ? "webpage extraction" : "raw text snippet";
        promptParts.push({
          text: `Analyze the following ${contextType} for misinformation, fake news, logical fallacies, or sensationalism:
            
            """
            ${rawTextContent}
            """
            
            Extract the main claim, person, or event into a short concise query suitable for Google Search.
            Provide a detailed report in JSON format including:
            - authenticity_score (0-100)
            - confidence_level (High, Medium, Low)
            - risk_level (Verified, Suspicious, High Risk)
            - manipulation_type (Fabricated Claim, Misleading Context, Satire, None)
            - explanation_text (Natural language reasoning outlining why the text is factual or fake)
            - metadata_analysis (Object with findings like tone, fallacies detected, spelling errors)
            - frame_timeline (null)
            - heatmap_regions (null)
            - search_query (A 2-4 word query of the main subject/claim for fact checking)
            
            Return ONLY valid JSON. Do not use markdown wrappers like \`\`\`json.`
        });
      }

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: promptParts }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      let rawText = response.text || '{}';
      // Strip markdown code block if model still outputs it
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const analysis = JSON.parse(rawText);

      // Extract grounding metadata if available
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && !analysis.references) {
        analysis.references = groundingChunks
          .map((chunk: any) => chunk.web?.uri)
          .filter(Boolean);
      }

      // Merge HF scores into metadata_analysis
      if (!analysis.metadata_analysis) analysis.metadata_analysis = {};
      if (hfScores) {
        analysis.metadata_analysis.huggingFaceScores = hfScores;
      }

      // --- Google Fact Check API Integration ---
      try {
        const factCheckKey = process.env.FACT_CHECK_API_KEY;
        if (factCheckKey && analysis.search_query) {
          const query = encodeURIComponent(analysis.search_query);
          const fcUrl = `https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${query}&key=${factCheckKey}`;
          const fcRes = await fetch(fcUrl);
          const fcData = await fcRes.json() as any;

          if (fcData.claims && fcData.claims.length > 0) {
            analysis.metadata_analysis.factCheckResults = fcData.claims.map((c: any) => ({
              claimant: c.claimant,
              claimDate: c.claimDate,
              text: c.text,
              reviews: c.claimReview.map((r: any) => ({
                publisher: r.publisher?.name,
                url: r.url,
                textualRating: r.textualRating
              }))
            }));
            // Append the first fact check URL to references if available
            const firstReviewUrl = fcData.claims[0]?.claimReview?.[0]?.url;
            if (firstReviewUrl) {
              analysis.references = analysis.references || [];
              if (!analysis.references.includes(firstReviewUrl)) {
                analysis.references.push(firstReviewUrl);
              }
            }
            delete analysis.search_query;
          }
        }
      } catch (e: any) {
        console.error("Fact Check API Error:", e.message);
      }

      // 3. Save Report
      const reportStmt = db.prepare(`
        INSERT INTO reports(
            upload_id, authenticity_score, confidence_level, risk_level,
            manipulation_type, explanation_text, metadata_analysis, frame_timeline, references_data
          ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

      reportStmt.run(
        uploadId,
        analysis.authenticity_score,
        analysis.confidence_level,
        analysis.risk_level,
        analysis.manipulation_type,
        analysis.explanation_text,
        JSON.stringify(analysis.metadata_analysis),
        JSON.stringify(analysis.frame_timeline),
        JSON.stringify(analysis.references || [])
      );

      res.json({
        id: uploadId,
        ...analysis,
        fileName
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: error.message || 'Analysis failed' });
    }
  });

  // History
  app.get('/api/reports', authenticateToken, (req: any, res) => {
    const reports = db.prepare(`
      SELECT r.*, u.file_name, u.file_type 
      FROM reports r 
      JOIN uploads u ON r.upload_id = u.id 
      WHERE u.user_id = ?
            ORDER BY r.created_at DESC
              `).all(req.user.id).map((r: any) => ({
      ...r,
      metadata_analysis: JSON.parse(r.metadata_analysis || '{}'),
      frame_timeline: JSON.parse(r.frame_timeline || 'null'),
      references: JSON.parse(r.references_data || '[]')
    }));
    res.json(reports);
  });

  // PDF Generation
  app.get('/api/reports/:id/pdf', authenticateToken, (req: any, res) => {
    const report: any = db.prepare(`
      SELECT r.*, u.file_name, u.file_type, u.file_hash
      FROM reports r 
      JOIN uploads u ON r.upload_id = u.id 
      WHERE r.id = ? AND u.user_id = ?
            `).get(req.params.id, req.user.id);

    if (!report) return res.status(404).send('Report not found');

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename = TruthGuard_Report_${report.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(25).text('TruthGuard AI Forensic Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report ID: ${report.id} `);
    doc.text(`Date: ${new Date(report.created_at).toLocaleString()} `);
    doc.text(`File Name: ${report.file_name} `);
    doc.text(`File Type: ${report.file_type} `);
    doc.text(`SHA - 256 Hash: ${report.file_hash} `);
    doc.moveDown();
    doc.fontSize(18).text('Analysis Summary', { underline: true });
    doc.fontSize(14).text(`Authenticity Score: ${report.authenticity_score}% `);
    doc.text(`Confidence Level: ${report.confidence_level} `);
    doc.text(`Risk Level: ${report.risk_level} `);
    doc.text(`Manipulation Type: ${report.manipulation_type} `);
    doc.moveDown();
    doc.fontSize(16).text('Forensic Explanation');
    doc.fontSize(12).text(report.explanation_text);
    doc.moveDown();
    doc.text('--- End of Report ---', { align: 'center' });
    doc.end();
  });

  // Admin Analytics
  app.get('/api/admin/stats', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);

    const totalUploads = db.prepare('SELECT COUNT(*) as count FROM uploads').get() as any;
    const riskStats = db.prepare('SELECT risk_level, COUNT(*) as count FROM reports GROUP BY risk_level').all();
    const recentLogs = db.prepare('SELECT a.*, u.name FROM audit_logs a JOIN users u ON a.user_id = u.id ORDER BY timestamp DESC LIMIT 10').all();

    res.json({
      totalUploads: totalUploads.count,
      riskStats,
      recentLogs
    });
  });

  // Serve Static Assets in Production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TruthGuard AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
