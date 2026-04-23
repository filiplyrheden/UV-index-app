// ─── Skin type data ──────────────────────────────────────────────────────────
// base = minutes at UV 1 before MED is reached (direct sun)
// Based on WHO Fitzpatrick scale MED values
const SKIN_TYPES = [
  {
    id: 1,
    color: "#F5DEB3",
    name: "Typ I",
    desc: "Mycket ljus, bränns alltid",
    base: 120,
  },
  {
    id: 2,
    color: "#E8C49A",
    name: "Typ II",
    desc: "Ljus, bränns lätt",
    base: 200,
  },
  {
    id: 3,
    color: "#C8956C",
    name: "Typ III",
    desc: "Mellanbrun, bränns ibland",
    base: 330,
  },
  {
    id: 4,
    color: "#A0714F",
    name: "Typ IV",
    desc: "Olivbrun, bränns sällan",
    base: 500,
  },
  {
    id: 5,
    color: "#7D4E2D",
    name: "Typ V",
    desc: "Brun, bränns mycket sällan",
    base: 800,
  },
  {
    id: 6,
    color: "#3D1F0D",
    name: "Typ VI",
    desc: "Mörk, bränns nästan aldrig",
    base: 1200,
  },
];

// UV level configuration
const UV_LEVELS = [
  {
    max: 2,
    cls: "lvl-low",
    label: "Lågt",
    c1: "#43b89c",
    c2: "#2ecc71",
    pct: 0.15,
  },
  {
    max: 5,
    cls: "lvl-mod",
    label: "Måttligt",
    c1: "#f9ca24",
    c2: "#f0932b",
    pct: 0.4,
  },
  {
    max: 7,
    cls: "lvl-high",
    label: "Högt",
    c1: "#f0932b",
    c2: "#eb4d4b",
    pct: 0.6,
  },
  {
    max: 10,
    cls: "lvl-vhigh",
    label: "Mycket högt",
    c1: "#eb4d4b",
    c2: "#c0392b",
    pct: 0.8,
  },
  {
    max: Infinity,
    cls: "lvl-ext",
    label: "Extremt",
    c1: "#a855f7",
    c2: "#7c3aed",
    pct: 1.0,
  },
];

let selectedSkin = 2;
let currentUV = 0;
let uvChart = null;

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtTime(min) {
  if (!isFinite(min) || min > 1440) return "> 24 h";
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
  }
  return `${Math.round(min)} min`;
}

function uvLevel(uv) {
  return UV_LEVELS.find((l) => uv <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
}

// ─── UI updates ─────────────────────────────────────────────────────────────
function updateUVCircle(uv) {
  const lvl = uvLevel(uv);
  const circle = document.getElementById("uv-circle");
  circle.className = `uv-circle ${lvl.cls}`;
  document.getElementById("uv-number").textContent =
    uv > 0 ? uv.toFixed(1) : "0";
  document.getElementById("uv-desc").textContent = lvl.label;

  // Animate ring: max UV for full ring is 11
  const fraction = Math.min(uv / 11, 1);
  const circumference = 2 * Math.PI * 68; // 427.3
  const offset = circumference * (1 - fraction);
  document.getElementById("uv-ring-fill").style.strokeDashoffset = offset;
  document.getElementById("grad-stop1").setAttribute("stop-color", lvl.c1);
  document.getElementById("grad-stop2").setAttribute("stop-color", lvl.c2);
}

function updateTimes() {
  const skin = SKIN_TYPES.find((s) => s.id === selectedSkin);
  if (!skin || currentUV <= 0) {
    ["t-direct", "t-partial", "t-full"].forEach(
      (id) => (document.getElementById(id).textContent = "—"),
    );
    return;
  }
  const direct = skin.base / currentUV;
  const partial = direct * 2.5; // ~40% UV transmission in partial shade
  const full = direct * 6; // ~17% UV transmission in full shade / tree canopy

  document.getElementById("t-direct").textContent = fmtTime(direct);
  document.getElementById("t-partial").textContent = fmtTime(partial);
  document.getElementById("t-full").textContent = fmtTime(full);
}

function renderSkinTypes() {
  const grid = document.getElementById("skin-grid");
  grid.innerHTML = "";
  SKIN_TYPES.forEach((s) => {
    const btn = document.createElement("button");
    btn.className = `skin-btn${s.id === selectedSkin ? " active" : ""}`;
    btn.style.background = s.color;
    btn.title = `${s.name} – ${s.desc}`;
    btn.setAttribute("aria-label", s.name);
    btn.addEventListener("click", () => {
      selectedSkin = s.id;
      renderSkinTypes();
      updateTimes();
    });
    grid.appendChild(btn);
  });
  const skin = SKIN_TYPES.find((s) => s.id === selectedSkin);
  document.getElementById("skin-label").textContent = skin.name;
  document.getElementById("skin-sublabel").textContent = skin.desc;
}

function renderChart(hours, values) {
  const ctx = document.getElementById("uv-chart").getContext("2d");

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, 140);
  grad.addColorStop(0, "rgba(240,147,43,0.25)");
  grad.addColorStop(1, "rgba(240,147,43,0)");

  // Find current hour for vertical line plugin
  const now = new Date();
  const currentHourLabel = `${String(now.getHours()).padStart(2, "0")}:00`;
  const nowIdx = hours.findIndex((h) => h === currentHourLabel);

  if (uvChart) uvChart.destroy();

  const nowLinePlugin = {
    id: "nowLine",
    afterDraw(chart) {
      if (nowIdx < 0) return;
      const { ctx, chartArea, scales } = chart;
      const x = scales.x.getPixelForValue(nowIdx);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.strokeStyle = "rgba(240,147,43,0.5)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.restore();
    },
  };

  const peakUV = Math.max(...values);
  const peakHour = hours[values.indexOf(peakUV)];
  document.getElementById("chart-peak").textContent =
    peakUV > 0 ? `Max ${peakUV.toFixed(1)} kl ${peakHour}` : "";

  uvChart = new Chart(ctx, {
    type: "line",
    plugins: [nowLinePlugin],
    data: {
      labels: hours,
      datasets: [
        {
          data: values,
          borderColor: "#f0932b",
          backgroundColor: grad,
          fill: true,
          tension: 0.45,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#f0932b",
          borderWidth: 2.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            title: (ctx) => `Kl ${ctx[0].label}`,
            label: (ctx) => `UV ${ctx.raw.toFixed(1)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            maxTicksLimit: 7,
            color: "#bbb",
            font: { size: 10, weight: "500" },
            maxRotation: 0,
          },
        },
        y: {
          min: 0,
          suggestedMax: Math.max(4, Math.ceil(peakUV) + 1),
          grid: { color: "rgba(0,0,0,0.04)" },
          border: { display: false },
          ticks: {
            maxTicksLimit: 4,
            color: "#bbb",
            font: { size: 10, weight: "500" },
            callback: (v) => (v === 0 ? "0" : v),
          },
        },
      },
    },
  });
}

// ─── Data fetching ───────────────────────────────────────────────────────────
async function fetchUV(lat, lon) {
  const url =
    `https://uvindexapi.com/api/v1/forecast` +
    `?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
    `&timezone=Auto&hourly=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API svarade ${res.status}`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || "Okänt API-fel");
  return data;
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "sv" } },
    );
    const d = await res.json();
    const city =
      d.address.city ||
      d.address.town ||
      d.address.village ||
      d.address.municipality ||
      d.address.county ||
      "";
    const country = d.address.country || "";
    document.getElementById("location-text").textContent = city
      ? `${city}, ${country}`
      : "Din plats";
  } catch {
    document.getElementById("location-text").textContent = "Din plats";
  }
}

function showError(msg) {
  const el = document.getElementById("error-banner");
  el.textContent = msg;
  el.classList.add("visible");
}

async function loadData(lat, lon) {
  try {
    const data = await fetchUV(lat, lon);
    currentUV = data.now?.uv_index ?? 0;
    updateUVCircle(currentUV);
    updateTimes();

    // hourly is an array of { date, time, uv_index }
    const today = data.now?.date;
    const todayHourly = (data.hourly ?? []).filter((h) => h.date === today);
    const hours = todayHourly.map((h) => h.time.slice(0, 5)); // "HH:MM"
    const values = todayHourly.map((h) => h.uv_index);
    renderChart(hours, values);
  } catch (err) {
    showError(`Kunde inte hämta UV-data: ${err.message}`);
  } finally {
    const loading = document.getElementById("loading");
    loading.classList.add("hidden");
    setTimeout(() => loading.remove(), 500);
  }
}

// ─── Boot ────────────────────────────────────────────────────────────────────
function init() {
  renderSkinTypes();
  updateUVCircle(0);

  if (!navigator.geolocation) {
    showError("Din webbläsare stöder inte geolokalisering. Visar Göteborg.");
    document.getElementById("location-text").textContent = "Göteborg, Sverige";
    loadData(57.7072326, 11.9670171);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      reverseGeocode(lat, lon);
      loadData(lat, lon);
    },
    () => {
      showError("Platsåtkomst nekades. Visar Göteborg som standardplats.");
      document.getElementById("location-text").textContent =
        "Göteborg, Sverige";
      loadData(57.7072326, 11.9670171);
    },
    { timeout: 8000 },
  );
}

init();
