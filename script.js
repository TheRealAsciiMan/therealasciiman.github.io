let weapons = [];
let filteredWeapons = [];
let current = null;

const FILTER_KEYS = [
  "Type",
  "Caliber(s)",
  "Country",
  "Fire Modes"
];

// ---------------- LOAD
fetch("weapons_normalized.json")
  .then(res => res.json())
  .then(data => {
    weapons = data;
    buildFilters(data);
  });

// ---------------- BUILD FILTERS FIX CLICK
function buildFilters(data) {

  const container = document.getElementById("filters-container");
  container.innerHTML = "";

  FILTER_KEYS.forEach(key => {

    const stats = {};

    data.forEach(w => {
      const val = w.specs?.[key];
      if (!val) return;

      val.split("|").forEach(v => {
        v = v.trim();
        if (!v) return;
        stats[v] = (stats[v] || 0) + 1;
      });
    });

    const sorted = Object.entries(stats)
      .sort((a, b) => b[1] - a[1]);

    const group = document.createElement("div");
    group.className = "filter-group";
    group.dataset.key = key;

    group.innerHTML = `<div class="filter-title">${key}</div>`;

    sorted.forEach(([val, count]) => {

      const btn = document.createElement("button");
      btn.className = "btn btn-outline-primary btn-sm filter-btn";
      btn.textContent = `${val} (${count})`;

      // ✅ FIX: toggle pur (aucune contrainte)
      btn.onclick = () => {
        btn.classList.toggle("active");
      };

      group.appendChild(btn);
    });

    container.appendChild(group);
  });
}

// ---------------- YEAR PARSER
function parseYearRange(text) {
  if (!text) return null;

  const years = text.match(/\d{4}/g);
  if (!years) return null;

  const start = parseInt(years[0]);
  let end = start;

  if (/present/i.test(text)) {
    end = new Date().getFullYear();
  } else if (years.length > 1) {
    end = parseInt(years[1]);
  }

  return { start, end };
}

function yearOverlap(r, min, max) {
  return r.end >= min && r.start <= max;
}


// RESET FILTERS
function resetFilters() {

  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  document.getElementById("year-start").value = "";
  document.getElementById("year-end").value = "";
}

// ---------------- START GAME
function startGame() {

  const minYear = parseInt(document.getElementById("year-start").value) || -9999;
  const maxYear = parseInt(document.getElementById("year-end").value) || 9999;

  filteredWeapons = weapons.filter(w => {

    // FILTER BUTTONS
    for (const key of FILTER_KEYS) {

      const group = [...document.querySelectorAll(".filter-group")]
        .find(g => g.innerText.includes(key));

      const active = group?.querySelectorAll(".active");

      if (!active || active.length === 0) continue;

      const val = (w.specs?.[key] || "").toLowerCase();

      const ok = [...active].some(b =>
        val.includes(b.textContent.split(" (")[0].toLowerCase())
      );

      if (!ok) return false;
    }

    // YEAR FILTER
    const yearData = parseYearRange(w.specs?.["Years of Use"]);

    if (minYear !== -9999 || maxYear !== 9999) {
      if (!yearData) return false;
      if (!yearOverlap(yearData, minYear, maxYear)) return false;
    }

    return true;
  });

  if (!filteredWeapons.length) {
    alert("No match");
    return;
  }

  document.getElementById("filters").style.display = "none";
  document.getElementById("game").style.display = "block";

  nextWeapon();
}

// ---------------- GAME
function nextWeapon() {
  current = filteredWeapons[Math.floor(Math.random() * filteredWeapons.length)];

  document.getElementById("weapon-img").src = current.image;
  document.getElementById("title").innerText = "";
  document.getElementById("info").innerHTML = "";

  window.revealed = false;
}

// ---------------- REVEAL
function reveal() {
  if (!current) return;

  document.getElementById("title").innerText = current.name;

  let html = `<p>${current.description}</p><ul>`;
  for (let k in current.specs) {
    html += `<li><b>${k}</b>: ${current.specs[k]}</li>`;
  }
  html += "</ul>";

  document.getElementById("info").innerHTML = html;
  window.revealed = true;
}

// ---------------- CLICK IMAGE
document.getElementById("weapon-img")?.addEventListener("click", () => {
  if (!window.revealed) reveal();
  else nextWeapon();
});

// ---------------- BUTTONS
document.getElementById("btn-refresh")?.addEventListener("click", nextWeapon);

document.getElementById("btn-filters")?.addEventListener("click", () => {
  document.getElementById("game").style.display = "none";
  document.getElementById("filters").style.display = "block";
});

// ---------------- THEME
document.getElementById("themeToggle")?.addEventListener("click", () => {
  const html = document.documentElement;
  const dark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", dark ? "light" : "dark");
});


// ---- Service

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("✅ Service Worker registered"))
    .catch(err => console.log("❌ SW error:", err));
}