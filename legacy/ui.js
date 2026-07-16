/**
 * Turbo Roulette — UI rendering: felt board, chips, HUD.
 */

const COLOR_CLASS = {
  red: 'bg-rose-700 hover:bg-rose-600 border-rose-500',
  black: 'bg-zinc-900 hover:bg-zinc-800 border-zinc-600',
  green: 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500',
};

function formatMoney(n) {
  return `$${Math.floor(n).toLocaleString()}`;
}

/**
 * Mount full shell into #app
 * @param {HTMLElement} root
 * @param {object} handlers - callbacks for interactions
 */
function mountShell(root, handlers) {
  if (!root) return;

  root.innerHTML = `
    <div class="w-full max-w-5xl mx-auto px-3 py-4 sm:px-6">
      <header class="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <p class="font-display text-4xl sm:text-5xl tracking-tight text-amber-200 drop-shadow">Turbo Roulette</p>
          <p class="text-sm text-emerald-200/70 mt-1">Live-synced · 30s rounds · fake money only</p>
        </div>
        <div class="text-right font-mono text-sm space-y-1">
          <div>Balance <span id="hud-balance" class="text-amber-300 text-lg font-semibold">$0</span></div>
          <div>At risk <span id="hud-staked" class="text-emerald-200">$0</span></div>
        </div>
      </header>

      <section class="rounded-xl border border-emerald-800/80 bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 p-3 sm:p-5 shadow-inner">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div id="hud-phase" class="px-3 py-1 rounded-md bg-emerald-800/60 text-sm uppercase tracking-wider">betting</div>
          <div id="hud-clock" class="font-mono text-amber-100/90 text-sm">—</div>
          <div id="hud-result" class="font-mono text-sm text-emerald-100/80">Last: —</div>
        </div>

        <div id="board" class="select-none"></div>

        <div class="mt-4 flex flex-wrap items-center gap-2 justify-between">
          <div id="chip-rack" class="flex flex-wrap gap-2"></div>
          <div class="flex flex-wrap gap-2">
            <button type="button" id="btn-clear" class="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm border border-zinc-600">Clear bets</button>
            <button type="button" id="btn-faucet" class="px-3 py-2 rounded-md bg-amber-700/90 hover:bg-amber-600 text-sm border border-amber-500">Claim faucet</button>
          </div>
        </div>

        <p id="hud-message" class="mt-3 text-sm text-emerald-200/80 min-h-[1.25rem]"></p>
      </section>
    </div>
  `;

  const board = root.querySelector('#board');
  renderBoard(board, handlers);

  const rack = root.querySelector('#chip-rack');
  renderChipRack(rack, handlers.chipValues || [1, 5, 25, 100, 500], handlers.selectedChip, handlers.onSelectChip);

  root.querySelector('#btn-clear').addEventListener('click', () => handlers.onClear && handlers.onClear());
  root.querySelector('#btn-faucet').addEventListener('click', () => handlers.onFaucet && handlers.onFaucet());
}

function renderBoard(container, handlers) {
  if (!container) return;
  const getColor = handlers.getColor;

  // Column layout: rows are top=3,6,9... middle=2,5,8... bottom=1,4,7...
  const col1 = [];
  const col2 = [];
  const col3 = [];
  for (let n = 1; n <= 36; n++) {
    const col = ((n - 1) % 3) + 1;
    if (col === 1) col1.push(n);
    else if (col === 2) col2.push(n);
    else col3.push(n);
  }

  function cellBtn(type, value, label, colorKey) {
    const colorCls = colorKey ? COLOR_CLASS[colorKey] : 'bg-emerald-800/80 hover:bg-emerald-700 border-emerald-600';
    const dataVal = value === undefined ? '' : ` data-value="${value}"`;
    return `<button type="button" data-bet-type="${type}"${dataVal}
      class="relative h-10 sm:h-11 min-w-[2.25rem] sm:min-w-[2.75rem] flex-1 rounded border text-xs sm:text-sm font-semibold text-white ${colorCls}">
      <span>${label}</span>
      <span data-chip-marker class="absolute -top-1 -right-1 hidden text-[10px] leading-none px-1 py-0.5 rounded-full bg-amber-400 text-zinc-900 font-bold"></span>
    </button>`;
  }

  container.innerHTML = `
    <div class="flex gap-1 mb-1">
      ${cellBtn('straight', 0, '0', 'green')}
    </div>
    <div class="grid grid-cols-[1fr_auto] gap-1">
      <div class="space-y-1">
        <div class="flex gap-1">${col3.map((n) => cellBtn('straight', n, String(n), getColor(n))).join('')}</div>
        <div class="flex gap-1">${col2.map((n) => cellBtn('straight', n, String(n), getColor(n))).join('')}</div>
        <div class="flex gap-1">${col1.map((n) => cellBtn('straight', n, String(n), getColor(n))).join('')}</div>
      </div>
      <div class="flex flex-col gap-1 w-12 sm:w-14">
        ${cellBtn('column', 3, '2:1')}
        ${cellBtn('column', 2, '2:1')}
        ${cellBtn('column', 1, '2:1')}
      </div>
    </div>
    <div class="grid grid-cols-3 gap-1 mt-1">
      ${cellBtn('dozen', 1, '1st 12')}
      ${cellBtn('dozen', 2, '2nd 12')}
      ${cellBtn('dozen', 3, '3rd 12')}
    </div>
    <div class="grid grid-cols-6 gap-1 mt-1">
      ${cellBtn('low', undefined, '1–18')}
      ${cellBtn('even', undefined, 'EVEN')}
      ${cellBtn('red', undefined, 'RED', 'red')}
      ${cellBtn('black', undefined, 'BLACK', 'black')}
      ${cellBtn('odd', undefined, 'ODD')}
      ${cellBtn('high', undefined, '19–36')}
    </div>
  `;

  container.querySelectorAll('[data-bet-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-bet-type');
      const raw = btn.getAttribute('data-value');
      const value = raw === null || raw === '' ? undefined : Number(raw);
      if (handlers.onPlaceBet) handlers.onPlaceBet({ type, value });
    });
  });
}

function renderChipRack(container, values, selected, onSelect) {
  if (!container) return;
  container.innerHTML = values
    .map(
      (v) => `
    <button type="button" data-chip="${v}"
      class="h-11 w-11 rounded-full border-2 text-xs font-bold shadow
        ${selected === v ? 'border-amber-300 scale-110 bg-amber-500 text-zinc-900' : 'border-amber-700/80 bg-amber-800/70 text-amber-50 hover:bg-amber-700'}">
      ${v}
    </button>`
    )
    .join('');
  container.querySelectorAll('[data-chip]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = Number(btn.getAttribute('data-chip'));
      if (onSelect) onSelect(v);
    });
  });
}

function updateHud(state) {
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('hud-balance', formatMoney(state.balance));
  set('hud-staked', formatMoney(state.staked));
  set('hud-phase', state.phase || '—');
  set('hud-clock', state.clock || '—');
  if (state.lastResult) {
    const r = state.lastResult;
    set('hud-result', `Last: ${r.number} (${r.color})`);
  }
  const msg = document.getElementById('hud-message');
  if (msg && state.message !== undefined) msg.textContent = state.message;

  const phaseEl = document.getElementById('hud-phase');
  if (phaseEl && state.phase) {
    const hues = {
      betting: 'bg-emerald-700/70 text-emerald-50',
      locked: 'bg-amber-800/80 text-amber-100',
      spinning: 'bg-rose-800/80 text-rose-100',
    };
    phaseEl.className = `px-3 py-1 rounded-md text-sm uppercase tracking-wider ${hues[state.phase] || 'bg-emerald-800/60'}`;
  }
}

/**
 * Paint chip amounts on board cells from current bets.
 */
function updateBetMarkers(bets) {
  const board = document.getElementById('board');
  if (!board) return;
  board.querySelectorAll('[data-bet-type]').forEach((btn) => {
    const type = btn.getAttribute('data-bet-type');
    const raw = btn.getAttribute('data-value');
    const value = raw === null || raw === '' ? undefined : Number(raw);
    const marker = btn.querySelector('[data-chip-marker]');
    const bet = bets.find((b) => b.type === type && b.value === value);
    if (bet && marker) {
      marker.textContent = bet.amount;
      marker.classList.remove('hidden');
    } else if (marker) {
      marker.textContent = '';
      marker.classList.add('hidden');
    }
  });
}

function refreshChipRack(selected, values, onSelect) {
  const rack = document.getElementById('chip-rack');
  renderChipRack(rack, values, selected, onSelect);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatMoney,
    mountShell,
    renderBoard,
    renderChipRack,
    updateHud,
    updateBetMarkers,
    refreshChipRack,
  };
}
if (typeof window !== 'undefined') {
  window.RouletteUI = {
    formatMoney,
    mountShell,
    renderBoard,
    renderChipRack,
    updateHud,
    updateBetMarkers,
    refreshChipRack,
  };
}
