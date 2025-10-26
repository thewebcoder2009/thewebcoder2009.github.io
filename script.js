// ====== Storage & helpers ======
const STORAGE_KEY = "aitsMarks_v4";
const marks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { pw: [], allen: [], aakash: [] };
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(marks)); }
function avg(arr) {
	const valid = arr.filter(e => typeof e.marks === "number");
	if (!valid.length) return "—";
	const total = valid.reduce((a, b) => {
		const val = typeof b.adjusted === "number" ? b.adjusted : b.marks;
		return a + val;
	}, 0);
	return (total / valid.length).toFixed(1);
}

// ====== Chart ======
const ctx = document.getElementById("marksChart").getContext("2d");
const chart = new Chart(ctx, {
	type: "line",
	data: {
		labels: [],
		datasets: [
			{ label: "PW", data: [], borderColor: "#9b5cf9", pointBackgroundColor: "#9b5cf9", tension: 0, spanGaps: true },
			{ label: "Allen", data: [], borderColor: "#ff6b4b", pointBackgroundColor: "#ff6b4b", borderDash: [6, 4], tension: 0, spanGaps: true },
			{ label: "Aakash", data: [], borderColor: "#32b7ff", pointBackgroundColor: "#32b7ff", borderDash: [3, 3], tension: 0, spanGaps: true }
		]
	},
	options: {
		responsive: true, maintainAspectRatio: false,
		plugins: { legend: { labels: { color: "#d1d5db" } } },
		scales: {
			x: { ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.05)" } },
			y: { beginAtZero: true, max: 720, ticks: { color: "#9ca3af" }, grid: { color: "rgba(255,255,255,0.05)" } }
		}
	}
});

// ====== Render ======
function render() {
	["pw", "allen", "aakash"].forEach(coach => {
		const list = document.getElementById(coach + "List");
		list.innerHTML = marks[coach].map((e, i) => `
      <li data-idx="${i}" data-coach="${coach}" draggable="true">
        <div>
          #${i + 1} — ${e.marks === "Absent"
				? `<span class="mark-absent">Absent (${e.type})</span>`
				: (coach === "aakash" && e.type === "PT")
					? `<strong>${e.display}</strong> <span class="mark-type">(${e.type})</span>`
					: `<strong>${e.display}</strong> <span class="mark-type">(${e.type})</span>`
			}
        </div>
        <div class="mark-actions">
          <button class="edit">✏️</button>
          <button class="delete">🗑️</button>
        </div>
      </li>
    `).join("") || `<li style="color:#94a3b8;">No entries</li>`;
		document.getElementById(coach + "Avg").textContent = "Average (/720): " + avg(marks[coach]);
	});
	attachEvents();
	updateChart();
}

// ====== Events on list items ======
function attachEvents() {
	document.querySelectorAll(".marks-list li[data-idx]").forEach(li => {
		const i = +li.dataset.idx, c = li.dataset.coach;

		// delete
		li.querySelector(".delete").onclick = () => {
			if (!confirm("Delete this entry?")) return;
			marks[c].splice(i, 1); save(); render();
		};
		// edit
		li.querySelector(".edit").onclick = () => editEntry(c, i);

		// drag & drop
		li.addEventListener("dragstart", dragStart);
		li.addEventListener("dragover", dragOver);
		li.addEventListener("drop", drop);
		li.addEventListener("dragend", dragEnd);

		// OPEN MODAL on row click (ignore clicks on edit/delete)
		li.addEventListener("click", (e) => {
			if (e.target.closest(".edit") || e.target.closest(".delete")) return;
			showDetails(c, i);
		});
	});
}

// ====== Drag & Drop Handlers ======
let draggedItem = null;
function dragStart(e) { draggedItem = this; this.style.opacity = "0.5"; }
function dragOver(e) { e.preventDefault(); this.style.border = "1px dashed #888"; }
function dragEnd() { this.style.opacity = "1"; this.style.border = "none"; }
function drop(e) {
	e.preventDefault();
	this.style.border = "none";
	const fromIndex = +draggedItem.dataset.idx;
	const toIndex = +this.dataset.idx;
	const coach = this.dataset.coach;
	if (fromIndex === toIndex) return;
	const arr = marks[coach];
	const item = arr.splice(fromIndex, 1)[0];
	arr.splice(toIndex, 0, item);
	save(); render();
}

// ====== Edit Entry ======
function editEntry(coach, i) {
	const e = marks[coach][i];
	const newVal = prompt(`Edit marks for ${coach.toUpperCase()} (${e.type})`, e.marks === "Absent" ? "" : e.marks);
	if (newVal === null) return;
	if (newVal.toLowerCase() === "absent") { e.marks = "Absent"; e.display = "Absent"; delete e.adjusted; }
	else {
		const val = parseInt(newVal);
		if (isNaN(val) || val < 0 || val > 720) return alert("Invalid marks!");
		e.marks = val;
		if (coach === "aakash" && e.type === "PT") {
			if (val > 240) return alert("PT is out of 240 marks!");
			e.adjusted = (val / 240) * 720; e.display = `${val}/240`;
		} else {
			e.adjusted = val; e.display = val;
		}
	}
	save(); render();
}

// ====== Chart Filter ======
const chartFilter = document.getElementById("chartFilter");
chartFilter.addEventListener("change", () => {
	const value = chartFilter.value;
	if (value === "all") chart.data.datasets.forEach(ds => ds.hidden = false);
	else chart.data.datasets.forEach(ds => ds.hidden = !ds.label.toLowerCase().includes(value));
	chart.update();
});

// ====== Chart Update ======
function updateChart() {
	const maxLen = Math.max(marks.pw.length, marks.allen.length, marks.aakash.length);
	chart.data.labels = Array.from({ length: maxLen }, (_, i) => i + 1);
	["pw", "allen", "aakash"].forEach((c, idx) => {
		const data = marks[c].map(e =>
			e.marks === "Absent" ? null :
				(c === "aakash" && e.type === "PT") ? e.adjusted : e.marks
		);
		chart.data.datasets[idx].data = data;
		if (c === "aakash") {
			chart.data.datasets[idx].pointBackgroundColor = marks[c].map(e =>
				e.marks === "Absent" ? "#808b99" : e.type === "PT" ? "#7fd8ff" : "#32b7ff"
			);
		}
	});
	chart.update();
}

// ====== Add Handlers ======
function addHandler(coach) {
	const input = document.getElementById(coach + "Input"),
		type = document.getElementById(coach + "Type").value,
		absent = document.getElementById(coach + "Absent").checked;
	if (absent) {
		marks[coach].push({ type, marks: "Absent", display: "Absent" });
	} else {
		const val = parseInt(input.value);
		if (isNaN(val) || val < 0) return alert("Enter valid marks!");
		let adjusted = val, display = val;
		if (coach === "aakash" && type === "PT") {
			if (val > 240) return alert("PT is out of 240 marks!");
			adjusted = (val / 240) * 720; display = `${val}/240`;
		}
		marks[coach].push({ type, marks: val, adjusted, display });
	}
	input.value = ""; document.getElementById(coach + "Absent").checked = false; input.disabled = false;
	save(); render();
}

["pw", "allen", "aakash"].forEach(c => {
	document.getElementById(c + "Add").onclick = () => addHandler(c);
	document.getElementById(c + "Absent").onchange = e => {
		document.getElementById(c + "Input").disabled = e.target.checked;
	};
	document.getElementById(c + "Input").onkeypress = e => {
		if (e.key === "Enter") addHandler(c);
	};
});

document.getElementById("resetBtn").onclick = () => {
	if (!confirm("Delete all data?")) return;
	marks.pw = []; marks.allen = []; marks.aakash = [];
	save(); render();
};

// Initial render
render();

// ====== DETAILS MODAL (works with current data model) ======

// previous of same coaching & type (by index)
function findPrev(coach, i) {
	const type = marks[coach][i]?.type;
	if (!type) return null;
	const prev = marks[coach]
		.map((t, idx) => ({ ...t, idx }))
		.filter(t => t.type === type && t.idx < i);
	if (!prev.length) return null;
	return prev[prev.length - 1];
}

function compare(curr, prev) {
	// If no previous OR either test is Absent → neutral
	if (!prev || curr.marks === "Absent" || prev.marks === "Absent") {
		return { txt: "■ —", cls: "zero" };
	}

	const cv = typeof curr.adjusted === "number" ? curr.adjusted : curr.marks;
	const pv = typeof prev.adjusted === "number" ? prev.adjusted : prev.marks;

	// If baseline is 0 (shouldn’t happen, but guard anyway) → neutral %
	const diff = cv - pv;
	const pct = pv === 0 ? "—" : ((diff / pv) * 100).toFixed(1) + "%";

	let cls = "zero", icon = "■";
	if (diff > 0) { cls = "pos"; icon = "▲"; }
	else if (diff < 0) { cls = "neg"; icon = "▼"; }

	return { txt: `${icon} ${diff.toFixed(1)} (${pct})`, cls };
}
	

function formatScoreWithAdjusted(entry) {
	if (!entry) return "—";
	if (entry.marks === "Absent") return "Absent";
	const raw = entry.display ?? entry.marks;               // "211/240" or 596
	if (entry.type === "PT" && typeof entry.adjusted === "number") {
		return `${raw} → ${entry.adjusted.toFixed(1)}/720`;   // show both for PT
	}
	return String(raw);                                     // non-PT
}


function showDetails(coach, i) {
	const t = marks[coach][i];
	const prev = findPrev(coach, i);
	const cmp = compare(t, prev);

	const currentScoreTxt = formatScoreWithAdjusted(t);
	const prevScoreTxt = prev ? formatScoreWithAdjusted(prev) : "—";

	const body = document.getElementById("details-body");
	body.innerHTML = `
  <ul class="detail-list">
    <li><span>Coaching</span><b>${coach.toUpperCase()}</b></li>
    <li><span>Type</span><b>${t.type}</b></li>
    <li><span>Test #</span><b>#${i + 1}</b></li>
    <li><span>Score</span><b><strong>${currentScoreTxt}</strong></b></li>
    <li><span>Previous Score</span><b>${prevScoreTxt}</b></li>
    <li><span>Change</span><b class="${cmp.cls}">${cmp.txt}</b></li>
  </ul>
`;


	document.getElementById("details-backdrop").hidden = false;
	document.getElementById("details-modal").hidden = false;
	document.body.classList.add("modal-open");
}


function closeDetails() {
	document.getElementById("details-backdrop").hidden = true;
	document.getElementById("details-modal").hidden = true;
	document.body.classList.remove("modal-open");
}

document.getElementById("modal-close").addEventListener("click", closeDetails);
document.getElementById("details-backdrop").addEventListener("click", closeDetails);
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && !document.getElementById("details-modal").hidden) closeDetails();
});
