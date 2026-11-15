// Daily stress check-in. Runs in the browser only; saved check-ins stay on this device.
(function () {
  'use strict';

  var form = document.getElementById('checkin-form');
  if (!form) return;

  var KEY = 'ltm-checkins';
  var sliders = Array.prototype.slice.call(form.querySelectorAll('input[type="range"]'));
  var readingTitle = document.getElementById('checkin-title');
  var readingStep = document.getElementById('checkin-step');
  var status = document.getElementById('checkin-status');
  var week = document.getElementById('checkin-week');
  var clearButton = document.getElementById('checkin-clear');
  var MAX = sliders.length * 5;

  // Bands by share of the maximum score.
  var BANDS = [
    { upTo: 0.4, title: 'Light and steady', step: 'One small step: notice what is helping today, so you can do more of it.' },
    { upTo: 0.6, title: 'A little wound up', step: 'One small step: three minutes of slow breathing before your next task.' },
    { upTo: 0.8, title: 'Carrying a lot', step: 'One small step: write down everything on your mind, then circle the one thing that matters today.' },
    { upTo: 1, title: 'Running on empty', step: 'One small step: put one thing down today and rest without earning it. If most days feel like this, talking to someone you trust or a professional can help.' }
  ];
  var WORDS = ['very low', 'low', 'in the middle', 'high', 'very high'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function score() {
    return sliders.reduce(function (sum, s) { return sum + Number(s.value); }, 0);
  }

  function band(total) {
    var share = total / MAX;
    for (var i = 0; i < BANDS.length; i++) {
      if (share <= BANDS[i].upTo) return BANDS[i];
    }
    return BANDS[BANDS.length - 1];
  }

  function dayKey(date) {
    var m = String(date.getMonth() + 1);
    var d = String(date.getDate());
    return date.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (d.length < 2 ? '0' + d : d);
  }

  function load() {
    try {
      var data = JSON.parse(window.localStorage.getItem(KEY) || '{}');
      return data && typeof data === 'object' ? data : {};
    } catch (e) {
      return {};
    }
  }

  function save(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function renderReading() {
    var current = band(score());
    readingTitle.textContent = current.title;
    readingStep.textContent = current.step;
    sliders.forEach(function (s) {
      s.setAttribute('aria-valuetext', WORDS[Number(s.value) - 1]);
    });
  }

  function renderWeek() {
    var data = load();
    var today = new Date();
    var any = false;
    while (week.firstChild) week.removeChild(week.firstChild);

    for (var back = 6; back >= 0; back--) {
      var date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
      var value = data[dayKey(date)];
      var name = DAYS[date.getDay()];

      var item = document.createElement('li');
      item.className = 'checkin-day' + (back === 0 ? ' is-today' : '');

      var bar = document.createElement('span');
      bar.className = 'checkin-bar';
      bar.setAttribute('aria-hidden', 'true');
      if (typeof value === 'number') {
        any = true;
        var fill = document.createElement('span');
        fill.className = 'checkin-bar-fill';
        fill.style.height = Math.max(8, Math.round((value / MAX) * 100)) + '%';
        bar.appendChild(fill);
      }
      item.appendChild(bar);

      var label = document.createElement('span');
      label.className = 'checkin-day-name';
      label.textContent = back === 0 ? 'Today' : name;
      item.appendChild(label);

      var spoken = document.createElement('span');
      spoken.className = 'visually-hidden';
      spoken.textContent = typeof value === 'number' ? ': ' + band(value).title : ': no check-in';
      item.appendChild(spoken);

      week.appendChild(item);
    }
    clearButton.hidden = !any;
  }

  sliders.forEach(function (s) {
    s.addEventListener('input', function () {
      renderReading();
      status.textContent = '';
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = load();
    data[dayKey(new Date())] = score();
    // Keep the last 60 days only.
    var keys = Object.keys(data).sort();
    while (keys.length > 60) delete data[keys.shift()];
    status.textContent = save(data)
      ? 'Saved for today. Come back tomorrow to see your week.'
      : 'Could not save on this device. Your reading is still shown here.';
    renderWeek();
  });

  clearButton.addEventListener('click', function () {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* nothing stored */ }
    status.textContent = 'Your saved check-ins were removed from this device.';
    renderWeek();
  });

  renderReading();
  renderWeek();
})();
