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
   GET SAVED STUDENT
   ===================================================== */

function getStoredStudent() {
  try {
    const raw =
      localStorage.getItem(STUDENT_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);

  } catch (error) {

    console.error(
      "Could not read saved student:",
      error
    );

    return null;
  }
}


/* =====================================================
   NORMALIZE BOOK NAME
   ===================================================== */

function normalizeBook(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ");
}


/* =====================================================
   CHECK ASSIGNED BOOK
   ===================================================== */

function isAssignedBook(
  assignedBook,
  bookCode
) {
  return (
    normalizeBook(assignedBook) ===
    normalizeBook(bookCode)
  );
}


/* =====================================================
   ESCAPE HTML
   ===================================================== */

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

  localStorage.removeItem(
    LOGIN_KEY
  );

  localStorage.removeItem(
    STUDENT_KEY
  );

  localStorage.removeItem(
    STUDENT_DOC_KEY
  );

  location.replace(
    "login.html"
  );
}


/* =====================================================
   GLOBAL LOGOUT
   ===================================================== */

window.logout =
  logoutStudent;


/* =====================================================
   PAGE ELEMENTS
   ===================================================== */

const studentInfo =
  document.getElementById(
    "studentInfo"
  );

const bookGrid =
  document.getElementById(
    "bookGrid"
  );

const logoutButton =
  document.getElementById(
    "logout"
  );


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
   STUDENT INFORMATION
   ===================================================== */

function renderStudentInfo(
  student
) {

  if (!studentInfo) {
    return;
  }


  const fullName =
    student.fullName ||
    student["Full Name"] ||
    student.name ||
    "";


  const username =
    student.username ||
    student.Username ||
    localStorage.getItem(
      LOGIN_KEY
    ) ||
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
          ${escapeHtml(
            fullName || username
          )}
        </strong>

      </div>


      <div>

        <span class="info-label">
          USERNAME
        </span>

        <strong>
          ${escapeHtml(
            username
          )}
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
                ${escapeHtml(
                  district
                )}
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
          ${escapeHtml(
            assignedBook ||
            "Not assigned"
          )}
        </strong>

      </div>

    </div>

  `;
}


/* =====================================================
   RENDER BOOK CARDS
   ===================================================== */

function renderBooks(
  student
) {

  if (!bookGrid) {
    return;
  }


  const assignedBook =
    student.assignedBook ||
    student["Assigned Book"] ||
    "";


  bookGrid.innerHTML = "";


  BOOKS.forEach(
    (book) => {

      const assigned =
        isAssignedBook(
          assignedBook,
          book.code
        );


      /* =================================================
         ASSIGNED BOOK
         ================================================= */

      if (assigned) {

        bookGrid.insertAdjacentHTML(
          "beforeend",
          `

          <article
            class="book-card unlocked"
          >

            <div class="book-cover">

              <img
                src="${book.image}"
                alt="${escapeHtml(
                  book.title
                )}"
              >

              <div
                class="assigned-badge"
              >
                ✓ ASSIGNED TO YOU
              </div>

            </div>


            <div class="book-content">

              <div class="book-label">
                ${escapeHtml(
                  book.label
                )}
              </div>


              <h2>
                ${escapeHtml(
                  book.title
                )}
              </h2>


              <p>
                Complete digital answer
                resource for your
                ${escapeHtml(
                  book.title
                )} book.
              </p>


              <div
                class="book-action-area"
              >

                <a
                  href="${book.assignedLink}"
                  class="
                    book-action
                    unlocked-action
                  "
                >

                  <span>
                    Open Answers
                  </span>

                  <span
                    class="action-arrow"
                  >
                    →
                  </span>

                </a>


                <div
                  class="
                    access-status
                    unlocked-status
                  "
                >

                  <span
                    class="status-dot"
                  ></span>

                  DIGITAL ACCESS ACTIVE

                </div>

              </div>

            </div>

          </article>

          `
        );

        return;
      }


      /* =================================================
         LOCKED BOOK
         ================================================= */

      bookGrid.insertAdjacentHTML(
        "beforeend",
        `

        <article
          class="book-card locked"
        >

          <div class="book-cover">

            <img
              src="${book.image}"
              alt="${escapeHtml(
                book.title
              )}"
            >


            <div
              class="locked-overlay"
            >

              <div
                class="lock-icon"
              >
                🔒
              </div>

              <span>
                LOCKED
              </span>

            </div>

          </div>


          <div class="book-content">

            <div class="book-label">
              ${escapeHtml(
                book.label
              )}
            </div>


            <h2>
              ${escapeHtml(
                book.title
              )}
            </h2>


            <p>
              This digital resource has
              not been assigned to your
              account.
            </p>


            <div
              class="book-action-area"
            >

              <a
                href="${book.buyLink}"
                class="
                  book-action
                  locked-buy
                "
              >

                <span>
                  Buy Book
                </span>

                <span
                  class="action-arrow"
                >
                  →
                </span>

              </a>


              <div
                class="
                  access-status
                  locked-status
                "
              >

                <span
                  class="status-lock"
                >
                  🔒
                </span>

                ACCESS NOT ASSIGNED

              </div>

            </div>

          </div>

        </article>

        `
      );

    }
  );
}


/* =====================================================
   SESSION MESSAGE
   ===================================================== */

function showSessionMessage() {

  if (studentInfo) {

    studentInfo.innerHTML = `

      <div
        class="student-info-card"
      >

        <div>

          <span
            class="info-label"
          >
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

        <p
          style="
            margin: 10px 0 20px;
          "
        >
          Please login again to access
          your digital books.
        </p>


        <a
          href="login.html"
          class="
            book-action
            unlocked-action
          "
          style="
            max-width: 260px;
            margin: auto;
          "
        >

          <span>
            Go to Login
          </span>

          <span>
            →
          </span>

        </a>

      </div>

    `;
  }
}


/* =====================================================
   REFRESH STUDENT FROM FIRESTORE
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
      await getDoc(
        studentRef
      );


    if (
      !studentSnapshot.exists()
    ) {

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


    if (
      !updatedStudent.username &&
      student.username
    ) {

      updatedStudent.username =
        student.username;

    }


    if (
      !updatedStudent.assignedBook &&
      updatedStudent["Assigned Book"]
    ) {

      updatedStudent.assignedBook =
        updatedStudent[
          "Assigned Book"
        ];

    }


    localStorage.setItem(
      STUDENT_KEY,
      JSON.stringify(
        updatedStudent
      )
    );


    return updatedStudent;


  } catch (error) {

    console.error(
      "Dashboard Firestore refresh failed:",
      error
    );

    return student;
  }
}


/* =====================================================
   DASHBOARD INITIALIZATION
   ===================================================== */

async function initDashboard() {

  const loginUsername =
    localStorage.getItem(
      LOGIN_KEY
    );


  let student =
    getStoredStudent();


  /*
    IMPORTANT:

    Do NOT automatically redirect
    to login from dashboard.

    This prevents the dashboard
    login bounce problem.
  */


  if (!student) {

    console.warn(
      "No saved student session found."
    );

    showSessionMessage();

    return;
  }


  if (
    !student.username &&
    loginUsername
  ) {

    student.username =
      loginUsername;

  }


  /* Render immediately */

  renderStudentInfo(
    student
  );

  renderBooks(
    student
  );


  /* Refresh Firestore data */

  const freshStudent =
    await refreshStudentFromFirestore(
      student
    );


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
   START DASHBOARD
   ===================================================== */

initDashboard();
