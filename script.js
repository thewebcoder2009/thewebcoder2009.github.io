// ======== Data & Storage ========
    const STORAGE_KEY = "aitsMarks_v1";
    const defaultData = { pw: [], allen: [], aakash: [] };
    const marks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultData;

    // ======== DOM refs ========
    const pwInput = document.getElementById('pwInput');
    const allenInput = document.getElementById('allenInput');
    const aakashInput = document.getElementById('aakashInput');

    const pwAdd = document.getElementById('pwAdd');
    const allenAdd = document.getElementById('allenAdd');
    const aakashAdd = document.getElementById('aakashAdd');

    const pwList = document.getElementById('pwList');
    const allenList = document.getElementById('allenList');
    const aakashList = document.getElementById('aakashList');

    const pwAvg = document.getElementById('pwAvg');
    const allenAvg = document.getElementById('allenAvg');
    const aakashAvg = document.getElementById('aakashAvg');

    const resetBtn = document.getElementById('resetBtn');

    // ======== Chart.js Setup ========
    const ctx = document.getElementById('marksChart').getContext('2d');
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'PW',
            data: [],
            borderColor: 'rgba(155,92,249,0.95)',
            backgroundColor: 'rgba(155,92,249,0.08)',
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(155,92,249,1)',
            borderDash: [],
            fill: false
          },
          {
            label: 'Allen',
            data: [],
            borderColor: 'rgba(255,107,75,0.95)',
            backgroundColor: 'rgba(255,107,75,0.06)',
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(255,107,75,1)',
            borderDash: [6,4],
            fill: false
          },
          {
            label: 'Aakash',
            data: [],
            borderColor: 'rgba(50,183,255,0.95)',
            backgroundColor: 'rgba(50,183,255,0.06)',
            tension: 0.25,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: 'rgba(50,183,255,1)',
            borderDash: [2,2],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#bfe0ff', boxWidth:12, padding:16 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Attempt Number', color: '#94a3b8' },
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.02)' }
          },
          y: {
            beginAtZero: true,
            max: 720,
            title: { display: true, text: 'Marks', color: '#94a3b8' },
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.02)' }
          }
        }
      }
    });

    // ======== Helpers ========
    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(marks));
    }
    function avg(arr){
      if(!arr.length) return '—';
      return (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1);
    }

    // ======== Render Lists & Chart ========
    function render(){
      // PW
      pwList.innerHTML = renderListHtml('pw', marks.pw);
      allenList.innerHTML = renderListHtml('allen', marks.allen);
      aakashList.innerHTML = renderListHtml('aakash', marks.aakash);

      pwAvg.textContent = 'Average: ' + avg(marks.pw);
      allenAvg.textContent = 'Average: ' + avg(marks.allen);
      aakashAvg.textContent = 'Average: ' + avg(marks.aakash);

      // Chart labels to longest length
      const maxLen = Math.max(marks.pw.length, marks.allen.length, marks.aakash.length);
      chart.data.labels = Array.from({length: maxLen}, (_,i)=> i+1);
      chart.data.datasets[0].data = marks.pw.slice(); // ensure arrays assigned
      chart.data.datasets[1].data = marks.allen.slice();
      chart.data.datasets[2].data = marks.aakash.slice();
      chart.update();
      setTimeout(attachListListeners, 0); // allow DOM to update before attaching
    }

    function renderListHtml(coach, arr){
      if(arr.length === 0) return '<li style="color:#94a3b8;padding:10px;border-radius:8px;background:transparent">No entries</li>';
      // Show newest at top (#2 above #1 as in screenshot) — but keep consistent attempt numbers ascending
      // We'll render in reverse so newest appears first
      return arr.slice().reverse().map((m, idxRev) => {
        const i = arr.length - idxRev - 1; // original index
        return `
          <li data-index="${i}" data-coach="${coach}">
            <div class="marks-left">
              <div class="mark-num">#${i+1}</div>
              <div class="mark-value">${m}</div>
            </div>
            <div class="mark-actions">
              <button class="icon-btn icon-edit" title="Edit">✏️</button>
              <button class="icon-btn icon-delete" title="Delete">🗑️</button>
            </div>
          </li>
        `;
      }).join('');
    }

    // ======== Attach listeners to action buttons in lists (edit/delete) ========
    function attachListListeners(){
      document.querySelectorAll('.marks-list li').forEach(li=>{
        const idx = Number(li.getAttribute('data-index'));
        const coach = li.getAttribute('data-coach');

        const editBtn = li.querySelector('.icon-edit');
        const deleteBtn = li.querySelector('.icon-delete');

        // edit inline: replace right side with input + save/cancel
        editBtn.onclick = () => enableInlineEdit(li, coach, idx);
        deleteBtn.onclick = () => {
          if(!confirm('Delete this entry?')) return;
          marks[coach].splice(idx,1);
          save();
          render();
        }
      });
    }

    function enableInlineEdit(li, coach, idx){
      // Prevent double edit
      if(li.querySelector('.edit-input')) return;

      const current = marks[coach][idx];
      // build inline editor
      const editor = document.createElement('div');
      editor.style.display = 'flex';
      editor.style.alignItems = 'center';
      editor.style.gap = '8px';

      const input = document.createElement('input');
      input.type = 'number';
      input.min = 0; input.max = 720;
      input.value = current;
      input.className = 'edit-input';
      input.onkeypress = (e) => { if(e.key === 'Enter') saveInline(); }

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className = 'save-btn';
      saveBtn.onclick = saveInline;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'cancel-btn';
      cancelBtn.onclick = cancelInline;

      editor.appendChild(input);
      editor.appendChild(saveBtn);
      editor.appendChild(cancelBtn);

      // hide original actions and value, then append editor
      const left = li.querySelector('.marks-left');
      const actions = li.querySelector('.mark-actions');
      left.style.display = 'none';
      actions.style.display = 'none';
      li.appendChild(editor);
      input.focus();
      input.select();

      function saveInline(){
        const v = parseInt(input.value);
        if(Number.isNaN(v) || v < 0 || v > 720){ alert('Enter valid marks (0-720)'); input.focus(); return; }
        marks[coach][idx] = v;
        save();
        render();
      }
      function cancelInline(){
        render(); // simply rerender to restore original
      }
    }

    // ======== Add handlers for Add buttons & Enter key ========
    function addHandler(coach, inputEl){
      const val = parseInt(inputEl.value);
      if(Number.isNaN(val) || val < 0 || val > 720){
        alert('Please enter valid marks (0-720)');
        return;
      }
      marks[coach].push(val);
      inputEl.value = '';
      save();
      render();
    }

    pwAdd.addEventListener('click', ()=> addHandler('pw', pwInput));
    allenAdd.addEventListener('click', ()=> addHandler('allen', allenInput));
    aakashAdd.addEventListener('click', ()=> addHandler('aakash', aakashInput));

    // Enter key functionality (on inputs)
    [pwInput, allenInput, aakashInput].forEach(inp=>{
      inp.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter'){
          // find which coach
          if(inp === pwInput) addHandler('pw', pwInput);
          if(inp === allenInput) addHandler('allen', allenInput);
          if(inp === aakashInput) addHandler('aakash', aakashInput);
        }
      });
    });

    // Reset all
    resetBtn.onclick = ()=>{
      if(!confirm('Are you sure you want to delete ALL data?')) return;
      marks.pw = []; marks.allen = []; marks.aakash = [];
      save();
      render();
    };

    // init render
    render();