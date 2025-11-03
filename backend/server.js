/**
 * Backend Proxy Server for Gemini Voice Chat
 * 
 * ⚠️ זה דורש שינויים גם ב-client code!
 * 
 * השרת הזה משמש כ-proxy עבור Gemini API, אבל צריך גם לשנות את ה-client
 * כדי שיעבוד דרך ה-backend במקום ישירות ל-Gemini API.
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend proxy is running' });
});

/**
 * ⚠️ בעיה: Gemini Live API משתמש ב-WebSocket
 * זה דורש proxy מורכב יותר מ-REST API רגיל
 * 
 * הפתרון הפשוט יותר: הגבלות על API key
 * הפתרון המורכב: WebSocket proxy (דורש יותר עבודה)
 */

// דוגמה ל-proxy עבור REST API (אם היו משתמשים ב-REST במקום Live)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    // כאן היית עושה קריאה ל-Gemini API
    // אבל כרגע האפליקציה משתמשת ב-Live API (WebSocket)
    // שדורש גישה שונה
    
    res.json({ 
      message: 'This endpoint is for REST API. Live API requires WebSocket proxy.',
      note: 'Consider using API key restrictions instead for demos'
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = createServer(app);

// WebSocket Server for proxy (מורכב יותר - דורש מימוש מלא)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket proxy');
  
  // כאן היית יוצר WebSocket connection ל-Gemini API
  // ומעביר הודעות בין client ל-Gemini
  
  ws.on('message', (message) => {
    // Relay message to Gemini API
    // זה דורש מימוש מלא של WebSocket proxy
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Backend proxy server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready for connections`);
  console.log('\n⚠️  Note: This requires changes to client code to work through proxy');
});

