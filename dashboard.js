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

        // Keep local student data updated
        localStorage.setItem(
          "bf_student",
          JSON.stringify(data)
        );

        // Show student name wherever needed
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
      }
    }

  } catch (err) {

    console.error(
      "Dashboard error:",
      err
    );

    location.href =
      "login.html";
  }
}


// =========================
// LOGOUT
// =========================

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
