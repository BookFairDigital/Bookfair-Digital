import {
  db,
  doc,
  getDoc
} from "./firebase.js";


/* =====================================================
   STORAGE
===================================================== */

const LOGIN_KEY = "bf_login";
const STUDENT_KEY = "bf_student";
const STUDENT_DOC_KEY = "bf_student_doc";


/* =====================================================
   BOOKS
===================================================== */

const BOOKS = [

  {
    number: "01",
    name: "Book 01",
    title: "A/L Accounting",
    description:
      "Complete digital answer resource for your A/L Accounting book.",
    image: "assets/accounting.jpg",
    answerPage: "accounting.html"
  },

  {
    number: "02",
    name: "Book 02",
    title: "LKAS & SLFRS · Part-I",
    description:
      "Digital answer resource for Book 02.",
    image: "assets/book-02.jpg",
    answerPage: "#"
  },

  {
    number: "03",
    name: "Book 03",
    title: "LKAS & SLFRS · Part-II",
    description:
      "Digital answer resource for Book 03.",
    image: "assets/book-03.jpg",
    answerPage: "#"
  }

];


/* =====================================================
   HELPERS
===================================================== */

function normalizeBook(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

}


function getAssignedBook(student) {

  return String(
    student.assignedBook ||
    student["Assigned Book"] ||
    ""
  ).trim();

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


window.logout =
  logoutStudent;


/* =====================================================
   LOGOUT BUTTON
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const button =
      document.getElementById("logout");

    if (button) {

      button.addEventListener(
        "click",
        logoutStudent
      );

    }

  }
);


/* =====================================================
   RENDER BOOKS
===================================================== */

function renderBooks(student) {

  const grid =
    document.getElementById("bookGrid");

  if (!grid) return;


  const assigned =
    normalizeBook(
      getAssignedBook(student)
    );


  grid.innerHTML = "";


  BOOKS.forEach(
    (book) => {

      const isAssigned =
        assigned ===
        normalizeBook(book.name);


      const card =
        document.createElement("article");


      card.dataset.book =
        book.name;


      /* =================================================
         UNLOCKED
      ================================================= */

      if (isAssigned) {

        card.className =
          "book-card book-unlocked";


        card.innerHTML = `

          <div class="book-cover">

            <img
              src="${book.image}"
              alt="${book.title}"
              loading="lazy"
            >

            <div class="status">
              ● ASSIGNED TO YOU
            </div>

          </div>


          <div class="book-content">

            <div class="book-meta">

              <span>
                BOOK ${book.number}
              </span>

              <span>•</span>

              <span>
                DIGITAL RESOURCE
              </span>

            </div>


            <h3>
              ${book.title}
            </h3>


            <p>
              ${book.description}
            </p>


            ${
              book.answerPage !== "#"

              ? `

                <a
                  class="open-btn"
                  href="${book.answerPage}"
                >

                  <span>
                    Open Answers
                  </span>

                  <span>
                    →
                  </span>

                </a>

              `

              : `

                <button
                  class="open-btn"
                  type="button"
                  disabled
                  style="
                    opacity:.45;
                    cursor:not-allowed;
                    border:0;
                  "
                >

                  <span>
                    Coming Soon
                  </span>

                  <span>
                    →
                  </span>

                </button>

              `
            }

          </div>

        `;

      }


      /* =================================================
         LOCKED
      ================================================= */

      else {

        card.className =
          "book-card locked-card";


        card.innerHTML = `

          <div class="book-cover">

            <img
              src="${book.image}"
              alt="${book.title}"
              loading="lazy"
            >

            <div class="status">
              🔒 LOCKED
            </div>

          </div>


          <div class="locked-content">

            <div class="locked-label">
              LOCKED
            </div>


            <div class="book-meta">

              <span>
                BOOK ${book.number}
              </span>

              <span>•</span>

              <span>
                DIGITAL RESOURCE
              </span>

            </div>


            <h3>
              ${book.title}
            </h3>


            <p>
              This digital resource has not
              been assigned to your account.
            </p>


            <button
              type="button"
              class="buy-btn"
              data-buy-book="${book.name}"
            >

              <span>
                Buy Book
              </span>

              <span>
                →
              </span>

            </button>


            <div class="locked-access">
              ACCESS NOT ASSIGNED
            </div>

          </div>

        `;

      }


      grid.appendChild(card);

    }
  );


  /* =================================================
     BUY BUTTONS
  ================================================= */

  grid
    .querySelectorAll("[data-buy-book]")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            alert(
              `${button.dataset.buyBook} purchase option will be available soon.`
            );

          }
        );

      }
    );

}


/* =====================================================
   LOAD DASHBOARD
===================================================== */

function loadDashboard() {

  console.log(
    "BOOKFAIR DASHBOARD START"
  );


  /*
   * IMPORTANT:
   *
   * Dashboard uses the student object already
   * saved by app.js during successful login.
   *
   * No Firestore request is required to display
   * the dashboard.
   */


  const username =
    localStorage.getItem(
      LOGIN_KEY
    );


  const savedStudent =
    localStorage.getItem(
      STUDENT_KEY
    );


  console.log(
    "Dashboard username:",
    username
  );


  console.log(
    "Saved student exists:",
    !!savedStudent
  );


  /* =================================================
     NO LOGIN DATA
  ================================================= */

  if (!username || !savedStudent) {

    console.warn(
      "No saved student login found."
    );


    location.replace(
      "login.html"
    );

    return;

  }


  /* =================================================
     READ SAVED STUDENT
  ================================================= */

  let student;


  try {

    student =
      JSON.parse(
        savedStudent
      );

  }

  catch (error) {

    console.error(
      "Invalid student data:",
      error
    );


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

    return;

  }


  /* =================================================
     STUDENT NAME
  ================================================= */

  const name =
    student.fullName ||
    student["Full Name"] ||
    student.username ||
    student.Username ||
    username;


  /* =================================================
     ASSIGNED BOOK
  ================================================= */

  const assigned =
    getAssignedBook(student);


  console.log(
    "Student:",
    name
  );


  console.log(
    "Assigned Book:",
    assigned
  );


  /* =================================================
     SHOW STUDENT INFO
  ================================================= */

  const studentInfo =
    document.getElementById(
      "studentInfo"
    );


  if (studentInfo) {

    studentInfo.innerHTML = `

      Signed in as

      <strong>
        ${name}
      </strong>

      · Assigned book:

      <strong>
        ${assigned || "Not assigned"}
      </strong>

    `;

  }


  /* =================================================
     RENDER BOOKS
  ================================================= */

  renderBooks(
    student
  );


  /*
   * STOP HERE.
   *
   * There is NO:
   *
   * location.href = "login.html"
   *
   * and NO:
   *
   * location.href = "index.html"
   *
   *
   * Student stays on dashboard.
   */

}


/* =====================================================
   START
===================================================== */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    loadDashboard
  );

}
else {

  loadDashboard();

}
