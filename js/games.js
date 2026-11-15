// Calm games. Six small games with no timers and no scores to beat. Nothing is saved.
(function () {
  'use strict';

  var menu = document.getElementById('game-menu');
  var stage = document.getElementById('game-stage');
  if (!menu || !stage) return;

  var nameEl = document.getElementById('game-name');
  var helpEl = document.getElementById('game-help');
  var area = document.getElementById('game-area');
  var statusEl = document.getElementById('game-status');
  var controls = document.getElementById('game-controls');
  var back = document.getElementById('game-back');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cleanup = null;
  var current = '';

  function rand(min, max) { return min + Math.random() * (max - min); }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function button(cls, text, onClick) {
    var node = el('button', cls, text);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
  }

  function say(text) { statusEl.textContent = text; }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var swap = list[i]; list[i] = list[j]; list[j] = swap;
    }
    return list;
  }

  var ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
  var SYMBOLS = [
    { name: 'sun', svg: ICON + '<circle cx="12" cy="12" r="4"></circle><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"></path></svg>' },
    { name: 'moon', svg: ICON + '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg>' },
    { name: 'leaf', svg: ICON + '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"></path><path d="M5 19c3-5 6-8 10-10"></path></svg>' },
    { name: 'wave', svg: ICON + '<path d="M3 9c3-3 6 3 9 0s6 3 9 0"></path><path d="M3 15c3-3 6 3 9 0s6 3 9 0"></path></svg>' },
    { name: 'cloud', svg: ICON + '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9.5a4.2 4.2 0 0 1 0 8.5z"></path></svg>' },
    { name: 'star', svg: ICON + '<path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z"></path></svg>' }
  ];

  var GAMES = {};

  /* ---------- 1. Bubble pop ---------- */
  GAMES.bubble = {
    name: 'Bubble pop',
    help: 'Tap a bubble to pop it. More will drift up.',
    start: function () {
      var field = el('div', 'bubble-field');
      var popped = 0;
      say('0 bubbles popped');

      function place(bubble) {
        var size = Math.round(rand(52, 92));
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.left = rand(2, 86) + '%';
        if (reduceMotion) {
          bubble.style.top = rand(4, 70) + '%';
        } else {
          bubble.style.animationDuration = rand(10, 18).toFixed(1) + 's';
          bubble.style.animationDelay = (-rand(0, 16)).toFixed(1) + 's';
        }
      }

      function makeBubble() {
        var bubble = el('button', 'bubble');
        bubble.type = 'button';
        bubble.setAttribute('aria-label', 'Bubble');
        place(bubble);
        bubble.addEventListener('animationiteration', function () {
          bubble.style.left = rand(2, 86) + '%';
        });
        bubble.addEventListener('click', function () {
          if (bubble.classList.contains('is-popped')) return;
          bubble.classList.add('is-popped');
          popped += 1;
          say(popped === 1 ? '1 bubble popped' : popped + ' bubbles popped');
          window.setTimeout(function () {
            if (bubble.parentNode !== field) return;
            var fresh = makeBubble();
            if (!reduceMotion) fresh.style.animationDelay = '0s';
            field.replaceChild(fresh, bubble);
          }, 320);
        });
        return bubble;
      }

      for (var i = 0; i < 9; i++) field.appendChild(makeBubble());
      area.appendChild(field);
    }
  };

  /* ---------- 2. Memory match ---------- */
  GAMES.match = {
    name: 'Memory match',
    help: 'Turn over two cards at a time and find the six pairs.',
    start: function () {
      var board = el('div', 'match-board');
      var open, moves, matched, locked, timer;

      function label(card, index, faceUp) {
        card.setAttribute('aria-label', 'Card ' + (index + 1) + (faceUp ? ': ' + card.getAttribute('data-name') : ', face down'));
      }

      function deal() {
        var deck = shuffle(SYMBOLS.concat(SYMBOLS));
        while (board.firstChild) board.removeChild(board.firstChild);
        open = []; moves = 0; matched = 0; locked = false;
        say('Find the six pairs. Take your time.');

        deck.forEach(function (symbol, index) {
          var card = el('button', 'match-card');
          card.type = 'button';
          card.setAttribute('data-name', symbol.name);
          card.innerHTML = '<span class="match-face">' + symbol.svg + '</span>';
          label(card, index, false);
          card.addEventListener('click', function () {
            if (locked || card.classList.contains('is-open') || card.classList.contains('is-matched')) return;
            card.classList.add('is-open');
            label(card, index, true);
            open.push({ card: card, index: index });
            if (open.length < 2) return;

            moves += 1;
            var first = open[0];
            var second = open[1];
            open = [];
            if (first.card.getAttribute('data-name') === second.card.getAttribute('data-name')) {
              first.card.classList.add('is-matched');
              second.card.classList.add('is-matched');
              matched += 1;
              say(matched === SYMBOLS.length
                ? 'All six pairs found in ' + moves + ' moves. Nicely done.'
                : 'A pair. ' + (SYMBOLS.length - matched) + ' to go.');
            } else {
              locked = true;
              say('Not a pair. Try another.');
              timer = window.setTimeout(function () {
                [first, second].forEach(function (item) {
                  item.card.classList.remove('is-open');
                  label(item.card, item.index, false);
                });
                locked = false;
              }, 900);
            }
          });
          board.appendChild(card);
        });
      }

      area.appendChild(board);
      controls.appendChild(button('quiz-back', 'Shuffle and start again', deal));
      deal();
      return function () { window.clearTimeout(timer); };
    }
  };

  /* ---------- 3. Mirror doodle ---------- */
  GAMES.doodle = {
    name: 'Mirror doodle',
    help: 'Draw anywhere with your finger or mouse. Your line repeats around the centre.',
    start: function () {
      var COLORS = [['Teal', '#0F4C4A'], ['Sage', '#5E8D7F'], ['Gold', '#B8872A'], ['Clay', '#B4583A']];
      var PAPER = '#FAF7EF';
      var FOLDS = 6;
      var canvas = el('canvas', 'doodle-canvas');
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', 'Drawing area. Lines you draw are repeated in a circle.');
      area.appendChild(canvas);

      var ctx = canvas.getContext('2d');
      var size = 0;
      var color = COLORS[0][1];
      var last = null;
      var strokes = 0;

      function clear() {
        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, size, size);
        strokes = 0;
        say('A blank page. Start anywhere.');
      }

      function fit() {
        var ratio = window.devicePixelRatio || 1;
        size = Math.round(canvas.getBoundingClientRect().width);
        canvas.width = size * ratio;
        canvas.height = size * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        clear();
      }

      function point(event) {
        var box = canvas.getBoundingClientRect();
        return { x: event.clientX - box.left - size / 2, y: event.clientY - box.top - size / 2 };
      }

      function segment(a, b) {
        ctx.strokeStyle = color;
        for (var k = 0; k < FOLDS; k++) {
          var angle = (Math.PI * 2 * k) / FOLDS;
          var cos = Math.cos(angle);
          var sin = Math.sin(angle);
          for (var flip = 1; flip >= -1; flip -= 2) {
            ctx.beginPath();
            ctx.moveTo(size / 2 + (a.x * flip) * cos - a.y * sin, size / 2 + (a.x * flip) * sin + a.y * cos);
            ctx.lineTo(size / 2 + (b.x * flip) * cos - b.y * sin, size / 2 + (b.x * flip) * sin + b.y * cos);
            ctx.stroke();
          }
        }
      }

      function down(event) {
        event.preventDefault();
        last = point(event);
        if (canvas.setPointerCapture && event.pointerId != null) {
          try { canvas.setPointerCapture(event.pointerId); } catch (e) { /* not capturable */ }
        }
      }
      function move(event) {
        if (!last) return;
        event.preventDefault();
        var next = point(event);
        segment(last, next);
        last = next;
      }
      function up() {
        if (!last) return;
        last = null;
        strokes += 1;
        say(strokes === 1 ? '1 line drawn' : strokes + ' lines drawn');
      }

      canvas.addEventListener('pointerdown', down);
      canvas.addEventListener('pointermove', move);
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);

      var swatches = el('div', 'doodle-swatches');
      swatches.setAttribute('role', 'group');
      swatches.setAttribute('aria-label', 'Line colour');
      COLORS.forEach(function (pair, i) {
        var swatch = button('doodle-swatch', '', function () {
          color = pair[1];
          Array.prototype.forEach.call(swatches.children, function (other) {
            other.setAttribute('aria-pressed', other === swatch ? 'true' : 'false');
          });
        });
        swatch.style.background = pair[1];
        swatch.setAttribute('aria-label', pair[0]);
        swatch.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
        swatches.appendChild(swatch);
      });
      controls.appendChild(swatches);
      controls.appendChild(button('quiz-back', 'Clear the page', clear));

      fit();
    }
  };

  /* ---------- 4. Shade sort ---------- */
  GAMES.sort = {
    name: 'Shade sort',
    help: 'Tap two tiles to swap them. Put the shades in order from lightest to darkest.',
    start: function () {
      var SHADES = ['#E4ECE6', '#C5D9CE', '#A3C2B4', '#7FA89B', '#5E8D7F', '#2F6B62', '#0F4C4A'];
      var row = el('div', 'sort-row');
      var order, picked, moves;

      function sorted() {
        for (var i = 0; i < order.length; i++) if (order[i] !== i) return false;
        return true;
      }

      function draw() {
        while (row.firstChild) row.removeChild(row.firstChild);
        var done = sorted();
        order.forEach(function (shade, position) {
          var tile = el('button', 'sort-tile' + (picked === position ? ' is-picked' : ''));
          tile.type = 'button';
          tile.style.background = SHADES[shade];
          tile.setAttribute('data-shade', String(shade));
          tile.setAttribute('aria-label', 'Position ' + (position + 1) + ', shade ' + (shade + 1) + ' of ' + SHADES.length + (picked === position ? ', selected' : ''));
          tile.disabled = done;
          tile.addEventListener('click', function () {
            if (picked == null) {
              picked = position;
              say('Now tap the tile to swap it with.');
            } else if (picked === position) {
              picked = null;
              say('Tap two tiles to swap them.');
            } else {
              var swap = order[picked]; order[picked] = order[position]; order[position] = swap;
              picked = null;
              moves += 1;
              say(sorted() ? 'In order, lightest to darkest, in ' + moves + (moves === 1 ? ' swap' : ' swaps') + '. Nicely done.' : moves + (moves === 1 ? ' swap so far.' : ' swaps so far.'));
            }
            draw();
            var again = row.children[position];
            if (again && !again.disabled) again.focus({ preventScroll: true });
          });
          row.appendChild(tile);
        });
      }

      function deal() {
        do { order = shuffle([0, 1, 2, 3, 4, 5, 6]); } while (sorted());
        picked = null; moves = 0;
        say('Tap two tiles to swap them.');
        draw();
      }

      area.appendChild(row);
      var ends = el('div', 'sort-ends');
      ends.setAttribute('aria-hidden', 'true');
      ends.appendChild(el('span', null, 'Lightest'));
      ends.appendChild(el('span', null, 'Darkest'));
      area.appendChild(ends);
      controls.appendChild(button('quiz-back', 'Shuffle again', deal));
      deal();
    }
  };

  /* ---------- 5. Echo ---------- */
  GAMES.echo = {
    name: 'Echo',
    help: 'Watch the tiles light up, then tap them in the same order. Each round adds one more.',
    start: function () {
      var pads = [];
      var grid = el('div', 'echo-grid');
      var sequence = [];
      var position = 0;
      var listening = false;
      var timers = [];
      var startButton;

      function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
      function stop() { timers.forEach(function (t) { window.clearTimeout(t); }); timers = []; }

      function setPads(enabled) {
        pads.forEach(function (pad) { pad.disabled = !enabled; });
      }

      function play() {
        listening = false;
        setPads(false);
        area.setAttribute('data-sequence', sequence.join(','));
        say('Round ' + sequence.length + '. Watch.');
        sequence.forEach(function (padIndex, step) {
          later(function () { pads[padIndex].classList.add('is-lit'); }, 500 + step * 800);
          later(function () { pads[padIndex].classList.remove('is-lit'); }, 500 + step * 800 + 520);
        });
        later(function () {
          listening = true;
          position = 0;
          setPads(true);
          say('Round ' + sequence.length + '. Your turn.');
        }, 500 + sequence.length * 800);
      }

      function nextRound() {
        sequence.push(Math.floor(Math.random() * 4));
        play();
      }

      SYMBOLS.slice(0, 4).forEach(function (symbol, index) {
        var pad = el('button', 'echo-pad');
        pad.type = 'button';
        pad.disabled = true;
        pad.setAttribute('aria-label', symbol.name);
        pad.innerHTML = symbol.svg;
        pad.addEventListener('click', function () {
          if (!listening) return;
          if (index === sequence[position]) {
            position += 1;
            if (position === sequence.length) {
              listening = false;
              setPads(false);
              say('That is ' + sequence.length + ' in a row. One more is coming.');
              later(nextRound, 1100);
            }
          } else {
            listening = false;
            setPads(false);
            say('Not quite. Watch it once more.');
            later(play, 1100);
          }
        });
        pads.push(pad);
        grid.appendChild(pad);
      });

      area.appendChild(grid);
      startButton = button('quiz-next', 'Start', function () {
        stop();
        sequence = [];
        startButton.textContent = 'Start over';
        nextRound();
      });
      controls.appendChild(startButton);
      say('Press Start when you are ready.');
      return function () { stop(); area.removeAttribute('data-sequence'); };
    }
  };

  /* ---------- 6. Ripple pond ---------- */
  GAMES.ripple = {
    name: 'Ripple pond',
    help: 'Tap the water and watch the ripples spread. That is all there is to it.',
    start: function () {
      var pond = el('div', 'pond');
      var count = 0;
      var timers = [];

      function drop(xPercent, yPercent) {
        var ripple = el('span', 'ripple');
        ripple.style.left = xPercent + '%';
        ripple.style.top = yPercent + '%';
        pond.appendChild(ripple);
        count += 1;
        say(count === 1 ? '1 ripple' : count + ' ripples');
        timers.push(window.setTimeout(function () {
          if (ripple.parentNode === pond) pond.removeChild(ripple);
        }, 3200));
      }

      pond.addEventListener('pointerdown', function (event) {
        var box = pond.getBoundingClientRect();
        drop(((event.clientX - box.left) / box.width) * 100, ((event.clientY - box.top) / box.height) * 100);
      });

      area.appendChild(pond);
      controls.appendChild(button('quiz-back', 'Drop a pebble', function () {
        drop(rand(15, 85), rand(20, 80));
      }));
      say('The water is still.');
      return function () { timers.forEach(function (t) { window.clearTimeout(t); }); };
    }
  };

  /* ---------- Menu and stage ---------- */
  function close() {
    if (cleanup) cleanup();
    cleanup = null;
    current = '';
    while (area.firstChild) area.removeChild(area.firstChild);
    while (controls.firstChild) controls.removeChild(controls.firstChild);
    statusEl.textContent = '';
    stage.hidden = true;
    menu.hidden = false;
  }

  function open(id) {
    var game = GAMES[id];
    close();
    if (!game) return;
    current = id;
    nameEl.textContent = game.name;
    helpEl.textContent = game.help;
    stage.setAttribute('data-game', id);
    menu.hidden = true;
    stage.hidden = false;
    cleanup = game.start() || null;
    nameEl.focus({ preventScroll: true });
    stage.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function route() {
    var id = window.location.hash.replace('#', '');
    if (!GAMES[id]) id = '';
    if (id === current) return;
    open(id);
  }

  Array.prototype.forEach.call(menu.querySelectorAll('[data-game]'), function (trigger) {
    trigger.addEventListener('click', function () {
      var id = trigger.getAttribute('data-game');
      window.location.hash = id;
      open(id);
    });
  });

  back.addEventListener('click', function () {
    var last = current;
    if (window.history && window.history.pushState) {
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
    } else {
      window.location.hash = '';
    }
    close();
    var trigger = menu.querySelector('[data-game="' + last + '"]');
    if (trigger) trigger.focus({ preventScroll: true });
  });

  window.addEventListener('hashchange', route);
  route();
})();
