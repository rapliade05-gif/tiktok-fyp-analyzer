// utils/analyzer.js
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

function extractHashtags(text){
  const re = /#(\w*[A-Za-z]+\w*)/g;
  const matches = [];
  let m;
  while ((m = re.exec(text)) !== null){
    matches.push(m[1].toLowerCase());
  }
  return [...new Set(matches)];
}

function extractEmojis(text){
  // simple emoji regex (not perfect but works for many cases)
  const re = /([\u231A-\uD83E\uDDFF])/g;
  const matches = text.match(re) || [];
  return matches;
}

function wordsFromText(text){
  return text
    .replace(/[#@]/g, ' ')
    .replace(/[.,!?;:\-\/()\[\]\"]+/g,'')
    .split(/\s+/)
    .map(s=>s.trim().toLowerCase())
    .filter(Boolean);
}

function suggestHashtagsFromKeywords(words, count=8){
  // very simple suggestions: pick top words excluding stopwords
  const stop = new Set(['yang','dan','di','ke','dengan','untuk','ini','itu','saat','lagi','saya','kamu','kita','iya','tdk','tidak']);
  const freq = {};
  words.forEach(w => { if (!stop.has(w) && w.length>2) freq[w] = (freq[w]||0)+1 });
  const sorted = Object.keys(freq).sort((a,b)=>freq[b]-freq[a]).slice(0,count);
  return sorted.map(s => s.replace(/[^a-z0-9]/g,'')).filter(Boolean).slice(0,count);
}

function analyzeCaption(caption, opts={}){
  const hashtags = extractHashtags(caption);
  const emojis = extractEmojis(caption);
  const words = wordsFromText(caption);
  const sentimentRes = sentiment.analyze(caption);
  const lengthChars = caption.length;
  const lengthWords = words.length;

  const suggested = suggestHashtagsFromKeywords(words.concat(hashtags));

  const hasCTA = /(?:klik|link|lihat|ketuk|follow|ikuti|like|share|bagikan|comment|komen)/i.test(caption);

  return {
    caption,
    hashtags,
    hashtag_count: hashtags.length,
    suggested_hashtags: suggested,
    emojis_count: emojis.length,
    emojis_sample: emojis.slice(0,5),
    words_count: lengthWords,
    chars_count: lengthChars,
    sentiment: sentimentRes, // includes score & comparative
    has_cta: !!hasCTA,
    sound: opts.sound || null,
    timezone: opts.timezone || 'Asia/Jakarta'
  };
}

function scoreFromMetrics(analysis){
  // simple heuristic scoring 0-100
  let score = 50;
  const rec = [];

  // caption length
  if (analysis.chars_count > 20 && analysis.chars_count <= 150) score += 8; else if (analysis.chars_count <= 20) score -= 5;

  // hashtags
  if (analysis.hashtag_count >= 1 && analysis.hashtag_count <= 5) score += 10; else if (analysis.hashtag_count > 8) score -= 6;

  // CTA
  if (analysis.has_cta) score += 8; else rec.push('Tambahkan CTA (mis. "ikuti untuk lebih banyak")');

  // sentiment
  if (analysis.sentiment.score >= 0) score += 5; else score -= 6;

  // emojis
  if (analysis.emojis_count >=1 && analysis.emojis_count <=3) score += 4;

  // suggested hashtags presence
  if (analysis.suggested_hashtags && analysis.suggested_hashtags.length>0) rec.push('Pertimbangkan hashtag tambahan: ' + analysis.suggested_hashtags.join(', '));

  // time posting suggestion basic
  rec.push('Waktu posting umum terbaik: 18:00 - 22:00 (sesuaikan dengan audiens)');

  // normalize
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return { score: Math.round(score), recommendations: rec };
}

function analyzeCSVRecords(records){
  // records: array of objects (strings). We'll compute simple stats: avg views, top hashtags, best posting time by hour (if date provided)
  const total = { posts: 0, views:0, likes:0 };
  const hashtagFreq = {};
  const hourFreq = {};

  records.forEach(r => {
    total.posts += 1;
    const views = Number(r.views) || 0;
    const likes = Number(r.likes) || 0;
    total.views += views;
    total.likes += likes;

    // hashtags column may be like "#tag1 #tag2"
    const tags = (r.hashtags || '').match(/#(\w+)/g) || [];
    tags.forEach(t => { const k = t.replace('#','').toLowerCase(); hashtagFreq[k] = (hashtagFreq[k]||0)+1 });

    // date -> hour
    const dateStr = r.date || r.timestamp || r.posted_at || '';
    const d = new Date(dateStr);
    if (!isNaN(d)){
      const h = d.getHours();
      hourFreq[h] = (hourFreq[h]||0)+1;
    }
  });

  const avgViews = total.posts? Math.round(total.views/total.posts):0;
  const avgLikes = total.posts? Math.round(total.likes/total.posts):0;
  const topHashtags = Object.keys(hashtagFreq).sort((a,b)=>hashtagFreq[b]-hashtagFreq[a]).slice(0,10);
  const bestHour = Object.keys(hourFreq).length ? Object.keys(hourFreq).sort((a,b)=>hourFreq[b]-hourFreq[a])[0] : null;

  return { totalPosts: total.posts, avgViews, avgLikes, topHashtags, bestPostingHour: bestHour };
}

module.exports = { analyzeCaption, scoreFromMetrics, analyzeCSVRecords };
