# Sayon Institute of Innovation  
## Secure Online Proctored Examination Portal  

---

##  Project Overview  

The **Online Proctored Examination Portal** is a fully secure, web-based examination management system developed exclusively for **Sion Institute of Innovation**.

This platform enables:

- Secure student authentication  
- Live proctored examinations  
- PDF-based and MCQ-based exams  
- Automated evaluation system  
- Real-time warning and violation monitoring  
- Admin dashboard for institutional control  
- Digital result generation with official scorecard  

The entire backend architecture is built using **Google Apps Script**, integrated with Google Sheets as the structured database system.

---

##  Institute  

**Sayon Institute of Innovation**  
Empowering Youth • Inspiring Innovation  

All institutional rights, branding, system ownership, and intellectual property are exclusively reserved by the institute.

---

##  System Architect & Developer  

This system is designed, developed, and implemented by:

**Sayon Mitra**  
Software Developer & System Architect  

The complete application logic, architecture design, security workflow, proctoring mechanism, UI/UX design, backend integration, and automation systems were independently engineered.

---

# Core Features  

## 1. Secure Student Authentication
- Login using SID and Roll Number  
- Backend verification via Google Apps Script  
- Session-based exam access control  

---

## 2. Dual Exam Mode Support  

###  PDF-Based Examination
- Embedded Google Drive PDF Viewer  
- Page navigation & zoom controls  
- Manual submission support  

###  MCQ-Based Examination
- Dynamic question rendering  
- Radio-button based selection  
- Short-answer support  
- Auto-grading functionality  
- Direct submission to Google Sheets  

---

## 3. Smart Timer System
- Configurable exam duration  
- Real-time countdown timer  
- Automatic submission on time expiry  
- Forced submission on rule violation  

---

## 4. Advanced Proctoring System  

The system actively monitors:

- Tab switching  
- Window focus loss  
- Right-click attempts  
- Copy/Paste/Print shortcuts  
- Suspicious keyboard combinations  

### Warning Mechanism
- Configurable maximum warnings  
- Real-time warning counter  
- Auto-submission after maximum violations  
- All violations logged in backend  

---

## 5. Admin Dashboard  

The admin panel includes:

- Student activity monitoring  
- Live submissions tracking  
- Warning records  
- Complete activity logs  
- Student status overview  

All data is dynamically fetched from Google Sheets via Google Apps Script APIs.

---

## 6. Official Digital Scorecard  

Students can:
- Enter SID and Roll Number  
- View subject-wise marks  
- View PASS / FAIL status  
- Access structured institutional scorecard  

---

# Technical Architecture  

## Frontend
- HTML5  
- CSS3  
- Vanilla JavaScript  
- Dynamic DOM Rendering  
- Embedded Google Drive PDF Viewer  

##  Backend
- Google Apps Script  
- Google Sheets Database  
- Server-side authentication  
- Exam fetching APIs  
- Submission APIs  
- Logging APIs  
- Auto-grading logic  

---

## API Communication Flow  

Frontend → Secure Proxy / Apps Script → Google Sheets  

Supported backend actions:

- `loginStudent`
- `loginAdmin`
- `fetchExam`
- `fetchMCQ`
- `submitExam`
- `submitMCQ`
- `fetchResult`
- `logWarning`
- `logActivity`
- `adminFetch`

---

# Security Measures  

- Credential verification via backend  
- No direct database exposure  
- Controlled API endpoints  
- Exam access restricted by class  
- Auto-logging of suspicious behavior  
- Auto-submission on violation threshold  
- Popup blocking detection for mandatory invigilation Meet  

---

# Project Structure  

```
├── index.html        → Main Application UI  
├── script.js         → Frontend Logic & Exam Engine  
├── code.gs           → Google Apps Script Backend  
├── styles.css        → UI Styling  
├── public/images     → Institute Branding Assets  
```

---

# ⚙️ Deployment  

## Backend Deployment
1. Deploy `code.gs` as a Google Apps Script Web App  
2. Configure Web App permissions  
3. Connect Google Sheets database  
4. Set execution permissions properly  

## Frontend Deployment
Can be deployed on:
- Netlify  
- GitHub Pages  
- Institutional Hosting Server  

---

# System Capabilities  

✔ Class-wise exam allocation  
✔ Automatic grading system  
✔ Real-time monitoring  
✔ Manual and auto submission  
✔ Digital result generation  
✔ Fully web-based system  
✔ Scalable architecture  
✔ Secure logging system  

---

# Copyright & Ownership  

© 2026 Sayon Institute of Innovation.  
All Rights Reserved.

This Online Proctored Examination Portal, including its architecture, system design, source code, backend logic, workflow mechanisms, security model, branding elements, and institutional structure, is the exclusive intellectual property of **Sion Institute of Innovation**.

Unauthorized reproduction, distribution, modification, reverse engineering, or commercial use of this system without prior written permission from the institute is strictly prohibited.

---

# License  

This project is proprietary software developed exclusively for institutional use by **Sion Institute of Innovation**.

Not open-source.  
Not permitted for redistribution.  
Not permitted for commercial reuse.  

---

# Vision  

To build a secure, scalable, innovation-driven digital examination ecosystem that ensures academic integrity while embracing modern technological infrastructure.

---

**Developed with dedication for institutional excellence.**
