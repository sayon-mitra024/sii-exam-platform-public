/* ===== script.js (Optimized & Fixed) ===== */

/* --- Helper Functions --- */
function el(sel) { return document.querySelector(sel); }

function showTopNotif(msg, isError = false, timeout = 4000) {
  const n = el('#notif');
  if (!n) return alert(msg);
  n.textContent = msg;
  n.style.background = isError ? 'linear-gradient(90deg, #9b1b1b, #6d0f0f)' : 'linear-gradient(90deg, #2b0f3f, #3a164a)';
  n.classList.remove('hidden');
  n.style.opacity = '1';

  
  // Clear previous timers if any (simple debounce)
  if (n.hideTimer) clearTimeout(n.hideTimer);
  n.hideTimer = setTimeout(() => {
    n.style.opacity = '0';
    setTimeout(() => n.classList.add('hidden'), 300);
  }, timeout);
}

// Robust API Fetcher
//async function apiPost(payload) {
//  payload.apiKey = API_KEY;
//  
//  if (!API_URL || API_URL.includes("REPLACE_WITH")) {
//    showTopNotif("Setup Error: API_URL not set in script.js", true);
//    return { ok: false };
//  }
//
//  try {
//    const res = await fetch(API_URL, {
//      method: 'POST',
//      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // 'text/plain' prevents CORS preflight issues in simple requests
//      body: JSON.stringify(payload),
//    });
//    
//    const text = await res.text();
//    try {
//      return JSON.parse(text);
//    } catch (e) {
//      console.error("Server returned non-JSON:", text);
//      return { ok: false, error: 'Server Error: Invalid JSON response' };
//    }
//  } catch (err) {
//    console.error("Fetch Error:", err);
//    return { ok: false, error: 'Network Error: Check internet or script permissions.' };
//  }
//}

async function apiPost(data) {
  try {
    // We call our OWN local function path now
    const response = await fetch('/.netlify/functions/secure-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error("Server responded with error");
    return await response.json();
  } catch (err) {
    console.error("Connection Error:", err);
    return { ok: false, error: "Could not connect to secure server." };
  }
}

/* --- Main Logic --- */
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabs = { student: el('#studentTab'), admin: el('#adminTab'), result: el('#resultTab') };
  const forms = { student: el('#studentForm'), admin: el('#adminForm'), result: el('#resultForm') };
  const inputs = {
    sid: el('#sid'), 
    roll: el('#rollNo'),
    aUser: el('#adminUser'), 
    aPass: el('#adminPass'),
    rSid: el('#rSid'),   // Changed: Matches HTML <input id="rSid">
    rRoll: el('#rRollNo') // Changed: Matches HTML <input id="rRollNo">
  };
  const panels = { auth: el('#authPanel'), exam: el('#examPanel'), admin: el('#adminPanel') };
  const btns = { 
    sLogin: el('#studentLoginBtn'), 
    aLogin: el('#adminLoginBtn'),
    rView: el('#viewResultBtn'), // Added: Matches HTML <button id="viewResultBtn">
    start: el('#startExamBtn'), 
    submit: el('#submitBtn'),
    meet: el('#openMeet'), 
    refresh: el('#refreshAdmin')
  };
  
  // State
  let currentStudent = null;
  let currentExam = null;
  let meetWindow = null;
  let pdfScale = 1;
  let examState = { 
    started: false, 
    remainingSec: 0, 
    timerInterval: null, 
    warnings: 0, 
    maxWarnings: 3 
  };
  
// NEW: PDF Navigation & Display State
 /* --- Event Listeners: UI --- */
  let currentZoom = 1.0;
  let currentPage = 0;
  const PAGE_HEIGHT = "jump"; // Standard height for Google Drive PDF pages in pixels
  
// Replace your setupPdfControls() function with this simpler, smoother version:
  function setupPdfControls() {
      const wrapper = el('#pdfWrapper');
      const viewer = el('#pdfViewer');
  
      // 1. Smooth Scroll Down (Next)
      el('#nextBtn').onclick = () => {
          wrapper.scrollBy({ top: 500, behavior: 'smooth' });
      };
  
      // 2. Smooth Scroll Up (Prev)
      el('#prevBtn').onclick = () => {
          wrapper.scrollBy({ top: -500, behavior: 'smooth' });
      };
  
      // 3. Simple Zoom (using CSS Scale)
      el('#zoomIn').onclick = () => {
          currentZoom += 0.1;
          viewer.style.transform = `scale(${currentZoom})`;
          viewer.style.transformOrigin = "top center";
      };
  
      el('#zoomOut').onclick = () => {
          if (currentZoom > 0.5) {
              currentZoom -= 0.1;
              viewer.style.transform = `scale(${currentZoom})`;
          }
      };
  }
  // Tab Switching
  tabs.student.onclick = () => switchTab('student');
  tabs.admin.onclick = () => switchTab('admin');
  tabs.result.onclick = () => switchTab('result');

  function switchTab(mode) {
    Object.keys(tabs).forEach(k => {
      tabs[k].classList.toggle('active', k === mode);
      forms[k].classList.toggle('hidden', k !== mode);
    });
    // Ensure the correct form is displayed
    if (forms[mode]) forms[mode].reset(); // Reset the form when switching tabs
  }

  btns.rView.onclick = async () => {
    const SID = el('#rSid').value.trim();
    const RollNo = el('#rRollNo').value.trim();
    
    if(!SID || !RollNo) return showTopNotif("Please enter both fields", true);
    
    showTopNotif("Fetching your marks...");
    const res = await apiPost({ action: 'fetchResult', SID, RollNo });
    
    if(!res.ok) return showTopNotif(res.error, true);
  
    const container = el('#scorecardContainer');
    container.classList.remove('hidden');
    
    // Create Table Rows for each subject
    let tableRows = res.data.map(item => `
      <tr>
        <td>${item.Subject}</td>
        <td class="score-val">${item.Marks}</td>
        <td>${item.OutOf}</td>
        <td style="color: ${item.Status === 'PASS' ? '#4caf50' : '#f44336'}">${item.Status}</td>
      </tr>
    `).join('');
  
    container.innerHTML = `
      <div class="scorecard">
        <div class="scorecard-header">
          <h3>SAYON INSTITUTE OF INNOVATION <br> OFFICIAL SCORECARD</h3>
          <p class="small-muted">${res.data[0].Name} | SID: ${SID}</p>
        </div>
        <table class="result-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Marks</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  };

  // Add event listener for result tab login
 // btns.result.onclick = () => switchTab('result');

  // Enter Key Support (The fix you asked for)
  function addEnter(input, btn) {
    if(input) input.addEventListener('keypress', e => { if(e.key === 'Enter') btn.click(); });
  }
  addEnter(inputs.sid, btns.sLogin);
  addEnter(inputs.roll, btns.sLogin);
  addEnter(inputs.aUser, btns.aLogin);
  addEnter(inputs.aPass, btns.aLogin);

  /* --- Student Login Flow --- */
  btns.sLogin.onclick = async () => {
    const SID = inputs.sid.value.trim();
    const RollNo = inputs.roll.value.trim();
    if (!SID || !RollNo) return showTopNotif('Please enter SID and Roll Number', true);

    showTopNotif('Verifying credentials...');
    btns.sLogin.disabled = true;

    const res = await apiPost({ action: 'loginStudent', SID, RollNo });
    btns.sLogin.disabled = false;

    if (!res.ok) return showTopNotif(res.error || 'Login failed', true);

// Login Success
    currentStudent = res.student;
// Inside btns.sLogin.onclick after login success:
    console.log("Logged in Student Class:", currentStudent.Class); // DEBUG LINE
    
    // Update UI with student details
    const sidEl = el('#userSID');
    const rollEl = el('#userRoll');
    const classEl = el('#userClass');
    
    if(sidEl) sidEl.textContent = currentStudent.SID;
    if(rollEl) rollEl.textContent = currentStudent.RollNo;
    if(classEl) classEl.textContent = currentStudent.Class;
    
    console.log("Roll No:", currentStudent.RollNo); // Debug to verify data

    showTopNotif(`Welcome, ${currentStudent.Name}`);
    
    // Fetch exam based on Student's CLASS (now correctly passed from backend)
    const exRes = await apiPost({ 
        action: 'fetchExam', 
        studentClass: currentStudent.Class, 
        SID: currentStudent.SID
    });
    
    if (exRes.ok) {
        console.log("Fetched Exam for Class:", exRes.exam.Class); // DEBUG LINE
    }
    
    if (!exRes.ok) return showTopNotif('No exam for your class!', true);
    
    currentExam = exRes.exam;
    setupExamUI();
  };

  function setupExamUI() {
    panels.auth.classList.add('hidden');
    panels.exam.classList.remove('hidden');
    
    el('#examTitle').textContent = currentExam.ExamID || 'Exam';
    el('#examMeta').textContent = `${currentExam.Subject} • ${currentExam.Duration_Min} Mins`;
    examState.maxWarnings = parseInt(currentExam.MaxWarnings) || 3;
    
    setupPdfControls();
    
    apiPost({ 
      action: 'logActivity', 
      SID: currentStudent.SID, 
      Name: currentStudent.Name, 
      Event: 'LOGIN', 
      Details: 'Student entered portal' 
    });
    
    enableProctoring();
  }

  /* --- Exam Logic --- */
  btns.start.onclick = async () => {
      if (!currentExam) return;
  
      // Check Start Time (Existing Logic)
      if (currentExam.Exam_start) {
        const start = new Date(currentExam.Exam_start);
        const now = new Date();
        if (start > now) return showTopNotif(`Exam starts at ${start.toLocaleTimeString()}`, true);
      }
  
      // --- MODE DETECTION ---
      const pdfLink = currentExam.PDF_Link || "";
      const driveId = extractDriveId(pdfLink);
  
      // Common Setup
      const mins = parseFloat(currentExam.Duration_Min) || 60;
      examState.remainingSec = Math.floor(mins * 60);
      btns.start.disabled = true;
      btns.start.classList.add('muted');
      examState.started = true;
      showTopNotif('Exam Started. Good Luck!');
      startTimer();
      
      // Log Start
      apiPost({ 
        action: 'logActivity', 
        SID: currentStudent.SID, 
        Name: currentStudent.Name, 
        Event: 'EXAM_START', 
        Details: `Started ${currentExam.ExamID} (${driveId ? 'PDF' : 'MCQ'})` 
      });
  
      if (driveId) {
        // === PDF MODE (Existing) ===
        el('#pdfWrapper').classList.remove('hidden');
        el('#mcqWrapper').classList.add('hidden');
        el('#pdfViewer').src = `https://drive.google.com/file/d/${driveId}/preview`;
        
        // Update Submit Button to use Old Manual Submit
        btns.submit.onclick = () => {
           if(confirm("Submit PDF Exam?")) submitExam('MANUAL_SUBMIT');
        };
  
      } else {
        // === MCQ MODE (New) ===
        el('#pdfWrapper').classList.add('hidden');
        el('#mcqWrapper').classList.remove('hidden');
        
        showTopNotif("Loading Questions...");
        const qRes = await apiPost({ action: 'fetchMCQ', ExamID: currentExam.ExamID });
        
        if(qRes.ok) {
          renderMCQ(qRes.questions);
          
          // Update Submit Button to use New MCQ Submit
          btns.submit.onclick = () => {
             if(confirm("Submit Answers?")) submitMCQ();
          };
        } else {
          showTopNotif("Error loading questions: " + qRes.error, true);
        }
      }
    };

  btns.submit.onclick = () => {
    if(confirm("Are you sure you want to submit? This cannot be undone.")) {
      submitExam('MANUAL_SUBMIT');
    }
  };

  /* --- Admin Logic --- */
  btns.aLogin.onclick = async () => {
    const u = inputs.aUser.value.trim();
    const p = inputs.aPass.value.trim();
    if(!u || !p) return showTopNotif('Enter Username and Password', true);

    showTopNotif('Authenticating...');
    const res = await apiPost({ action: 'loginAdmin', username: u, password: p });
    
    if(!res.ok) return showTopNotif(res.error || 'Invalid Credentials', true);

    panels.auth.classList.add('hidden');
    panels.admin.classList.remove('hidden');
    showTopNotif('Admin Dashboard Loaded');
    loadAdminData();
  };

  if(btns.refresh) btns.refresh.onclick = loadAdminData;

  async function loadAdminData() {
    const res = await apiPost({ action: 'adminFetch' });
    if(res.ok) {
      renderTable(el('#adminStudents'), res.data.students, ['SID', 'Name', 'Status']);
      renderTable(el('#adminSubmissions'), res.data.submissions, ['SID', 'Name', 'SubmitTime']);
      renderTable(el('#adminWarnings'), res.data.warnings, ['SID', 'Reason', 'Warning_No']);
      renderTable(el('#adminActivity'), res.data.activity, ['Name', 'Event', 'Details', 'Time']);
    }
  }

  function renderTable(container, data, columns) {
    if(!data || !data.length) { container.innerHTML = '<div class="small muted">No Data</div>'; return; }
    let html = '<table style="width:100%; text-align:left; font-size:13px;"><thead><tr>';
    columns.forEach(c => html += `<th style="padding:8px; opacity:0.7">${c}</th>`);
    html += '</tr></thead><tbody>';
    data.forEach(row => {
      html += '<tr>';
      columns.forEach(c => {
        let val = row[c] || row[c.toLowerCase()] || '-';
        if(typeof val === 'string' && val.includes('T') && val.length > 20) val = new Date(val).toLocaleTimeString();
        html += `<td style="padding:8px; border-top:1px solid rgba(255,255,255,0.05)">${val}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  /* --- Proctoring & Utilities --- */
  function enableProctoring() {
    // 1. Tab Switching
    document.addEventListener('visibilitychange', () => {
      if(document.hidden && examState.started) triggerWarning('Tab Switched / Minimized');
    });

    // 2. Focus Loss
    window.onblur = () => {
      if(examState.started) triggerWarning('Window Lost Focus');
    };

    // 3. Right Click
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      triggerWarning('Right Click Attempt');
    });

    // 4. Keyboard Shortcuts (Copy/Paste/Print)
    window.addEventListener('keydown', e => {
      if((e.ctrlKey || e.metaKey) && ['c','v','p','s'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        triggerWarning(`Illegal Shortcut (Ctrl+${e.key.toUpperCase()})`);
      }
    });
  }

  async function triggerWarning(reason) {
    if(!examState.started) return;
    
    examState.warnings++;
    el('#warningCount').textContent = examState.warnings;
    
    showTopNotif(`⚠️ WARNING ${examState.warnings}/${examState.maxWarnings}: ${reason}`, true, 5000);
    
    // Log to server
    apiPost({
      action: 'logWarning',
      SID: currentStudent.SID,
      Name: currentStudent.Name,
      ExamID: currentExam.ExamID,
      Warning_No: examState.warnings,
      Reason: reason
    });

    if(examState.warnings >= examState.maxWarnings) {
      showTopNotif('Maximum Warnings Reached. Auto-Submitting...', true);
      submitExam('MAX_VIOLATIONS');
    }
  }

  async function submitExam(reason) {
    clearInterval(examState.timerInterval);
    examState.started = false;
    
    showTopNotif('Submitting Exam...', false, 10000); // Persistent message
    
    const res = await apiPost({
      action: 'submitExam',
      SID: currentStudent.SID,
      Name: currentStudent.Name,
      ExamID: currentExam.ExamID,
      Reason: reason
    });

    panels.exam.innerHTML = `
      <div class="panel glass" style="text-align:center; padding: 40px;">
        <h2 style="color:var(--accent)">Exam Submitted</h2>
        <p>Thank you. Your responses have been recorded.</p>
        <p class="small muted">Reason: ${reason}</p>
        <button class="btn" onclick="location.reload()">Return Home</button>
      </div>
    `;
  }

  /* --- Timer --- */
  function startTimer() {
    const timerDisplay = el('#timer');
    examState.timerInterval = setInterval(() => {
      examState.remainingSec--;
      
      const h = Math.floor(examState.remainingSec / 3600);
      const m = Math.floor((examState.remainingSec % 3600) / 60);
      const s = examState.remainingSec % 60;
      
      timerDisplay.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
      
      if(examState.remainingSec <= 0) {
        submitExam('TIME_UP');
      }
    }, 1000);
  }
  function pad(n) { return n < 10 ? '0'+n : n; }

  /* --- Meet Logic --- */
  btns.meet.onclick = () => {
    if(!currentExam.MeetLink) return showTopNotif('No Meet Link provided', true);
    meetWindow = window.open(currentExam.MeetLink, 'Invigilation', 'width=800,height=600');
    if(!meetWindow) return showTopNotif('Popup Blocked! Please allow popups.', true);
    
    el('#meetStatus').textContent = "Connected";
    el('#meetStatus').style.color = "#4caf50";
    
    apiPost({
      action: 'logActivity',
      SID: currentStudent.SID,
      Name: currentStudent.Name,
      Event: 'MEET_OPEN',
      Details: 'Student opened Meet window'
    });
  };

  function renderMCQ(questions) {
  const form = el('#mcqForm');
  let html = '';
  
  questions.forEach((q, index) => {
    html += `
      <div class="question-card" style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid var(--accent);">
        <p style="margin-top:0; font-weight:bold; color: var(--accent);">
          Q${index+1}. ${q.Question} <span style="font-size:0.8em; opacity:0.7">(${q.Marks} Marks)</span>
        </p>
    `;
    
    if (q.Type === 'MCQ') {
      const opts = [q.OptionA, q.OptionB, q.OptionC, q.OptionD].filter(o => o); // Remove empty options
      opts.forEach(opt => {
        html += `
          <div style="margin: 5px 0;">
            <label style="cursor:pointer; display:flex; align-items:center; gap:10px;">
              <input type="radio" name="${q.QID}" value="${opt}" style="accent-color: var(--accent);">
              <span>${opt}</span>
            </label>
          </div>
        `;
      });
    } else {
      // Short Answer
      html += `
        <textarea name="${q.QID}" placeholder="Type your answer here..." 
          style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid #444; color:#fff; border-radius:4px; resize:vertical;"></textarea>
      `;
    }
    
    html += `</div>`;
  });
  
  form.innerHTML = html;
}

  async function submitMCQ() {
    clearInterval(examState.timerInterval);
    examState.started = false;
    showTopNotif('Submitting Answers...', false, 10000);
  
    // Gather Answers
    const formData = new FormData(el('#mcqForm'));
    const answers = {};
    for (const [key, value] of formData.entries()) {
      answers[key] = value;
    }
  
    const res = await apiPost({
      action: 'submitMCQ',
      SID: currentStudent.SID,
      Name: currentStudent.Name,
      RollNo: currentStudent.RollNo, // Needed for Results sheet
      ExamID: currentExam.ExamID,
      answers: answers
    });
  
    if (res.ok) {
       el('#examPanel').innerHTML = `
        <div class="panel glass" style="text-align:center; padding: 40px;">
          <h2 style="color:var(--accent)">Exam Submitted Successfully</h2>
          <p>Your responses have been auto-graded.</p>
          <button class="btn" onclick="location.reload()">Return Home</button>
        </div>
      `;
    } else {
      showTopNotif("Submission Failed: " + res.error, true);
    }
  }

  /* --- PDF Helper --- */
  function extractDriveId(url) {
    if(!url) return null;
    let match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  }
  
  // Real-time Clock
  setInterval(() => {
    el('#timeNow').textContent = new Date().toLocaleTimeString();
  }, 1000);
});
