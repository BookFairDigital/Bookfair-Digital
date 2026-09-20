import {
  auth,
  db,
  doc,
  setDoc,
  getDocs,
  getDoc,
  collection,
  deleteDoc,
  storage,
  ref,
  getDownloadURL
} from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =====================================================
   ADMIN CONFIG
===================================================== */

const ADMIN_UID =
  "SU2kLL2ovwPXGyJ436s8PJpLJQZ2";


/* =====================================================
   ADMIN AUTH CHECK
===================================================== */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "admin-login.html";

      return;

    }


    if (user.uid !== ADMIN_UID) {

      try {
        await signOut(auth);
      } catch (_) {}


      alert(
        "This account is not authorized as an administrator."
      );


      window.location.href =
        "admin-login.html";

      return;

    }


    initAdmin();

  }
);


/* =====================================================
   ADMIN DASHBOARD
===================================================== */

async function initAdmin() {

  const $ = (id) =>
    document.getElementById(id);


  const rows =
    $("rows");

  const empty =
    $("empty");

  const modal =
    $("modal");

  const toast =
    $("toast");

  const detailModal =
    $("detailModal");


  let students = [];
  let orders = [];


  /* ===================================================
     ESCAPE HTML
  =================================================== */

  function esc(value) {

    return String(value ?? "")
      .replace(
        /[&<>"']/g,
        (char) => ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]
      );

  }


  /* ===================================================
     BOOK NAME
  =================================================== */

  function bookName(book) {

    if (book === "01") {
      return "Book 01 · A/L Accounting";
    }

    if (book === "02") {
      return "Book 02";
    }

    if (book === "03") {
      return "Book 03";
    }

    return "Not assigned";

  }


  /* ===================================================
     NORMALIZE BOOK
  =================================================== */

  function normalizeBook(value) {

    const text =
      String(value ?? "")
        .trim()
        .toLowerCase();


    if (
      text === "01" ||
      text === "book 01" ||
      text.includes("book 01")
    ) {

      return "01";

    }


    if (
      text === "02" ||
      text === "book 02" ||
      text.includes("book 02")
    ) {

      return "02";

    }


    if (
      text === "03" ||
      text === "book 03" ||
      text.includes("book 03")
    ) {

      return "03";

    }


    return "";

  }


  /* ===================================================
     VALID USERNAME
  =================================================== */

  function validUsername(username) {

    return /^[A-Za-z0-9._-]{3,40}$/.test(
      username
    );

  }


  /* ===================================================
     RANDOM PASSWORD
  =================================================== */

  function randomPassword() {

    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";


    return Array.from(
      { length: 10 },
      () =>
        chars[
          Math.floor(
            Math.random() * chars.length
          )
        ]
    ).join("");

  }


  /* ===================================================
     TOAST
  =================================================== */

  function showToast(
    text,
    error = false
  ) {

    if (!toast) {
      return;
    }


    toast.textContent =
      text;


    toast.className =
      "toast show" +
      (error ? " error" : "");


    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      2800
    );

  }


  /* ===================================================
     LOAD STUDENTS
     
     IMPORTANT:
     NO REALTIME LISTENER
     NO onSnapshot
     NO setInterval
     
     Data loads only when this function is called.
  =================================================== */

  async function loadStudents() {

    const status =
      $("dbStatus");


    try {

      if (status) {

        status.textContent =
          "● Loading students...";

        status.classList.remove(
          "error"
        );

      }


      const snapshot =
        await getDocs(
          collection(
            db,
            "students"
          )
        );


      students =
        snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data()
          })
        );


      if (status) {

        status.textContent =
          "● Firestore connected";

        status.classList.remove(
          "error"
        );

      }


      render();


    } catch (error) {

      console.error(
        "LOAD STUDENTS ERROR:",
        error
      );


      if (status) {

        status.textContent =
          "● Firestore unavailable";

        status.classList.add(
          "error"
        );

      }


      showToast(
        "Could not load students from Firestore.",
        true
      );


      throw error;

    }

  }


  /* ===================================================
     MANUAL REFRESH BUTTON
     
     This is the ONLY normal way to refresh the
     student list after the initial page load.
  =================================================== */

  const refreshBtn =
    $("refreshBtn");


  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      async () => {

        if (
          refreshBtn.disabled
        ) {
          return;
        }


        refreshBtn.disabled =
          true;


        const originalText =
          refreshBtn.textContent;


        refreshBtn.textContent =
          "Refreshing…";


        try {

          await loadStudents();


          showToast(
            "Student data refreshed."
          );


        } catch (error) {

          console.error(
            "MANUAL REFRESH ERROR:",
            error
          );


          showToast(
            "Could not refresh student data.",
            true
          );


        } finally {

          refreshBtn.disabled =
            false;


          refreshBtn.textContent =
            originalText ||
            "Refresh";

        }

      }
    );

  }


  /* ===================================================
     BOOK COUNTS
  =================================================== */

  function updateBookManagement() {

    const book01 =
      students.filter(
        (student) =>
          normalizeBook(
            student.assignedBook ||
            student.book
          ) === "01"
      ).length;


    const book02 =
      students.filter(
        (student) =>
          normalizeBook(
            student.assignedBook ||
            student.book
          ) === "02"
      ).length;


    const book03 =
      students.filter(
        (student) =>
          normalizeBook(
            student.assignedBook ||
            student.book
          ) === "03"
      ).length;


    if ($("book1Count")) {

      $("book1Count").textContent =
        book01;

    }


    if ($("book2Count")) {

      $("book2Count").textContent =
        book02;

    }


    if ($("book3Count")) {

      $("book3Count").textContent =
        book03;

    }

  }


  /* ===================================================
     RENDER DASHBOARD
  =================================================== */

  function render() {

    const search =
      (
        $("search")?.value ||
        ""
      )
        .toLowerCase()
        .trim();


    const bookFilter =
      $("bookFilter")?.value ||
      "all";


    const registrationFilter =
      $("registrationFilter")?.value ||
      "all";


    const filtered =
      students.filter(
        (student) => {

          const searchable = `
            ${student.username || ""}
            ${student.fullName || ""}
            ${student.district || ""}
            ${student.contact || ""}
          `.toLowerCase();


          const matchesSearch =
            searchable.includes(
              search
            );


          const studentBook =
            normalizeBook(
              student.assignedBook ||
              student.book
            );


          const matchesBook =
            bookFilter === "all" ||
            bookFilter === "" ||
            studentBook === bookFilter;


          const matchesRegistration =
            registrationFilter === "all" ||
            registrationFilter === "" ||

            (
              registrationFilter ===
                "registered" &&
              student.registered === true
            ) ||

            (
              registrationFilter ===
                "pending" &&
              student.registered !== true
            );


          return (
            matchesSearch &&
            matchesBook &&
            matchesRegistration
          );

        }
      );


    if (rows) {

      rows.innerHTML =
        filtered
          .map(
            (student) => {

              const studentBook =
                normalizeBook(
                  student.assignedBook ||
                  student.book
                );


              return `
                <tr
                  class="student-row"
                  data-id="${esc(student.id)}"
                  style="cursor:pointer;"
                >

                  <td>
                    <strong>
                      ${esc(
                        student.username ||
                        student.id
                      )}
                    </strong>
                  </td>

                  <td>
                    <span class="muted">
                      ${esc(
                        student.password ||
                        "—"
                      )}
                    </span>
                  </td>

                  <td>
                    ${esc(
                      bookName(
                        studentBook
                      )
                    )}
                  </td>

                  <td>
                    ${esc(
                      student.fullName ||
                      "Not registered"
                    )}
                  </td>

                  <td>
                    ${esc(
                      student.district ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      student.contact ||
                      "—"
                    )}
                  </td>

                  <td>
                    <span
                      class="pill ${
                        student.registered
                          ? "green"
                          : "gold"
                      }"
                    >
                      ${
                        student.registered
                          ? "REGISTERED"
                          : "PENDING"
                      }
                    </span>
                  </td>

                  <td>
                    <span
                      class="pill ${
                        student.active === false
                          ? "gold"
                          : "green"
                      }"
                    >
                      ${
                        student.active === false
                          ? "INACTIVE"
                          : "ACTIVE"
                      }
                    </span>
                  </td>

                  <td>
                    <button
                      class="delete-student admin-btn danger"
                      data-id="${esc(student.id)}"
                      data-username="${esc(
                        student.username ||
                        student.id
                      )}"
                      type="button"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              `;

            }
          )
          .join("");

    }


    if (empty) {

      empty.style.display =
        filtered.length
          ? "none"
          : "block";

    }


    /* -----------------------------------------------
       STATS
    ------------------------------------------------ */

    if ($("total")) {

      $("total").textContent =
        students.length;

    }


    if ($("b1")) {

      $("b1").textContent =
        students.filter(
          (student) =>
            normalizeBook(
              student.assignedBook ||
              student.book
            ) === "01"
        ).length;

    }


    if ($("b2")) {

      $("b2").textContent =
        students.filter(
          (student) =>
            normalizeBook(
              student.assignedBook ||
              student.book
            ) === "02"
        ).length;

    }


    if ($("b3")) {

      $("b3").textContent =
        students.filter(
          (student) =>
            normalizeBook(
              student.assignedBook ||
              student.book
            ) === "03"
        ).length;

    }


    if ($("registered")) {

      $("registered").textContent =
        students.filter(
          (student) =>
            student.registered === true
        ).length;

    }


    if ($("pending")) {

      $("pending").textContent =
        students.filter(
          (student) =>
            student.registered !== true
        ).length;

    }


    if ($("active")) {

      $("active").textContent =
        students.filter(
          (student) =>
            student.active !== false
        ).length;

    }


    if ($("inactive")) {

      $("inactive").textContent =
        students.filter(
          (student) =>
            student.active === false
        ).length;

    }


    updateBookManagement();


    /* -----------------------------------------------
       ROW CLICK
    ------------------------------------------------ */

    document
      .querySelectorAll(
        ".student-row"
      )
      .forEach(
        (row) => {

          row.onclick =
            (event) => {

              if (
                event.target.closest(
                  ".delete-student"
                )
              ) {

                return;

              }


              showDetails(
                row.dataset.id
              );

            };

        }
      );


    /* -----------------------------------------------
       DELETE BUTTONS
    ------------------------------------------------ */

    document
      .querySelectorAll(
        ".delete-student"
      )
      .forEach(
        (button) => {

          button.onclick =
            async (event) => {

              event.stopPropagation();


              const id =
                button.dataset.id;


              const username =
                button.dataset.username;


              const confirmed =
                confirm(
                  `Delete student account "${username}"?\n\n` +
                  `This will permanently delete the Firestore student record.\n\n` +
                  `This action cannot be undone.`
                );


              if (!confirmed) {
                return;
              }


              button.disabled =
                true;


              button.textContent =
                "Deleting…";


              try {

                await deleteDoc(
                  doc(
                    db,
                    "students",
                    id
                  )
                );


                students =
                  students.filter(
                    (student) =>
                      student.id !== id
                  );


                render();


                showToast(
                  `Student ${username} deleted successfully.`
                );


              } catch (error) {

                console.error(
                  "DELETE ERROR:",
                  error
                );


                button.disabled =
                  false;


                button.textContent =
                  "Delete";


                showToast(
                  "Could not delete this student.",
                  true
                );

              }

            };

        }
      );

  }


  /* ===================================================
     STUDENT DETAILS
  =================================================== */

  function showDetails(id) {

    const student =
      students.find(
        (item) =>
          item.id === id
      );


    if (!student) {
      return;
    }


    const studentBook =
      normalizeBook(
        student.assignedBook ||
        student.book
      );


    const detailContent =
      $("detailContent");


    if (!detailContent) {
      return;
    }


    detailContent.innerHTML = `

      <div
        class="detail-grid"
        style="
          display:grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));
          gap:16px;
        "
      >

        <div>
          <small>USERNAME</small>
          <strong style="display:block;margin-top:4px;">
            ${esc(
              student.username ||
              student.id
            )}
          </strong>
        </div>

        <div>
          <small>PASSWORD</small>
          <strong style="display:block;margin-top:4px;">
            ${esc(
              student.password ||
              "—"
            )}
          </strong>
        </div>

        <div>
          <small>ASSIGNED BOOK</small>
          <strong style="display:block;margin-top:4px;">
            ${esc(
              bookName(
                studentBook
              )
            )}
          </strong>
        </div>

        <div>
          <small>FULL NAME</small>
          <strong style="display:block;margin-top:4px;">
            ${esc(
              student.fullName ||
              "Not registered"
            )}
          </strong>
        </div>

        <div>
          <small>DISTRICT</small>
          <strong style="display:block;margin-top:4px;">
            ${esc(
              student.district ||
              "Not provided"
            )}
          </strong>
        </div>

        <div>
          <small>CONTACT NUMBER</small>
          <strong style="display:block;margin-top:4px;">
            ${esc(
              student.contact ||
              "Not provided"
            )}
          </strong>
        </div>

        <div>
          <small>REGISTRATION</small>
          <strong style="display:block;margin-top:4px;">
            ${
              student.registered
                ? "Registered"
                : "First Login / Pending"
            }
          </strong>
        </div>

        <div>
          <small>ACCOUNT</small>
          <strong style="display:block;margin-top:4px;">
            ${
              student.active === false
                ? "Inactive"
                : "Active"
            }
          </strong>
        </div>

      </div>

    `;


    detailModal?.classList.add(
      "show"
    );

  }


  /* ===================================================
     CREATE / UPDATE STUDENT

     IMPORTANT:
     Student accounts are stored directly in Firestore.
     No Firebase Authentication account is created here.

     The document ID is the exact student username from
     the Excel file. This matches the current student
     login flow in app.js.
  =================================================== */

  async function createStudent(
    username,
    password,
    book
  ) {

    username = username.trim();
    password = password.trim();

    if (!validUsername(username)) {
      throw new Error(
        "Invalid username. Use the exact username from Excel."
      );
    }

    if (password.length < 6) {
      throw new Error(
        "Password must be at least 6 characters."
      );
    }

    if (!["01", "02", "03"].includes(book)) {
      throw new Error(
        "Invalid book assignment."
      );
    }

    const studentRef = doc(
      db,
      "students",
      username
    );

    const existingSnapshot = await getDoc(
      studentRef
    );

    const existingData =
      existingSnapshot.exists()
        ? existingSnapshot.data()
        : {};

    const studentData = {
      ...existingData,

      username: username,
      password: password,
      assignedBook: `Book ${book}`,

      fullName:
        existingData.fullName || "",

      district:
        existingData.district || "",

      contact:
        existingData.contact || "",

      registered:
        existingData.registered === true,

      active:
        existingData.active !== false,

      updatedAt:
        new Date().toISOString(),

      createdAt:
        existingData.createdAt ||
        new Date().toISOString()
    };

    await setDoc(
      studentRef,
      studentData
    );

    return {
      username,
      password,
      book,
      migrated: existingSnapshot.exists()
    };
  }


  /* ===================================================
     NEW STUDENT BUTTON
  =================================================== */

  if ($("newBtn")) {

    $("newBtn").onclick =
      () => {

        modal?.classList.add(
          "show"
        );


        if ($("newUser")) {
          $("newUser").value =
            "";
        }


        if ($("newPass")) {

          $("newPass").value =
            randomPassword();

        }


        $("newUser")?.focus();

      };

  }


  /* ===================================================
     CLOSE MODALS
  =================================================== */

  function closeModal() {

    modal?.classList.remove(
      "show"
    );

  }


  $("close")?.addEventListener(
    "click",
    closeModal
  );


  $("cancel")?.addEventListener(
    "click",
    closeModal
  );


  $("detailClose")?.addEventListener(
    "click",
    () => {

      detailModal?.classList.remove(
        "show"
      );

    }
  );


  /* ===================================================
     GENERATE PASSWORD
  =================================================== */

  $("gen")?.addEventListener(
    "click",
    () => {

      if ($("newPass")) {

        $("newPass").value =
          randomPassword();

      }

    }
  );


  /* ===================================================
     CREATE BUTTON
  =================================================== */

  $("create")?.addEventListener(
    "click",
    async () => {

      const button =
        $("create");


      const username =
        $("newUser")
          ?.value
          .trim() || "";


      const password =
        $("newPass")
          ?.value
          .trim() || "";


      const book =
        $("newBook")?.value ||
        "01";


      if (
        !username ||
        !password
      ) {

        showToast(
          "Username and password are required.",
          true
        );

        return;

      }


      button.disabled =
        true;


      button.textContent =
        "Creating…";


      try {

        const result =
          await createStudent(
            username,
            password,
            book
          );


        closeModal();


        await loadStudents();


        if (
          result.migrated
        ) {

          showToast(
            `Student ${username} migrated successfully.`
          );


          alert(
            `STUDENT ACCOUNT MIGRATED\n\n` +
            `Username: ${username}\n` +
            `Password: ${password}\n` +
            `Assigned: ${bookName(book)}\n\n` +
            `The username has not changed.`
          );


        } else {

          showToast(
            `Student ${username} created successfully.`
          );


          alert(
            `STUDENT ACCOUNT CREATED\n\n` +
            `Username: ${username}\n` +
            `Password: ${password}\n` +
            `Assigned: ${bookName(book)}\n\n` +
            `The student can now use the normal login page.`
          );

        }


      } catch (error) {

        console.error(
          "CREATE/MIGRATE ERROR:",
          error
        );


        showToast(
          error.message ||
          "Account creation failed.",
          true
        );


      } finally {

        button.disabled =
          false;


        button.textContent =
          "Create Student";

      }

    }
  );


  /* ===================================================
     EXCEL DOWNLOAD
  =================================================== */

  function downloadExcel(
    list,
    filename
  ) {

    if (
      typeof XLSX ===
      "undefined"
    ) {

      showToast(
        "Excel library is not loaded.",
        true
      );

      return;

    }


    const data =
      list.map(
        (student) => ({

          "Username":
            student.username || "",

          "Password":
            student.password || "",

          "Assigned Book":
            student.assignedBook || "",

          "Full Name":
            student.fullName || "",

          "District":
            student.district || "",

          "Contact Number":
            student.contact || ""

        })
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        data
      );


    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 28 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 }
    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Student Accounts"
    );


    XLSX.writeFile(
      workbook,
      filename
    );

  }


  $("downloadBtn")?.addEventListener(
    "click",
    () => {

      downloadExcel(
        students,
        "bookfair-students-export.xlsx"
      );

    }
  );


  /* ===================================================
     EXCEL TEMPLATE
  =================================================== */

  function downloadTemplate() {

    if (
      typeof XLSX ===
      "undefined"
    ) {

      showToast(
        "Excel library is not loaded.",
        true
      );

      return;

    }


    const exampleRows = [

      {
        "Username":
          "BF26-000001",

        "Password":
          "BookFair@123",

        "Assigned Book":
          "Book 01",

        "Full Name":
          "",

        "District":
          "",

        "Contact Number":
          ""
      },

      {
        "Username":
          "BF26-10001",

        "Password":
          "BookFair@456",

        "Assigned Book":
          "Book 02",

        "Full Name":
          "",

        "District":
          "",

        "Contact Number":
          ""
      },

      {
        "Username":
          "BF26-11001",

        "Password":
          "BookFair@789",

        "Assigned Book":
          "Book 03",

        "Full Name":
          "",

        "District":
          "",

        "Contact Number":
          ""
      }

    ];


    const worksheet =
      XLSX.utils.json_to_sheet(
        exampleRows
      );


    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 18 }
    ];


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Student Accounts"
    );


    const instructions =
      XLSX.utils.aoa_to_sheet([

        [
          "BookFair Digital — Student Import"
        ],

        [],

        [
          "Username",
          "Required. Must be unique."
        ],

        [
          "Password",
          "Required. Minimum 6 characters."
        ],

        [
          "Assigned Book",
          "Book 01, Book 02 or Book 03."
        ],

        [
          "Full Name",
          "Optional."
        ],

        [
          "District",
          "Optional."
        ],

        [
          "Contact Number",
          "Optional."
        ],

        [],

        [
          "Delete the example rows before importing real students."
        ],

        [
          "Keep this Excel file secure because it contains passwords."
        ]

      ]);


    instructions["!cols"] = [
      { wch: 25 },
      { wch: 80 }
    ];


    XLSX.utils.book_append_sheet(
      workbook,
      instructions,
      "Instructions"
    );


    XLSX.writeFile(
      workbook,
      "BookFair-Student-Template.xlsx"
    );

  }


  $("templateBtn")?.addEventListener(
    "click",
    downloadTemplate
  );


  /* ===================================================
     IMPORT BUTTON
  =================================================== */

  $("importBtn")?.addEventListener(
    "click",
    () => {

      $("fileInput")?.click();

    }
  );


  /* ===================================================
     EXCEL IMPORT
  =================================================== */

  $("fileInput")?.addEventListener(
    "change",
    async () => {

      const file =
        $("fileInput")
          ?.files?.[0];


      if (!file) {
        return;
      }


      if (
        typeof XLSX ===
        "undefined"
      ) {

        showToast(
          "Excel library is not loaded.",
          true
        );

        return;

      }


      const button =
        $("importBtn");


      if (button) {

        button.disabled =
          true;

        button.textContent =
          "Importing…";

      }


      try {

        const workbook =
          XLSX.read(
            await file.arrayBuffer(),
            {
              type: "array"
            }
          );


        const sheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];


        const excelRows =
          XLSX.utils.sheet_to_json(
            sheet,
            {
              defval: ""
            }
          );


        if (
          !excelRows.length
        ) {

          throw new Error(
            "The Excel sheet is empty."
          );

        }


        const columns = {};


        Object.keys(
          excelRows[0]
        ).forEach(
          (key) => {

            columns[
              key
                .trim()
                .toLowerCase()
            ] = key;

          }
        );


        const usernameColumn =
          columns["username"];

        const passwordColumn =
          columns["password"];

        const bookColumn =
          columns["assigned book"];

        const fullNameColumn =
          columns["full name"];

        const districtColumn =
          columns["district"];

        const contactColumn =
          columns["contact number"];


        if (
          !usernameColumn ||
          !passwordColumn ||
          !bookColumn
        ) {

          throw new Error(
            "Excel must contain Username, Password and Assigned Book columns."
          );

        }


        let success = 0;
        let failed = 0;
        let skipped = 0;


        const failedRows = [];


        const total =
          excelRows.length;


        if ($("importStatus")) {

          $("importStatus")
            .style.display =
            "block";

        }


        if ($("importTitle")) {

          $("importTitle").textContent =
            "Importing students…";

        }


        if ($("importCount")) {

          $("importCount").textContent =
            `0 / ${total}`;

        }


        if ($("importProgress")) {

          $("importProgress").style.width =
            "0%";

        }


        for (
          let index = 0;
          index < total;
          index++
        ) {

          const row =
            excelRows[index];


          const username =
            String(
              row[usernameColumn] ??
              ""
            ).trim();


          const password =
            String(
              row[passwordColumn] ??
              ""
            ).trim();


          const book =
            normalizeBook(
              row[bookColumn]
            );


          const fullName =
            String(
              row[fullNameColumn] ??
              ""
            ).trim();


          const district =
            String(
              row[districtColumn] ??
              ""
            ).trim();


          const contact =
            String(
              row[contactColumn] ??
              ""
            ).trim();


          if (
            !username &&
            !password &&
            !book
          ) {

            skipped++;

          } else {

            try {

              if (
                !validUsername(
                  username
                )
              ) {

                throw new Error(
                  "Invalid username."
                );

              }


              if (
                password.length < 6
              ) {

                throw new Error(
                  "Password must be at least 6 characters."
                );

              }


              if (!book) {

                throw new Error(
                  "Invalid assigned book."
                );

              }


              /* ---------------------------------------
                 SAVE DIRECTLY TO FIRESTORE

                 IMPORTANT:
                 - No Firebase Auth account is created.
                 - Username is the exact Excel username.
                 - Existing username = update existing record.
                 - New username = create new record.
              --------------------------------------- */

              const studentRef =
                doc(
                  db,
                  "students",
                  username
                );

              const existingSnapshot =
                await getDoc(
                  studentRef
                );

              const existingData =
                existingSnapshot.exists()
                  ? existingSnapshot.data()
                  : {};

              await setDoc(
                studentRef,
                {
                  ...existingData,

                  username,
                  password,
                  assignedBook:
                    `Book ${book}`,

                  fullName:
                    fullName ||
                    existingData.fullName ||
                    "",

                  district:
                    district ||
                    existingData.district ||
                    "",

                  contact:
                    contact ||
                    existingData.contact ||
                    "",

                  registered:
                    existingData.registered === true,

                  active:
                    existingData.active !== false,

                  createdAt:
                    existingData.createdAt ||
                    new Date().toISOString(),

                  updatedAt:
                    new Date().toISOString()
                }
              );

              success++;


            } catch (error) {

              console.error(
                "IMPORT STUDENT ERROR:",
                error
              );


              failed++;


              failedRows.push({

                username:
                  username ||
                  `Row ${index + 2}`,

                reason:
                  error.message ||
                  "Import failed."

              });

            }

          }


          const processed =
            index + 1;


          if ($("importCount")) {

            $("importCount").textContent =
              `${processed} / ${total}`;

          }


          if ($("importProgress")) {

            $("importProgress").style.width =
              `${Math.round(
                processed /
                total *
                100
              )}%`;

          }

        }


        if ($("importTitle")) {

          $("importTitle").textContent =
            "Import complete";

        }


        /*
          IMPORTANT:
          After import finishes, data is explicitly
          reloaded once.
          There is still NO automatic refresh.
        */

        await loadStudents();


        if ($("importSuccess")) {

          $("importSuccess").textContent =
            success;

        }


        if ($("importFailed")) {

          $("importFailed").textContent =
            failed;

        }


        if ($("importSkipped")) {

          $("importSkipped").textContent =
            skipped;

        }


        const failedWrap =
          $("failedWrap");


        const failedList =
          $("failedList");


        if (
          failedRows.length
        ) {

          if (failedWrap) {

            failedWrap.style.display =
              "block";

          }


          if (failedList) {

            failedList.innerHTML =
              failedRows
                .map(
                  (item) => `
                    <div
                      class="failed-item"
                      style="padding:6px 0;"
                    >
                      <strong>
                        ${esc(
                          item.username
                        )}
                      </strong>

                      <span>
                        — ${esc(
                          item.reason
                        )}
                      </span>
                    </div>
                  `
                )
                .join("");

          }

        } else {

          if (failedWrap) {

            failedWrap.style.display =
              "none";

          }


          if (failedList) {

            failedList.innerHTML =
              "";

          }

        }


        $("importResultModal")
          ?.classList
          .add("show");


        showToast(
          `${success} student account(s) imported successfully.`
        );


      } catch (error) {

        console.error(
          "IMPORT ERROR:",
          error
        );


        showToast(
          error.message ||
          "Excel import failed.",
          true
        );


      } finally {

        if ($("fileInput")) {

          $("fileInput").value =
            "";

        }


        if (button) {

          button.disabled =
            false;

          button.textContent =
            "Import";

        }

      }

    }
  );


  /* ===================================================
     SEARCH / FILTERS
  =================================================== */

  $("search")?.addEventListener(
    "input",
    render
  );


  $("bookFilter")?.addEventListener(
    "change",
    render
  );


  $("registrationFilter")?.addEventListener(
    "change",
    render
  );


  /* ===================================================
     IMPORT RESULT CLOSE
  =================================================== */

  $("importResultClose")?.addEventListener(
    "click",
    () => {

      $("importResultModal")
        ?.classList
        .remove("show");

    }
  );


  $("importResultCloseBtn")?.addEventListener(
    "click",
    () => {

      $("importResultModal")
        ?.classList
        .remove("show");

    }
  );


  /* ===================================================
     DELETE BOOK STUDENTS
  =================================================== */

  async function deleteBookStudents(
    bookNumber
  ) {

    const bookTitle =
      bookName(bookNumber);


    const matchingStudents =
      students.filter(
        (student) =>
          normalizeBook(
            student.assignedBook ||
            student.book
          ) === bookNumber
      );


    const count =
      matchingStudents.length;


    if (count === 0) {

      alert(
        `${bookTitle}\n\nThere are no student accounts assigned to this book.`
      );

      return;

    }


    const confirmed =
      confirm(
        `DELETE ${bookTitle}?\n\n` +
        `${count} student account(s) are currently assigned to this book.\n\n` +
        `All ${count} student Firestore records will be permanently deleted.\n\n` +
        `This action cannot be undone.\n\n` +
        `Do you want to continue?`
      );


    if (!confirmed) {
      return;
    }


    const button =
      $(`deleteBook${bookNumber}`);


    if (button) {

      button.disabled =
        true;

      button.textContent =
        "Deleting…";

    }


    try {

      let deleted = 0;


      for (
        const student
        of matchingStudents
      ) {

        await deleteDoc(
          doc(
            db,
            "students",
            student.id
          )
        );


        deleted++;

      }


      const deletedIds =
        new Set(
          matchingStudents.map(
            (student) =>
              student.id
          )
        );


      students =
        students.filter(
          (student) =>
            !deletedIds.has(
              student.id
            )
        );


      render();


      showToast(
        `${bookTitle}: ${deleted} student account(s) deleted successfully.`
      );


      alert(
        `${bookTitle}\n\n${deleted} student account(s) deleted successfully.`
      );


    } catch (error) {

      console.error(
        "BOOK DELETE ERROR:",
        error
      );


      showToast(
        `Could not completely delete ${bookTitle}.`,
        true
      );


      await loadStudents();


    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          `Delete ${bookNumber} Students`;

      }

    }

  }


  /* ===================================================
     BOOK DELETE BUTTONS
  =================================================== */

  $("deleteBook01")?.addEventListener(
    "click",
    () => {
      deleteBookStudents("01");
    }
  );


  $("deleteBook02")?.addEventListener(
    "click",
    () => {
      deleteBookStudents("02");
    }
  );


  $("deleteBook03")?.addEventListener(
    "click",
    () => {
      deleteBookStudents("03");
    }
  );



  /* ===================================================
     ONLINE ORDERS + REVENUE
  =================================================== */

  function money(value) {
    return `Rs ${Number(value || 0).toLocaleString("en-LK", {
      maximumFractionDigits: 0
    })}`;
  }

  function formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-LK", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function revenueOrder(order) {
    const status = String(order.status || "").toLowerCase();
    return status === "paid" || status === "completed";
  }

  function loadOrderStats() {
    const now = new Date();

    const pending = orders.filter(
      o => String(o.status || "Payment Checking") === "Payment Checking"
    ).length;

    const today = orders
      .filter(o => {
        if (!revenueOrder(o)) return false;
        const d = new Date(o.createdAt);
        return !Number.isNaN(d.getTime()) &&
          d.toDateString() === now.toDateString();
      })
      .reduce((n,o) => n + Number(o.total || 0), 0);

    const month = orders
      .filter(o => {
        if (!revenueOrder(o)) return false;
        const d = new Date(o.createdAt);
        return !Number.isNaN(d.getTime()) &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth();
      })
      .reduce((n,o) => n + Number(o.total || 0), 0);

    const total = orders
      .filter(revenueOrder)
      .reduce((n,o) => n + Number(o.total || 0), 0);

    if ($("orderCount")) $("orderCount").textContent = orders.length;
    if ($("pendingOrders")) $("pendingOrders").textContent = pending;
    if ($("todayRevenue")) $("todayRevenue").textContent = money(today);
    if ($("monthRevenue")) $("monthRevenue").textContent = money(month);
    if ($("totalRevenue")) $("totalRevenue").textContent = money(total);
  }

  function renderOrders() {
    const search = String($("orderSearch")?.value || "").toLowerCase().trim();
    const statusFilter = $("orderStatusFilter")?.value || "all";

    const filtered = orders.filter(order => {
      const c = order.customer || {};
      const text = [
        order.orderNumber, order.book, order.bookCode,
        c.fullName, c.mobile, c.district, order.slipFileName
      ].join(" ").toLowerCase();

      return (!search || text.includes(search)) &&
        (statusFilter === "all" ||
         String(order.status || "Payment Checking") === statusFilter);
    });

    const rows = $("orderRows");
    if (rows) {
      rows.innerHTML = filtered.map(order => {
        const c = order.customer || {};
        const status = order.status || "Payment Checking";
        const slip = order.slipDownloadURL
          ? `<a class="admin-btn" target="_blank" rel="noopener" href="${esc(order.slipDownloadURL)}">View Slip</a>`
          : `<span class="muted">${esc(order.slipFileName || "No slip")}</span>`;

        return `
          <tr>
            <td><strong>${esc(order.orderNumber || order.id)}</strong><div class="muted">${esc(formatDate(order.createdAt))}</div></td>
            <td>${esc(order.book || "—")}</td>
            <td><strong>${esc(c.fullName || "—")}</strong><div class="muted">${esc(c.mobile || "")}</div></td>
            <td>${esc(c.district || "—")}</td>
            <td>${esc(order.quantity || 0)}</td>
            <td><strong>${money(order.total)}</strong></td>
            <td><span class="pill ${revenueOrder(order) ? "green" : "gold"}">${esc(status.toUpperCase())}</span></td>
            <td>${slip}</td>
            <td>
              <select class="order-status-select" data-order-id="${esc(order.id)}">
                ${["Payment Checking","Paid","Completed","Cancelled"].map(v =>
                  `<option value="${v}" ${status === v ? "selected" : ""}>${v}</option>`
                ).join("")}
              </select>
            </td>
          </tr>`;
      }).join("");
    }

    const empty = $("orderEmpty");
    if (empty) empty.style.display = filtered.length ? "none" : "block";
    loadOrderStats();
  }

  async function loadOrders() {
    try {
      const snapshot = await getDocs(collection(db, "orders"));
      orders = snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));
      orders.sort((a,b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      renderOrders();
    } catch (error) {
      console.error("LOAD ORDERS ERROR:", error);
      const empty = $("orderEmpty");
      if (empty) {
        empty.style.display = "block";
        empty.textContent = "Could not load orders. Check Firestore 'orders' permissions.";
      }
    }
  }

  async function updateOrderStatus(orderId, statusValue) {
    try {
      await setDoc(doc(db, "orders", orderId), {
        status: statusValue,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      const order = orders.find(item => item.id === orderId);
      if (order) order.status = statusValue;

      renderOrders();
      showToast(`Order ${orderId} → ${statusValue}`);
    } catch (error) {
      console.error("ORDER STATUS ERROR:", error);
      showToast(error.message || "Could not update order status.", true);
    }
  }

  document.addEventListener("change", event => {
    const select = event.target.closest(".order-status-select");
    if (!select) return;
    updateOrderStatus(select.dataset.orderId, select.value);
  });

  $("orderSearch")?.addEventListener("input", renderOrders);
  $("orderStatusFilter")?.addEventListener("change", renderOrders);

  $("refreshOrdersBtn")?.addEventListener("click", async () => {
    const b = $("refreshOrdersBtn");
    if (b) { b.disabled = true; b.textContent = "Refreshing…"; }
    try { await loadOrders(); showToast("Orders refreshed."); }
    finally {
      if (b) { b.disabled = false; b.textContent = "↻ Refresh Orders"; }
    }
  });

  /* ===================================================
     INITIAL LOAD
     
     ONLY LOADS ONCE WHEN ADMIN PAGE OPENS.
  =================================================== */

  await loadStudents();
  await loadOrders();

}