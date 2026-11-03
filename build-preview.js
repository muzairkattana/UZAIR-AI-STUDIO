const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');

const startMarker = 'id="internship"';
const endMarker = 'id="process"';

const startIndex = indexHtml.lastIndexOf('<section', indexHtml.indexOf(startMarker));
const endIndex = indexHtml.lastIndexOf('<section', indexHtml.indexOf(endMarker));

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found');
  process.exit(1);
}

const internshipSection = indexHtml.substring(startIndex, endIndex).trim();

const previewDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Internship Portal Live Preview - Uzair AI Studio</title>
  <link rel="stylesheet" href="/css/style.css">
  <style>
    body {
      background: #F8FAFC;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .preview-topbar {
      background: #1D4ED8;
      color: #FFFFFF;
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
    }
  </style>
</head>
<body>
  <div class="preview-topbar">
    <div>
      🎓 <strong>Uzair AI Studio</strong> &bull; 2-Month Internship & Training Program Portal Preview
    </div>
    <div>
      <a href="/" style="color:#FFFFFF; text-decoration:underline; font-weight:700;">Visit Full Website &rarr;</a>
    </div>
  </div>

  ${internshipSection}

  <script src="/js/main.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'public', 'preview-internship.html'), previewDoc, 'utf8');
console.log('Successfully wrote public/preview-internship.html! Size:', previewDoc.length);
