import {
  db,
  doc,
  getDoc
} from "./firebase.js";


/* =========================
   CONFIG
========================= */

const LOGIN_KEY = "bf_login";
const STUDENT_KEY = "bf_student";


/* =========================
   GET STUDENT
========================= */

const username =
  localStorage.getItem(LOGIN_KEY);


if (!username) {

  location.href = "login.html";

} else {

  try {

    const ref =
      doc(
        db,
        "students",
        username
      );


    const snap =
      await getDoc(ref);


    /* =========================
       ACCOUNT NOT FOUND
    ========================= */

    if (!snap.exists()) {

      localStorage.removeItem(
        LOGIN_KEY
      );

      localStorage.removeItem(
        STUDENT_KEY
      );

      location.href =
        "login.html";

    } else {

      const data =
        snap.data();


      /* =========================
         ACCOUNT INACTIVE
      ========================= */

      if (data.active === false) {

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
           SAVE STUDENT DATA
        ========================= */

        localStorage.setItem(
          STUDENT_KEY,
          JSON.stringify(data)
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
                data.fullName ||
                data.username ||
                username;

            }
          );


        /* =========================
           ASSIGNED BOOK
        ========================= */

        const assignedBook =
          String(
            data.assignedBook ||
            ""
          )
            .trim()
            .toLowerCase();


        console.log(
          "Assigned book:",
          data.assignedBook
        );


        /* =========================
           BOOK CARDS
        ========================= */

        const bookCards =
          document.querySelectorAll(
            ".book-card"
          );


        bookCards.forEach(
          (card, index) => {

            /*
              Card 1 = Book 01
              Card 2 = Book 02
              Card 3 = Book 03
            */

            const bookNumber =
              String(index + 1)
                .padStart(2, "0");


            const bookName =
              `book ${bookNumber}`;


            const allowed =
              assignedBook ===
              bookName;


            /* =====================
               REMOVE OLD STATES
            ===================== */

            card.classList.remove(
              "book-unlocked",
              "book-locked"
            );


            /* =====================
               UNLOCK ASSIGNED BOOK
            ===================== */

            if (allowed) {

              card.classList.add(
                "book-unlocked"
              );


              card.dataset.access =
                "allowed";


              /* ---------------------
                 OPEN BUTTON
              --------------------- */

              const link =
                card.querySelector(
                  "a"
                );


              if (link) {

                link.classList.remove(
                  "locked-link"
                );

                link.removeAttribute(
                  "aria-disabled"
                );

                link.style.pointerEvents =
                  "auto";

              }


              /* ---------------------
                 STATUS
              --------------------- */

              const status =
                card.querySelector(
                  ".book-status"
                );


              if (status) {

                status.textContent =
                  "● AVAILABLE";

              }


              /* ---------------------
                 LOCK MESSAGE
              --------------------- */

              const lock =
                card.querySelector(
                  ".lock-message"
                );


              if (lock) {

                lock.remove();

              }


            } else {


              /* =====================
                 LOCK OTHER BOOKS
              ===================== */

              card.classList.add(
                "book-locked"
              );


              card.dataset.access =
                "locked";


              /* ---------------------
                 DISABLE LINK
              --------------------- */

              const link =
                card.querySelector(
                  "a"
                );


              if (link) {

                link.classList.add(
                  "locked-link"
                );

                link.setAttribute(
                  "aria-disabled",
                  "true"
                );

                link.style.pointerEvents =
                  "none";

              }


              /* ---------------------
                 STATUS
              --------------------- */

              const status =
                card.querySelector(
                  ".book-status"
                );


              if (status) {

                status.textContent =
                  "🔒 LOCKED";

              }


              /* ---------------------
                 ADD LOCK MESSAGE
              --------------------- */

              if (
                !card.querySelector(
                  ".lock-message"
                )
              ) {

                const message =
                  document.createElement(
                    "div"
                  );


                message.className =
                  "lock-message";


                message.textContent =
                  "Not assigned to your account";


                card.appendChild(
                  message
                );

              }

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
