import {
  db,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const form = document.getElementById("reg");
const message = document.getElementById("rm");

const usernameInput = document.getElementById("ru");
const nameInput = document.getElementById("name");
const districtInput = document.getElementById("district");
const phoneInput = document.getElementById("phone");

function showMessage(text, error = true) {
  message.textContent = text;
  message.className =
    error ? "error-msg" : "success-msg";
}


// =========================
// LOAD STUDENT
// =========================

async function loadStudent() {

  const username =
    localStorage.getItem("bf_login");

  if (!username) {
    location.href = "login.html";
    return;
  }

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

      showMessage(
        "Student account was not found."
      );

      return;
    }

    const data =
      snap.data();

    if (data.active === false) {

      showMessage(
        "This student account is inactive."
      );

      return;
    }

    // Locked username
    usernameInput.value =
      data.username || username;

    usernameInput.dataset.username =
      data.username || username;

    // Existing details
    nameInput.value =
      data.fullName || "";

    districtInput.value =
      data.district || "";

    phoneInput.value =
      data.contact || "";

  } catch (err) {

    console.error(
      "LOAD ERROR:",
      err
    );

    showMessage(
      "Could not load your account. Please refresh and try again."
    );
  }
}


// =========================
// REGISTRATION
// =========================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const username =
      usernameInput.dataset.username ||
      usernameInput.value.trim();

    const fullName =
      nameInput.value.trim();

    const district =
      districtInput.value;

    const contact =
      phoneInput.value.trim();

    if (
      !username ||
      !fullName ||
      !district ||
      !contact
    ) {

      showMessage(
        "Please complete all registration fields."
      );

      return;
    }

    const button =
      form.querySelector(
        'button[type="submit"]'
      );

    button.disabled = true;
    button.innerHTML = "Saving…";

    showMessage(
      "Saving your registration…",
      false
    );

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

        showMessage(
          "Student account was not found."
        );

        return;
      }

      const old =
        snap.data();

      if (old.active === false) {

        showMessage(
          "This student account is inactive."
        );

        return;
      }

      await setDoc(
        ref,
        {
          username:
            old.username || username,

          password:
            old.password || "",

          assignedBook:
            old.assignedBook || "Book 01",

          fullName:
            fullName,

          district:
            district,

          contact:
            contact,

          registered:
            true,

          active:
            old.active !== false
        },
        {
          merge: true
        }
      );

      // Update local login data
      localStorage.setItem(
        "bf_login",
        old.username || username
      );

      localStorage.setItem(
        "bf_student",
        JSON.stringify({
          ...old,
          username:
            old.username || username,
          fullName,
          district,
          contact,
          registered: true
        })
      );

      // Go to dashboard
      location.href =
        "dashboard.html";

    } catch (err) {

      console.error(
        "REGISTRATION ERROR:",
        err
      );

      showMessage(
        "Could not save registration. Please try again."
      );

    } finally {

      button.disabled = false;

      button.innerHTML =
        'Complete Registration <span>→</span>';
    }
  }
);


// =========================
// START
// =========================

loadStudent();
