const fs = require('fs');
const path = require('path');

// Files to connect
const files = [
	{ html: 'index.html', css: 'style.css' },
	{ html: 'about.html', css: 'style1.css' }
];
const scriptTag = '<script src="app.js"></script>';

function ensureLink(html, cssFile) {
	const linkTag = `<link rel="stylesheet" href="${cssFile}">`;
	if (html.includes(linkTag)) return html;
	// insert link into <head> if present, otherwise at top
	if (html.includes('<head')) {
		return html.replace(/<head[^>]*>/i, match => match + '\n    ' + linkTag);
	}
	return linkTag + '\n' + html;
}

function ensureScript(html) {
	if (html.includes(scriptTag)) return html;
	// insert before closing body if present
	if (html.includes('</body>')) {
		return html.replace(/<\/body>/i, scriptTag + '\n</body>');
	}
	return html + '\n' + scriptTag;
}

files.forEach(({ html, css }) => {
	const filePath = path.join(__dirname, html);
	if (!fs.existsSync(filePath)) {
		console.warn(`${html} not found at ${filePath}`);
		return;
	}
	let content = fs.readFileSync(filePath, 'utf8');
	content = ensureLink(content, css);
	content = ensureScript(content);
	fs.writeFileSync(filePath, content, 'utf8');
	console.log(`Updated ${html} -> linked ${css} and app.js`);
});

// Also ensure app.js exists (create empty if missing)
const appPath = path.join(__dirname, 'app.js');
if (!fs.existsSync(appPath)) {
	fs.writeFileSync(appPath, "// app.js\n", 'utf8');
	console.log('Created app.js');
}

// Ensure CSS files exist (create empty if missing)
['style.css', 'style1.css'].forEach(fn => {
	const p = path.join(__dirname, fn);
	if (!fs.existsSync(p)) {
		fs.writeFileSync(p, `/* ${fn} */\n`, 'utf8');
		console.log(`Created ${fn}`);
	}
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
});

console.log('Linking complete.');
