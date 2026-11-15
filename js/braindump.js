// Brain dump: write thoughts, then sort each into "I can do something" or "Out of my hands".
// Nothing is saved or sent; closing the page clears it.
(function () {
  'use strict';

  var input = document.getElementById('dump-input');
  if (!input) return;

  var sortButton = document.getElementById('dump-sort');
  var writeStep = document.getElementById('dump-write');
  var sortStep = document.getElementById('dump-sorting');
  var inbox = document.getElementById('dump-inbox');
  var inboxWrap = document.getElementById('dump-inbox-wrap');
  var canList = document.getElementById('dump-can');
  var cannotList = document.getElementById('dump-cannot');
  var canEmpty = document.getElementById('dump-can-empty');
  var cannotEmpty = document.getElementById('dump-cannot-empty');
  var done = document.getElementById('dump-done');
  var restart = document.getElementById('dump-restart');
  var hint = document.getElementById('dump-hint');

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function refresh() {
    var left = inbox.children.length;
    inboxWrap.hidden = left === 0;
    done.hidden = left !== 0;
    canEmpty.hidden = canList.children.length !== 0;
    cannotEmpty.hidden = cannotList.children.length !== 0;
  }

  function sortedItem(text, target) {
    var item = el('li', 'dump-item');
    item.appendChild(el('span', 'dump-item-text', text));
    var move = el('button', 'dump-move', target === canList ? 'Move to out of my hands' : 'Move to I can do something');
    move.type = 'button';
    move.addEventListener('click', function () {
      var other = target === canList ? cannotList : canList;
      item.parentNode.removeChild(item);
      other.appendChild(sortedItem(text, other));
      refresh();
    });
    item.appendChild(move);
    return item;
  }

  function inboxItem(text) {
    var item = el('li', 'dump-card');
    item.appendChild(el('p', 'dump-card-text', text));
    var row = el('div', 'dump-card-actions');
    [['I can do something', canList], ['Out of my hands', cannotList]].forEach(function (pair) {
      var button = el('button', 'dump-choice', pair[0]);
      button.type = 'button';
      button.addEventListener('click', function () {
        item.parentNode.removeChild(item);
        pair[1].appendChild(sortedItem(text, pair[1]));
        refresh();
        var next = inbox.querySelector('.dump-choice');
        (next || restart).focus();
      });
      row.appendChild(button);
    });
    item.appendChild(row);
    return item;
  }

  sortButton.addEventListener('click', function () {
    var lines = input.value.split('\n').map(function (line) {
      return line.trim();
    }).filter(function (line) {
      return line.length > 0;
    });
    if (lines.length === 0) {
      hint.textContent = 'Write at least one thought first. One per line.';
      input.focus();
      return;
    }
    hint.textContent = '';
    lines.forEach(function (line) {
      inbox.appendChild(inboxItem(line));
    });
    writeStep.hidden = true;
    sortStep.hidden = false;
    refresh();
    inbox.querySelector('.dump-choice').focus();
  });

  restart.addEventListener('click', function () {
    [inbox, canList, cannotList].forEach(function (list) {
      while (list.firstChild) list.removeChild(list.firstChild);
    });
    input.value = '';
    sortStep.hidden = true;
    writeStep.hidden = false;
    input.focus();
  });
})();
