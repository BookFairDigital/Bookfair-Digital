/* =====================================================
   BOOKFAIR DIGITAL
   STUDENT DASHBOARD
   ===================================================== */

import {
  db,
  doc,
  getDoc
} from "./firebase.js";


/* =====================================================
   STORAGE KEYS
===================================================== */

const LOGIN_KEY = "bf_login";
const STUDENT_KEY = "bf_student";
const STUDENT_DOC_KEY = "bf_student_doc";


/* =====================================================
   BOOK DATA
===================================================== */

const BOOKS = [
  {
    code: "Book 01",
    title: "A/L Accounting",
    label: "BOOK 01 · DIGITAL RESOURCE",
    description:
      "Complete digital answer resource for your A/L Accounting book.",
    image: "assets/accounting.jpg",
    assignedButton: "Open Answers",
    assignedLink: "accounting.html",
    buyLink: "index.html?buy=Book%2001#store"
  },

  {
    code: "Book 02",
    title: "LKAS & SLFRS · Part-I",
    label: "BOOK 02 · DIGITAL RESOURCE",
    description:
      "This digital resource has not been assigned to your account.",
    image: "assets/book-02.jpg",
    assignedButton: "Open Book",
    assignedLink: "#",
    buyLink: "index.html?buy=Book%2002#store"
  },

  {
    code: "Book 03",
    title: "LKAS & SLFRS · Part-II",
    label: "BOOK 03 · DIGITAL RESOURCE",
    description:
      "This digital resource has not been assigned to your account.",
    image: "assets/book-03.jpg",
    assignedButton: "Open Book",
    assignedLink: "#",
    buyLink: "index.html?buy=Book%2003#store"
  }
];


/* =====================================================
   HELPERS
===================================================== */

function getStoredStudent() {
  try {
    const raw =
      localStorage.getItem(STUDENT_KEY);

    if (!raw) return null;

    return JSON.parse(raw);

  } catch (error) {
    console.error(
      "Could not read saved student:",
      error
    );

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


function isAssignedBook(
  assignedBook,
  bookCode
) {
  return (
    normalizeBook(assignedBook) ===
    normalizeBook(bookCode)
  );
}


function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   LOGOUT
===================================================== */

function logoutStudent() {

  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(STUDENT_KEY);
  localStorage.removeItem(STUDENT_DOC_KEY);

  location.replace("login.html");
}


window.logout = logoutStudent;


/* =====================================================
   ELEMENTS
===================================================== */

const studentInfo =
  document.getElementById("studentInfo");

const bookGrid =
  document.getElementById("bookGrid");

const logoutButton =
  document.getElementById("logout");


/* =====================================================
   LOGOUT BUTTON
===================================================== */

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    logoutStudent
  );

}


/* =====================================================
   RENDER STUDENT INFO
===================================================== */

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
        <span class="info-label">
          STUDENT
        </span>

        <strong>
          ${escapeHtml(fullName || username)}
        </strong>
      </div>

      <div>
        <span class="info-label">
          USERNAME
        </span>

        <strong>
          ${escapeHtml(username)}
        </strong>
      </div>

      ${
        district
          ? `
            <div>
              <span class="info-label">
                DISTRICT
              </span>

              <strong>
                ${escapeHtml(district)}
              </strong>
            </div>
          `
          : ""
      }

      <div>
        <span class="info-label">
          ASSIGNED BOOK
        </span>

        <strong>
          ${escapeHtml(assignedBook || "Not assigned")}
        </strong>
      </div>

    </div>
  `;
}


/* =====================================================
   RENDER BOOKS
===================================================== */

function renderBooks(student) {

  if (!bookGrid) return;

  const assignedBook =
    student.assignedBook ||
    student["Assigned Book"] ||
    "";

  bookGrid.innerHTML = "";

  BOOKS.forEach((book) => {

    const assigned =
      isAssignedBook(
        assignedBook,
        book.code
      );


    /* ===============================================
       ASSIGNED BOOK
    =============================================== */

    if (assigned) {

      bookGrid.insertAdjacentHTML(
        "beforeend",
        `
        <article class="book-card unlocked">

          <div class="book-cover">

            <img
              src="${book.image}"
              alt="${escapeHtml(book.title)}"
            >

            <div class="assigned-badge">
              ✓ ASSIGNED TO YOU
            </div>

          </div>


          <div class="book-content">

            <div class="book-label">
              ${escapeHtml(book.label)}
            </div>

            <h2>
              ${escapeHtml(book.title)}
            </h2>

            <p>
              Complete digital answer resource
              for your ${escapeHtml(book.title)} book.
            </p>


            <a
              href="${book.assignedLink}"
              class="book-action unlocked-action"
            >
              ${escapeHtml(book.assignedButton)}
              <span>→</span>
            </a>

          </div>

        </article>
        `
      );

      return;
    }


    /* ===============================================
       LOCKED BOOK
    =============================================== */

    bookGrid.insertAdjacentHTML(
      "beforeend",
      `
      <article class="book-card locked">

        <div class="book-cover">

          <img
            src="${book.image}"
            alt="${escapeHtml(book.title)}"
          >

          <div class="locked-overlay">

            <div class="lock-icon">
              🔒
            </div>

            <span>
              LOCKED
            </span>

          </div>

        </div>


        <div class="book-content">

          <div class="book-label">
            ${escapeHtml(book.label)}
          </div>

          <h2>
            ${escapeHtml(book.title)}
          </h2>

          <p>
            This digital resource has not
            been assigned to your account.
          </p>


          <a
            href="${book.buyLink}"
            class="book-action locked-buy"
          >
            Buy Book
            <span>→</span>
          </a>


          <div class="access-note">
            ACCESS NOT ASSIGNED
          </div>

        </div>

      </article>
      `
    );

  });
}


/* =====================================================
   SHOW SESSION MESSAGE
===================================================== */

function showSessionMessage() {

  if (studentInfo) {

    studentInfo.innerHTML = `
      <div class="student-info-card">

        <div>
          <span class="info-label">
            SESSION
          </span>

          <strong>
            Student information is unavailable.
          </strong>
        </div>

      </div>
    `;
  }


  if (bookGrid) {

    bookGrid.innerHTML = `
      <div
        style="
          grid-column: 1 / -1;
          padding: 35px;
          text-align: center;
        "
      >

        <h2>
          Session not found
        </h2>

        <p style="margin: 10px 0 20px;">
          Please login again to access your digital books.
        </p>

        <a
          href="login.html"
          class="book-action unlocked-action"
          style="
            max-width: 260px;
            margin: auto;
          "
        >
          Go to Login
          <span>→</span>
        </a>

      </div>
    `;
  }
}


/* =====================================================
   FIRESTORE REFRESH
===================================================== */

async function refreshStudentFromFirestore(
  student
) {

  const docId =
    localStorage.getItem(
      STUDENT_DOC_KEY
    ) ||
    student.docId ||
    "";


  if (!docId) {
    return student;
  }


  try {

    const studentRef =
      doc(
        db,
        "students",
        docId
      );


    const studentSnapshot =
      await getDoc(studentRef);


    if (!studentSnapshot.exists()) {

      console.warn(
        "Student Firestore document not found."
      );

      return student;
    }


    const freshData =
      studentSnapshot.data();


    const updatedStudent = {
      ...student,
      ...freshData,
      docId: docId
    };


    /*
      Keep the original username if
      Firestore data does not contain it.
    */

    if (
      !updatedStudent.username &&
      student.username
    ) {
      updatedStudent.username =
        student.username;
    }


    /*
      Keep Assigned Book from either
      naming style.
    */

    if (
      !updatedStudent.assignedBook &&
      updatedStudent["Assigned Book"]
    ) {
      updatedStudent.assignedBook =
        updatedStudent["Assigned Book"];
    }


    localStorage.setItem(
      STUDENT_KEY,
      JSON.stringify(updatedStudent)
    );


    return updatedStudent;

  } catch (error) {

    /*
      IMPORTANT:
      Do not redirect the student if
      Firestore refresh fails.

      Dashboard can still work using
      the locally saved login data.
    */

    console.error(
      "Dashboard Firestore refresh failed:",
      error
    );

    return student;
  }
}


/* =====================================================
   INITIALIZE DASHBOARD
===================================================== */

async function initDashboard() {

  const loginUsername =
    localStorage.getItem(
      LOGIN_KEY
    );

  let student =
    getStoredStudent();


  /*
    We intentionally DO NOT automatically
    redirect to login here.

    This prevents the dashboard from
    bouncing back to the login page.
  */

  if (!student) {

    console.warn(
      "No saved student session found."
    );

    showSessionMessage();

    return;
  }


  /*
    Make sure username exists.
  */

  if (
    !student.username &&
    loginUsername
  ) {

    student.username =
      loginUsername;
  }


  /*
    Render immediately from localStorage.
    This makes dashboard appear without
    waiting for Firestore.
  */

  renderStudentInfo(student);
  renderBooks(student);


  /*
    Then silently refresh student data
    from Firestore.
  */

  const freshStudent =
    await refreshStudentFromFirestore(
      student
    );


  /*
    Re-render only if Firestore returned
    updated data.
  */

  if (freshStudent) {

    renderStudentInfo(
      freshStudent
    );

    renderBooks(
      freshStudent
    );
  }

}


/* =====================================================
   START
===================================================== */

initDashboard();
