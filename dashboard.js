/* =====================================================
   BOOKFAIR DIGITAL
   STUDENT DASHBOARD — BOOK 01 PAPERS
   ===================================================== */

import { db, doc, getDoc } from "./firebase.js";

const LOGIN_KEY = "bf_login";
const STUDENT_KEY = "bf_student";
const STUDENT_DOC_KEY = "bf_student_doc";

const PAPERS = Array.from({ length: 10 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    number: n,
    title: `Paper ${n}`,
    link: `answers/book01-paper${n}/paper-${n}.html`
  };
});

function getStoredStudent() {
  try {
    const raw = localStorage.getItem(STUDENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeBook(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}

function isBook01(value) {
  const v = normalizeBook(value);
  return v === "book 01" || v === "01" || v === "book01";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function logoutStudent() {
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(STUDENT_KEY);
  localStorage.removeItem(STUDENT_DOC_KEY);
  location.replace("login.html");
}

window.logout = logoutStudent;

const studentInfo = document.getElementById("studentInfo");
const bookGrid = document.getElementById("bookGrid");
const logoutButton = document.getElementById("logout");

if (logoutButton) {
  logoutButton.addEventListener("click", logoutStudent);
}

function renderStudentInfo(student) {
  if (!studentInfo) return;

  const fullName =
    student.fullName ||
    student["Full Name"] ||
    student.name ||
    "";

  const username =
    student.username ||
    student.Username ||
    localStorage.getItem(LOGIN_KEY) ||
    "";

  const district =
    student.district ||
    student.District ||
    "";

  const assignedBook =
    student.assignedBook ||
    student["Assigned Book"] ||
    "";

  studentInfo.innerHTML = `
    <div class="student-info-card">
      <div>
        <span class="info-label">STUDENT</span>
        <strong>${escapeHtml(fullName || username)}</strong>
      </div>
      <div>
        <span class="info-label">USERNAME</span>
        <strong>${escapeHtml(username)}</strong>
      </div>
      ${district ? `
        <div>
          <span class="info-label">DISTRICT</span>
          <strong>${escapeHtml(district)}</strong>
        </div>
      ` : ""}
      <div>
        <span class="info-label">ASSIGNED BOOK</span>
        <strong>${escapeHtml(assignedBook || "Not assigned")}</strong>
      </div>
    </div>
  `;
}

function paperCardsHtml() {
  return PAPERS.map((paper) => `
    <a class="paper-card" href="${paper.link}">
      <span class="paper-number">${paper.number}</span>
      <span class="paper-title">${escapeHtml(paper.title)}</span>
      <span class="paper-arrow">→</span>
    </a>
  `).join("");
}

function renderBooks(student) {
  if (!bookGrid) return;

  const assignedBook =
    student.assignedBook ||
    student["Assigned Book"] ||
    "";

  const book01Assigned = isBook01(assignedBook);

  bookGrid.innerHTML = `
    <article class="book-card ${book01Assigned ? "unlocked" : "locked"} book01-card">
      <div class="book-cover">
        <img src="assets/accounting.jpg" alt="A/L Accounting">
        ${book01Assigned ? `
          <div class="assigned-badge">✓ ASSIGNED TO YOU</div>
        ` : `
          <div class="locked-overlay">
            <div class="lock-icon">🔒</div>
            <span>LOCKED</span>
          </div>
        `}
      </div>

      <div class="book-content">
        <div class="book-label">BOOK 01 · DIGITAL RESOURCE</div>
        <h2>A/L Accounting</h2>

        ${
          book01Assigned
            ? `
              <p>Choose a paper to open its model answers.</p>
              <div class="paper-grid">
                ${paperCardsHtml()}
              </div>
            `
            : `
              <p>This digital resource has not been assigned to your account.</p>
              <div class="book-action-area">
                <a class="book-action locked-buy"
                   href="index.html?buy=Book%2001#store">
                  Buy Book <span class="action-arrow">→</span>
                </a>
              </div>
            `
        }
      </div>
    </article>

    <article class="book-card locked">
      <div class="book-cover">
        <img src="assets/book-02.jpg" alt="LKAS & SLFRS Part-I">
        <div class="locked-overlay">
          <div class="lock-icon">🔒</div>
          <span>LOCKED</span>
        </div>
      </div>
      <div class="book-content">
        <div class="book-label">BOOK 02 · DIGITAL RESOURCE</div>
        <h2>LKAS &amp; SLFRS · Part-I</h2>
        <p>This digital resource has not been assigned to your account.</p>
        <div class="book-action-area">
          <a class="book-action locked-buy"
             href="index.html?buy=Book%2002#store">
            Buy Book <span class="action-arrow">→</span>
          </a>
        </div>
      </div>
    </article>

    <article class="book-card locked">
      <div class="book-cover">
        <img src="assets/book-03.jpg" alt="LKAS & SLFRS Part-II">
        <div class="locked-overlay">
          <div class="lock-icon">🔒</div>
          <span>LOCKED</span>
        </div>
      </div>
      <div class="book-content">
        <div class="book-label">BOOK 03 · DIGITAL RESOURCE</div>
        <h2>LKAS &amp; SLFRS · Part-II</h2>
        <p>This digital resource has not been assigned to your account.</p>
        <div class="book-action-area">
          <a class="book-action locked-buy"
             href="index.html?buy=Book%2003#store">
            Buy Book <span class="action-arrow">→</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

function showSessionMessage() {
  if (studentInfo) {
    studentInfo.innerHTML = `
      <div class="student-info-card">
        <div>
          <span class="info-label">SESSION</span>
          <strong>Student information is unavailable.</strong>
        </div>
      </div>
    `;
  }

  if (bookGrid) {
    bookGrid.innerHTML = `
      <div style="grid-column:1/-1;padding:35px;text-align:center">
        <h2>Session not found</h2>
        <p style="margin:10px 0 20px">Please login again to access your digital books.</p>
        <a href="login.html" class="book-action unlocked-action"
           style="max-width:260px;margin:auto">
          Go to Login <span>→</span>
        </a>
      </div>
    `;
  }
}

async function refreshStudentFromFirestore(student) {
  const docId =
    localStorage.getItem(STUDENT_DOC_KEY) ||
    student.docId ||
    "";

  if (!docId) return student;

  try {
    const snap = await getDoc(doc(db, "students", docId));
    if (!snap.exists()) return student;

    const updatedStudent = {
      ...student,
      ...snap.data(),
      docId
    };

    localStorage.setItem(STUDENT_KEY, JSON.stringify(updatedStudent));
    return updatedStudent;
  } catch (error) {
    console.error("Dashboard Firestore refresh failed:", error);
    return student;
  }
}

async function initDashboard() {
  const loginUsername = localStorage.getItem(LOGIN_KEY);
  let student = getStoredStudent();

  if (!student) {
    showSessionMessage();
    return;
  }

  if (!student.username && loginUsername) {
    student.username = loginUsername;
  }

  renderStudentInfo(student);
  renderBooks(student);

  const freshStudent = await refreshStudentFromFirestore(student);
  renderStudentInfo(freshStudent);
  renderBooks(freshStudent);
}

initDashboard();
