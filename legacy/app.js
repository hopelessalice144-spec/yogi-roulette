/**
 * Turbo Roulette — App orchestration (phases, bets, settle, wallet).
 */
(function () {
  if (typeof window === 'undefined') return;

  const MathEngine = window.RouletteMath;
  const Timer = window.RouletteTimer;
  const Storage = window.RouletteStorage;
  const Bets = window.RouletteBets;
  const UI = window.RouletteUI;

  if (!MathEngine || !Timer || !Storage || !Bets || !UI) {
    console.error('[app] Missing modules');
    return;
  }

  const state = {
    balance: Storage.loadBalance(),
    bets: Storage.loadBets(),
    selectedChip: 25,
    lastResult: null,
    lastSettledCycle: null,
    message: 'Place chips while the phase is BETTING.',
  };

  function staked() {
    return Bets.totalStaked(state.bets);
  }

  function persist() {
    Storage.saveBalance(state.balance);
    Storage.saveBets(state.bets);
  }

  function refresh() {
    const phase = Timer.getPhase();
    UI.updateHud({
      balance: state.balance,
      staked: staked(),
      phase: phase.name,
      clock: `Cycle ${Timer.getCycleId()} · ${phase.cycleSecond}s / ${Timer.CYCLE_SECONDS} · ${phase.secondsRemaining}s left`,
      lastResult: state.lastResult,
      message: state.message,
    });
    UI.updateBetMarkers(state.bets);
  }

  function onSelectChip(v) {
    state.selectedChip = v;
    UI.refreshChipRack(state.selectedChip, Bets.CHIP_VALUES, onSelectChip);
  }

  function onPlaceBet(target) {
    const phase = Timer.getPhase();
    if (phase.name !== 'betting') {
      state.message = 'Bets locked — wait for the next round.';
      refresh();
      return;
    }
    const chip = state.selectedChip;
    if (chip > state.balance) {
      state.message = 'Not enough balance for that chip.';
      refresh();
      return;
    }
    state.balance -= chip;
    state.bets = Bets.placeChip(state.bets, target, chip);
    persist();
    state.message = `Placed $${chip} on ${target.type}${target.value !== undefined ? ' ' + target.value : ''}.`;
    refresh();
  }

  function onClear() {
    const phase = Timer.getPhase();
    if (phase.name !== 'betting') {
      state.message = 'Cannot clear after bets lock.';
      refresh();
      return;
    }
    const refund = staked();
    state.balance += refund;
    state.bets = [];
    persist();
    state.message = refund ? `Cleared bets. Refunded $${refund}.` : 'No bets to clear.';
    refresh();
  }

  function onFaucet() {
    const result = Storage.claimFaucet(state.balance);
    if (!result.claimed) {
      state.message = result.reason || 'Faucet unavailable.';
      refresh();
      return;
    }
    state.balance = result.balance;
    persist();
    state.message = `Faucet claimed: +$${result.amount}.`;
    refresh();
  }

  function settleIfNeeded() {
    const phase = Timer.getPhase();
    const cycleId = Timer.getCycleId();

    if (phase.name !== 'spinning') return;
    if (state.lastSettledCycle === cycleId) return;

    const result = Bets.spinForCycle(cycleId, MathEngine.getColor);
    state.lastResult = result;
    state.lastSettledCycle = cycleId;

    if (state.bets.length === 0) {
      state.message = `No bet · ball landed on ${result.number} (${result.color}).`;
      refresh();
      return;
    }

    const returned = Bets.settleAll(state.bets, result.number, MathEngine.evaluateBet);
    const risked = staked();
    state.balance += returned;
    state.bets = [];
    persist();

    const net = returned - risked;
    if (returned > 0) {
      state.message = `Hit ${result.number} (${result.color})! Returned $${returned} (net ${net >= 0 ? '+' : ''}${net}).`;
    } else {
      state.message = `Hit ${result.number} (${result.color}). Lost $${risked}.`;
    }
    refresh();
  }

  const app = document.getElementById('app');
  UI.mountShell(app, {
    getColor: MathEngine.getColor,
    chipValues: Bets.CHIP_VALUES,
    selectedChip: state.selectedChip,
    onSelectChip,
    onPlaceBet,
    onClear,
    onFaucet,
  });

  refresh();
  setInterval(() => {
    settleIfNeeded();
    refresh();
  }, 200);
})();
