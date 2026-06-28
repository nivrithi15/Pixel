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

console.log('Linking complete.');
