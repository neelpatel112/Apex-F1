'use strict';

// ══════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════
const SECTION_LABELS = {
  schedule:  'CALENDAR',
  standings: 'CHAMPIONSHIP',
  results:   'RACE RESULTS',
  telemetry: 'TELEMETRY',
};

document.querySelectorAll('.snav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.snav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.section).classList.add('active');
    document.getElementById('breadcrumb').textContent = SECTION_LABELS[btn.dataset.section];
  });
});

// ══════════════════════════════════════════════
//  TAB TOGGLE
// ══════════════════════════════════════════════
let activeTab = 'drivers';

function switchTab(btn, tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
}

// ══════════════════════════════════════════════
//  LOADER
// ══════════════════════════════════════════════
const $loader = document.getElementById('loader');
const showLoader = () => $loader.classList.remove('hidden');
const hideLoader = () => $loader.classList.add('hidden');

// ══════════════════════════════════════════════
//  API FETCH
// ══════════════════════════════════════════════
async function apiFetch(url) {
  showLoader();
  try {
    const res  = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } finally {
    hideLoader();
  }
}

// ══════════════════════════════════════════════
//  TEAM COLORS
// ══════════════════════════════════════════════
const TEAM_COLORS = {
  'red bull':     '#3671C6',
  'ferrari':      '#E8002D',
  'mercedes':     '#27F4D2',
  'mclaren':      '#FF8000',
  'aston martin': '#229971',
  'alpine':       '#FF87BC',
  'williams':     '#64C4FF',
  'rb':           '#6692FF',
  'alphatauri':   '#6692FF',
  'haas':         '#B6BABD',
  'sauber':       '#52E252',
  'alfa romeo':   '#C92D4B',
};

function getTeamColor(name = '') {
  const n = name.toLowerCase();
  for (const [key, color] of Object.entries(TEAM_COLORS)) {
    if (n.includes(key)) return color;
  }
  return '#555566';
}

// ══════════════════════════════════════════════
//  ERROR RENDER
// ══════════════════════════════════════════════
function renderError(id, msg) {
  document.getElementById(id).innerHTML = `
    <div class="error-block">
      <div class="error-icon">!</div>
      <div class="error-msg">${msg}<br><br>Note: First-time data loads can take 20–40s while FastF1 downloads session data.</div>
    </div>`;
}

// ══════════════════════════════════════════════
//  SCHEDULE
// ══════════════════════════════════════════════
async function loadSchedule() {
  const year = document.getElementById('schedule-year').value;
  const out  = document.getElementById('schedule-output');
  out.innerHTML = '';

  try {
    const data = await apiFetch(`/api/schedule/${year}`);
    const grid = document.createElement('div');
    grid.className = 'race-grid';

    data.races.forEach(r => {
      const d = document.createElement('div');
      d.className = 'race-card';
      d.innerHTML = `
        <div class="race-format">${r.format.toUpperCase()}</div>
        <div class="race-round">ROUND ${String(r.round).padStart(2,'0')}</div>
        <div class="race-name">${r.name}</div>
        <div class="race-location">${r.location}, ${r.country}</div>
        <div class="race-date">${r.date}</div>`;
      grid.appendChild(d);
    });

    out.appendChild(grid);
  } catch (e) {
    renderError('schedule-output', e.message);
  }
}

// ══════════════════════════════════════════════
//  STANDINGS
// ══════════════════════════════════════════════
async function loadStandings() {
  const year = document.getElementById('standings-year').value;
  const out  = document.getElementById('standings-output');
  out.innerHTML = '';

  const url = activeTab === 'drivers'
    ? `/api/standings/drivers/${year}`
    : `/api/standings/constructors/${year}`;

  try {
    const data = await apiFetch(url);
    const rows = data.standings;
    const maxPts = rows[0]?.points || 1;

    const label = document.createElement('div');
    label.className = 'event-label';
    label.textContent = `${year} ${activeTab === 'drivers' ? 'Drivers' : 'Constructors'} Championship`;
    out.appendChild(label);

    const wrap  = document.createElement('div');
    wrap.className = 'data-table-wrap';

    const isDrivers = activeTab === 'drivers';
    const headers = isDrivers
      ? ['Pos', 'Driver', 'Constructor', 'Points', 'Wins']
      : ['Pos', 'Constructor', 'Points', 'Wins'];

    let tbody = '';
    rows.forEach((r, i) => {
      const pos    = r.position;
      const pClass = pos === 1 ? 'p1' : pos === 2 ? 'p2' : pos === 3 ? 'p3' : '';
      const bar    = Math.max(4, Math.round((r.points / maxPts) * 120));
      const color  = getTeamColor(r.team || '');

      if (isDrivers) {
        tbody += `
          <tr class="${pClass}">
            <td><span class="pos-num ${pClass}">${pos}</span></td>
            <td><span class="driver-name">${r.driver}</span></td>
            <td><div class="team-pill"><div class="team-bar" style="background:${color}"></div>${r.team}</div></td>
            <td>
              <div class="pts-bar-wrap">
                <span class="pts-value">${r.points}</span>
                <div class="pts-bar" style="width:${bar}px;background:${color}"></div>
              </div>
            </td>
            <td>${r.wins}</td>
          </tr>`;
      } else {
        tbody += `
          <tr class="${pClass}">
            <td><span class="pos-num ${pClass}">${pos}</span></td>
            <td><div class="team-pill"><div class="team-bar" style="background:${color}"></div>${r.team}</div></td>
            <td>
              <div class="pts-bar-wrap">
                <span class="pts-value">${r.points}</span>
                <div class="pts-bar" style="width:${bar}px;background:${color}"></div>
              </div>
            </td>
            <td>${r.wins}</td>
          </tr>`;
      }
    });

    wrap.innerHTML = `
      <table class="f1-table">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>`;
    out.appendChild(wrap);

  } catch (e) {
    renderError('standings-output', e.message);
  }
}

// ══════════════════════════════════════════════
//  RACE RESULTS
// ══════════════════════════════════════════════
async function loadResults() {
  const year  = document.getElementById('results-year').value;
  const round = document.getElementById('results-round').value;
  const out   = document.getElementById('results-output');
  out.innerHTML = '';

  try {
    const data = await apiFetch(`/api/results/${year}/${round}`);

    const label = document.createElement('div');
    label.className = 'event-label';
    label.textContent = `${data.year} · ${data.event}`;
    out.appendChild(label);

    const wrap = document.createElement('div');
    wrap.className = 'data-table-wrap';

    const headers = ['Pos', 'Driver', 'Team', 'Grid', 'Points', 'Status'];
    let tbody = '';

    data.results.forEach(r => {
      const pos    = parseInt(r.Position) || 99;
      const pClass = pos === 1 ? 'p1' : pos === 2 ? 'p2' : pos === 3 ? 'p3' : '';
      const color  = getTeamColor(r.TeamName || '');
      const isRet  = r.Status && r.Status !== 'Finished' && !r.Status.startsWith('+');

      tbody += `
        <tr class="${pClass}">
          <td><span class="pos-num ${pClass}">${r.Position || '–'}</span></td>
          <td>
            <span class="driver-name">${r.FullName || '–'}</span>
            <span class="driver-code">${r.Abbreviation || ''}</span>
          </td>
          <td><div class="team-pill"><div class="team-bar" style="background:${color}"></div>${r.TeamName || '–'}</div></td>
          <td>${r.GridPosition || '–'}</td>
          <td><span class="pts-value">${r.Points}</span></td>
          <td><span class="${isRet ? 'status-ret' : 'status-fin'}">${r.Status || '–'}</span></td>
        </tr>`;
    });

    wrap.innerHTML = `
      <table class="f1-table">
        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>`;
    out.appendChild(wrap);

  } catch (e) {
    renderError('results-output', e.message);
  }
}

// ══════════════════════════════════════════════
//  TELEMETRY
// ══════════════════════════════════════════════
let telChart = null;

async function loadTelemetry() {
  const year   = document.getElementById('tel-year').value;
  const round  = document.getElementById('tel-round').value;
  const driver = document.getElementById('tel-driver').value.toUpperCase().trim();
  const out    = document.getElementById('telemetry-output');
  const stats  = document.getElementById('tel-stats');
  const wrap   = document.getElementById('chart-wrap');

  out.innerHTML = '';
  stats.className = 'tel-stats hidden';
  wrap.className  = 'chart-wrap hidden';

  try {
    const data = await apiFetch(`/api/telemetry/${year}/${round}/${driver}`);
    const tel  = data.telemetry;

    // Stats bar
    const maxSpeed   = Math.max(...tel.map(t => t.Speed)).toFixed(0);
    const avgThrottle = (tel.reduce((a, b) => a + b.Throttle, 0) / tel.length).toFixed(0);
    const brakeZones = tel.filter(t => t.Brake).length;
    const topGear    = Math.max(...tel.map(t => t.nGear));

    stats.innerHTML = [
      ['LAP TIME',      data.lapTime,          ''],
      ['TOP SPEED',     maxSpeed,               'km/h'],
      ['AVG THROTTLE',  `${avgThrottle}`,       '%'],
      ['TOP GEAR',      topGear,                ''],
      ['BRAKE POINTS',  brakeZones,             'pts'],
    ].map(([label, val, unit]) => `
      <div class="stat-card">
        <div class="stat-label">${label}</div>
        <div class="stat-value">${val}<span class="stat-unit">${unit}</span></div>
      </div>`).join('');

    stats.className = 'tel-stats';

    // Label
    const label = document.createElement('div');
    label.className = 'event-label';
    label.textContent = `${driver} · ${data.event} ${data.year} · Qualifying Fastest Lap`;
    out.appendChild(label);

    // Chart
    wrap.className = 'chart-wrap';
    if (telChart) { telChart.destroy(); telChart = null; }

    const canvas = document.getElementById('tel-chart');
    const dist   = tel.map(t => Math.round(t.Distance));

    telChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: dist,
        datasets: [
          {
            label: 'Speed (km/h)',
            data: tel.map(t => t.Speed),
            borderColor: '#FF1801',
            backgroundColor: 'rgba(255,24,1,0.07)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            yAxisID: 'ySpeed',
            fill: true,
            order: 3,
          },
          {
            label: 'Throttle (%)',
            data: tel.map(t => t.Throttle),
            borderColor: '#D4AF37',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.2,
            yAxisID: 'yPct',
            order: 2,
          },
          {
            label: 'Brake',
            data: tel.map(t => t.Brake * 100),
            borderColor: '#4488ff',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.1,
            yAxisID: 'yPct',
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            labels: {
              color: '#9090a8',
              font: { family: 'Share Tech Mono', size: 11 },
              boxWidth: 12,
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: '#13131a',
            borderColor: '#2a2a3c',
            borderWidth: 1,
            titleColor: '#f0f0f5',
            bodyColor: '#9090a8',
            titleFont: { family: 'Barlow Condensed', size: 12, weight: 'bold' },
            bodyFont:  { family: 'Share Tech Mono', size: 11 },
            padding: 12,
            callbacks: {
              title: items => `Distance: ${items[0].label}m`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#55556a',
              maxTicksLimit: 10,
              font: { family: 'Share Tech Mono', size: 10 },
            },
            grid: { color: 'rgba(30,30,42,0.8)' },
            title: {
              display: true,
              text: 'DISTANCE (m)',
              color: '#55556a',
              font: { family: 'Share Tech Mono', size: 10 },
            },
          },
          ySpeed: {
            position: 'left',
            ticks: { color: '#FF1801', font: { family: 'Share Tech Mono', size: 10 } },
            grid: { color: 'rgba(30,30,42,0.8)' },
            title: {
              display: true,
              text: 'SPEED (km/h)',
              color: '#FF1801',
              font: { family: 'Share Tech Mono', size: 10 },
            },
          },
          yPct: {
            position: 'right',
            min: 0, max: 105,
            ticks: { color: '#D4AF37', font: { family: 'Share Tech Mono', size: 10 } },
            grid: { drawOnChartArea: false },
            title: {
              display: true,
              text: 'THROTTLE / BRAKE (%)',
              color: '#D4AF37',
              font: { family: 'Share Tech Mono', size: 10 },
            },
          },
        },
      },
    });

  } catch (e) {
    renderError('telemetry-output', e.message);
  }
}
 
