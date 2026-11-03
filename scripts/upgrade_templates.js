const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'public', 'assets', 'verfication');
const pubDir = path.join(__dirname, '..', 'public');

console.log('--- Upgrading Verification Documents ---');

// 1. Upgrade Offer Letter
function upgradeOfferLetter() {
  const srcFile = path.join(srcDir, 'internship_offer_letter.html');
  let content = fs.readFileSync(srcFile, 'utf8');

  // Replace script src to include local qrcode.js
  content = content.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>',
    '<script src="/js/qrcode.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>'
  );

  // Upgrade tools buttons
  content = content.replace(
    '<div class="tools"><button type="button" onclick="print()">Print / Save as PDF</button></div>',
    '<div class="tools"><button type="button" onclick="print()">🖨️ Print / Save as PDF</button><a id="toolVerifyBtn" href="/verify" target="_blank" style="padding:10px 18px;background:linear-gradient(135deg,#0a2358,#114092);color:#fff;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(10,35,88,.25);display:inline-flex;align-items:center;gap:6px;">🔍 Verify Credential</a></div>'
  );

  // Upgrade script block
  const oldScriptMarker = '<script>\n/* ===== EDIT PER LETTER, or use the link: ?name=Ali+Khan&ref=UAS-LOR-2026-0002&qr=IMAGE_URL&pro=he ===== */';
  const newScript = `<script>
/* ===== UZAIR AI STUDIO - OFFICIAL INTERNSHIP OFFER LETTER ===== */
const DATA = {
  name:    "MUHAMMAD UZAIR",
  role:    "Web Developer Intern",
  program: "Internship & Training Program",
  start:   "1 October 2026",
  end:     "30 November 2026",
  weeks:   "8 weeks",
  date:    "October 01, 2026",
  ref:     "UZ-IN-2026-0001",
  vid:     "ID: UZ-IN-2026-0001",
  email:   "kmuzairkhan123@gmail.com",
  qr:      "",
  verify:  ""
};

const q = new URLSearchParams(location.search);
let queryId = q.get('id') || q.get('ref');
if (!queryId) {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSeg = pathParts[pathParts.length - 1];
  if (lastSeg && !lastSeg.includes('.html') && lastSeg !== 'offer-letter') {
    queryId = lastSeg;
  }
}

const $ = id => document.getElementById(id);
const esc = s => (s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const mo = s => (s||'').replace(/(January|February|March|April|June|July|August|September|October|November|December)/g,m=>m.slice(0,3));

async function initOfferLetter() {
  if (queryId) {
    try {
      const res = await fetch('/api/internship/offer-letter/' + encodeURIComponent(queryId));
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.letter) {
          const l = json.letter;
          DATA.name = l.fullName || DATA.name;
          DATA.role = l.roleName || DATA.role;
          DATA.program = 'Internship & Training Program';
          DATA.start = l.formattedStartDate || DATA.start;
          DATA.end = l.formattedEndDate || DATA.end;
          DATA.weeks = l.duration || DATA.weeks;
          DATA.date = l.formattedIssueDate || DATA.date;
          DATA.ref = l.id || DATA.ref;
          DATA.vid = 'ID: ' + (l.id || DATA.ref);
          DATA.email = l.studioEmail || DATA.email;
        }
      }
    } catch(e) {
      console.warn('Dynamic fetch fallback:', e);
    }
  }

  // Explicit URL query overrides
  Object.keys(DATA).forEach(k => { if(q.get(k)) DATA[k] = q.get(k); });
  
  // Scannable Verification URL for QR Code
  DATA.verify = DATA.verify || (window.location.origin + '/verify?id=' + encodeURIComponent(DATA.ref));

  // Render DOM
  $('to').textContent = 'Dear ' + DATA.name + ',';
  $('subj').innerHTML = '<span>Subject:</span>Offer of Internship – ' + esc(DATA.role) + ' (' + esc(DATA.program) + ')';
  $('body').innerHTML =
   '<p><em>Welcome to UZAIR AI STUDIO.</em> Congratulations! We are delighted to offer you an internship position as a <em>' + esc(DATA.role) + '</em> under our <em>' + esc(DATA.program) + '</em>. This letter confirms your selection and welcomes you to our organization.</p>' +
   '<p>The internship will run from <em>' + esc(DATA.start) + '</em> to <em>' + esc(DATA.end) + '</em>, for a period of <em>' + esc(DATA.weeks) + '</em>.</p>' +
   '<p>During this time you will work on real-world projects, strengthen your technical skills, and gain practical experience under professional guidance. You are expected to carry out your assigned tasks responsibly and to follow all company policies and instructions.</p>' +
   '<p>This internship is designed to give you valuable industry exposure and to help you build the skills your future career requires. Please confirm your acceptance by replying to this letter at ' + esc(DATA.email) + '.</p>' +
   '<p>We look forward to a productive and successful association with you, and we wish you all the best for your professional journey.</p>';

  (function fitBody(){ const b=$('body'); let fs=14.8; b.style.fontSize=fs+'px'; while(b.offsetTop+b.offsetHeight>812 && fs>12.5){ fs-=.2; b.style.fontSize=fs+'px'; } })();
  
  $('c_name').textContent = DATA.name;
  $('c_prog').textContent = DATA.role;
  $('c_dur').textContent = mo(DATA.start) + ' – ' + mo(DATA.end);

  const chipsEl = $('chips');
  chipsEl.innerHTML = '';
  ['Real-world projects','Professional guidance','Practical experience','Industry exposure','8-week program'].forEach(s => {
    const e = document.createElement('span');
    e.textContent = s;
    chipsEl.appendChild(e);
  });

  $('date').textContent = DATA.date;
  $('ref').textContent = DATA.ref;
  $('vid').textContent = DATA.vid;
  $('mail').textContent = DATA.email;

  const toolBtn = $('toolVerifyBtn');
  if (toolBtn) toolBtn.href = DATA.verify;

  // Render Live Unique Scannable QR Code
  const b = $('qrBox');
  b.classList.remove('empty');
  b.style.border = 'none';
  b.innerHTML = '';
  if (DATA.qr) {
    const im = new Image(); im.alt = 'Verification QR code'; im.src = DATA.qr; b.appendChild(im);
  } else if (window.QRCode) {
    try {
      new QRCode(b, {
        text: DATA.verify,
        width: 100,
        height: 100,
        correctLevel: QRCode.CorrectLevel.M
      });
      b.querySelectorAll('img,canvas').forEach(el => { el.style.width = '100%'; el.style.height = '100%'; });
    } catch(err) {
      console.error('QR code generation error:', err);
    }
  }

  document.title = 'Internship Offer Letter – ' + DATA.name;
}

initOfferLetter();

let Sc=1,rx=0,ry=0;
const apply=()=>{ $('stage').style.transform='perspective(2400px) scale('+Sc+') rotateX('+rx+'deg) rotateY('+ry+'deg)'; };
function fit(){ Sc=Math.min(innerWidth/794,innerHeight/1123)*.97; apply(); }
addEventListener('resize',fit); fit();
if(matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches){
  addEventListener('pointermove',e=>{ const x=e.clientX/innerWidth,y=e.clientY/innerHeight; ry=+((x-.5)*4).toFixed(2); rx=+((.5-y)*3).toFixed(2); apply();
    $('page').style.setProperty('--mx',(x*100)+'%'); $('page').style.setProperty('--my',(y*100)+'%'); });
  document.addEventListener('pointerleave',()=>{ rx=ry=0; apply(); });
}
</script>`;

  const scriptSplitIdx = content.indexOf('<script>\n/* ===== EDIT PER LETTER');
  if (scriptSplitIdx !== -1) {
    content = content.substring(0, scriptSplitIdx) + newScript + '\n</body>\n</html>';
  } else {
    // fallback if marker slightly different
    const fallbackIdx = content.lastIndexOf('<script>');
    content = content.substring(0, fallbackIdx) + newScript + '\n</body>\n</html>';
  }

  fs.writeFileSync(path.join(pubDir, 'offer-letter.html'), content, 'utf8');
  fs.writeFileSync(srcFile, content, 'utf8');
  console.log('✅ Upgraded Offer Letter (public/offer-letter.html)');
}

// 2. Upgrade Recommendation Letter
function upgradeRecommendationLetter() {
  const srcFile = path.join(srcDir, 'letter_of_recommendation (1).html');
  let content = fs.readFileSync(srcFile, 'utf8');

  // Replace script src
  content = content.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>',
    '<script src="/js/qrcode.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>'
  );

  // Upgrade tools buttons
  content = content.replace(
    '<div class="tools"><button type="button" onclick="print()">Print / Save as PDF</button></div>',
    '<div class="tools"><button type="button" onclick="print()">🖨️ Print / Save as PDF</button><a id="toolVerifyBtn" href="/verify" target="_blank" style="padding:10px 18px;background:linear-gradient(135deg,#0a2358,#114092);color:#fff;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(10,35,88,.25);display:inline-flex;align-items:center;gap:6px;">🔍 Verify Credential</a></div>'
  );

  const newScript = `<script>
/* ===== UZAIR AI STUDIO - OFFICIAL LETTER OF RECOMMENDATION ===== */
const DATA = {
  name:    "MUHAMMAD UZAIR",
  pro:     "he",
  program: "Web Development",
  start:   "1 August 2026",
  end:     "30 September 2026",
  date:    "September 30, 2026",
  ref:     "UZ-LOR-2026-0001",
  vid:     "ID: UZ-LOR-2026-0001",
  email:   "kmuzairkhan123@gmail.com",
  qr:      "",
  verify:  ""
};

const q = new URLSearchParams(location.search);
let queryId = q.get('id') || q.get('ref');
if (!queryId) {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSeg = pathParts[pathParts.length - 1];
  if (lastSeg && !lastSeg.includes('.html') && lastSeg !== 'recommendation-letter') {
    queryId = lastSeg;
  }
}

const $ = id => document.getElementById(id);
const esc = s => (s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const mo = s => (s||'').replace(/(January|February|March|April|June|July|August|September|October|November|December)/g,m=>m.slice(0,3));

function showLockModal(lockInfo) {
  const overlay = document.createElement('div');
  overlay.id = 'lockModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,15,30,0.92);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;';
  overlay.innerHTML = \`
    <div style="background:#FFFFFF;border-radius:20px;max-width:540px;width:100%;padding:36px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.4);">
      <div style="width:72px;height:72px;border-radius:50%;background:#FEF3C7;color:#D97706;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:32px;">🔒</div>
      <h2 style="margin:0 0 10px;font-size:24px;color:#0F172A;font-weight:800;">Recommendation Letter Locked</h2>
      <p style="margin:0 0 20px;color:#64748B;font-size:15px;line-height:1.6;">\${lockInfo && lockInfo.message ? lockInfo.message : 'Letter of Recommendation is strictly issued upon successful completion of the full 2-month internship tenure.'}</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin-bottom:24px;display:flex;justify-content:space-around;">
        <div><div style="font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;">Days Remaining</div><div style="font-size:22px;font-weight:800;color:#2563EB;">\${lockInfo && lockInfo.daysRemaining !== undefined ? lockInfo.daysRemaining : 'Active'}</div></div>
        <div style="border-left:1px solid #E2E8F0;"></div>
        <div><div style="font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;">Scheduled Release</div><div style="font-size:15px;font-weight:700;color:#0F172A;margin-top:4px;">\${lockInfo && lockInfo.completionDate ? lockInfo.completionDate : 'Ongoing'}</div></div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="/offer-letter?id=\${encodeURIComponent(queryId)}" style="padding:12px 20px;background:#2563EB;color:#FFF;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">📄 View Active Offer Letter</a>
        <a href="/verify?id=\${encodeURIComponent(queryId)}" style="padding:12px 20px;background:#F1F5F9;color:#334155;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid #CBD5E1;">🔍 Check Live Status</a>
      </div>
    </div>
  \`;
  document.body.appendChild(overlay);
}

async function initRecommendationLetter() {
  if (queryId) {
    try {
      const res = await fetch('/api/internship/recommendation-letter/' + encodeURIComponent(queryId));
      if (res.status === 403) {
        const lockInfo = await res.json();
        showLockModal(lockInfo);
        return;
      } else if (res.ok) {
        const json = await res.json();
        if (json.success && json.recommendation) {
          const r = json.recommendation;
          DATA.name = r.fullName || DATA.name;
          DATA.program = r.domain || DATA.program;
          DATA.start = r.formattedStartDate || DATA.start;
          DATA.end = r.formattedEndDate || DATA.end;
          DATA.date = r.formattedIssueDate || DATA.date;
          DATA.ref = r.id || DATA.ref;
          DATA.vid = 'ID: ' + (r.id || DATA.ref);
          DATA.email = r.studioEmail || DATA.email;
          DATA.pro = (r.pronouns && r.pronouns.subject === 'She') ? 'she' : 'he';
        }
      }
    } catch(e) {
      console.warn('Dynamic fetch fallback:', e);
    }
  }

  // Explicit URL query overrides
  Object.keys(DATA).forEach(k => { if(q.get(k)) DATA[k] = q.get(k); });
  DATA.verify = DATA.verify || (window.location.origin + '/verify?id=' + encodeURIComponent(DATA.ref));

  const he = DATA.pro === 'he', S = he ? 'He' : 'She', H = he ? 'His' : 'Her', h = he ? 'his' : 'her';
  const N = '<em>' + esc(DATA.name) + '</em>';
  const O = he ? 'him' : 'her';

  $('subj').innerHTML = '<span>Subject:</span>Recommendation for ' + esc(DATA.name) + ' – ' + esc(DATA.program) + ' Internship';
  $('body').innerHTML =
   '<p>It is with great pleasure that we confirm the successful completion of the <em>' + esc(DATA.program) + '</em> Internship &amp; Training Program by ' + N + ' at UZAIR AI STUDIO. The program ran from ' + esc(DATA.start) + ' to ' + esc(DATA.end) + ' and gave ' + O + ' structured, hands-on experience in a professional development environment.</p>' +
   '<p>Throughout the internship, ' + N + ' demonstrated professionalism, dedication, and a strong sense of responsibility. ' + S + ' adapted quickly to new technologies, collaborated effectively with the team, approached problems with sound judgment, and completed assigned tasks reliably and on time.</p>' +
   '<p>' + H + ' punctuality, enthusiasm, and commitment made a positive contribution to our projects and reflect strong potential for future academic and professional success.</p>' +
   '<p>We are confident that the skills and experience gained at UZAIR AI STUDIO provide a solid foundation for ' + h + ' future endeavors. We <em>recommend ' + esc(DATA.name) + ' without reservation</em> for further educational and professional opportunities, and would be glad to confirm any details on request at ' + esc(DATA.email) + '.</p>';

  (function fitBody(){ const b=$('body'); let fs=14.8; b.style.fontSize=fs+'px'; while(b.offsetTop+b.offsetHeight>812 && fs>12.5){ fs-=.2; b.style.fontSize=fs+'px'; } })();

  $('c_name').textContent = DATA.name;
  $('c_prog').textContent = DATA.program;
  $('c_dur').textContent = mo(DATA.start) + ' – ' + mo(DATA.end);

  const chipsEl = $('chips');
  chipsEl.innerHTML = '';
  ['Professionalism','Dedication','Responsibility','Willingness to learn','Collaboration','Problem solving','Punctuality'].forEach(s => {
    const e = document.createElement('span');
    e.textContent = s;
    chipsEl.appendChild(e);
  });

  $('date').textContent = DATA.date;
  $('ref').textContent = DATA.ref;
  $('vid').textContent = DATA.vid;
  $('mail').textContent = DATA.email;

  const toolBtn = $('toolVerifyBtn');
  if (toolBtn) toolBtn.href = DATA.verify;

  // Render Live Unique Scannable QR Code
  const b = $('qrBox');
  b.classList.remove('empty');
  b.style.border = 'none';
  b.innerHTML = '';
  if (DATA.qr) {
    const im = new Image(); im.alt = 'Verification QR code'; im.src = DATA.qr; b.appendChild(im);
  } else if (window.QRCode) {
    try {
      new QRCode(b, {
        text: DATA.verify,
        width: 100,
        height: 100,
        correctLevel: QRCode.CorrectLevel.M
      });
      b.querySelectorAll('img,canvas').forEach(el => { el.style.width = '100%'; el.style.height = '100%'; });
    } catch(err) {
      console.error('QR code generation error:', err);
    }
  }

  document.title = 'Letter of Recommendation – ' + DATA.name;
}

initRecommendationLetter();

let Sc=1,rx=0,ry=0;
const apply=()=>{ $('stage').style.transform='perspective(2400px) scale('+Sc+') rotateX('+rx+'deg) rotateY('+ry+'deg)'; };
function fit(){ Sc=Math.min(innerWidth/794,innerHeight/1123)*.97; apply(); }
addEventListener('resize',fit); fit();
if(matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches){
  addEventListener('pointermove',e=>{ const x=e.clientX/innerWidth,y=e.clientY/innerHeight; ry=+((x-.5)*4).toFixed(2); rx=+((.5-y)*3).toFixed(2); apply();
    $('page').style.setProperty('--mx',(x*100)+'%'); $('page').style.setProperty('--my',(y*100)+'%'); });
  document.addEventListener('pointerleave',()=>{ rx=ry=0; apply(); });
}
</script>`;

  const scriptSplitIdx = content.indexOf('<script>\n/* ===== EDIT PER LETTER');
  if (scriptSplitIdx !== -1) {
    content = content.substring(0, scriptSplitIdx) + newScript + '\n</body>\n</html>';
  } else {
    const fallbackIdx = content.lastIndexOf('<script>');
    content = content.substring(0, fallbackIdx) + newScript + '\n</body>\n</html>';
  }

  fs.writeFileSync(path.join(pubDir, 'recommendation-letter.html'), content, 'utf8');
  fs.writeFileSync(srcFile, content, 'utf8');
  console.log('✅ Upgraded Recommendation Letter (public/recommendation-letter.html)');
}

// 3. Upgrade Certificate
function upgradeCertificate() {
  const srcFile = path.join(srcDir, 'certificate (3).html');
  let content = fs.readFileSync(srcFile, 'utf8');

  // Insert QR code scripts before tools div
  const toolIdx = content.indexOf('<div class="tools">');
  if (toolIdx !== -1) {
    content = content.substring(0, toolIdx) + 
      '<script src="/js/qrcode.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>\n' + 
      content.substring(toolIdx);
  }

  // Upgrade tools button
  content = content.replace(
    '<div class="tools"><button type="button" onclick="print()">Print / Save as PDF</button></div>',
    '<div class="tools"><button type="button" onclick="print()">🖨️ Print / Save as PDF</button><a id="toolVerifyBtn" href="/verify" target="_blank" style="padding:10px 18px;background:linear-gradient(135deg,#0a2358,#114092);color:#fff;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(10,35,88,.25);display:inline-flex;align-items:center;gap:6px;">🔍 Verify Credential</a></div>'
  );

  const newScript = `<script>
/* ===== UZAIR AI STUDIO - OFFICIAL CERTIFICATE OF COMPLETION ===== */
const DATA = {
  name:   "MUHAMMAD UZAIR",
  course: "Web Development",
  dates:  "1<sup>st</sup> April to 30<sup>th</sup> May 2026 (8 weeks)",
  reg:    "UAS-WD-2026-0001",
  tr:     "1674-6256-37",
  issued: "Issued 30 May 2026",
  verify: "",
  qr:     ""
};

const q = new URLSearchParams(location.search);
let queryId = q.get('id') || q.get('reg') || q.get('ref');
if (!queryId) {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSeg = pathParts[pathParts.length - 1];
  if (lastSeg && !lastSeg.includes('.html') && lastSeg !== 'certificate') {
    queryId = lastSeg;
  }
}

const $ = id => document.getElementById(id);

function showLockModal(lockInfo) {
  const overlay = document.createElement('div');
  overlay.id = 'lockModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,15,30,0.92);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;';
  overlay.innerHTML = \`
    <div style="background:#FFFFFF;border-radius:20px;max-width:540px;width:100%;padding:36px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.4);">
      <div style="width:72px;height:72px;border-radius:50%;background:#FEF3C7;color:#D97706;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:32px;">🔒</div>
      <h2 style="margin:0 0 10px;font-size:24px;color:#0F172A;font-weight:800;">Certificate of Completion Locked</h2>
      <p style="margin:0 0 20px;color:#64748B;font-size:15px;line-height:1.6;">\${lockInfo && lockInfo.message ? lockInfo.message : 'Official Certificate of Completion is locked until successful completion of your 2-month internship duration.'}</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin-bottom:24px;display:flex;justify-content:space-around;">
        <div><div style="font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;">Days Remaining</div><div style="font-size:22px;font-weight:800;color:#2563EB;">\${lockInfo && lockInfo.daysRemaining !== undefined ? lockInfo.daysRemaining : 'Active'}</div></div>
        <div style="border-left:1px solid #E2E8F0;"></div>
        <div><div style="font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;">Award Date</div><div style="font-size:15px;font-weight:700;color:#0F172A;margin-top:4px;">\${lockInfo && lockInfo.completionDate ? lockInfo.completionDate : 'Ongoing'}</div></div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="/offer-letter?id=\${encodeURIComponent(queryId)}" style="padding:12px 20px;background:#2563EB;color:#FFF;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">📄 View Active Offer Letter</a>
        <a href="/verify?id=\${encodeURIComponent(queryId)}" style="padding:12px 20px;background:#F1F5F9;color:#334155;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid #CBD5E1;">🔍 Check Live Status</a>
      </div>
    </div>
  \`;
  document.body.appendChild(overlay);
}

async function initCertificate() {
  if (queryId) {
    try {
      const res = await fetch('/api/internship/certificate/' + encodeURIComponent(queryId));
      if (res.status === 403) {
        const lockInfo = await res.json();
        showLockModal(lockInfo);
        return;
      } else if (res.ok) {
        const json = await res.json();
        if (json.success && json.certificate) {
          const c = json.certificate;
          DATA.name = c.fullName || DATA.name;
          DATA.course = c.domain || DATA.course;
          DATA.dates = c.formattedPeriod ? c.formattedPeriod.replace(/(\\d+)(st|nd|rd|th)/g, '$1<sup>$2</sup>') : DATA.dates;
          DATA.reg = c.id || DATA.reg;
          DATA.tr = (c.id || '1674-6256-37').replace(/[^0-9]/g, '').slice(0, 10) || '1674-6256-37';
          DATA.issued = 'Issued ' + (c.completionDate || '30 May 2026');
        }
      }
    } catch(e) {
      console.warn('Dynamic certificate fetch fallback:', e);
    }
  }

  // Explicit URL query overrides
  ['name','course','dates','reg','tr','issued','verify','qr'].forEach(k => { if(q.get(k)) DATA[k] = q.get(k); });
  DATA.verify = DATA.verify || (window.location.origin + '/verify?id=' + encodeURIComponent(DATA.reg));

  $('recipient').textContent = DATA.name;
  $('b_name').textContent = DATA.name;
  $('b_course').textContent = DATA.course;
  $('b_dates').innerHTML = DATA.dates;
  $('regNo').textContent = DATA.reg;
  $('trId').textContent = DATA.tr;
  $('issued').textContent = DATA.issued;
  $('scan').textContent = 'Scan to verify authenticity';

  const toolBtn = $('toolVerifyBtn');
  if (toolBtn) toolBtn.href = DATA.verify;

  // Render Live Unique Scannable QR Code
  const b = $('qrBox');
  b.classList.remove('empty');
  b.style.border = 'none';
  b.innerHTML = '';
  if (DATA.qr) {
    const im = new Image(); im.alt = 'Verification QR code'; im.src = DATA.qr; b.appendChild(im);
  } else if (window.QRCode) {
    try {
      new QRCode(b, {
        text: DATA.verify,
        width: 100,
        height: 100,
        correctLevel: QRCode.CorrectLevel.M
      });
      b.querySelectorAll('img,canvas').forEach(el => { el.style.width = '100%'; el.style.height = '100%'; });
    } catch(err) {
      console.error('QR code generation error:', err);
    }
  }

  document.title = 'Certificate – ' + DATA.name;
}

initCertificate();

/* scalloped seal edge */
(function(){ const n=40,p=[]; for(let i=0;i<n*2;i++){ const a=i/(n*2)*Math.PI*2, r=i%2?46:50; p.push((50+r*Math.cos(a)).toFixed(2)+'% '+(50+r*Math.sin(a)).toFixed(2)+'%'); }
  $('scallop').style.clipPath='polygon('+p.join(',')+')'; })();

let S=1,rx=0,ry=0;
const apply=()=>{ $('stage').style.transform='perspective(2200px) scale('+S+') rotateX('+rx+'deg) rotateY('+ry+'deg)'; };
function fit(){ S=Math.min(innerWidth/1280,innerHeight/720)*.97; apply(); }
addEventListener('resize',fit); fit();
if(matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches){
  addEventListener('pointermove',e=>{ const x=e.clientX/innerWidth,y=e.clientY/innerHeight; ry=+((x-.5)*5).toFixed(2); rx=+((.5-y)*3).toFixed(2); apply();
    $('cert').style.setProperty('--mx',(x*100)+'%'); $('cert').style.setProperty('--my',(y*100)+'%'); });
  document.addEventListener('pointerleave',()=>{ rx=ry=0; apply(); });
}
</script>`;

  const scriptSplitIdx = content.indexOf('<script>\n/* ===== EDIT PER CERTIFICATE');
  if (scriptSplitIdx !== -1) {
    content = content.substring(0, scriptSplitIdx) + newScript + '\n</body>\n</html>';
  } else {
    const fallbackIdx = content.lastIndexOf('<script>');
    content = content.substring(0, fallbackIdx) + newScript + '\n</body>\n</html>';
  }

  fs.writeFileSync(path.join(pubDir, 'certificate.html'), content, 'utf8');
  fs.writeFileSync(srcFile, content, 'utf8');
  console.log('✅ Upgraded Certificate (public/certificate.html)');
}

// 4. Upgrade Experience Letter
function upgradeExperienceLetter() {
  const srcFile = path.join(srcDir, 'experience_letter.html');
  let content = fs.readFileSync(srcFile, 'utf8');

  // Replace script src
  content = content.replace(
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>',
    '<script src="/js/qrcode.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>'
  );

  // Upgrade tools buttons
  content = content.replace(
    '<div class="tools"><button type="button" onclick="print()">Print / Save as PDF</button></div>',
    '<div class="tools"><button type="button" onclick="print()">🖨️ Print / Save as PDF</button><a id="toolVerifyBtn" href="/verify" target="_blank" style="padding:10px 18px;background:linear-gradient(135deg,#0a2358,#114092);color:#fff;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(10,35,88,.25);display:inline-flex;align-items:center;gap:6px;">🔍 Verify Credential</a></div>'
  );

  const newScript = `<script>
/* ===== UZAIR AI STUDIO - OFFICIAL EXPERIENCE LETTER ===== */
const DATA = {
  name:    "MUHAMMAD UZAIR",             /* Default: Employee / Intern Name */
  pro:     "he",                        /* she or he */
  role:    "Web Developer",             /* job title */
  start:   "1 January 2026",
  end:     "30 September 2026",
  date:    "October 01, 2026",
  ref:     "UZ-EXP-2026-0001",
  vid:     "ID: UZ-EXP-2026-0001",
  email:   "kmuzairkhan123@gmail.com",
  qr:      "",
  verify:  ""
};

const q = new URLSearchParams(location.search);
let queryId = q.get('id') || q.get('ref');
if (!queryId) {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSeg = pathParts[pathParts.length - 1];
  if (lastSeg && !lastSeg.includes('.html') && lastSeg !== 'experience-letter') {
    queryId = lastSeg;
  }
}

const $ = id => document.getElementById(id);
const esc = s => (s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const mo = s => (s||'').replace(/(January|February|March|April|June|July|August|September|October|November|December)/g,m=>m.slice(0,3));

function showLockModal(lockInfo) {
  const overlay = document.createElement('div');
  overlay.id = 'lockModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,15,30,0.92);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;';
  overlay.innerHTML = \`
    <div style="background:#FFFFFF;border-radius:20px;max-width:540px;width:100%;padding:36px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,0.4);">
      <div style="width:72px;height:72px;border-radius:50%;background:#FEF3C7;color:#D97706;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:32px;">🔒</div>
      <h2 style="margin:0 0 10px;font-size:24px;color:#0F172A;font-weight:800;">Experience Letter Locked</h2>
      <p style="margin:0 0 20px;color:#64748B;font-size:15px;line-height:1.6;">\${lockInfo && lockInfo.message ? lockInfo.message : 'Official Experience Letter is issued upon completing the full internship / tenure.'}</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin-bottom:24px;display:flex;justify-content:space-around;">
        <div><div style="font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;">Days Remaining</div><div style="font-size:22px;font-weight:800;color:#2563EB;">\${lockInfo && lockInfo.daysRemaining !== undefined ? lockInfo.daysRemaining : 'Active'}</div></div>
        <div style="border-left:1px solid #E2E8F0;"></div>
        <div><div style="font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;">Completion Date</div><div style="font-size:15px;font-weight:700;color:#0F172A;margin-top:4px;">\${lockInfo && lockInfo.completionDate ? lockInfo.completionDate : 'Ongoing'}</div></div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="/offer-letter?id=\${encodeURIComponent(queryId)}" style="padding:12px 20px;background:#2563EB;color:#FFF;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">📄 View Active Offer Letter</a>
        <a href="/verify?id=\${encodeURIComponent(queryId)}" style="padding:12px 20px;background:#F1F5F9;color:#334155;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid #CBD5E1;">🔍 Check Live Status</a>
      </div>
    </div>
  \`;
  document.body.appendChild(overlay);
}

async function initExperienceLetter() {
  if (queryId) {
    try {
      const res = await fetch('/api/internship/experience-letter/' + encodeURIComponent(queryId));
      if (res.status === 403) {
        const lockInfo = await res.json();
        showLockModal(lockInfo);
        return;
      } else if (res.ok) {
        const json = await res.json();
        if (json.success && json.letter) {
          const l = json.letter;
          DATA.name = l.fullName || DATA.name;
          DATA.role = l.role || DATA.role;
          DATA.start = l.formattedStartDate || DATA.start;
          DATA.end = l.formattedEndDate || DATA.end;
          DATA.date = l.formattedIssueDate || DATA.date;
          DATA.ref = l.id || DATA.ref;
          DATA.vid = 'ID: ' + (l.id || DATA.ref);
          DATA.email = l.studioEmail || DATA.email;
          DATA.pro = (l.pronouns && l.pronouns.subject === 'She') ? 'she' : 'he';
        }
      }
    } catch(e) {
      console.warn('Dynamic experience fetch fallback:', e);
    }
  }

  // Explicit URL query overrides
  Object.keys(DATA).forEach(k => { if(q.get(k)) DATA[k] = q.get(k); });
  DATA.verify = DATA.verify || (window.location.origin + '/verify?id=' + encodeURIComponent(DATA.ref));

  const he = DATA.pro === 'he', S = he ? 'He' : 'She', H = he ? 'His' : 'Her', h = he ? 'his' : 'her';
  const N = '<em>' + esc(DATA.name) + '</em>';

  $('subj').innerHTML = '<span>Subject:</span>Experience Certificate – ' + esc(DATA.name) + ', ' + esc(DATA.role);
  $('body').innerHTML =
   '<p>This is to certify that ' + N + ' worked with <em>UZAIR AI STUDIO</em> as a <em>' + esc(DATA.role) + '</em> from <em>' + esc(DATA.start) + '</em> to <em>' + esc(DATA.end) + '</em>.</p>' +
   '<p>During this period, ' + N + ' carried out ' + h + ' duties with professionalism, dedication, and a strong sense of responsibility. ' + S + ' worked well with the team, adapted quickly to new tools and technologies, and handled assigned tasks reliably and to a good standard.</p>' +
   '<p>' + H + ' conduct and work ethic remained professional throughout ' + h + ' time with us, and ' + h + ' contribution was valued by the team and by the studio.</p>' +
   '<p>We thank ' + N + ' for ' + h + ' service and wish ' + (he ? 'him' : 'her') + ' every success in ' + h + ' future career. This certificate is issued on request for whatever purpose it may serve, and any verification may be requested at ' + esc(DATA.email) + '.</p>';

  (function fitBody(){ const b=$('body'); let fs=14.8; b.style.fontSize=fs+'px'; while(b.offsetTop+b.offsetHeight>812 && fs>12.5){ fs-=.2; b.style.fontSize=fs+'px'; } })();

  $('c_name').textContent = DATA.name;
  $('c_prog').textContent = DATA.role;
  $('c_dur').textContent = mo(DATA.start) + ' – ' + mo(DATA.end);

  const chipsEl = $('chips');
  chipsEl.innerHTML = '';
  ['Professionalism','Dedication','Responsibility','Teamwork','Reliability','Problem solving','Adaptability'].forEach(s => {
    const e = document.createElement('span');
    e.textContent = s;
    chipsEl.appendChild(e);
  });

  $('date').textContent = DATA.date;
  $('ref').textContent = DATA.ref;
  $('vid').textContent = DATA.vid;
  $('mail').textContent = DATA.email;

  const toolBtn = $('toolVerifyBtn');
  if (toolBtn) toolBtn.href = DATA.verify;

  // Render Live Unique Scannable QR Code
  const b = $('qrBox');
  b.classList.remove('empty');
  b.style.border = 'none';
  b.innerHTML = '';
  if (DATA.qr) {
    const im = new Image(); im.alt = 'Verification QR code'; im.src = DATA.qr; b.appendChild(im);
  } else if (window.QRCode) {
    try {
      new QRCode(b, {
        text: DATA.verify,
        width: 100,
        height: 100,
        correctLevel: QRCode.CorrectLevel.M
      });
      b.querySelectorAll('img,canvas').forEach(el => { el.style.width = '100%'; el.style.height = '100%'; });
    } catch(err) {
      console.error('QR code generation error:', err);
    }
  }

  document.title = 'Experience Letter – ' + DATA.name;
}

initExperienceLetter();

let Sc=1,rx=0,ry=0;
const apply=()=>{ $('stage').style.transform='perspective(2400px) scale('+Sc+') rotateX('+rx+'deg) rotateY('+ry+'deg)'; };
function fit(){ Sc=Math.min(innerWidth/794,innerHeight/1123)*.97; apply(); }
addEventListener('resize',fit); fit();
if(matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches){
  addEventListener('pointermove',e=>{ const x=e.clientX/innerWidth,y=e.clientY/innerHeight; ry=+((x-.5)*4).toFixed(2); rx=+((.5-y)*3).toFixed(2); apply();
    $('page').style.setProperty('--mx',(x*100)+'%'); $('page').style.setProperty('--my',(y*100)+'%'); });
  document.addEventListener('pointerleave',()=>{ rx=ry=0; apply(); });
}
</script>`;

  const scriptSplitIdx = content.indexOf('<script>\n/* ===== EDIT PER LETTER');
  if (scriptSplitIdx !== -1) {
    content = content.substring(0, scriptSplitIdx) + newScript + '\n</body>\n</html>';
  } else {
    const fallbackIdx = content.lastIndexOf('<script>');
    content = content.substring(0, fallbackIdx) + newScript + '\n</body>\n</html>';
  }

  fs.writeFileSync(path.join(pubDir, 'experience-letter.html'), content, 'utf8');
  fs.writeFileSync(srcFile, content, 'utf8');
  console.log('✅ Upgraded Experience Letter (public/experience-letter.html)');
}

try {
  upgradeOfferLetter();
  upgradeRecommendationLetter();
  upgradeCertificate();
  upgradeExperienceLetter();
  console.log('🎉 All 4 verification templates successfully upgraded with default "MUHAMMAD UZAIR" and dynamic QR codes!');
} catch (err) {
  console.error('Error upgrading templates:', err);
  process.exit(1);
}
