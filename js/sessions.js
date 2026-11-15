// Guided sessions: short, step-by-step exercises read at your own pace. Nothing is saved.
(function () {
  'use strict';

  var list = document.getElementById('session-list');
  var player = document.getElementById('session-player');
  if (!list || !player) return;

  var SESSIONS = [
    {
      id: 'grounding',
      title: '5-4-3-2-1 grounding',
      length: 'About 2 minutes',
      about: 'For when your thoughts are racing. Uses your senses to bring you back to the room you are in.',
      steps: [
        ['Arrive', 'Sit or stand comfortably. Let your shoulders drop. Take one slow breath in and a longer breath out.'],
        ['5 things you can see', 'Look around slowly. Name five things you can see, one at a time. Notice a color or a shape in each.'],
        ['4 things you can feel', 'Notice four things touching you: your feet on the floor, the chair, your clothes, the air on your skin.'],
        ['3 things you can hear', 'Listen for three sounds. Near ones, far ones. You do not need to like them, only notice them.'],
        ['2 things you can smell', 'Find two smells, even faint ones. If you cannot find any, remember two smells you like.'],
        ['1 thing you can taste', 'Notice one taste in your mouth, or take a sip of water and notice that.'],
        ['Back in the room', 'Take one more slow breath. You are here, and this moment is manageable. Carry on gently.']
      ]
    },
    {
      id: 'unclench',
      title: 'Unclench',
      length: 'About 1 minute',
      about: 'For a tight jaw, raised shoulders and clenched hands. Tense on purpose, then let go.',
      steps: [
        ['Hands', 'Make two fists and squeeze for a slow count of five. Then open your hands and let them go heavy.'],
        ['Shoulders', 'Lift your shoulders up towards your ears. Hold for five. Let them drop all at once.'],
        ['Jaw', 'Press your teeth together gently for three. Then let your jaw hang loose and your tongue rest.'],
        ['Forehead', 'Raise your eyebrows as high as they go. Hold for three. Let your whole face soften.'],
        ['One long breath', 'Breathe in through your nose. Breathe out slowly, as if through a straw. Notice what feels looser.']
      ]
    },
    {
      id: 'body-scan',
      title: 'Short body scan',
      length: 'About 3 minutes',
      about: 'For the end of the day, or any time you have been living in your head. Move your attention slowly through your body.',
      steps: [
        ['Settle', 'Sit or lie down. Close your eyes if that feels fine. Breathe normally; there is nothing to fix.'],
        ['Feet and legs', 'Bring your attention to your feet. Then your calves, knees and thighs. Notice warmth, weight or tingling. Stay for a few breaths.'],
        ['Belly and chest', 'Feel your belly rise and fall. Notice your chest and your heartbeat, if you can feel it. Let the breath be as it is.'],
        ['Back and shoulders', 'Notice where your back meets the chair or bed. Move up to your shoulders. If they are tight, let them be heavy.'],
        ['Arms and hands', 'Let your attention travel down your arms to your fingertips. Let your hands rest open.'],
        ['Neck, jaw and face', 'Soften your neck. Unclench your jaw. Let the space between your eyebrows widen.'],
        ['Whole body', 'Feel your whole body at once, breathing. Stay for three breaths. Open your eyes when you are ready.']
      ]
    },
    {
      id: 'worry-window',
      title: 'Worry window',
      length: 'About 5 minutes',
      about: 'For one worry that keeps coming back. Give it a few minutes of proper attention, then put it down.',
      steps: [
        ['Pick one worry', 'Choose the one that is loudest right now. Only one. The others can wait their turn.'],
        ['Say it in one sentence', 'Put the worry into a single plain sentence, out loud or on paper. "I am worried that..."'],
        ['Fact or story?', 'Ask: what do I actually know here, and what am I guessing? Notice which parts are guesses.'],
        ['Can I act on it this week?', 'If yes, decide one small step and when you will do it. If no, say: "This one is not mine to solve today."'],
        ['Set a time to come back', 'If the worry still needs thought, choose when you will return to it, for example tomorrow at the same time. Until then it can wait.'],
        ['Close the window', 'Take a slow breath. Stand up or stretch. The window is closed for now. Go and do one ordinary thing.']
      ]
    }
  ];

  var current = null;
  var index = 0;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function showList(message) {
    current = null;
    player.hidden = true;
    list.hidden = false;
    var note = document.getElementById('session-note');
    note.textContent = message || '';
  }

  function render() {
    var step = current.steps[index];
    var last = index === current.steps.length - 1;
    clear(player);

    var head = el('div', 'quiz-head');
    head.appendChild(el('span', 'quiz-kicker', current.title));
    head.appendChild(el('span', 'quiz-count', 'Step ' + (index + 1) + ' of ' + current.steps.length));
    player.appendChild(head);

    var track = el('div', 'quiz-track');
    track.setAttribute('aria-hidden', 'true');
    var fill = el('div', 'quiz-fill');
    fill.style.width = Math.round(((index + 1) / current.steps.length) * 100) + '%';
    track.appendChild(fill);
    player.appendChild(track);

    var title = el('h2', 'session-step-title', step[0]);
    title.tabIndex = -1;
    player.appendChild(title);
    player.appendChild(el('p', 'session-step-text', step[1]));

    var actions = el('div', 'quiz-actions');
    var back = el('button', 'quiz-back', index === 0 ? 'End session' : 'Back');
    back.type = 'button';
    back.addEventListener('click', function () {
      if (index === 0) { showList(''); return; }
      index -= 1;
      render();
    });
    actions.appendChild(back);

    var next = el('button', 'quiz-next', last ? 'Finish' : 'Next');
    next.type = 'button';
    next.addEventListener('click', function () {
      if (last) { showList('Nicely done. Come back whenever you need it.'); return; }
      index += 1;
      render();
    });
    actions.appendChild(next);
    player.appendChild(actions);

    title.focus();
  }

  SESSIONS.forEach(function (session) {
    var card = el('li', 'session-card');
    card.appendChild(el('h2', 'session-title', session.title));
    card.appendChild(el('p', 'session-length', session.length + ' · ' + session.steps.length + ' steps'));
    card.appendChild(el('p', 'session-about', session.about));
    var start = el('button', 'quiz-next', 'Start');
    start.type = 'button';
    start.setAttribute('aria-label', 'Start ' + session.title);
    start.addEventListener('click', function () {
      current = session;
      index = 0;
      list.hidden = true;
      player.hidden = false;
      render();
    });
    card.appendChild(start);
    list.appendChild(card);
  });
})();
