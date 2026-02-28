/* ===== code.gs (Google Apps Script) ===== */

/* --- CONFIGURATION --- */
const SPREADSHEET_ID = "1v-rJ3rv3SUy0v7DxIFZOnSE8csQjy79meDL9SnofaJw"; // <--- VERIFY THIS ID
const API_KEY = "Sayon*024"; // <--- MUST MATCH SCRIPT.JS



function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Admin Tools')
    .addItem('Send Pending Emails (From Email_re)', 'processPendingEmails')
    .addToUi();
}

/* --- MAIN ENTRY POINT --- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  
  try {
    // Attempt to acquire lock for 10 seconds to prevent write collisions
    lock.tryLock(10000);
    
    // Parse Input
    const rawData = e.postData ? e.postData.contents : "{}";
    const body = JSON.parse(rawData);

    // Security Check
    if (body.apiKey !== API_KEY) {
      return jsonResponse({ ok: false, error: "Unauthorized: Invalid API Key" });
    }

    // Router
    const action = body.action;
    let result = {};

    switch (action) {
      case "loginStudent": result = handleStudentLogin(body); break;
      case "loginAdmin":   result = handleAdminLogin(body); break;
      case "fetchExam":    result = handleFetchExam(body); break;
      case "logWarning":   result = handleLogWarning(body); break;
      case "logActivity":  result = handleLogActivity(body); break;
      case "submitExam":   result = handleSubmitExam(body); break;
      case "adminFetch":   result = handleAdminFetch(body); break;
      case "fetchResult": result = handleFetchResult(body); break;
      case "fetchMCQ":     result = handleFetchMCQ(body); break; // NEW
      case "submitMCQ":    result = handleSubmitMCQ(body); break; // NEW
      default:             result = { ok: false, error: "Unknown Action" };
    }

    return jsonResponse(result);

  } catch (err) {
    return jsonResponse({ ok: false, error: "Server Error: " + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/* --- HANDLERS --- */
//
//function handleStudentLogin(data) {
//  const sheet = getSheet("Students");
//  const rows = sheet.getDataRange().getValues();
//  const headers = rows[0];
//  
//  // Find column indexes
//  const idx = {
//    sid: headers.indexOf("SID"),
//    roll: headers.indexOf("RollNo"),
//    name: headers.indexOf("Name"),
//    status: headers.indexOf("Status")
//  };
//
//  if (idx.sid === -1 || idx.roll === -1) return { ok: false, error: "Database Config Error: Missing Columns" };
//
//  // Search for student
//  for (let i = 1; i < rows.length; i++) {
//    const row = rows[i];
//    if (String(row[idx.sid]) === String(data.SID) && String(row[idx.roll]) === String(data.RollNo)) {
//      
//      const status = row[idx.status];
//      if (status === "SUBMITTED") {
//        return { ok: false, error: "You have already submitted this exam." };
//      }
//
//      return { 
//        ok: true, 
//        student: { 
//          SID: row[idx.sid], 
//          Name: row[idx.name], 
//          Status: status 
//        } 
//      };
//    }
//  }
//  return { ok: false, error: "Invalid SID or Roll Number" };
//}
function handleStudentLogin(data) {
  const sheet = getSheet("Students");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  const idx = {
    sid: headers.indexOf("SID"),
    roll: headers.indexOf("RollNo"),
    name: headers.indexOf("Name"),
    status: headers.indexOf("Status"),
    studentClass: headers.indexOf("Class") // Add this line
  };

  if (idx.sid === -1 || idx.roll === -1 || idx.studentClass === -1) 
    return { ok: false, error: "Database Config Error: Missing SID, RollNo, or Class columns" };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[idx.sid]) === String(data.SID) && String(row[idx.roll]) === String(data.RollNo)) {
      if (row[idx.status] === "SUBMITTED") {
        return { ok: false, error: "You have already submitted this exam." };
      }

      return { 
        ok: true, 
        student: { 
          SID: row[idx.sid], 
          Name: row[idx.name], 
          Status: row[idx.status],
          Class: row[idx.studentClass] // Add this line
        } 
      };
    }
  }
  return { ok: false, error: "Invalid SID or Roll Number" };
}
function handleAdminLogin(data) {
  const sheet = getSheet("Admin");
  const rows = sheet.getDataRange().getValues();
  
  // Simple check (assuming col 1 is user, col 2 is pass)
  for(let i=1; i<rows.length; i++) {
    if(String(rows[i][0]) === data.username && String(rows[i][1]) === data.password) {
      return { ok: true };
    }
  }
  return { ok: false, error: "Invalid Admin Credentials" };
}


function handleLogWarning(data) {
  const sheet = getSheet("Warnings_Log");
  sheet.appendRow([data.SID, data.Name, data.ExamID, data.Warning_No, data.Reason, new Date()]);
  return { ok: true };
}
function handleFetchExam(data) {
  const studentClass = data.studentClass;
  const examSheet = getSheet("Exam");
  const rows = examSheet.getDataRange().getValues();
  const headers = rows[0];
  
  const classIdx = headers.indexOf("Class");
  if (classIdx === -1) return { ok: false, error: "Exam sheet missing 'Class' column" };

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][classIdx]) === String(studentClass)) {
      let exam = {};
      // Correctly map each header to the value in this row
      headers.forEach((header, colIndex) => {
        exam[header] = rows[i][colIndex];
      });
      
      exam.LastTwo = String(exam.ExamID).slice(-2);
      return { ok: true, exam: exam };
    }
  }
  return { ok: false, error: "No exam found for Class: " + studentClass };
}
function handleLogActivity(data) {
  const sheet = getSheet("Activity_Logs");
  sheet.appendRow([data.SID, data.Name, data.Event, data.Details, new Date()]);
  return { ok: true };
}

function handleSubmitExam(data) {
  const subSheet = getSheet("Exam_Submissions");
  subSheet.appendRow([data.SID, data.Name, data.ExamID, new Date(), data.Reason]);
  
  // Update Student Status to SUBMITTED
  const studSheet = getSheet("Students");
  const rows = studSheet.getDataRange().getValues();
  const headers = rows[0];
  const sidIdx = headers.indexOf("SID");
  const statIdx = headers.indexOf("Status");
  
  for(let i=1; i<rows.length; i++) {
    if(String(rows[i][sidIdx]) === String(data.SID)) {
      studSheet.getRange(i+1, statIdx+1).setValue("SUBMITTED");
      break;
    }
  }
  
  return { ok: true };
}

function handleAdminFetch() {
  return {
    ok: true,
    data: {
      students: getSheetData("Students"),
      submissions: getSheetData("Exam_Submissions"),
      warnings: getSheetData("Warnings_Log"),
      activity: getSheetData("Activity_Logs", 50) // Limit to last 50 logs
    }
  };
}

/* --- UTILITIES --- */
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name); // Auto-create if missing
  return sheet;
}

function getSheetData(name, limit) {
  const sheet = getSheet(name);
  const data = sheet.getDataRange().getValues();
  if(data.length < 2) return [];
  
  const headers = data[0];
  let rows = data.slice(1);
  
  // If limit applied, take last N rows
  if(limit && rows.length > limit) rows = rows.slice(-limit);
  
  return rows.reverse().map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
/* --- NEW MCQ HANDLERS --- */

/* --- FIXED MCQ HANDLERS --- */

function handleFetchMCQ(data) {
  const sheet = getSheet("MCQ_Questions");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  // Map headers
  const h = {};
  headers.forEach((header, i) => h[header] = i);

  // Filter questions by ExamID
  let questions = [];
  // Trim inputs to ensure "MATH101" matches "MATH101 "
  const targetID = String(data.ExamID).trim();

  for (let i = 1; i < rows.length; i++) {
    // FIX: Added .trim() to handle accidental spaces in Google Sheet
    if (String(rows[i][h.ExamID]).trim() === targetID) {
      questions.push({
        QID: rows[i][h.QID],
        Type: rows[i][h.Type],
        Question: rows[i][h.Question],
        OptionA: rows[i][h.OptionA],
        OptionB: rows[i][h.OptionB],
        OptionC: rows[i][h.OptionC],
        OptionD: rows[i][h.OptionD],
        Marks: rows[i][h.Marks]
        // CorrectAnswer is withheld for security
      });
    }
  }

  if (questions.length > 0) return { ok: true, questions: questions };
  return { ok: false, error: "No questions found for Exam ID: " + targetID };
}

/* COPY AND PASTE THIS ENTIRE FUNCTION INTO code.gs */

function handleSubmitMCQ(data) {
  // 1. Setup Data
  const sid = data.SID;
  const examId = data.ExamID;
  const answers = data.answers;

  // 2. Load Questions
  const qSheet = getSheet("MCQ_Questions");
  const qRows = qSheet.getDataRange().getValues();
  const qHeaders = qRows[0];
  
  // Map Columns (Using dynamic search to be safe)
  const qIdx = {
    id: qHeaders.indexOf("ExamID"),
    qid: qHeaders.indexOf("QID"),
    ans: qHeaders.indexOf("CorrectAnswer"),
    marks: qHeaders.indexOf("Marks"),
    question: qHeaders.indexOf("Question") // <--- We need this for the email
  };

  // Variables for Grading
  let totalScore = 0;
  let totalMax = 0;
  let responseLog = [];
  
  // NEW: Variables specifically for Email Template
  let emailDetails = [];
  let correctCount = 0;
  let incorrectCount = 0;

  const targetID = String(examId).trim();

  // 3. Loop through questions and Grade
  for (let i = 1; i < qRows.length; i++) {
    // Check if row belongs to current ExamID
    if (String(qRows[i][qIdx.id]).trim() === targetID) {
      
      const qid = qRows[i][qIdx.qid];
      const correctAns = String(qRows[i][qIdx.ans]).trim().toLowerCase();
      const marks = Number(qRows[i][qIdx.marks]);
      const questionText = qRows[i][qIdx.question]; // Fetch Question Text

      const studentAns = (answers[qid] || "").trim();
      let isCorrect = false;
      let awarded = 0;

      // Logic: Compare Student Answer vs Correct Answer
      if (studentAns.toLowerCase() === correctAns) {
        isCorrect = true;
        awarded = marks;
        correctCount++;
      } else {
        incorrectCount++;
      }

      totalScore += awarded;
      totalMax += marks;

      // Add to Database Log
      responseLog.push([sid, examId, qid, studentAns, isCorrect, awarded, new Date()]);
      
      // NEW: Add to Email Data Object
      emailDetails.push({
        question: questionText,
        marks: marks,
        studentAns: studentAns,
        correctAns: String(qRows[i][qIdx.ans]), // Send original casing
        isCorrect: isCorrect,
        awarded: awarded
      });
    }
  }

  // 4. Save Response Data to Sheets
  const rSheet = getSheet("MCQ_Responses");
  responseLog.forEach(row => rSheet.appendRow(row));

  // 5. Calculate Final Result
  const percentage = totalMax > 0 ? (totalScore / totalMax * 100).toFixed(2) : 0;
  const status = percentage >= 40 ? "PASS" : "FAIL";
  
  getSheet("MCQ_Results").appendRow([sid, examId, responseLog.length, responseLog.length, totalScore, totalMax, percentage + "%", status]);

  getSheet("Results").appendRow([
    sid, 
    data.RollNo, 
    data.Name, 
    examId, 
    totalScore, 
    totalMax, 
    status
  ]);

  // 6. Update Student Status
  markStudentSubmitted(sid);

  // ======================================================
  // 7. CRITICAL FIX: SEND EMAIL LOGIC
  // ======================================================
  try {
    // A. Find Student Email in "Students" Sheet
    const studSheet = getSheet("Students");
    const sRows = studSheet.getDataRange().getValues();
    const sHeaders = sRows[0];
    
    const sSidIdx = sHeaders.indexOf("SID");
    const sEmailIdx = sHeaders.indexOf("Email"); // Looks for "Email" column

    let studentEmail = "";

    // Search specifically for the Student's Email using SID
    if (sEmailIdx !== -1 && sSidIdx !== -1) {
      for (let k = 1; k < sRows.length; k++) {
        if (String(sRows[k][sSidIdx]) === String(sid)) {
          studentEmail = sRows[k][sEmailIdx];
          break; // Stop searching once found
        }
      }
    }

    // B. If Email is found, Send the Result
    if (studentEmail && studentEmail.includes("@")) {
      
      // Load the "email.result.html" file
      const htmlTemplate = HtmlService.createTemplateFromFile('email.result');
      
      // Inject Data into Template
      htmlTemplate.name = data.Name;
      htmlTemplate.rollNo = data.RollNo;
      htmlTemplate.examId = examId;
      htmlTemplate.totalScore = totalScore;
      htmlTemplate.totalMax = totalMax;
      htmlTemplate.percentage = percentage;
      htmlTemplate.status = status;
      
      // Inject Stats
      htmlTemplate.performance = {
        total: responseLog.length,
        correct: correctCount,
        incorrect: incorrectCount
      };
      
      // Inject Question Breakdown
      htmlTemplate.details = emailDetails;

      // Generate HTML Body
      const emailBody = htmlTemplate.evaluate().getContent();

      // Send Email
      GmailApp.sendEmail(studentEmail, "Exam Result: " + examId, "Please view this email in a client that supports HTML.", {
        htmlBody: emailBody,
        name: "Sayon Institute Exam System" // Custom Sender Name
      });
      
      Logger.log("Email Successfully Sent to: " + studentEmail);

    } else {
      Logger.log("WARNING: No email found for SID " + sid);
    }

  } catch (e) {
    // Ensure the exam submits successfully even if email fails
    Logger.log("EMAIL ERROR: " + e.toString());
  }
  // ======================================================

  return { ok: true };
}
/* --- NEW EMAIL HELPERS (Add these to bottom of code.gs) --- */

function getStudentEmail(sid) {
  const sheet = getSheet("Students");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idx = {
    sid: headers.indexOf("SID"),
    email: headers.indexOf("Email") 
  };
  
  // Safety check if Email column exists
  if (idx.email === -1) return null;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idx.sid]) === String(sid)) {
      return data[i][idx.email];
    }
  }
  return null;
}

function sendResultEmail(data) {
  const template = HtmlService.createTemplateFromFile('email.result');
  
  // Inject data into template
  template.name = data.name;
  template.rollNo = data.rollNo;
  template.examId = data.examId;
  template.totalScore = data.totalScore;
  template.totalMax = data.totalMax;
  template.percentage = data.percentage;
  template.status = data.status;
  template.details = data.details;
  
  // Calculate performance stats
  let correct = 0;
  let incorrect = 0;
  data.details.forEach(q => q.isCorrect ? correct++ : incorrect++);
  
  template.performance = {
    total: data.details.length,
    correct: correct,
    incorrect: incorrect
  };

  const emailBody = template.evaluate().getContent();

  MailApp.sendEmail({
    to: data.email,
    subject: `Exam Result: ${data.examId} - ${data.name}`,
    htmlBody: emailBody,
    name: "Sayon Institute Exams"
  });
}

// Helper to reuse 'SUBMITTED' logic without duplicating code
function markStudentSubmitted(sid) {
  const sheet = getSheet("Students");
  const data = sheet.getDataRange().getValues();
  const sidIdx = data[0].indexOf("SID");
  const statIdx = data[0].indexOf("Status");
  
  for(let i=1; i<data.length; i++) {
    if(String(data[i][sidIdx]) === String(sid)) {
      sheet.getRange(i+1, statIdx+1).setValue("SUBMITTED");
      break;
    }
  }
}

function handleFetchResult(data) {
  const sheet = getSheet("Results");
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  const sidIdx = headers.indexOf("SID");
  const rollIdx = headers.indexOf("RollNo");

  // Collect ALL matching rows (for multiple subjects)
  let results = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][sidIdx]) === String(data.SID) && String(rows[i][rollIdx]) === String(data.RollNo)) {
      let rowData = {};
      headers.forEach((h, index) => rowData[h] = rows[i][index]);
      results.push(rowData);
    }
  }

  if (results.length > 0) {
    return { ok: true, data: results };
  }
  return { ok: false, error: "No result found for this SID/Roll" };
}



/* ===== ADD TO BOTTOM OF code.gs ===== */

function processPendingEmails() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Get Sheets
  const emailSheet = ss.getSheetByName("Email_re");
  const respSheet = ss.getSheetByName("MCQ_Responses");
  const qSheet = ss.getSheetByName("MCQ_Questions");
  
  if (!emailSheet || !respSheet || !qSheet) {
    SpreadsheetApp.getUi().alert("Error: Missing one of the required sheets (Email_re, MCQ_Responses, MCQ_Questions).");
    return;
  }

  // 2. Load Data
  const emailData = emailSheet.getDataRange().getValues(); // SID | Name | Class | EmStatus | Email
  const respData = respSheet.getDataRange().getValues();   // SID | ExamID | QID | Ans | IsCorrect | Awarded
  const qData = qSheet.getDataRange().getValues();         // ... | QID | ... | Question | CorrectAnswer
  
  // Map Question Data for quick lookup:  { "ExamID_QID": { text, correctAns, marks } }
  const qMap = {};
  const qHeaders = qData[0];
  const qIdx = {
    examId: qHeaders.indexOf("ExamID"),
    qid: qHeaders.indexOf("QID"),
    txt: qHeaders.indexOf("Question"),
    ans: qHeaders.indexOf("CorrectAnswer"),
    marks: qHeaders.indexOf("Marks")
  };

  for (let i = 1; i < qData.length; i++) {
    const key = qData[i][qIdx.examId] + "_" + qData[i][qIdx.qid];
    qMap[key] = {
      text: qData[i][qIdx.txt],
      correct: qData[i][qIdx.ans],
      marks: Number(qData[i][qIdx.marks])
    };
  }

  // 3. Loop through Email_re sheet
  // Assuming Headers: SID(0), Name(1), Class(2), EmStatus(3), Email(4)
  const eIdx = {
    sid: 0,
    name: 1,
    status: 3,
    email: 4
  };

  let sentCount = 0;

  for (let i = 1; i < emailData.length; i++) {
    const row = emailData[i];
    const status = String(row[eIdx.status]).toUpperCase();
    const email = row[eIdx.email];
    const sid = row[eIdx.sid];
    const name = row[eIdx.name];

    // SKIP if already sent or no email provided
    if (status === "SENT" || !email || !email.includes("@")) continue;

    // 4. Gather Student Results
    let studentDetails = [];
    let totalScore = 0;
    let totalMax = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let examID = "";

    // Find all responses for this SID
    // respData Headers assumed: SID(0), ExamID(1), QID(2), Ans(3), IsCorrect(4), Awarded(5)
    for (let r = 1; r < respData.length; r++) {
      if (String(respData[r][0]) === String(sid)) {
        
        examID = respData[r][1]; // Capture Exam ID
        const qid = respData[r][2];
        const studentAns = respData[r][3];
        const isCorrect = respData[r][4] === true || String(respData[r][4]).toLowerCase() === "true";
        const awarded = Number(respData[r][5]);

        // Lookup Question Text
        const qKey = examID + "_" + qid;
        const qInfo = qMap[qKey] || { text: "Question not found", correct: "-", marks: 0 };

        totalScore += awarded;
        totalMax += qInfo.marks;
        if (isCorrect) correctCount++; else incorrectCount++;

        studentDetails.push({
          question: qInfo.text,
          marks: qInfo.marks,
          studentAns: studentAns,
          correctAns: qInfo.correct,
          isCorrect: isCorrect,
          awarded: awarded
        });
      }
    }

    if (studentDetails.length === 0) {
      console.log(`No results found for SID: ${sid}`);
      continue; 
    }

    // 5. Prepare Email Payload
    const percentage = totalMax > 0 ? (totalScore / totalMax * 100).toFixed(2) : 0;
    const passStatus = percentage >= 40 ? "PASS" : "FAIL";

    const templateData = {
      name: name,
      rollNo: "N/A", // RollNo isn't in Email_re, you can leave N/A or fetch if needed
      examId: examID,
      totalScore: totalScore,
      totalMax: totalMax,
      percentage: percentage,
      status: passStatus,
      performance: {
        total: studentDetails.length,
        correct: correctCount,
        incorrect: incorrectCount
      },
      details: studentDetails
    };

    // 6. Send Email
    try {
      sendResultEmailHtml(email, templateData); // Call helper function
      
      // Update Status in Email_re
      emailSheet.getRange(i + 1, eIdx.status + 1).setValue("SENT");
      sentCount++;
      SpreadsheetApp.flush(); // Force save changes immediately
    } catch (e) {
      emailSheet.getRange(i + 1, eIdx.status + 1).setValue("ERROR: " + e.message);
      console.error("Failed to send to " + email, e);
    }
  }

  SpreadsheetApp.getUi().alert(`Process Complete. Sent ${sentCount} emails.`);
}

// Helper Function to Render and Send
function sendResultEmailHtml(email, data) {
  const htmlTemplate = HtmlService.createTemplateFromFile('email.result');
  
  // Inject variables
  htmlTemplate.name = data.name;
  htmlTemplate.rollNo = data.rollNo;
  htmlTemplate.examId = data.examId;
  htmlTemplate.totalScore = data.totalScore;
  htmlTemplate.totalMax = data.totalMax;
  htmlTemplate.percentage = data.percentage;
  htmlTemplate.status = data.status;
  htmlTemplate.performance = data.performance;
  htmlTemplate.details = data.details;

  const emailBody = htmlTemplate.evaluate().getContent();

  GmailApp.sendEmail(email, "Exam Result: " + data.examId, "Please enable HTML to view your result.", {
    htmlBody: emailBody,
    name: "Sayon Institute Exam System"
  });
}