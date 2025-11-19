// public/app.js
async function postJSON(url, data){
  const resp = await fetch(url, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  return resp.json();
}

document.getElementById('analyzeBtn').addEventListener('click', async ()=> {
  const caption = document.getElementById('caption').value.trim();
  const sound = document.getElementById('sound').value.trim();
  const resultDiv = document.getElementById('result');
  if (!caption) return alert('Masukkan caption terlebih dahulu');
  resultDiv.innerHTML = 'Menganalisis...';
  try {
    const data = await postJSON('/api/analyze', { caption, sound });
    if (data.error) return resultDiv.innerHTML = 'Error: ' + data.error;
    // show results
    const a = data.analysis;
    resultDiv.innerHTML = `
      <h3>Hasil Analisis</h3>
      <p><strong>Skor peluang FYP:</strong> ${data.score}/100</p>
      <p><strong>Jumlah hashtag:</strong> ${a.hashtag_count} • <strong>Emoji:</strong> ${a.emojis_count} • <strong>Words:</strong> ${a.words_count}</p>
      <p><strong>Hashtags ditemukan:</strong> ${a.hashtags.join(', ') || '-'}</p>
      <p><strong>Hashtag saran:</strong> ${a.suggested_hashtags.join(', ')}</p>
      <p><strong>CTA:</strong> ${a.has_cta? 'Ada' : 'Tidak ada'}</p>
      <p><strong>Sentiment score:</strong> ${a.sentiment.score} (comparative: ${a.sentiment.comparative})</p>
      <div><strong>Rekomendasi:</strong><ul>${data.recommendations.map(r=>'<li>'+r+'</li>').join('')}</ul></div>
      <div style="margin-top:8px"><button id="copyBtn">Salin caption + hashtag</button></div>
    `;
    document.getElementById('copyBtn').addEventListener('click', ()=>{
      const toCopy = caption + '\n\n' + (a.suggested_hashtags.map(h=>('#'+h)).join(' '));
      navigator.clipboard.writeText(toCopy).then(()=>alert('Tersalin ke clipboard'));
    });
  } catch(err){
    console.error(err);
    resultDiv.innerHTML = 'Terjadi kesalahan';
  }
});

// CSV upload
document.getElementById('uploadCsv').addEventListener('click', async ()=> {
  const fileInput = document.getElementById('csvfile');
  const out = document.getElementById('csvResult');
  if (!fileInput.files.length) return alert('Pilih file CSV terlebih dahulu');
  const fd = new FormData();
  fd.append('csv', fileInput.files[0]);
  out.innerHTML = 'Mengunggah & menganalisis...';
  try {
    const resp = await fetch('/api/upload-csv', { method:'POST', body: fd });
    const data = await resp.json();
    if (data.error) return out.innerHTML = 'Error: ' + data.error;
    const r = data.report;
    out.innerHTML = `
      <h3>Laporan CSV</h3>
      <p>Total post: ${r.totalPosts}</p>
      <p>Avg views: ${r.avgViews} • Avg likes: ${r.avgLikes}</p>
      <p>Top hashtags: ${r.topHashtags.join(', ')}</p>
      <p>Best posting hour (most posts): ${r.bestPostingHour ?? '-'}:00</p>
    `;
  } catch(err){ console.error(err); out.innerHTML = 'Terjadi kesalahan'; }
});
