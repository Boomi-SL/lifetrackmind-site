// Breathing timer: in for 4 seconds, out for 6, for the chosen number of minutes.
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

  var PHASES = [
    { label: 'Breathe in', seconds: 4, scale: 1 },
    { label: 'Breathe out', seconds: 6, scale: 0.6 }
  ];

  var timer = null;
  var remaining = 0;   // seconds left in the session
  var phase = 0;
  var phaseLeft = 0;   // seconds left in the current phase
  var started = false;

  function minutes() {
    for (var i = 0; i < lengths.length; i++) {
      if (lengths[i].checked) return Number(lengths[i].value);
    }
    return 1;
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
    setLengthsDisabled(false);
  }

  function tick() {
    remaining -= 1;
    phaseLeft -= 1;
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

  function setLengthsDisabled(value) {
    for (var i = 0; i < lengths.length; i++) lengths[i].disabled = value;
  }

  function start() {
    if (!started) {
      remaining = minutes() * 60;
      started = true;
      enterPhase(0);
    } else {
      // Resuming: begin the current phase again so the circle and count agree.
      enterPhase(phase);
    }
    remainingText.textContent = clock(remaining) + ' left';
    toggle.textContent = 'Pause';
    reset.hidden = false;
    setLengthsDisabled(true);
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
    setLengthsDisabled(false);
  }

  toggle.addEventListener('click', function () {
    if (timer) pause(); else start();
  });
  reset.addEventListener('click', toIdle);

  toIdle();
})();
