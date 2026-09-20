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
      "Book 02",

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
      "Book 03",

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

  if (
    student.assignedBook
  ) {

    return String(
      student.assignedBook
    ).trim();

  }


  if (
    student["Assigned Book"]
  ) {

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


  /*
   * Replace instead of normal
   * navigation so dashboard
   * won't remain in browser history.
   */

  location.replace(
    "login.html"
  );

}


/* =====================================================
   GLOBAL LOGOUT
   Supports old onclick="logout()"
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
      document.getElementById(
        "logout"
      );


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
    document.getElementById(
      "bookGrid"
    );


  if (!grid) {

    return;

  }


  /*
   * Get student's assigned book.
   */

  const assignedBook =
    getAssignedBook(
      student
    );


  const assignedNormalized =
    normalizeBook(
      assignedBook
    );


  console.log(
    "Student:",
    student.username
  );


  console.log(
    "Assigned Book:",
    assignedBook
  );


  /*
   * Clear existing cards.
   */

  grid.innerHTML = "";


  /*
   * Render Book 01 / 02 / 03.
   */

  BOOKS.forEach(
    (book) => {


      const allowed =
        assignedNormalized ===
        normalizeBook(
          book.name
        );


      const card =
        document.createElement(
          "article"
        );


      card.dataset.book =
        book.name;


      /* =================================================
         ASSIGNED / UNLOCKED BOOK
      ================================================= */

      if (allowed) {

        card.className =
          "book-card book-unlocked";


        card.innerHTML = `

          <div class="book-cover">

            <img
              src="${book.image}"
              alt="${book.title}"
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
         COVER IMAGE ALSO SHOWN
      ================================================= */

      else {

        card.className =
          "book-card locked-card";


        card.innerHTML = `

          <div class="book-cover">

            <img
              src="${book.image}"
              alt="${book.title}"
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


      grid.appendChild(
        card
      );

    }
  );


  /* =================================================
     BUY BUTTONS
  ================================================= */

  grid
    .querySelectorAll(
      "[data-buy-book]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const bookName =
              button.dataset.buyBook;


            alert(
              `${bookName} purchase option will be available soon.`
            );

          }
        );

      }
    );

}


/* =====================================================
   LOAD STUDENT
===================================================== */

async function loadStudent() {


  /*
   * Get logged-in username.
   */

  const username =
    localStorage.getItem(
      LOGIN_KEY
    );


  /*
   * No login.
   */

  if (!username) {

    location.replace(
      "login.html"
    );

    return;

  }


  try {


    /* =================================================
       GET STUDENT DOCUMENT
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


    /*
     * Student document doesn't exist.
     */

    if (!snapshot.exists()) {

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


    /*
     * Student data.
     */

    const student =
      snapshot.data();


    /* =================================================
       ACTIVE CHECK
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
      JSON.stringify(
        student
      )
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
        username;


      const assigned =
        getAssignedBook(
          student
        );


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
       RENDER BOOK CARDS
    ================================================= */

    renderBooks(
      student
    );


  }


  catch (error) {


    console.error(
      "Dashboard error:",
      error
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

  }

}


/* =====================================================
   START
===================================================== */

loadStudent();
