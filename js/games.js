// Calm games: bubble pop and memory match. No timers, no scores to beat, nothing saved.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  /* ---------- Bubble pop ---------- */
  var field = document.getElementById('bubble-field');
  var countText = document.getElementById('bubble-count');
  if (field && countText) {
    var popped = 0;
    var BUBBLES = 9;

    var place = function (bubble) {
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
    };

    var makeBubble = function () {
      var bubble = document.createElement('button');
      bubble.type = 'button';
      bubble.className = 'bubble';
      bubble.setAttribute('aria-label', 'Bubble');
      place(bubble);
      bubble.addEventListener('animationiteration', function () {
        bubble.style.left = rand(2, 86) + '%';
      });
      bubble.addEventListener('click', function () {
        if (bubble.classList.contains('is-popped')) return;
        bubble.classList.add('is-popped');
        popped += 1;
        countText.textContent = popped === 1 ? '1 bubble popped' : popped + ' bubbles popped';
        window.setTimeout(function () {
          var fresh = makeBubble();
          if (!reduceMotion) fresh.style.animationDelay = '0s';
          field.replaceChild(fresh, bubble);
        }, 320);
      });
      return bubble;
    };

    for (var i = 0; i < BUBBLES; i++) field.appendChild(makeBubble());
  }

  /* ---------- Memory match ---------- */
  var board = document.getElementById('match-board');
  var matchStatus = document.getElementById('match-status');
  var matchReset = document.getElementById('match-reset');
  if (board && matchStatus && matchReset) {
    var ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
    var SYMBOLS = [
      { name: 'sun', svg: ICON + '<circle cx="12" cy="12" r="4"></circle><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"></path></svg>' },
      { name: 'moon', svg: ICON + '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"></path></svg>' },
      { name: 'leaf', svg: ICON + '<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"></path><path d="M5 19c3-5 6-8 10-10"></path></svg>' },
      { name: 'wave', svg: ICON + '<path d="M3 9c3-3 6 3 9 0s6 3 9 0"></path><path d="M3 15c3-3 6 3 9 0s6 3 9 0"></path></svg>' },
      { name: 'cloud', svg: ICON + '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9.5a4.2 4.2 0 0 1 0 8.5z"></path></svg>' },
      { name: 'star', svg: ICON + '<path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z"></path></svg>' }
    ];

    var open = [];
    var moves = 0;
    var matched = 0;
    var locked = false;

    var label = function (card, index, faceUp) {
      card.setAttribute('aria-label', 'Card ' + (index + 1) + (faceUp ? ': ' + card.getAttribute('data-name') : ', face down'));
    };

    var show = function (card, index) {
      card.classList.add('is-open');
      label(card, index, true);
    };

    var hide = function (card, index) {
      card.classList.remove('is-open');
      label(card, index, false);
    };

    var deal = function () {
      var deck = SYMBOLS.concat(SYMBOLS).map(function (symbol) { return symbol; });
      for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var swap = deck[i]; deck[i] = deck[j]; deck[j] = swap;
      }
      while (board.firstChild) board.removeChild(board.firstChild);
      open = []; moves = 0; matched = 0; locked = false;
      matchStatus.textContent = 'Find the six pairs. Take your time.';

      deck.forEach(function (symbol, index) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'match-card';
        card.setAttribute('data-name', symbol.name);
        card.innerHTML = '<span class="match-face">' + symbol.svg + '</span>';
        label(card, index, false);
        card.addEventListener('click', function () {
          if (locked || card.classList.contains('is-open') || card.classList.contains('is-matched')) return;
          show(card, index);
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
            matchStatus.textContent = matched === SYMBOLS.length
              ? 'All six pairs found in ' + moves + ' moves. Nicely done.'
              : 'A pair. ' + (SYMBOLS.length - matched) + ' to go.';
          } else {
            locked = true;
            matchStatus.textContent = 'Not a pair. Try another.';
            window.setTimeout(function () {
              hide(first.card, first.index);
              hide(second.card, second.index);
              locked = false;
            }, 900);
          }
        });
        board.appendChild(card);
      });
    };

    matchReset.addEventListener('click', deal);
    deal();
  }
})();
