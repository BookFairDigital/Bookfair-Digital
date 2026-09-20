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


/* =====================================================
   BOOK CONFIG
   ONLY BOOK 01, 02, 03
===================================================== */

const BOOKS = [

  {
    number: "01",
    name: "Book 01",

    title:
      "A/L Accounting",

    description:
      "Complete digital answer resource for your A/L Accounting book.",

    image:
      "assets/accounting.jpg",

    answerPage:
      "accounting.html"
  },

  {
    number: "02",
    name: "Book 02",

    title:
      "LKAS & SLFRS · Part-I",

    description:
      "Digital answer resource for Book 02.",

    image:
      "assets/book-02.jpg",

    answerPage:
      "#"
  },

  {
    number: "03",
    name: "Book 03",

    title:
      "LKAS & SLFRS · Part-II",

    description:
      "Digital answer resource for Book 03.",

    image:
      "assets/book-03.jpg",

    answerPage:
      "#"
  }

];


/* =====================================================
   NORMALIZE BOOK NAME
===================================================== */

function normalizeBook(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

}


/* =====================================================
   GET ASSIGNED BOOK
===================================================== */

function getAssignedBook(student) {

  if (student.assignedBook) {

    return String(
      student.assignedBook
    ).trim();

  }

  if (student["Assigned Book"]) {

    return String(
      student["Assigned Book"]
    ).trim();

  }

  return "";

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
   LOGOUT BUTTON
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const logoutButton =
      document.getElementById("logout");

    if (logoutButton) {

      logoutButton.addEventListener(
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

  if (!grid) {
    return;
  }


  /* -----------------------------------------------
     STUDENT ASSIGNED BOOK
  ------------------------------------------------ */

  const assignedBook =
    getAssignedBook(student);

  const assignedNormalized =
    normalizeBook(assignedBook);


  console.log(
    "BookFair Digital student:",
    student.username ||
    student.Username ||
    "unknown"
  );

  console.log(
    "Assigned book:",
    assignedBook
  );


  /* -----------------------------------------------
     CLEAR LOADING STATE
  ------------------------------------------------ */

  grid.innerHTML = "";


  /* -----------------------------------------------
     CREATE 3 BOOK CARDS
  ------------------------------------------------ */

  BOOKS.forEach((book) => {

    const allowed =
      assignedNormalized ===
      normalizeBook(book.name);


    const card =
      document.createElement("article");


    card.dataset.book =
      book.name;


    /* =================================================
       ASSIGNED BOOK
    ================================================= */

    if (allowed) {

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

            <span>
              •
            </span>

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
       LOCKED BOOK
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

            <span>
              •
            </span>

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

  });


  /* =================================================
     BUY BUTTONS
  ================================================= */

  grid
    .querySelectorAll("[data-buy-book]")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          const bookName =
            button.dataset.buyBook;


          /*
           * Current dashboard behaviour.
           * Ecommerce purchase can be connected later.
           */

          alert(
            `${bookName} purchase option will be available soon.`
          );

        }
      );

    });

}


/* =====================================================
   LOAD STUDENT
===================================================== */

async function loadStudent() {

  /*
   * IMPORTANT:
   * The username saved during login is used here.
   */

  const username =
    localStorage.getItem(
      LOGIN_KEY
    );


  /* =================================================
     NOT LOGGED IN
  ================================================= */

  if (!username) {

    location.replace(
      "login.html"
    );

    return;

  }


  try {

    /* =================================================
       GET EXACT STUDENT DOCUMENT
    ================================================= */

    const studentRef =
      doc(
        db,
        "students",
        username
      );


    const snapshot =
      await getDoc(
        studentRef
      );


    /* =================================================
       DOCUMENT NOT FOUND
    ================================================= */

    if (!snapshot.exists()) {

      console.error(
        "Student document not found:",
        username
      );


      localStorage.removeItem(
        LOGIN_KEY
      );

      localStorage.removeItem(
        STUDENT_KEY
      );


      location.replace(
        "login.html"
      );

      return;

    }


    /* =================================================
       STUDENT DATA
    ================================================= */

    const student =
      snapshot.data();


    /* =================================================
       ACTIVE ACCOUNT CHECK
    ================================================= */

    if (
      student.active === false
    ) {

      localStorage.removeItem(
        LOGIN_KEY
      );

      localStorage.removeItem(
        STUDENT_KEY
      );


      location.replace(
        "login.html"
      );

      return;

    }


    /* =================================================
       SAVE CURRENT STUDENT
    ================================================= */

    localStorage.setItem(
      STUDENT_KEY,
      JSON.stringify(student)
    );


    /* =================================================
       STUDENT INFORMATION
    ================================================= */

    const studentInfo =
      document.getElementById(
        "studentInfo"
      );


    if (studentInfo) {

      const name =
        student.fullName ||
        student["Full Name"] ||
        student.username ||
        student.Username ||
        username;


      const assigned =
        getAssignedBook(student);


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
     * IMPORTANT:
     *
     * There is intentionally NO:
     *
     * location.href = "index.html"
     *
     * here.
     *
     * Once dashboard.html is loaded,
     * the student stays on the dashboard.
     */

  }


  catch (error) {

    console.error(
      "Dashboard error:",
      error
    );


    /*
     * Only return to login if the
     * dashboard cannot verify the
     * student account.
     */

    localStorage.removeItem(
      LOGIN_KEY
    );

    localStorage.removeItem(
      STUDENT_KEY
    );


    location.replace(
      "login.html"
    );

  }

}


/* =====================================================
   START DASHBOARD
===================================================== */

loadStudent();
