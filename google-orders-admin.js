/* BookFair Digital - Google Apps Script admin orders override */
const BOOKFAIR_ADMIN_ORDER_API = "https://script.google.com/macros/s/AKfycbyJPyMYQy10tYPWoonku6i319WIT7dIukMaXjJXeIgYIRWEKXkeVUzfHebxkLx_ygYdUA/exec";
const BOOKFAIR_ADMIN_TOKEN = "BF_ADMIN_2026_SECURE";

(function () {
  let orders = [];
  const $ = id => document.getElementById(id);

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char]));
  }
  function money(value) { return "Rs " + Number(value || 0).toLocaleString("en-LK"); }
  function dateValue(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? 0 : d.getTime(); }
  function formatDate(value) { const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-LK", {dateStyle:"medium", timeStyle:"short"}); }
  function revenueOrder(order) { const s = String(order.status || "").toLowerCase(); return s === "paid" || s === "completed"; }

  function renderStats() {
    const pending = orders.filter(o => String(o.status || "Payment Checking") === "Payment Checking");
    const now = new Date();
    const today = orders.filter(o => { const d = new Date(o.date); return d.toDateString() === now.toDateString(); });
    const month = orders.filter(o => { const d = new Date(o.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
    const revenue = list => list.filter(revenueOrder).reduce((sum,o) => sum + Number(o.total || 0), 0);
    if ($("orderCount")) $("orderCount").textContent = orders.length;
    if ($("pendingOrders")) $("pendingOrders").textContent = pending.length;
    if ($("todayRevenue")) $("todayRevenue").textContent = money(revenue(today));
    if ($("monthRevenue")) $("monthRevenue").textContent = money(revenue(month));
    if ($("totalRevenue")) $("totalRevenue").textContent = money(revenue(orders));
  }

  function render() {
    const search = String($("orderSearch")?.value || "").toLowerCase().trim();
    const statusFilter = $("orderStatusFilter")?.value || "all";
    const filtered = orders.filter(order => {
      const haystack = [order.orderNo, order.customer, order.mobile, order.district, order.book].join(" ").toLowerCase();
      return (!search || haystack.includes(search)) && (statusFilter === "all" || String(order.status || "Payment Checking") === statusFilter);
    });

    const rows = $("orderRows");
    if (rows) {
      rows.innerHTML = filtered.map(order => {
        const status = order.status || "Payment Checking";
        const slip = order.slip
          ? `<a class="admin-btn" target="_blank" rel="noopener" href="${esc(order.slip)}">View Slip</a>`
          : `<span class="muted">No slip</span>`;
        return `<tr>
          <td><strong>${esc(order.orderNo)}</strong><div class="muted">${esc(formatDate(order.date))}</div></td>
          <td>${esc(order.book || "—")}</td>
          <td><strong>${esc(order.customer || "—")}</strong><div class="muted">${esc(order.mobile || "")}</div></td>
          <td>${esc(order.district || "—")}</td>
          <td>${esc(order.quantity || 0)}</td>
          <td><strong>${money(order.total)}</strong></td>
          <td><span class="pill ${revenueOrder(order) ? "green" : "gold"}">${esc(status.toUpperCase())}</span></td>
          <td>${slip}</td>
          <td>
            <select class="order-status-select" data-google-order="${esc(order.orderNo)}">
              ${["Payment Checking","Paid","Completed","Cancelled"].map(v => `<option value="${v}"${status === v ? " selected" : ""}>${v}</option>`).join("")}
            </select>
            <button type="button" class="admin-btn danger google-order-delete" data-google-order="${esc(order.orderNo)}" style="margin-left:6px">Delete</button>
          </td>
        </tr>`;
      }).join("");
    }
    if ($("orderEmpty")) $("orderEmpty").style.display = filtered.length ? "none" : "block";
    renderStats();
  }

  async function getOrders() {
    const response = await fetch(BOOKFAIR_ADMIN_ORDER_API + "?action=adminOrders&token=" + encodeURIComponent(BOOKFAIR_ADMIN_TOKEN), {cache:"no-store"});
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Could not load orders.");
    orders = data.orders || [];
    orders.sort((a,b) => dateValue(b.date) - dateValue(a.date));
    render();
  }

  async function post(payload) {
    const response = await fetch(BOOKFAIR_ADMIN_ORDER_API, {
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(payload)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || "Request failed.");
    return data;
  }

  async function updateStatus(orderNo, status) {
    try {
      await post({action:"updateStatus", token:BOOKFAIR_ADMIN_TOKEN, orderNo, status});
      await getOrders();
    } catch (error) {
      alert(error.message || "Could not update order status.");
      await getOrders().catch(() => {});
    }
  }

  async function deleteOrder(orderNo) {
    if (!confirm("Delete order " + orderNo + "?")) return;
    try {
      await post({action:"deleteOrder", token:BOOKFAIR_ADMIN_TOKEN, orderNo});
      await getOrders();
    } catch (error) {
      alert(error.message || "Could not delete order.");
    }
  }

  document.addEventListener("change", event => {
    const select = event.target.closest(".order-status-select");
    if (select && select.dataset.googleOrder) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      updateStatus(select.dataset.googleOrder, select.value);
      return;
    }
    if (event.target?.id === "orderStatusFilter") render();
  }, true);

  document.addEventListener("click", event => {
    const deleteButton = event.target.closest(".google-order-delete");
    if (deleteButton) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      deleteOrder(deleteButton.dataset.googleOrder);
      return;
    }
    const refresh = event.target.closest("#refreshOrdersBtn");
    if (refresh) {
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      getOrders().catch(error => alert(error.message));
    }
  }, true);

  document.addEventListener("input", event => {
    if (event.target?.id === "orderSearch") render();
  }, true);

  setTimeout(() => getOrders().catch(error => console.error("GOOGLE ORDERS ADMIN:", error)), 1200);
  setInterval(() => getOrders().catch(() => {}), 15000);
})();
