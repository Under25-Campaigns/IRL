const API_URL =
"https://script.google.com/macros/s/AKfycby7iKu-UWqQPby_0y6HJQHeSiRHjRjvgxKG3vMvHJ1wCKpjlB4-QMTxxuiqaaFha1ch/exec";

const TOKEN =
"IRL_Dashboard";

const PASSWORD_HASH =
"21a105268663d59df90238e25b1066eccd3594081cd50b2f2a08d6cf1261834b";

async function sha256(text) {
const buffer = await crypto.subtle.digest(
"SHA-256",
new TextEncoder().encode(text)
);

return [...new Uint8Array(buffer)]
.map(b => b.toString(16).padStart(2, "0"))
.join("");
}

async function authenticate() {
const authenticated = sessionStorage.getItem("dashboardAuth");

if (authenticated === "true") {
return true;
}

const password = prompt("Enter Dashboard Password");

if (!password) {
return false;
}

const hash = await sha256(password);

if (hash !== PASSWORD_HASH) {
document.body.innerHTML = `       <div style="
        background:#000;
        color:#fff;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:28px;
        font-family:Inter,sans-serif;
      ">
        Access Denied       </div>
    `;
return false;
}

sessionStorage.setItem("dashboardAuth", "true");
return true;
}


(async () => {
const allowed = await authenticate();

if (!allowed) return;

loadSubmissions();
setInterval(loadSubmissions, 15000);
})();


async function loadSubmissions() {
try {
const response = await fetch(
`${API_URL}?token=${TOKEN}&mode=list`
);


const data = await response.json();

document.getElementById("pendingCount").innerText = data.length;

const tableBody = document.getElementById("tableBody");
tableBody.innerHTML = "";

data.forEach((item, index) => {
  const card = document.createElement("div");
  card.className = "submission-card";

  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="candidate-name">
          ${item.name || ""}
        </div>

        <div class="candidate-phone">
          ${item.phone || ""}
        </div>
      </div>
    </div>

    <a
      href="${item.screenshot || "#"}"
      target="_blank"
      class="screenshot-button"
    >
      View Screenshot
    </a>

    <div class="actions">
      <button
        class="approve-btn"
        onclick="updateStatus(${item.row}, 'approve')"
      >
        Approve
      </button>

      <button
        class="reject-btn"
        onclick="updateStatus(${item.row}, 'reject')"
      >
        Reject
      </button>
    </div>
  `;

  tableBody.appendChild(card);
});


} catch (err) {
console.error("Load Error:", err);
}
}

async function updateStatus(row, action) {
const confirmed = confirm(
`${action.toUpperCase()} this submission?`
);

if (!confirmed) return;

try {
const response = await fetch(
`${API_URL}?token=${TOKEN}&mode=${action}&row=${row}`
);


const result = await response.json();

if (result.success) {
  loadSubmissions();
} else {
  alert(result.error || "Operation failed");
}


} catch (err) {
console.error("Update Error:", err);
alert("Update failed");
}
}


const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
logoutBtn.onclick = () => {
sessionStorage.removeItem("dashboardAuth");
location.reload();
};
}
