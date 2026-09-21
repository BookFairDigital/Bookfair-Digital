const BOOKFAIR_ADMIN_ORDER_API =
  "https://script.google.com/macros/s/AKfycbyJPyMYQy10tYPWoonku6i319WIT7dIukMaXjJXeIgYIRWEKXkeVUzfHebxkLx_ygYdUA/exec";

const BOOKFAIR_ADMIN_TOKEN = "BF_ADMIN_2026_SECURE";

(function () {
  let orders = [];

  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function money(value) {
    return "Rs " + Number(value || 0).toLocaleString("en-LK");
  }

  function dateValue(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  function formatDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-LK", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  function isRevenue(order) {
    return ["paid", "completed"].includes(
      String(order.status || "").toLowerCase()
    );
  }

  function renderStats() {
    const now = new Date();

    const pending = orders.filter(
      (o) => String(o.status || "Payment Checking") === "Payment Checking"
    );

    const today = orders.filter(
      (o) => {
        const d = new Date(o.date);
        return !Number.isNaN(d.getTime()) &&
          d.toDateString() === now.toDateString();
      }
    );

    const month = orders.filter(
      (o) => {
        const d = new Date(o.date);
        return !Number.isNaN(d.getTime()) &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth();
      }
    );

    const revenue = (list) =>
      list.filter(isRevenue).reduce(
        (sum, o) => sum + Number(o.total || 0),
        0
      );

    if ($("orderCount")) $("orderCount").textContent = orders.length;
    if ($("pendingOrders")) $("pendingOrders").textContent = pending.length;
    if ($("todayRevenue")) $("todayRevenue").textContent = money(revenue(today));
    if ($("monthRevenue")) $("monthRevenue").textContent = money(revenue(month));
    if ($("totalRevenue")) $("totalRevenue").textContent = money(revenue(orders));
  }

  function render() {
    const search = String($("orderSearch")?.value || "")
      .toLowerCase()
      .trim();

    const filter = $("orderStatusFilter")?.value || "all";

    const filtered = orders.filter((o) => {
      const text = [
        o.orderNo,
        o.customer,
        o.mobile,
        o.district,
        o.book,
        o.bookCode,
        o.slip
      ].join(" ").toLowerCase();

      return (!search || text.includes(search)) &&
        (filter === "all" ||
         String(o.status || "Payment Checking") === filter);
    });

    const rows = $("orderRows");

    if (rows) {
      rows.innerHTML = filtered.map((o) => {
        const status = o.status || "Payment Checking";

        const slip = o.slip
          ? `<a class="admin-btn" target="_blank" rel="noopener" href="${esc(o.slip)}">View Slip</a>`
          : `<span class="muted">No slip</span>`;

        return `
          <tr>
            <td>
              <strong>${esc(o.orderNo || "—")}</strong>
              <div class="muted">${esc(formatDate(o.date))}</div>
            </td>
            <td>${esc(o.book || "—")}</td>
            <td>
              <strong>${esc(o.customer || "—")}</strong>
              <div class="muted">${esc(o.mobile || "")}</div>
            </td>
            <td>${esc(o.district || "—")}</td>
            <td>${esc(o.quantity || 0)}</td>
            <td><strong>${money(o.total)}</strong></td>
            <td>
              <span class="pill ${isRevenue(o) ? "green" : "gold"}">
                ${esc(status.toUpperCase())}
              </span>
            </td>
            <td>${slip}</td>
            <td>
              <select
                class="order-status-select"
                data-google-order="${esc(o.orderNo)}">
                ${[
                  "Payment Checking",
                  "Paid",
                  "Completed",
                  "Cancelled"
                ].map((v) =>
                  `<option value="${v}" ${status === v ? "selected" : ""}>${v}</option>`
                ).join("")}
              </select>

              <button
                type="button"
                class="admin-btn danger google-order-delete"
                data-google-order="${esc(o.orderNo)}"
                style="margin-left:6px">
                Delete
              </button>
            </td>
          </tr>`;
      }).join("");
    }

    if ($("orderEmpty")) {
      $("orderEmpty").style.display =
        filtered.length ? "none" : "block";
    }

    renderStats();
  }

  async function loadOrders() {
    try {
      const response = await fetch(
        BOOKFAIR_ADMIN_ORDER_API +
        "?action=adminOrders&token=" +
        encodeURIComponent(BOOKFAIR_ADMIN_TOKEN),
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Could not load orders.");
      }

      orders = data.orders || [];

      orders.sort(
        (a, b) => dateValue(b.date) - dateValue(a.date)
      );

      render();
    } catch (error) {
      console.error("GOOGLE ORDERS ADMIN:", error);

      if ($("orderEmpty")) {
        $("orderEmpty").style.display = "block";
        $("orderEmpty").textContent =
          "Could not load orders from Google Sheets.";
      }
    }
  }

  async function post(payload) {
    const response = await fetch(
      BOOKFAIR_ADMIN_ORDER_API,
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  async function updateStatus(orderNo, status) {
    try {
      await post({
        action: "updateStatus",
        token: BOOKFAIR_ADMIN_TOKEN,
        orderNo,
        status
      });

      await loadOrders();

      const toast = $("toast");
      if (toast) {
        toast.textContent = `Order ${orderNo} → ${status}`;
        toast.className = "toast show";
        setTimeout(() => toast.classList.remove("show"), 2800);
      }
    } catch (error) {
      alert(error.message || "Could not update order status.");
      await loadOrders();
    }
  }

  async function deleteOrder(orderNo) {
    if (!confirm(
      `Delete order "${orderNo}"?\n\n` +
      "This will permanently remove the order from Google Sheets.\n\n" +
      "This action cannot be undone."
    )) return;

    try {
      await post({
        action: "deleteOrder",
        token: BOOKFAIR_ADMIN_TOKEN,
        orderNo
      });

      await loadOrders();

      const toast = $("toast");
      if (toast) {
        toast.textContent = `Order ${orderNo} deleted successfully.`;
        toast.className = "toast show";
        setTimeout(() => toast.classList.remove("show"), 2800);
      }
    } catch (error) {
      alert(error.message || "Could not delete order.");
    }
  }

  document.addEventListener("change", (event) => {
    const select = event.target.closest(".order-status-select");
    if (!select || !select.dataset.googleOrder) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    updateStatus(
      select.dataset.googleOrder,
      select.value
    );
  }, true);

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".google-order-delete");
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    deleteOrder(button.dataset.googleOrder);
  }, true);

  $("orderSearch")?.addEventListener("input", render);
  $("orderStatusFilter")?.addEventListener("change", render);

  $("refreshOrdersBtn")?.addEventListener("click", async () => {
    const button = $("refreshOrdersBtn");

    if (button) {
      button.disabled = true;
      button.textContent = "Refreshing…";
    }

    try {
      await loadOrders();
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "↻ Refresh Orders";
      }
    }
  });

  // Wait for the existing admin page to finish its student initialization,
  // then replace only the Online Orders data source with Google Sheets.
  setTimeout(() => {
    loadOrders();
    setInterval(loadOrders, 15000);
  }, 2000);
})();
