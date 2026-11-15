// Overthinker quiz. Runs entirely in the browser: no answers leave the page.
(function () {
  'use strict';

  var root = document.getElementById('quiz-app');
  if (!root) return;

  // Each option carries the type it points to:
  // M = mind reader, R = replayer, F = forecaster, C = comparer.
  var QUESTIONS = [
    {
      q: 'A friend takes hours to reply. Where does your mind go first?',
      a: [
        ['I must have said something wrong', 'M'],
        ['I replay our last conversation', 'R'],
        ['I plan what I will say next', 'F'],
        ['I wonder why other friendships seem easier', 'C']
      ]
    },
    {
      q: 'You make a small mistake at work. What happens next in your head?',
      a: [
        ['I go over the moment again and again', 'R'],
        ['Everyone noticed and thinks less of me', 'M'],
        ['I think of people who never seem to slip', 'C'],
        ['I picture everything that could go wrong because of it', 'F']
      ]
    },
    {
      q: 'It is 2 a.m. and you cannot sleep. What is keeping you up?',
      a: [
        ['Tomorrow, and everything that could happen', 'F'],
        ['Something I said or did earlier', 'R'],
        ['Where I am in life next to other people', 'C'],
        ['What someone meant by a comment', 'M']
      ]
    },
    {
      q: 'You have a big decision to make. What slows you down?',
      a: [
        ['Looking at what others chose and doubting mine', 'C'],
        ['Running through every what-if', 'F'],
        ['Worrying what people will think of my choice', 'M'],
        ['Remembering past choices that went badly', 'R']
      ]
    },
    {
      q: 'You scroll social media for ten minutes. How do you feel after?',
      a: [
        ['Behind, like everyone is ahead of me', 'C'],
        ['Wondering why someone did not reply to my post', 'M'],
        ['Reminded of something I wish I had done differently', 'R'],
        ['Anxious about what I should be doing next', 'F']
      ]
    },
    {
      q: 'Someone gives you a compliment. What is your first thought?',
      a: [
        ['They are just being polite', 'M'],
        ['Now I have to keep this up', 'F'],
        ['I think of the times I did not do so well', 'R'],
        ['Other people still do it better', 'C']
      ]
    },
    {
      q: 'A plan gets cancelled at the last minute. What do you do?',
      a: [
        ['I look back for what I did to cause it', 'R'],
        ['I start rearranging the whole week in my head', 'F'],
        ['I think maybe they did not want to see me', 'M'],
        ['I notice other people’s plans never seem to fall through', 'C']
      ]
    },
    {
      q: 'When your mind finally goes quiet, what helped most?',
      a: [
        ['Picking one small next step', 'F'],
        ['Getting off my phone and back to my own day', 'C'],
        ['Asking the person instead of guessing', 'M'],
        ['Writing it down so I could stop repeating it', 'R']
      ]
    }
  ];

  var RESULTS = {
    M: {
      name: 'The Mind Reader',
      text: 'When you do not know what someone is thinking, your mind writes the story for them, and it is rarely a kind one. Silence turns into meaning very quickly.',
      steps: [
        'Ask yourself: what do I actually know, and what did I add?',
        'Give a slow reply three ordinary reasons before a painful one.',
        'When it really matters, ask the person instead of guessing.'
      ]
    },
    R: {
      name: 'The Replayer',
      text: 'Your mind keeps going back. A sentence, a look, a mistake: you run it again hoping it will feel different this time. It is your way of trying to fix what already happened.',
      steps: [
        'Write the moment down once, in full, then close the page.',
        'Ask: is there one thing to repair or learn here? Do that one thing.',
        'When the replay starts again, stand up and move for two minutes.'
      ]
    },
    F: {
      name: 'The Forecaster',
      text: 'Your mind lives a few steps ahead, preparing for every way things could go. It feels like planning, but most of what you prepare for never arrives.',
      steps: [
        'Pick the one what-if that matters most and write a single next step for it.',
        'Give worry a set fifteen minutes a day, at the same time and place.',
        'Come back to now: five slow breaths, then name three things you can see.'
      ]
    },
    C: {
      name: 'The Comparer',
      text: 'You measure your life against other people’s, and you usually come out behind. You are comparing your whole story to the parts they choose to show.',
      steps: [
        'Notice the moment you start comparing and name it: “I am comparing again.”',
        'Write down one thing that moved forward for you this month.',
        'Set a daily limit for the app that makes you feel most behind.'
      ]
    }
  };

  var index = 0;
  var answers = [];

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear() {
    while (root.firstChild) root.removeChild(root.firstChild);
  }

  function header(right) {
    var row = el('div', 'quiz-head');
    row.appendChild(el('span', 'quiz-kicker', 'Overthinker quiz'));
    row.appendChild(el('span', 'quiz-count', right));
    return row;
  }

  function progress(fraction) {
    var track = el('div', 'quiz-track');
    track.setAttribute('aria-hidden', 'true');
    var fill = el('div', 'quiz-fill');
    fill.style.width = Math.round(fraction * 100) + '%';
    track.appendChild(fill);
    return track;
  }

  function showQuestion(moveFocus) {
    var item = QUESTIONS[index];
    clear();
    root.appendChild(header('Question ' + (index + 1) + ' of ' + QUESTIONS.length));
    root.appendChild(progress((index + 1) / QUESTIONS.length));

    var title = el('h3', 'quiz-question', item.q);
    title.id = 'quiz-question';
    title.tabIndex = -1;
    root.appendChild(title);

    var list = el('div', 'quiz-options');
    list.setAttribute('role', 'group');
    list.setAttribute('aria-labelledby', 'quiz-question');

    var next = el('button', 'quiz-next', index === QUESTIONS.length - 1 ? 'See my result' : 'Next question');
    next.type = 'button';
    next.disabled = answers[index] == null;

    item.a.forEach(function (option, i) {
      var button = el('button', 'quiz-option', option[0]);
      button.type = 'button';
      button.setAttribute('aria-pressed', answers[index] === i ? 'true' : 'false');
      button.addEventListener('click', function () {
        answers[index] = i;
        Array.prototype.forEach.call(list.children, function (other, j) {
          other.setAttribute('aria-pressed', j === i ? 'true' : 'false');
        });
        next.disabled = false;
      });
      list.appendChild(button);
    });
    root.appendChild(list);

    var actions = el('div', 'quiz-actions');
    if (index > 0) {
      var back = el('button', 'quiz-back', 'Back');
      back.type = 'button';
      back.addEventListener('click', function () {
        index -= 1;
        showQuestion(true);
      });
      actions.appendChild(back);
    } else {
      actions.appendChild(el('span'));
    }
    next.addEventListener('click', function () {
      if (index === QUESTIONS.length - 1) {
        showResult();
      } else {
        index += 1;
        showQuestion(true);
      }
    });
    actions.appendChild(next);
    root.appendChild(actions);

    if (moveFocus) title.focus();
  }

  function winner() {
    var counts = { M: 0, R: 0, F: 0, C: 0 };
    var lastSeen = {};
    answers.forEach(function (choice, i) {
      var type = QUESTIONS[i].a[choice][1];
      counts[type] += 1;
      lastSeen[type] = i;
    });
    // Highest count wins; on a tie, the type answered most recently.
    return Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || (lastSeen[b] || 0) - (lastSeen[a] || 0);
    })[0];
  }

  function showResult() {
    var result = RESULTS[winner()];
    clear();
    root.appendChild(header('Your result'));
    root.appendChild(progress(1));

    var title = el('h3', 'quiz-result', result.name);
    title.tabIndex = -1;
    root.appendChild(title);
    root.appendChild(el('p', 'quiz-text', result.text));
    root.appendChild(el('p', 'quiz-steps-title', 'Three small steps that help'));

    var steps = el('ol', 'quiz-steps');
    result.steps.forEach(function (step) {
      steps.appendChild(el('li', null, step));
    });
    root.appendChild(steps);
    root.appendChild(el('p', 'quiz-note', 'This quiz is for self-reflection. It is not a diagnosis.'));

    var actions = el('div', 'quiz-actions');
    var again = el('button', 'quiz-back', 'Take it again');
    again.type = 'button';
    again.addEventListener('click', function () {
      index = 0;
      answers = [];
      showQuestion(true);
    });
    actions.appendChild(again);
    var more = el('a', 'quiz-next', 'Try the stress check-in');
    more.href = '#checkin';
    actions.appendChild(more);
    root.appendChild(actions);

    title.focus();
  }

  showQuestion(false);
})();
