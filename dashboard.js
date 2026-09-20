import {
  db,
  doc,
  getDoc
} from "./firebase.js";


/* =========================
   STORAGE KEYS
========================= */

const LOGIN_KEY = "bf_login";
const STUDENT_KEY = "bf_student";


/* =========================
   BOOK CONFIG
   ONLY BOOK 01, 02, 03
========================= */

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
    title: "Book 02",
    description:
      "Digital answer resource for Book 02.",
    image: "",
    answerPage: "#"
  },

  {
    number: "03",
    name: "Book 03",
    title: "Book 03",
    description:
      "Digital answer resource for Book 03.",
    image: "",
    answerPage: "#"
  }

];


/* =========================
   NORMALIZE BOOK NAME
========================= */

function normalizeBook(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

}


/* =========================
   GET ASSIGNED BOOK
========================= */

function getAssignedBook(student) {

  /*
   * Normal Firestore field
   */
  if (student.assignedBook) {

    return String(
      student.assignedBook
    ).trim();

  }


  /*
   * Excel-style field name
   */
  if (student["Assigned Book"]) {

    return String(
      student["Assigned Book"]
    ).trim();

  }


  return "";

}


/* =========================
   RENDER BOOKS
========================= */

function renderBooks(student) {

  const grid =
    document.getElementById(
      "bookGrid"
    );


  if (!grid) {
    return;
  }


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
   * Create ONLY Book 01, 02, 03.
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


      /*
       * Assigned book = unlocked
       * Other books = locked
       */
      if (allowed) {

        card.className =
          "book-card book-unlocked";

      } else {

        card.className =
          "book-card locked-card";

      }


      card.dataset.book =
        book.name;


      /* =====================
         UNLOCKED BOOK
      ===================== */

      if (allowed) {

        card.innerHTML = `

          <div class="book-cover">

            ${
              book.image
                ? `
                  <img
                    src="${book.image}"
                    alt="${book.title}"
                  >
                `
                : `
                  <div
                    style="
                      width:100%;
                      height:100%;
                      display:grid;
                      place-items:center;
                      font-size:50px;
                    "
                  >
                    📖
                  </div>
                `
            }

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


      /* =====================
         LOCKED BOOK
      ===================== */

      else {

        card.innerHTML = `

          <div class="lock-icon">
            🔒
          </div>


          <div class="locked-label">
            LOCKED
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

        `;

      }


      grid.appendChild(
        card
      );

    }
  );


  /* =========================
     BUY BUTTONS
  ========================= */

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


/* =========================
   LOAD STUDENT
========================= */

async function loadStudent() {

  const username =
    localStorage.getItem(
      LOGIN_KEY
    );


  /*
   * No login session.
   */
  if (!username) {

    location.href =
      "login.html";

    return;

  }


  try {

    /*
     * Student document.
     */
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
     * Student not found.
     */
    if (!snapshot.exists()) {

      localStorage.removeItem(
        LOGIN_KEY
      );

      localStorage.removeItem(
        STUDENT_KEY
      );

      location.href =
        "login.html";

      return;

    }


    const student =
      snapshot.data();


    /*
     * Active check.
     */
    if (
      student.active === false
    ) {

      localStorage.removeItem(
        LOGIN_KEY
      );

      localStorage.removeItem(
        STUDENT_KEY
      );

      location.href =
        "login.html";

      return;

    }


    /*
     * Save current student.
     */
    localStorage.setItem(
      STUDENT_KEY,
      JSON.stringify(
        student
      )
    );


    /* =========================
       STUDENT INFO
    ========================= */

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


    /* =========================
       RENDER BOOKS
    ========================= */

    renderBooks(
      student
    );


  } catch (error) {

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


    location.href =
      "login.html";

  }

}


/* =========================
   LOGOUT
========================= */

window.logout =
  function () {

    localStorage.removeItem(
      LOGIN_KEY
    );

    localStorage.removeItem(
      STUDENT_KEY
    );


    location.href =
      "login.html";

  };


/* =========================
   START
========================= */

loadStudent();
