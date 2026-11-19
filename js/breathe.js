// Breathing timer: in for 4 seconds, out for 6, for the chosen number of minutes.
// When a session finishes it shows what the visitor did, how their feeling changed,
// and their calm path. Progress is kept only in this browser.
(function () {
  'use strict';

  var circle = document.getElementById('breathe-circle');
  if (!circle) return;

  var phaseText = document.getElementById('breathe-phase');
  var countText = document.getElementById('breathe-count');
  var remainingText = document.getElementById('breathe-remaining');
  var toggle = document.getElementById('breathe-toggle');
  var reset = document.getElementById('breathe-reset');
  var lengths = document.querySelectorAll('input[name="breathe-length"]');
  var before = document.querySelectorAll('input[name="feel-before"]');
  var after = document.querySelectorAll('input[name="feel-after"]');
  var done = document.getElementById('breathe-done');
  var summary = document.getElementById('breathe-summary');
  var newStep = document.getElementById('breathe-new-step');
  var shift = document.getElementById('breathe-shift');
  var statsText = document.getElementById('calm-stats');
  var stepsList = document.getElementById('calm-steps');
  var nextText = document.getElementById('calm-next');
  var clearBtn = document.getElementById('breathe-clear');

  var KEY = 'ltm-breaths';
  var FEEL = ['', 'calm', 'okay', 'a bit tense', 'tense', 'very tense'];
  var PHASES = [
    { label: 'Breathe in', seconds: 4, scale: 1 },
    { label: 'Breathe out', seconds: 6, scale: 0.6 }
  ];

  // Steps on the calm path. Each one is reached once its test passes.
  var STEPS = [
    { name: 'First calm minute', hint: 'Finish one session', test: function (s) { return s.sessions >= 1; }, left: function (s) { return 1 - s.sessions; }, unit: 'session' },
    { name: 'Three sessions', hint: 'Finish three sessions', test: function (s) { return s.sessions >= 3; }, left: function (s) { return 3 - s.sessions; }, unit: 'session' },
    { name: 'Ten calm minutes', hint: 'Breathe for ten minutes in total', test: function (s) { return s.minutes >= 10; }, left: function (s) { return 10 - s.minutes; }, unit: 'minute' },
    { name: 'Three days in a row', hint: 'Breathe on three days in a row', test: function (s) { return s.best >= 3; }, left: function (s) { return 3 - s.streak; }, unit: 'day' },
    { name: 'A week of practice', hint: 'Breathe on seven different days', test: function (s) { return s.days >= 7; }, left: function (s) { return 7 - s.days; }, unit: 'day' },
    { name: 'Thirty calm minutes', hint: 'Breathe for thirty minutes in total', test: function (s) { return s.minutes >= 30; }, left: function (s) { return 30 - s.minutes; }, unit: 'minute' },
    { name: 'Seven days in a row', hint: 'Breathe on seven days in a row', test: function (s) { return s.best >= 7; }, left: function (s) { return 7 - s.streak; }, unit: 'day' }
  ];

  var timer = null;
  var remaining = 0;   // seconds left in the session
  var phase = 0;
  var phaseLeft = 0;   // seconds left in the current phase
  var started = false;
  var breaths = 0;     // full breaths finished in this session
  var feelBefore = 0;
  var lastIndex = -1;  // position of this session in the saved history

  // ---------- saved history ----------
  function load() {
    try {
      var data = JSON.parse(window.localStorage.getItem(KEY) || '[]');
      return Object.prototype.toString.call(data) === '[object Array]' ? data : [];
    } catch (e) { return []; }
  }
  function save(list) {
    try { window.localStorage.setItem(KEY, JSON.stringify(list.slice(-300))); } catch (e) {}
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function dayNumber(key) {
    var p = key.split('-');
    return Math.round(Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2])) / 86400000);
  }

  function stats(list) {
    var s = { sessions: list.length, minutes: 0, days: 0, streak: 0, best: 0 };
    var seen = {};
    var nums = [];
    for (var i = 0; i < list.length; i++) {
      s.minutes += Number(list[i].m) || 0;
      if (list[i].d && !seen[list[i].d]) { seen[list[i].d] = true; nums.push(dayNumber(list[i].d)); }
    }
    nums.sort(function (a, b) { return a - b; });
    s.days = nums.length;
    var run = 0;
    for (var j = 0; j < nums.length; j++) {
      run = (j > 0 && nums[j] === nums[j - 1] + 1) ? run + 1 : 1;
      if (run > s.best) s.best = run;
    }
    // The current run counts if it reaches today or yesterday.
    var now = dayNumber(today());
    if (nums.length && now - nums[nums.length - 1] <= 1) {
      s.streak = 1;
      for (var k = nums.length - 1; k > 0 && nums[k] === nums[k - 1] + 1; k--) s.streak++;
    }
    return s;
  }

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  // ---------- results ----------
  function showPath(list, justReached) {
    var s = stats(list);
    statsText.textContent = plural(s.sessions, 'session') + ' · ' + plural(s.minutes, 'calm minute') +
      (s.streak > 1 ? ' · ' + s.streak + ' days in a row' : '');
    while (stepsList.firstChild) stepsList.removeChild(stepsList.firstChild);
    var next = null;
    for (var i = 0; i < STEPS.length; i++) {
      var ok = STEPS[i].test(s);
      var li = document.createElement('li');
      li.className = 'calm-step' + (ok ? ' is-done' : '') + (!ok && !next ? ' is-next' : '') +
        (justReached && justReached.indexOf(i) !== -1 ? ' is-new' : '');
      var mark = document.createElement('span');
      mark.className = 'calm-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.appendChild(document.createTextNode(ok ? '✓' : String(i + 1)));
      var label = document.createElement('span');
      label.className = 'calm-label';
      label.appendChild(document.createTextNode(STEPS[i].name));
      var state = document.createElement('span');
      state.className = 'visually-hidden';
      state.appendChild(document.createTextNode(ok ? ' (reached)' : ''));
      li.appendChild(mark); li.appendChild(label); li.appendChild(state);
      stepsList.appendChild(li);
      if (!ok && !next) next = STEPS[i];
    }
    if (next) {
      var left = Math.max(1, next.left(s));
      nextText.textContent = 'Next step: ' + next.name + '. ' + next.hint + ' (' + plural(left, next.unit) + ' to go).';
    } else {
      nextText.textContent = 'You have reached every step on the path. Keep the habit going.';
    }
  }

  function reachedSteps(s) {
    var out = [];
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i].test(s)) out.push(i);
    return out;
  }

  function showShift(nowFeel) {
    var text;
    if (!feelBefore) {
      text = 'You feel ' + FEEL[nowFeel] + ' now. Next time, pick how you feel before you start to see the change.';
    } else if (nowFeel < feelBefore) {
      text = 'You went from ' + FEEL[feelBefore] + ' to ' + FEEL[nowFeel] + '. That is a real shift in just a few minutes.';
    } else if (nowFeel === feelBefore) {
      text = 'About the same as before, and that is okay. Some days it takes a few rounds. Your body still got a few slow, steady minutes.';
    } else {
      text = 'Feeling more tense is a signal, not a failure. Try a longer session, or the grounding exercise in our guided sessions.';
    }
    shift.textContent = text;
    shift.hidden = false;
  }

  function finish() {
    stopTimer();
    started = false;
    phaseText.textContent = 'Nicely done';
    countText.textContent = '';
    remainingText.textContent = 'Take that slower pace with you.';
    circle.style.transitionDuration = '2s';
    circle.style.transform = 'scale(0.8)';
    toggle.textContent = 'Start again';
    reset.hidden = true;
    setDisabled(lengths, false);
    setDisabled(before, false);

    var list = load();
    var beforeSteps = reachedSteps(stats(list));
    list.push({ d: today(), m: minutes(), b: breaths, f0: feelBefore || 0, f1: 0 });
    save(list);
    lastIndex = list.length - 1;
    var nowSteps = reachedSteps(stats(list));
    var fresh = [];
    for (var i = 0; i < nowSteps.length; i++) if (beforeSteps.indexOf(nowSteps[i]) === -1) fresh.push(nowSteps[i]);

    summary.textContent = 'You took ' + plural(breaths, 'slow breath') + ' in ' + plural(minutes(), 'minute') + '.';
    if (fresh.length) {
      var names = [];
      for (var n = 0; n < fresh.length; n++) names.push(STEPS[fresh[n]].name);
      newStep.textContent = (names.length > 1 ? 'New steps reached: ' + names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : 'New step reached: ' + names[0]) + '.';
      newStep.hidden = false;
    } else {
      newStep.hidden = true;
    }
    for (var j = 0; j < after.length; j++) after[j].checked = false;
    shift.hidden = true;
    showPath(list, fresh);
    done.hidden = false;
    try { done.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { done.scrollIntoView(); }
  }

  // ---------- timer ----------
  function minutes() {
    for (var i = 0; i < lengths.length; i++) {
      if (lengths[i].checked) return Number(lengths[i].value);
    }
    return 1;
  }

  function picked(group) {
    for (var i = 0; i < group.length; i++) if (group[i].checked) return Number(group[i].value);
    return 0;
  }

  function clock(total) {
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function enterPhase(i) {
    phase = i;
    phaseLeft = PHASES[i].seconds;
    phaseText.textContent = PHASES[i].label;
    countText.textContent = String(phaseLeft);
    circle.style.transitionDuration = PHASES[i].seconds + 's';
    circle.style.transform = 'scale(' + PHASES[i].scale + ')';
  }

  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function tick() {
    remaining -= 1;
    phaseLeft -= 1;
    if (phaseLeft <= 0 && phase === PHASES.length - 1) breaths += 1;
    if (remaining <= 0) {
      finish();
      return;
    }
    remainingText.textContent = clock(remaining) + ' left';
    if (phaseLeft <= 0) {
      enterPhase((phase + 1) % PHASES.length);
    } else {
      countText.textContent = String(phaseLeft);
    }
  }

  function setDisabled(group, value) {
    for (var i = 0; i < group.length; i++) group[i].disabled = value;
  }

  function start() {
    if (!started) {
      remaining = minutes() * 60;
      started = true;
      breaths = 0;
      feelBefore = picked(before);
      done.hidden = true;
      enterPhase(0);
    } else {
      // Resuming: begin the current phase again so the circle and count agree.
      enterPhase(phase);
    }
    remainingText.textContent = clock(remaining) + ' left';
    toggle.textContent = 'Pause';
    reset.hidden = false;
    setDisabled(lengths, true);
    setDisabled(before, true);
    timer = window.setInterval(tick, 1000);
  }

  function pause() {
    stopTimer();
    phaseText.textContent = 'Paused';
    countText.textContent = '';
    toggle.textContent = 'Continue';
  }

  function toIdle() {
    stopTimer();
    started = false;
    phaseText.textContent = 'Ready';
    countText.textContent = '';
    remainingText.textContent = 'In for 4, out for 6.';
    circle.style.transitionDuration = '1s';
    circle.style.transform = 'scale(0.8)';
    toggle.textContent = 'Start';
    reset.hidden = true;
    setDisabled(lengths, false);
    setDisabled(before, false);
  }

  toggle.addEventListener('click', function () {
    if (timer) pause(); else start();
  });
  reset.addEventListener('click', toIdle);

  for (var i = 0; i < after.length; i++) {
    after[i].addEventListener('change', function () {
      var nowFeel = Number(this.value);
      showShift(nowFeel);
      var list = load();
      if (lastIndex >= 0 && lastIndex < list.length) { list[lastIndex].f1 = nowFeel; save(list); }
    });
  }

  clearBtn.addEventListener('click', function () {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
    lastIndex = -1;
    newStep.hidden = true;
    showPath([], []);
    summary.textContent = 'Your breathing history is cleared.';
  });

  toIdle();
})();
