import {
  db,
  doc,
  getDoc
} from "./firebase.js";

const username =
  localStorage.getItem("bf_login");

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

    if (!snap.exists()) {

      localStorage.removeItem("bf_login");
      localStorage.removeItem("bf_student");

      location.href = "login.html";

    } else {

      const data =
        snap.data();

      if (data.active === false) {

        localStorage.removeItem("bf_login");
        localStorage.removeItem("bf_student");

        location.href = "login.html";

      } else {

        localStorage.setItem(
          "bf_student",
          JSON.stringify(data)
        );


        /* =========================
           STUDENT NAME
        ========================= */

        document
          .querySelectorAll(
            "[data-student-name]"
          )
          .forEach((element) => {

            element.textContent =
              data.fullName ||
              data.username ||
              username;

          });


        /* =========================
           BOOK ACCESS
        ========================= */

        const assignedBook =
          data.assignedBook;


        const bookCards =
          document.querySelectorAll(
            ".book-card"
          );


        bookCards.forEach(
          (card, index) => {

            const bookNumber =
              index + 1;

            const allowed =
              assignedBook ===
              `Book 0${bookNumber}`;


            if (bookNumber === 1) {

              if (allowed) {

                card.classList.add(
                  "book-unlocked"
                );

              } else {

                card.classList.add(
                  "book-locked"
                );

              }

            }


            if (
              bookNumber === 2 ||
              bookNumber === 3
            ) {

              card.classList.add(
                "book-locked"
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

    location.href =
      "login.html";
  }
}


/* =========================
   LOGOUT
========================= */

window.logout = function () {

  localStorage.removeItem(
    "bf_login"
  );

  localStorage.removeItem(
    "bf_student"
  );

  location.href =
    "login.html";
};
