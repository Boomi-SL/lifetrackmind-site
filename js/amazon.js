// Shows Amazon product images and exact product links on the Bookshelf and Calm shop pages.
// The data comes from data/amazon.json, which a scheduled job refreshes from the Amazon Creators API.
// If the file is missing or more than 24 hours old, the cards keep their plain covers and search links.
(function () {
  'use strict';

  var cards = document.querySelectorAll('[data-amz]');
  if (!cards.length || !window.fetch) return;

  var MAX_AGE = 24 * 60 * 60 * 1000;

  function apply(data) {
    if (!data || !data.items || !data.updated) return;
    var age = Date.now() - Date.parse(data.updated);
    if (!(age >= 0 && age <= MAX_AGE)) return;

    Array.prototype.forEach.call(cards, function (card) {
      var item = data.items[card.getAttribute('data-amz')];
      if (!item) return;

      var link = card.querySelector('a.shelf-link');
      if (link && typeof item.url === 'string' && item.url.indexOf('https://www.amazon.com/') === 0) {
        link.href = item.url;
      }

      var image = item.image;
      if (!image || typeof image.url !== 'string' || image.url.indexOf('https://') !== 0) return;

      var img = document.createElement('img');
      img.src = image.url;
      img.alt = '';
      // Not lazy: the image is only added to the page after it loads, and an image that is
      // not on the page yet never starts a lazy load.
      img.setAttribute('fetchpriority', 'low');
      img.decoding = 'async';
      if (image.width && image.height) {
        img.width = image.width;
        img.height = image.height;
      }

      var cover = card.querySelector('.shelf-cover');
      if (cover) {
        // Swap in the photo only once it has loaded, so a broken link never blanks the cover.
        img.addEventListener('load', function () {
          while (cover.firstChild) cover.removeChild(cover.firstChild);
          cover.appendChild(img);
          cover.classList.add('has-img');
        });
      } else {
        var frame = document.createElement('div');
        frame.className = 'shop-photo';
        frame.setAttribute('aria-hidden', 'true');
        frame.appendChild(img);
        img.addEventListener('load', function () {
          card.insertBefore(frame, card.firstChild);
        });
      }
    });
  }

  fetch('data/amazon.json', { cache: 'no-store' })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(apply)
    .catch(function () { /* keep the plain cards */ });
})();
