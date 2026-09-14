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
   LOGIN CHECK
========================= */

const username =
  localStorage.getItem(LOGIN_KEY);


if (!username) {

  location.href = "login.html";

} else {

  try {

    /* =========================
       GET STUDENT
    ========================= */

    const studentRef =
      doc(
        db,
        "students",
        username
      );


    const snapshot =
      await getDoc(studentRef);


    if (!snapshot.exists()) {

      localStorage.removeItem(
        LOGIN_KEY
      );

      localStorage.removeItem(
        STUDENT_KEY
      );

      location.href =
        "login.html";

    } else {

      const student =
        snapshot.data();


      /* =========================
         ACTIVE CHECK
      ========================= */

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

      } else {


        /* =========================
           SAVE STUDENT
        ========================= */

        localStorage.setItem(
          STUDENT_KEY,
          JSON.stringify(student)
        );


        /* =========================
           STUDENT NAME
        ========================= */

        document
          .querySelectorAll(
            "[data-student-name]"
          )
          .forEach(
            (element) => {

              element.textContent =
                student.fullName ||
                student.username ||
                username;

            }
          );


        /* =========================
           ASSIGNED BOOK
        ========================= */

        const assignedBook =
          String(
            student.assignedBook || ""
          )
            .trim()
            .toLowerCase();


        console.log(
          "Student:",
          student.username
        );

        console.log(
          "Assigned book:",
          student.assignedBook
        );


        /* =========================
           FIND ALL BOOK CARDS
        ========================= */

        const cards =
          document.querySelectorAll(
            ".book-card"
          );


        cards.forEach(
          (card, index) => {

            const number =
              String(index + 1)
                .padStart(2, "0");


            const currentBook =
              `book ${number}`;


            const isAllowed =
              assignedBook ===
              currentBook;


            /* =====================
               RESET CARD
            ===================== */

            card.classList.remove(
              "book-unlocked",
              "book-locked"
            );


            card.dataset.access =
              isAllowed
                ? "allowed"
                : "locked";


            /* =====================
               REMOVE OLD LOCK UI
            ===================== */

            card
              .querySelectorAll(
                ".lock-message"
              )
              .forEach(
                (element) =>
                  element.remove()
              );


            card
              .querySelectorAll(
                ".locked-overlay"
              )
              .forEach(
                (element) =>
                  element.remove()
              );


            /* =====================
               FIND ANSWER LINK
            ===================== */

            const answerLink =
              card.querySelector(
                'a[href*=".html"]'
              );


            /* =====================
               ASSIGNED BOOK
            ===================== */

            if (isAllowed) {

              card.classList.add(
                "book-unlocked"
              );


              if (answerLink) {

                answerLink.style.display =
                  "";

                answerLink.style.pointerEvents =
                  "auto";

                answerLink.removeAttribute(
                  "aria-disabled"
                );

                answerLink.classList.remove(
                  "locked-link"
                );

              }


              /* Remove any
                 lock text */

              card
                .querySelectorAll(
                  ".book-status"
                )
                .forEach(
                  (status) => {

                    status.textContent =
                      "● ASSIGNED TO YOU";

                  }
                );


            }


            /* =====================
               LOCKED BOOK
            ===================== */

            else {

              card.classList.add(
                "book-locked"
              );


              /* ---------------------
                 REMOVE OPEN ANSWERS
              --------------------- */

              if (answerLink) {

                answerLink.style.display =
                  "none";

                answerLink.style.pointerEvents =
                  "none";

                answerLink.setAttribute(
                  "aria-disabled",
                  "true"
                );

                answerLink.classList.add(
                  "locked-link"
                );

              }


              /* ---------------------
                 CHANGE STATUS
              --------------------- */

              card
                .querySelectorAll(
                  ".book-status"
                )
                .forEach(
                  (status) => {

                    status.textContent =
                      "🔒 LOCKED";

                  }
                );


              /* ---------------------
                 PROFESSIONAL LOCK BOX
              --------------------- */

              const lockBox =
                document.createElement(
                  "div"
                );


              lockBox.className =
                "lock-message";


              lockBox.innerHTML = `

                <div class="lock-icon">
                  🔒
                </div>

                <div class="lock-copy">

                  <strong>
                    ACCESS NOT ASSIGNED
                  </strong>

                  <span>
                    Not assigned to your account
                  </span>

                </div>

              `;


              card.appendChild(
                lockBox
              );

            }

          }
        );

      }

    }

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
