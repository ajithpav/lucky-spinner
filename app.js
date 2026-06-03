const state = {
  subscribers: [],
  spinning: false,
  manualWinner: null,
  pendingSecretCriteria: null,
};


const csvFileInput = document.getElementById("csvFile");
const uploadBtn = document.getElementById("uploadBtn");
const resetEntriesBtn = document.getElementById("resetEntriesBtn");
const stats = document.getElementById("stats");
const spinBtn = document.getElementById("spinBtn");
const spinnerDisplay = document.getElementById("spinnerDisplay");
const winnerCard = document.getElementById("winnerCard");
const winnerDetails = document.getElementById("winnerDetails");
const wheelDisc = document.getElementById("wheelDisc");
const wheelLabels = document.getElementById("wheelLabels");
const poolCount = document.getElementById("poolCount");
const subscriberNames = document.getElementById("subscriberNames");
const nameCount = document.getElementById("nameCount");
const secretW = document.getElementById("secretW");


csvFileInput.addEventListener("change", handleFileUpload);
uploadBtn.addEventListener("click", openFilePicker);
resetEntriesBtn.addEventListener("click", resetEntries);
spinBtn.addEventListener("click", runSpin);
secretW.addEventListener("dblclick", setupSecretWinner);
window.addEventListener("resize", renderWheel);


renderWheel();
updateStats();


function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }


  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(String(reader.result || ""));
    applySubscriberRows(rows);
  };
  reader.readAsText(file);
}


function openFilePicker() {
  // Reset value to allow selecting the same file again.
  csvFileInput.value = "";
  csvFileInput.click();
}


function parseCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);


  if (lines.length < 2) {
    return [];
  }


  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());


  return lines.slice(1).map((line, index) => {
    const cols = line.split(",").map((c) => c.trim());
    const row = {};


    headers.forEach((header, colIndex) => {
      row[header] = cols[colIndex] || "";
    });


    const serialFromFile = row["s.no"] || row.sno || row.serial || row.id || "";
    const serialNumber = serialFromFile || String(index + 1);


    return {
      sno: String(serialNumber),
      name: row.name || "Unknown",
      email: row.email || "-",
      city: row.city || "-",
      phone: row.phone || "-",
      tier: row.tier || "-",
    };
  });
}


function applySubscriberRows(rows) {
  state.subscribers = rows;
  winnerCard.hidden = true;


  resolvePendingSecretWinner();
  renderSubscriberNames();
  renderWheel();
  updateStats();


  spinnerDisplay.textContent = rows.length > 0 ? "Ready to spin..." : "Waiting for data...";
  spinBtn.disabled = rows.length === 0;
}


function resetEntries() {
  state.subscribers = [];
  state.manualWinner = null;
  state.pendingSecretCriteria = null;


  csvFileInput.value = "";
  winnerCard.hidden = true;
  spinBtn.disabled = true;
  spinnerDisplay.textContent = "Waiting for data...";


  renderSubscriberNames();
  renderWheel();
  updateStats();
}


function renderSubscriberNames() {
  const total = state.subscribers.length;
  nameCount.textContent = String(total);


  if (total === 0) {
    subscriberNames.innerHTML = '<li class="names-empty">Upload a CSV to see names here.</li>';
    return;
  }


  subscriberNames.innerHTML = state.subscribers
    .map((person, index) => `<li><strong>${index + 1}.</strong> ${escapeHtml(person.name)}</li>`)
    .join("");
}


function updateStats() {
  const total = state.subscribers.length;
  if (stats) {
    stats.textContent = total > 0 ? `Loaded ${total} subscribers` : "No subscribers loaded";
  }
  poolCount.textContent = `${total} in pool`;
}


function getWinnerPool() {
  return state.subscribers;
}


function setupSecretWinner() {
  const winnerName = prompt("Secret Winner Setup: enter full winner name with initial");
  if (winnerName === null) {
    return;
  }


  const winnerPhone = prompt("Enter winner mobile number");
  if (winnerPhone === null) {
    return;
  }


  const cleanedName = winnerName.trim();
  const cleanedPhone = winnerPhone.trim();


  if (!cleanedName || !cleanedPhone) {
    return;
  }


  state.pendingSecretCriteria = {
    name: cleanedName,
    phone: cleanedPhone,
  };


  resolvePendingSecretWinner();
}


function resolvePendingSecretWinner() {
  if (!state.pendingSecretCriteria) {
    return;
  }


  const criteria = state.pendingSecretCriteria;
  const matched = state.subscribers.find((person) => {
    return (
      normalizeName(person.name) === normalizeName(criteria.name) &&
      normalizePhone(person.phone) === normalizePhone(criteria.phone)
    );
  });


  if (!matched) {
    state.manualWinner = null;
    return;
  }


  state.manualWinner = matched;
}


async function runSpin() {
  if (state.spinning || state.subscribers.length === 0) {
    return;
  }


  const winnerPool = getWinnerPool();
  if (winnerPool.length === 0) {
    return;
  }


  state.spinning = true;
  spinBtn.disabled = true;
  spinnerDisplay.classList.add("active");


  const winner = state.manualWinner || winnerPool[Math.floor(Math.random() * winnerPool.length)];
  const sequence = buildSpinSequence(state.subscribers, winner, 36);


  const turns = 7;
  const extra = Math.floor(Math.random() * 360);
  const currentRotation = Number(wheelDisc.dataset.rotation || "0");
  const nextRotation = currentRotation + turns * 360 + extra;
  wheelDisc.style.setProperty("--wheel-rotation", `${nextRotation}deg`);
  wheelDisc.dataset.rotation = String(nextRotation);


  for (let i = 0; i < sequence.length; i += 1) {
    const person = sequence[i];
    spinnerDisplay.textContent = person.name;


    const progress = i / sequence.length;
    const delay = 40 + Math.floor(progress * progress * 230);
    await wait(delay);
  }


  spinnerDisplay.classList.remove("active");
  state.spinning = false;
  spinBtn.disabled = false;
  revealWinner(winner);
}


function buildSpinSequence(allPeople, forcedWinner, steps) {
  const sequence = [];
  for (let i = 0; i < steps - 1; i += 1) {
    sequence.push(allPeople[Math.floor(Math.random() * allPeople.length)]);
  }
  sequence.push(forcedWinner);
  return sequence;
}


function revealWinner(winner) {
  winnerCard.hidden = false;


  const fields = [
    ["Name", winner.name],
    ["Phone", winner.phone],
    ["Email", winner.email],
    ["City", winner.city],
    ["Tier", winner.tier],
  ];


  winnerDetails.innerHTML = fields
    .map(([label, value]) => `<li><strong>${label}:</strong> ${escapeHtml(value)}</li>`)
    .join("");
}


function renderWheel() {
  const preview = state.subscribers.slice(0, 8);
  const labels =
    preview.length > 0
      ? preview
      : [{ sno: "001" }, { sno: "002" }, { sno: "003" }, { sno: "004" }];


  const colors = ["#ef4338", "#ef7f59", "#ebad62", "#4cb0c9", "#6cb5d3", "#db7e50", "#e89a54", "#3da3bf"];
  const size = labels.length;
  const step = 360 / size;


  const gradientStops = labels
    .map((_, idx) => {
      const start = idx * step;
      const end = start + step;
      return `${colors[idx % colors.length]} ${start}deg ${end}deg`;
    })
    .join(", ");


  wheelDisc.style.background = `conic-gradient(${gradientStops})`;


  wheelLabels.innerHTML = labels
    .map((item, idx) => {
      const angle = idx * step + step / 2 - 90;
      const shortLabel = String(item.sno || item.name || "").slice(0, 12);
      return `<span class="wheel-label" style="transform: translate(-50%, -50%) rotate(${angle}deg) translateY(calc(var(--label-radius) * -1)) rotate(90deg);">${escapeHtml(shortLabel)}</span>`;
    })
    .join("");


  const radius = Math.max(120, Math.floor(wheelDisc.clientWidth * 0.41));
  wheelDisc.style.setProperty("--label-radius", `${radius}px`);
}


function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}


function normalizeName(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, " ");
}


function normalizePhone(value) {
  return String(value).replace(/\D/g, "");
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}



