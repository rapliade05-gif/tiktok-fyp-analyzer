// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const { analyzeCaption, scoreFromMetrics, analyzeCSVRecords } = require('./utils/analyzer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// upload setup
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, uuidv4() + '-' + file.originalname)
});
const upload = multer({ storage });

// Endpoint analyze caption (JSON)
app.post('/api/analyze', (req, res) => {
  try {
    const { caption = '', sound = '', timezone = 'Asia/Jakarta' } = req.body || {};
    if (!caption) return res.status(400).json({ error: 'caption required' });

    const analysis = analyzeCaption(caption, { sound, timezone });
    // score and recommendations
    const scoreObj = scoreFromMetrics(analysis);
    res.json({ success: true, analysis, score: scoreObj.score, recommendations: scoreObj.recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

// Endpoint upload CSV (user performance history)
// expects CSV with columns: date, caption, views, likes, comments, sound, hashtags
app.post('/api/upload-csv', upload.single('csv'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const filePath = req.file.path;
    const records = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => records.push(data))
      .on('end', () => {
        // analyze CSV records (simple stats)
        const report = analyzeCSVRecords(records);
        // remove uploaded file
        fs.unlink(filePath, () => {});
        res.json({ success: true, report });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.get('/ping', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));
