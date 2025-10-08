const STORAGE_KEY = "aitsMarks_v4";
const marks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { pw: [], allen: [], aakash: [] };
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(marks)); }
function avg(arr) {
  const valid = arr.filter(e => typeof e.marks === "number");
  return valid.length ? (valid.reduce((a,b)=>a+b.marks,0)/valid.length).toFixed(1) : "—";
}

// ==== Chart Setup ====
const ctx = document.getElementById("marksChart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: { labels: [], datasets: [
    { label:"PW", data:[], borderColor:"#9b5cf9", pointBackgroundColor:"#9b5cf9", tension:0, spanGaps:true },
    { label:"Allen", data:[], borderColor:"#ff6b4b", pointBackgroundColor:"#ff6b4b", borderDash:[6,4], tension:0, spanGaps:true },
    { label:"Aakash", data:[], borderColor:"#32b7ff", pointBackgroundColor:"#32b7ff", borderDash:[3,3], tension:0, spanGaps:true }
  ]},
  options: {
    responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{labels:{color:"#d1d5db"}} },
    scales:{
      x:{ ticks:{color:"#9ca3af"}, grid:{color:"rgba(255,255,255,0.05)"} },
      y:{ beginAtZero:true, max:720, ticks:{color:"#9ca3af"}, grid:{color:"rgba(255,255,255,0.05)"} }
    }
  }
});

// ==== Render ====
function render(){
  ["pw","allen","aakash"].forEach(coach=>{
    const list=document.getElementById(coach+"List");
    list.innerHTML = marks[coach].map((e,i)=>`
      <li data-idx="${i}" data-coach="${coach}" draggable="true">
        <div>
          #${i+1} — ${
            e.marks==="Absent"
            ? `<span class="mark-absent">Absent (${e.type})</span>`
            : coach==="aakash" && e.type==="PT"
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
    document.getElementById(coach+"Avg").textContent = "Average: " + avg(marks[coach]);
  });
  attachEvents(); updateChart();
}

// ==== Attach Events ====
function attachEvents(){
  document.querySelectorAll(".marks-list li[data-idx]").forEach(li=>{
    const i=+li.dataset.idx, c=li.dataset.coach;
    li.querySelector(".delete").onclick=()=>{ if(!confirm("Delete this entry?"))return; marks[c].splice(i,1); save(); render(); };
    li.querySelector(".edit").onclick=()=>editEntry(c,i);

    // Drag logic
    li.addEventListener("dragstart", dragStart);
    li.addEventListener("dragover", dragOver);
    li.addEventListener("drop", drop);
    li.addEventListener("dragend", dragEnd);
  });
}

// ==== Drag & Drop Handlers ====
let draggedItem = null;
function dragStart(e){
  draggedItem = this;
  this.style.opacity = "0.5";
}
function dragOver(e){ e.preventDefault(); this.style.border = "1px dashed #888"; }
function dragEnd(){ this.style.opacity = "1"; this.style.border = "none"; }
function drop(e){
  e.preventDefault();
  this.style.border = "none";
  const list = this.parentNode;
  if (draggedItem === this) return;
  const coach = this.dataset.coach;
  const fromIndex = +draggedItem.dataset.idx;
  const toIndex = +this.dataset.idx;
  const arr = marks[coach];
  const item = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, item);
  save(); render();
}

// ==== Edit Entry ====
function editEntry(coach,i){
  const e=marks[coach][i];
  const newVal=prompt(`Edit marks for ${coach.toUpperCase()} (${e.type})`, e.marks==="Absent"?"":e.marks);
  if(newVal===null)return;
  if(newVal.toLowerCase()==="absent"){ e.marks="Absent"; e.display="Absent"; }
  else{
    const val=parseInt(newVal);
    if(isNaN(val)||val<0||val>720)return alert("Invalid marks!");
    e.marks=val; e.display=coach==="aakash"&&e.type==="PT"?`${val}/240`:val;
    if(coach==="aakash"&&e.type==="PT") e.adjusted=(val/240)*720; else e.adjusted=val;
  }
  save(); render();
}

// ==== Chart Update ====
function updateChart(){
  const maxLen=Math.max(marks.pw.length,marks.allen.length,marks.aakash.length);
  chart.data.labels=Array.from({length:maxLen},(_,i)=>i+1);
  ["pw","allen","aakash"].forEach((c,idx)=>{
    const data=marks[c].map(e=>e.marks==="Absent"?null:(c==="aakash"&&e.type==="PT")?e.adjusted:e.marks);
    chart.data.datasets[idx].data=data;
    if(c==="aakash"){
      chart.data.datasets[idx].pointBackgroundColor=marks[c].map(e=>
        e.marks==="Absent"? "#808b99": e.type==="PT"? "#7fd8ff":"#32b7ff");
    }
  });
  chart.update();
}

// ==== Add Handler ====
function addHandler(coach){
  const input=document.getElementById(coach+"Input"),
        type=document.getElementById(coach+"Type").value,
        absent=document.getElementById(coach+"Absent").checked;
  if(absent){
    marks[coach].push({type,marks:"Absent",display:"Absent"});
  }else{
    const val=parseInt(input.value);
    if(isNaN(val)||val<0)return alert("Enter valid marks!");
    let adjusted=val, display=val;
    if(coach==="aakash"&&type==="PT"){
      if(val>240)return alert("PT is out of 240 marks!");
      adjusted=(val/240)*720; display=`${val}/240`;
    }
    marks[coach].push({type,marks:val,adjusted,display});
  }
  input.value=""; document.getElementById(coach+"Absent").checked=false; input.disabled=false;
  save(); render();
}

// ==== Events ====
["pw","allen","aakash"].forEach(c=>{
  document.getElementById(c+"Add").onclick=()=>addHandler(c);
  document.getElementById(c+"Absent").onchange=e=>{
    document.getElementById(c+"Input").disabled=e.target.checked;
  };
  document.getElementById(c+"Input").onkeypress=e=>{
    if(e.key==="Enter")addHandler(c);
  };
});
document.getElementById("resetBtn").onclick=()=>{
  if(!confirm("Delete all data?"))return;
  marks.pw=[]; marks.allen=[]; marks.aakash=[];
  save(); render();
};

render();
