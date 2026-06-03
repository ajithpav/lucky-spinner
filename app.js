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


let secretClickCount = 0;
let secretClickTimer = null;


csvFileInput.addEventListener("change", handleFileUpload);
uploadBtn.addEventListener("click", openFilePicker);
resetEntriesBtn.addEventListener("click", resetEntries);
spinBtn.addEventListener("click", runSpin);
secretW.addEventListener("click", handleSecretClick);
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
    .map((line) => line.trimEnd())
    .filter(Boolean);


  if (lines.length < 2) {
    return [];
  }


  const headers = parseCsvLine(lines[0]).map((h) => sanitizeCsvCell(h));


  return lines.slice(1).map((line, index) => {
    const cols = parseCsvLine(line).map((c) => sanitizeCsvCell(c));
    const row = {};


    headers.forEach((header, colIndex) => {
      row[header] = cols[colIndex] || "";
    });


    const serialFromFile = getByAliases(row, ["s.no", "sno", "serial", "id", "order_id"]);
    const serialNumber = serialFromFile || String(index + 1);


    return {
      sno: String(serialNumber),
      name: getByAliases(row, ["name", "full_name", "customer_name"]) || "Unknown",
      email: getByAliases(row, ["email", "mail"]) || "-",
      city: getByAliases(row, ["city", "town", "location"]) || "-",
      phone: getByAliases(row, ["phone", "phone_number", "phone number", "mobile", "mobile_number"]) || "-",
      tier: getByAliases(row, ["tier", "plan", "subscription_tier", "payment status"]) || "-",
      rawData: row,
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


function handleSecretClick() {
  secretClickCount += 1;


  if (secretClickTimer) {
    clearTimeout(secretClickTimer);
  }


  if (secretClickCount === 3) {
    secretClickCount = 0;
    setupSecretWinner();
    return;
  }


  secretClickTimer = setTimeout(() => {
    secretClickCount = 0;
  }, 550);
}


function setupSecretWinner() {
  const winnerName = prompt("Secret Winner Setup: enter full winner name with initial");
  if (winnerName === null) {
    return;
  }


  const winnerPhone = prompt("Enter winner mobile number (optional)");
  if (winnerPhone === null) {
    return;
  }


  const winnerEmail = prompt("Enter winner email (optional)");
  if (winnerEmail === null) {
    return;
  }


  const cleanedName = winnerName.trim();
  const cleanedPhone = winnerPhone.trim();
  const cleanedEmail = winnerEmail.trim();


  if (!cleanedName) {
    return;
  }


  if (!cleanedPhone && !cleanedEmail) {
    return;
  }


  state.pendingSecretCriteria = {
    name: cleanedName,
    phone: cleanedPhone,
    email: cleanedEmail,
  };


  resolvePendingSecretWinner();
}


function resolvePendingSecretWinner() {
  if (!state.pendingSecretCriteria) {
    return;
  }


  const criteria = state.pendingSecretCriteria;
  const criteriaName = normalizeName(criteria.name);
  const criteriaPhone = normalizePhone(criteria.phone);
  const criteriaEmail = normalizeEmail(criteria.email || "");
  const criteriaPhoneLast10 = lastDigits(criteriaPhone, 10);


  const matched = state.subscribers.find((person) => {
    const personName = normalizeName(person.name);
    const personPhone = normalizePhone(person.phone);
    const personEmail = normalizeEmail(person.email);
    const personPhoneLast10 = lastDigits(personPhone, 10);


    const nameMatch =
      personName === criteriaName ||
      personName.includes(criteriaName) ||
      criteriaName.includes(personName);


    const phoneMatch =
      personPhone === criteriaPhone ||
      personPhoneLast10 === criteriaPhoneLast10;


    const emailMatch = criteriaEmail && personEmail === criteriaEmail;


    const identifierMatch =
      (criteriaPhone && phoneMatch) ||
      (criteriaEmail && emailMatch);


    return nameMatch && identifierMatch;
  });


  // Fallback: if phone uniquely matches a single row, use it.
  const phoneOnlyMatches = state.subscribers.filter((person) => {
    const personPhone = normalizePhone(person.phone);
    const personPhoneLast10 = lastDigits(personPhone, 10);
    return personPhone === criteriaPhone || personPhoneLast10 === criteriaPhoneLast10;
  });


  const emailOnlyMatches = state.subscribers.filter((person) => {
    return normalizeEmail(person.email) === criteriaEmail;
  });


  const fallbackByPhone = criteriaPhone ? phoneOnlyMatches.length === 1 ? phoneOnlyMatches[0] : null : null;
  const fallbackByEmail = criteriaEmail ? emailOnlyMatches.length === 1 ? emailOnlyMatches[0] : null : null;


  if (!matched && !fallbackByPhone && !fallbackByEmail) {
    state.manualWinner = null;
    return;
  }


  state.manualWinner = matched || fallbackByPhone || fallbackByEmail;
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


  const row = winner.rawData || {};
  const fields = [
    ["name", getByAliases(row, ["name", "full_name", "customer_name"]) || winner.name || "-"],
    ["phone_number", getByAliases(row, ["phone_number", "phone", "phone number", "mobile", "mobile_number"]) || winner.phone || "-"],
    ["email", getByAliases(row, ["email", "mail"]) || winner.email || "-"],
    ["city", getByAliases(row, ["city", "town", "location"]) || winner.city || "-"],
    ["payment id", getByAliases(row, ["payment id", "payment_id", "paymentid"]) || "-"],
    ["order_id", getByAliases(row, ["order_id", "order id", "orderid"]) || "-"],
    ["payment date", getByAliases(row, ["payment date", "payment_date", "date", "paymentdate"]) || "-"],
  ];


  winnerDetails.innerHTML = fields
    .map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value || "-")}</li>`)
    .join("");
}


function renderWheel() {
  // Show 12 mild color slices with only number labels.
  const size = 12;
  const colors = [
    "#1f3c88", "#2f5aa8", "#3f77b9", "#4f94bb",
    "#5d9d92", "#4f7f6d", "#6e8f71", "#8f9f7a",
    "#a89f7a", "#8f7f6b", "#6f6684", "#4f4f78"
  ];
  const step = 360 / size;


  const gradientStops = Array.from({ length: size })
    .map((_, idx) => {
      const start = idx * step;
      const end = start + step;
      return `${colors[idx % colors.length]} ${start}deg ${end}deg`;
    })
    .join(", ");


  wheelDisc.style.background = `conic-gradient(${gradientStops})`;


  wheelLabels.innerHTML = Array.from({ length: size })
    .map((_, idx) => {
      const angle = idx * step + step / 2 - 90;
      const label = String(idx + 1).padStart(2, "0");
      return `<span class="wheel-label" style="transform: translate(-50%, -50%) rotate(${angle}deg) translateY(calc(var(--label-radius) * -1)) rotate(90deg);">${label}</span>`;
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
  return String(value)
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizePhone(value) {
  return String(value).replace(/\D/g, "");
}


function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}


function lastDigits(value, count) {
  return String(value).slice(-count);
}


function sanitizeCsvCell(value) {
  return String(value).trim().replace(/^"|"$/g, "").replace(/""/g, '"');
}


function parseCsvLine(line) {
  const out = [];
  let cell = "";
  let inQuotes = false;


  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];


    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }


    if (ch === "," && !inQuotes) {
      out.push(cell);
      cell = "";
      continue;
    }


    cell += ch;
  }


  out.push(cell);
  return out;
}


function getByAliases(row, aliases) {
  const keys = Object.keys(row || {});


  for (let i = 0; i < aliases.length; i += 1) {
    const target = normalizeHeader(aliases[i]);
    const actual = keys.find((key) => normalizeHeader(key) === target);
    if (actual && String(row[actual]).trim()) {
      return row[actual];
    }
  }


  return "";
}


function normalizeHeader(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}



