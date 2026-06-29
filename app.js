(function () {
  const create = (tag, attrs = {}) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else el[k] = v;
    });
    return el;
  };

  // Y2K black & pink styling injected for the photobooth
  const style = document.createElement('style');
  style.textContent = `
    :root{--pink:#ff2d95;--hotpink:#ff66b2;--black:#050406}
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,var(--black) 0%, #0b0b0d 100%);font-family:'Bitcount Grid Double',system-ui, sans-serif;color:var(--hotpink)}
    .photobooth{width:min(100%,980px);padding:22px;border-radius:20px;background:linear-gradient(180deg,rgba(255,20,120,0.04),rgba(0,0,0,0.4));box-shadow:0 20px 60px rgba(0,0,0,0.7);border:2px solid rgba(255,45,149,0.12);}
    .photobooth h1{margin:0;font-size:2.2rem;color:var(--pink);text-shadow:0 2px 0 rgba(0,0,0,0.6);text-align:center;margin-bottom:16px;}
    .preview-wrap{position:relative;border-radius:14px;overflow:hidden;border:3px solid rgba(255,45,149,0.08);width:100%;max-width:500px;margin:0 auto;}
    video.preview{width:100%;height:auto;display:block;object-fit:cover;background:#000}
    .countdown{position:absolute;inset:12px;display:flex;align-items:flex-end;justify-content:flex-end;padding:12px;pointer-events:none}
    .countdown .bubble{background:rgba(0,0,0,0.6);color:var(--pink);font-weight:700;padding:8px 12px;border-radius:999px;font-size:1.4rem;border:2px solid rgba(255,45,149,0.18)}
    .controls{display:flex;flex-direction:column;gap:12px;margin-top:12px;max-width:500px;margin-left:auto;margin-right:auto;}
    .controls button{width:100%;padding:14px;border-radius:12px;border:0;background:linear-gradient(90deg,var(--pink),#ff5aa0);color:#0b0b0d;font-weight:700;cursor:pointer;font-size:1rem}
    .controls button.secondary{background:transparent;border:2px dashed rgba(255,45,149,0.14);color:var(--hotpink)}
    .status{margin-top:10px;text-align:center;color:rgba(255,102,178,0.9)}
    .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:16px}
    .shot{background:linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.35));padding:10px;border-radius:12px;border:1px solid rgba(255,45,149,0.06);text-align:center;}
    .shot img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;border-radius:8px}
    .download{display:inline-block;margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--pink);color:#0b0b0d;text-decoration:none;font-weight:700;font-size:0.85rem;}
  `;
  document.head.appendChild(style);

  // Build DOM
  const container = create('div', { className: 'photobooth' });
  const title = create('h1', { text: 'Y2K Photobooth' });
  const previewWrap = create('div', { className: 'preview-wrap' });
  const video = create('video', { className: 'preview', autoplay: true, playsInline: true, muted: true });
  const countdownWrap = create('div', { className: 'countdown' });
  const countdownBubble = create('div', { className: 'bubble', text: '' });
  countdownWrap.appendChild(countdownBubble);

  const status = create('div', { className: 'status', text: 'Waiting for camera access...' });
  const controls = create('div', { className: 'controls' });
  const startSequence = create('button', { text: 'Start 4×3s Sequence', disabled: true });
  const takeOne = create('button', { className: 'secondary', text: 'Take Single Square' });
  const getStripBtn = create('button', { text: 'Get Photostrip', style: 'background: linear-gradient(90deg, #ff007f, #ff66b2); display: none; color:#0b0b0d;' });
  const gallery = create('div', { className: 'gallery' });
  const canvas = create('canvas');

  previewWrap.appendChild(video);
  previewWrap.appendChild(countdownWrap);
  controls.appendChild(startSequence);
  controls.appendChild(takeOne);
  controls.appendChild(getStripBtn);
  container.append(title, previewWrap, status, controls, gallery);
  document.body.appendChild(container);

  const updateStatus = msg => (status.textContent = msg);
  let streamRef = null;

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => {
      streamRef = stream;
      video.srcObject = stream;
      startSequence.disabled = false;
      updateStatus('Camera ready — press "Start 4×3s Sequence" to begin.');
    })
    .catch(err => {
      console.error(err);
      updateStatus('Unable to access camera. Allow webcam permissions and reload.');
    });

  // Capture a clean 1:1 square from the center of the video feed
  const captureSquare = () => {
    const videoW = video.videoWidth || 1280;
    const videoH = video.videoHeight || 720;
    const size = Math.min(videoW, videoH);
    
    const sx = (videoW - size) / 2;
    const sy = (videoH - size) / 2;

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    return canvas.toDataURL('image/png');
  };

  const addShotToGallery = (dataUrl) => {
    const shot = create('div', { className: 'shot' });
    const img = create('img');
    img.src = dataUrl;
    const link = create('a', { className: 'download', href: dataUrl, download: `square-${Date.now()}.png`, text: 'Download' });
    shot.append(img, link);
    gallery.prepend(shot);
  };

  takeOne.addEventListener('click', () => {
    if (!video.srcObject) return;
    const data = captureSquare();
    addShotToGallery(data);
    updateStatus('Single square photo taken.');
  });

  let capturedSequencePhotos = [];

  startSequence.addEventListener('click', async () => {
    if (!video.srcObject) return;
    startSequence.disabled = true;
    takeOne.disabled = true;
    getStripBtn.style.display = 'none';
    updateStatus('Sequence started.');
    
    capturedSequencePhotos = [];
    const total = 4;
    
    for (let i = 1; i <= total; i++) {
      for (let t = 3; t >= 1; t--) {
        countdownBubble.textContent = t;
        await new Promise(r => setTimeout(r, 1000));
      }
      countdownBubble.textContent = 'CHEESE!';
      const data = captureSquare();
      capturedSequencePhotos.push(data);
      addShotToGallery(data);
      updateStatus(`Captured ${i}/${total}`);
      await new Promise(r => setTimeout(r, 600));
      countdownBubble.textContent = '';
    }
    
    sessionStorage.setItem('photostrip_photos', JSON.stringify(capturedSequencePhotos));
    updateStatus('Sequence complete! Click "Get Photostrip" to assemble your custom strip page.');
    startSequence.disabled = false;
    takeOne.disabled = false;
    getStripBtn.style.display = 'block';
  });

  getStripBtn.addEventListener('click', () => {
    window.location.href = 'strip.html';
  });

  window.addEventListener('beforeunload', () => {
    if (streamRef) streamRef.getTracks().forEach(t => t.stop());
  });
  document.addEventListener('mousemove', (e) => {
  // Create a sparkle element
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  
  // Set position directly at the cursor
  sparkle.style.left = `${e.pageX}px`;
  sparkle.style.top = `${e.pageY}px`;
  
  // Give it a tiny bit of random drift for a floaty effect
  const randomX = (Math.random() - 0.5) * 20;
  const randomY = (Math.random() - 0.5) * 20;
  sparkle.style.setProperty('--driftX', `${randomX}px`);
  sparkle.style.setProperty('--driftY', `${randomY}px`);

  // Randomly alternate colors between hot pink, baby pink, and white
  const colors = ['#ff69b4', '#ffb6c1', '#ffffff', '#ff1493'];
  sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

  document.body.appendChild(sparkle);
  
  // Clean up the element from the DOM after the animation finishes
  setTimeout(() => {
    sparkle.remove();
  }, 800);
})();
