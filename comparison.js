// comparison.js
document.addEventListener("DOMContentLoaded", () => {
  // ==== Load Marks from LocalStorage ====
  const STORAGE_KEY = "aitsMarks_v4";
  const marks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { pw: [], allen: [], aakash: [] };

  if (!window.neetToppers) {
    console.error("neetToppers.js not loaded. Make sure it's included before comparison.js");
    return;
  }

  // ==== Average calculator ====
  const avg = arr => {
    const valid = arr.filter(e => typeof e.marks === "number");
    return valid.length ? valid.reduce((a, b) => a + b.marks, 0) / valid.length : 0;
  };

  // ==== Calculate Averages for PW, Allen, Aakash ====
  const averages = [
    { name: "PW", avg: avg(marks.pw) },
    { name: "Allen", avg: avg(marks.allen) },
    { name: "Aakash", avg: avg(marks.aakash) }
  ];

  // ==== DOM References ====
  const yearSelect = document.getElementById("yearSelect");
  const tableBody = document.getElementById("comparisonBody");
  const chartCanvas = document.getElementById("comparisonChart");

  // ==== Populate Year Dropdown ====
  window.neetToppers.forEach(({ year }) => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    yearSelect.appendChild(opt);
  });

  // ==== Function to Render Table + Chart ====
  const renderComparison = () => {
    const selectedYear = parseInt(yearSelect.value);
    const topper = window.neetToppers.find(y => y.year === selectedYear)?.highest || 720;

    // ---- Table Render ----
    tableBody.innerHTML = "";
    averages.forEach(({ name, avg }) => {
      const percent = topper ? ((avg / topper) * 100).toFixed(2) : "0.00";
      tableBody.insertAdjacentHTML(
        "beforeend",
        `<tr>
          <td>${name}</td>
          <td>${avg.toFixed(1)}</td>
          <td>${topper}</td>
          <td>${percent}%</td>
        </tr>`
      );
    });

    // ---- Chart Render ----
    if (window.compChart) window.compChart.destroy();
    window.compChart = new Chart(chartCanvas, {
      type: "bar",
      data: {
        labels: averages.map(a => a.name),
        datasets: [
          {
            label: "Average Score",
            data: averages.map(a => a.avg),
          },
          {
            label: `NEET Topper (${selectedYear})`,
            data: averages.map(() => topper),
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: {
            display: true,
            text: "Average Score vs NEET Topper"
          }
        },
        scales: {
          y: { beginAtZero: true, max: 720 }
        }
      }
    });
  };

  // ==== Initial Render ====
  yearSelect.value = window.neetToppers.at(-1)?.year || 2025;
  renderComparison();

  // ==== Handle Year Change ====
  yearSelect.addEventListener("change", renderComparison);

  // ==== Auto Update When Marks Change ====
  window.addEventListener("storage", e => {
    if (e.key === STORAGE_KEY) {
      const newMarks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || marks;
      ["pw", "allen", "aakash"].forEach((c, i) => {
        averages[i].avg = avg(newMarks[c]);
      });
      renderComparison();
    }
  });
});
