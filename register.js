import {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
  onAuthStateChanged
} from "./firebase.js";

const form = document.getElementById("reg");
const message = document.getElementById("rm");

const usernameInput = document.getElementById("ru");
const nameInput = document.getElementById("name");
const districtInput = document.getElementById("district");
const phoneInput = document.getElementById("phone");

function showMessage(text, error = true) {
  message.textContent = text;
  message.className = error ? "error-msg" : "success-msg";
}

async function loadRegistration(user) {
  if (!user) {
    location.href = "login.html";
    return;
  }

  try {
    const username = localStorage.getItem("bf_login") || "";

    if (!username) {
      showMessage(
        "Your assigned username could not be loaded. Please log in again."
      );
      return;
    }

    const ref = doc(db, "students", username);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      showMessage(
        "This student account is not configured yet. Please contact the administrator."
      );
      return;
    }

    const data = snap.data();

    if (data.active === false) {
      showMessage(
        "This student account is inactive. Please contact the administrator."
      );
      return;
    }

    usernameInput.value = data.username || username;
    usernameInput.dataset.username = data.username || username;

    if (data.fullName) {
      nameInput.value = data.fullName;
    }

    if (data.district) {
      districtInput.value = data.district;
    }

    if (data.contact) {
      phoneInput.value = data.contact;
    }

  } catch (err) {
    console.error("Registration load error:", err);

    showMessage(
      "Could not load your account. Please refresh and try again."
    );
  }
}

form.onsubmit = async (e) => {
  e.preventDefault();

  const user = auth.currentUser;

  if (!user) {
    location.href = "login.html";
    return;
  }

  const username =
    usernameInput.dataset.username ||
    usernameInput.value.trim();

  const fullName = nameInput.value.trim();
  const district = districtInput.value;
  const contact = phoneInput.value.trim();

  if (!username) {
    showMessage(
      "Your assigned username could not be loaded. Please log in again."
    );
    return;
  }

  if (!fullName || !district || !contact) {
    showMessage("Please complete all registration fields.");
    return;
  }

  const button = form.querySelector(
    'button[type="submit"]'
  );

  button.disabled = true;
  button.innerHTML = "Saving…";

  showMessage(
    "Saving your registration…",
    false
  );

  try {
    const ref = doc(db, "students", username);

    const existing = await getDoc(ref);

    if (!existing.exists()) {
      showMessage(
        "Your assigned account was not found in the database. Please contact the administrator."
      );
      return;
    }

    const old = existing.data();

    if (old.active === false) {
      showMessage(
        "This student account is inactive. Please contact the administrator."
      );
      return;
    }

    /*
     * IMPORTANT:
     * Only update registration fields.
     *
     * Username, password, assignedBook and active
     * remain unchanged.
     */
    await updateDoc(ref, {
      fullName: fullName,
      district: district,
      contact: contact,
      registered: true
    });

    /*
     * Keep local session information updated.
     */
    const updatedStudent = {
      ...old,
      fullName: fullName,
      district: district,
      contact: contact,
      registered: true
    };

    localStorage.setItem(
      "bf_login",
      old.username || username
    );

    localStorage.setItem(
      "bf_student",
      JSON.stringify(updatedStudent)
    );

    /*
     * Registration completed.
     */
    location.href = "dashboard.html";

  } catch (err) {
    console.error(
      "Registration save error:",
      err
    );

    if (err?.code === "permission-denied") {
      showMessage(
        "Registration is not permitted for this account. Please contact the administrator."
      );
    } else {
      showMessage(
        "Could not save registration. Please try again."
      );
    }

  } finally {
    button.disabled = false;

    button.innerHTML =
      'Complete Registration <span>→</span>';
  }
};

/*
 * Wait for Firebase Authentication
 * before loading the student record.
 */
onAuthStateChanged(auth, (user) => {
  loadRegistration(user);
});
