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
   BOOK CONFIG
===================================================== */

const BOOKS = [

  {
    number: "01",
    name: "Book 01",
    title: "A/L Accounting",

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
    title: "LKAS & SLFRS · Part-I",

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
    title: "LKAS & SLFRS · Part-II",

    description:
      "Digital answer resource for Book 03.",

    image:
      "assets/book-03.jpg",

    answerPage:
      "#"
  }

];


/* =====================================================
   NORMALIZE BOOK
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


  const assignedBook =
    getAssignedBook(student);


  const assignedNormalized =
    normalizeBook(assignedBook);


  console.log(
    "BookFair Dashboard"
  );


  console.log(
    "Username:",
    student.username ||
    student.Username
  );


  console.log(
    "Assigned Book:",
    assignedBook
  );


  grid.innerHTML = "";


  BOOKS.forEach(
    (book) => {

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

  console.log(
    "Loading BookFair dashboard..."
  );


  /* =================================================
     GET SAVED LOGIN
  ================================================= */

  const username =
    localStorage.getItem(
      LOGIN_KEY
    );


  const savedStudent =
    localStorage.getItem(
      STUDENT_KEY
    );


  const savedDocId =
    localStorage.getItem(
      STUDENT_DOC_KEY
    );


  console.log(
    "Saved username:",
    username
  );


  console.log(
    "Saved document ID:",
    savedDocId
  );


  /* =================================================
     NO LOGIN
  ================================================= */

  if (!username) {

    location.replace(
      "login.html"
    );

    return;

  }


  /* =================================================
     USE SAVED STUDENT FIRST
     
     IMPORTANT:
     We don't immediately redirect to login
     just because Firestore lookup has an issue.
  ================================================= */

  let student = null;


  if (savedStudent) {

    try {

      student =
        JSON.parse(
          savedStudent
        );

    }

    catch (error) {

      console.error(
        "Saved student data invalid:",
        error
      );

    }

  }


  /* =================================================
     IF WE HAVE SAVED STUDENT
     
     Show dashboard immediately.
  ================================================= */

  if (student) {

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


    renderBooks(
      student
    );


    /*
     * Dashboard is now displayed.
     *
     * Do NOT redirect to login.html here.
     */


    /* =================================================
       OPTIONAL FIRESTORE REFRESH
    ================================================= */

    if (savedDocId) {

      try {

        const studentRef =
          doc(
            db,
            "students",
            savedDocId
          );


        const snapshot =
          await getDoc(
            studentRef
          );


        if (snapshot.exists()) {

          const freshStudent =
            snapshot.data();


          /*
           * Keep important identity values.
           */

          freshStudent.docId =
            savedDocId;


          freshStudent.username =
            freshStudent.username ||
            freshStudent.Username ||
            username;


          freshStudent.assignedBook =
            getAssignedBook(
              freshStudent
            );


          /*
           * Update local storage.
           */

          localStorage.setItem(
            STUDENT_KEY,
            JSON.stringify(
              freshStudent
            )
          );


          /*
           * Refresh dashboard.
           */

          const freshInfo =
            document.getElementById(
              "studentInfo"
            );


          if (freshInfo) {

            const freshName =
              freshStudent.fullName ||
              freshStudent["Full Name"] ||
              freshStudent.username ||
              username;


            const freshBook =
              getAssignedBook(
                freshStudent
              );


            freshInfo.innerHTML = `

              Signed in as

              <strong>
                ${freshName}
              </strong>

              · Assigned book:

              <strong>
                ${freshBook || "Not assigned"}
              </strong>

            `;

          }


          renderBooks(
            freshStudent
          );

        }

      }

      catch (error) {

        /*
         * IMPORTANT:
         *
         * If Firestore refresh fails,
         * DON'T kick the student out.
         *
         * The saved login is still displayed.
         */

        console.warn(
          "Could not refresh student data:",
          error
        );

      }

    }


    return;

  }


  /* =================================================
     OLD / MISSING STUDENT DATA
  ================================================= */

  /*
   * If there is a username but no saved student
   * profile, only then try Firestore.
   */

  if (!savedDocId) {

    console.warn(
      "No saved Firestore document ID."
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
     FIRESTORE FALLBACK
  ================================================= */

  try {

    const studentRef =
      doc(
        db,
        "students",
        savedDocId
      );


    const snapshot =
      await getDoc(
        studentRef
      );


    if (!snapshot.exists()) {

      console.error(
        "Student document not found."
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


    student =
      snapshot.data();


    if (
      student.active === false
    ) {

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


    student.docId =
      savedDocId;


    student.username =
      student.username ||
      student.Username ||
      username;


    student.assignedBook =
      getAssignedBook(
        student
      );


    localStorage.setItem(
      STUDENT_KEY,
      JSON.stringify(
        student
      )
    );


    /* =================================================
       SHOW STUDENT
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


    renderBooks(
      student
    );

  }


  catch (error) {

    console.error(
      "Dashboard Firestore error:",
      error
    );


    /*
     * IMPORTANT:
     *
     * Don't automatically kick the student
     * to login just because Firestore has
     * a temporary error.
     *
     * If we don't have student data,
     * show a useful message instead.
     */

    const grid =
      document.getElementById(
        "bookGrid"
      );


    if (grid) {

      grid.innerHTML = `

        <div class="loading-state">

          Unable to refresh your account
          right now.

          <br><br>

          Please refresh this page.

        </div>

      `;

    }

  }

}


/* =====================================================
   START
===================================================== */

loadStudent();
