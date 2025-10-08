const STORAGE_KEY = "aitsMarks_v2";
const marks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  pw: [],
  allen: [],
  aakash: []
};

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
}

function avg(arr) {
  const valid = arr.filter(e => typeof e.marks === "number");
  return valid.length ? (valid.reduce((a,b)=>a+b.marks,0)/valid.length).toFixed(1) : "—";
}

const chart = new Chart(document.getElementById("marksChart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      { label:"PW", data:[], borderColor:"rgba(155,92,249,1)", pointBackgroundColor:"rgba(155,92,249,1)", spanGaps:true },
      { label:"Allen", data:[], borderColor:"rgba(255,107,75,1)", pointBackgroundColor:"rgba(255,107,75,1)", borderDash:[6,4], spanGaps:true },
      { label:"Aakash", data:[], borderColor:"rgba(50,183,255,1)", pointBackgroundColor:"rgba(50,183,255,1)", borderDash:[3,3], spanGaps:true }
    ]
  },
  options: {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{ legend:{labels:{color:"#d1d5db"}} },
    scales:{
      x:{ ticks:{color:"#9ca3af"}, grid:{color:"rgba(255,255,255,0.05)"} },
      y:{ beginAtZero:true, max:720, ticks:{color:"#9ca3af"}, grid:{color:"rgba(255,255,255,0.05)"} }
    }
  }
});

function render() {
  renderList("pw");
  renderList("allen");
  renderList("aakash");
  updateChart();
}

function renderList(coach) {
  const list = document.getElementById(coach + "List");
  list.innerHTML = marks[coach]
    .map((e, i) => `
      <li data-idx="${i}" data-coach="${coach}">
        <div>
          #${i + 1} — ${
            e.marks === "Absent"
              ? `<span class="mark-absent">Absent (${e.type})</span>`
              : `<strong>${e.marks}</strong> <span class="mark-type">(${e.type})</span>`
          }
        </div>
        <div class="mark-actions">
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </div>
      </li>
    `)
    .join("") || `<li style="color:#94a3b8;">No entries</li>`;

  document.getElementById(coach + "Avg").textContent =
    "Average: " + avg(marks[coach]);

  attachListEvents(coach);
}

function attachListEvents(coach) {
  document.querySelectorAll(`#${coach}List li[data-idx]`).forEach(li => {
    const i = +li.dataset.idx;
    li.querySelector(".delete").onclick = () => {
      if (!confirm("Delete this entry?")) return;
      marks[coach].splice(i, 1);
      save();
      render();
    };
    li.querySelector(".edit").onclick = () => editEntry(coach, i);
  });
}

function editEntry(coach, i) {
  const entry = marks[coach][i];
  const newMark = prompt(
    `Edit marks for ${coach.toUpperCase()} (${entry.type})`,
    entry.marks === "Absent" ? "" : entry.marks
  );
  if (newMark === null) return;
  if (newMark.toLowerCase() === "absent") {
    entry.marks = "Absent";
  } else {
    const val = parseInt(newMark);
    if (isNaN(val) || val < 0 || val > 720) return alert("Invalid marks!");
    entry.marks = val;
  }
  save();
  render();
}

function updateChart() {
  const maxLen = Math.max(marks.pw.length, marks.allen.length, marks.aakash.length);
  chart.data.labels = Array.from({ length: maxLen }, (_, i) => i + 1);

  ["pw","allen","aakash"].forEach((c, idx) => {
    const data = marks[c].map(e => e.marks === "Absent" ? null : e.marks);
    chart.data.datasets[idx].data = data;
  });

  chart.update();
}

function addHandler(coach) {
  const input = document.getElementById(coach + "Input");
  const type = document.getElementById(coach + "Type").value;
  const absent = document.getElementById(coach + "Absent").checked;

  if (absent) {
    marks[coach].push({ type, marks: "Absent" });
  } else {
    const val = parseInt(input.value);
    if (isNaN(val) || val < 0 || val > 720)
      return alert("Please enter valid marks (0–720)");
    marks[coach].push({ type, marks: val });
  }

  input.value = "";
  document.getElementById(coach + "Absent").checked = false;
  input.disabled = false;
  save();
  render();
}

["pw","allen","aakash"].forEach(coach => {
  document.getElementById(coach + "Add").onclick = () => addHandler(coach);
  document.getElementById(coach + "Absent").onchange = e => {
    document.getElementById(coach + "Input").disabled = e.target.checked;
  };
  document.getElementById(coach + "Input").onkeypress = e => {
    if (e.key === "Enter") addHandler(coach);
  };
});

document.getElementById("resetBtn").onclick = () => {
  if (!confirm("Delete all data?")) return;
  marks.pw = [];
  marks.allen = [];
  marks.aakash = [];
  save();
  render();
};

render();
