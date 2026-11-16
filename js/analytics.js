/* Google Analytics, loaded only after the visitor says yes. The choice is kept in this browser. */
(function () {
  var ID = 'G-H6KYFYNRJ4';
  var KEY = 'ltm-consent';
  var loaded = false;
  var box = null;

  function read() { try { return window.localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { window.localStorage.setItem(KEY, v); } catch (e) {} }

  function load() {
    if (loaded || window.location.protocol === 'file:') { return; }
    loaded = true;
    window['ga-disable-' + ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }

  function stop() {
    window['ga-disable-' + ID] = true;
    var parts = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < parts.length; i++) {
      var name = parts[i].split('=')[0].replace(/^\s+/, '');
      if (name.indexOf('_ga') === 0) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + window.location.hostname;
      }
    }
  }

  function close() { if (box && box.parentNode) { box.parentNode.removeChild(box); } box = null; }

  function choose(v) {
    write(v);
    if (v === 'yes') { load(); } else { stop(); }
    close();
  }

  function button(label, cls, value) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = cls;
    b.appendChild(document.createTextNode(label));
    b.addEventListener('click', function () { choose(value); });
    return b;
  }

  function show() {
    if (box) { return; }
    box = document.createElement('div');
    box.className = 'cookie-box';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Cookie choice');
    var p = document.createElement('p');
    p.className = 'cookie-text';
    p.appendChild(document.createTextNode('We would like to use Google Analytics cookies to count visits and see which pages help. Nothing you type in the tools is included. '));
    var a = document.createElement('a');
    a.href = (document.querySelector('a[href$="privacy.html"]') || { href: 'privacy.html' }).href;
    a.appendChild(document.createTextNode('Privacy policy'));
    p.appendChild(a);
    var row = document.createElement('div');
    row.className = 'cookie-actions';
    row.appendChild(button('No thanks', 'cookie-no', 'no'));
    row.appendChild(button('OK', 'cookie-yes', 'yes'));
    box.appendChild(p);
    box.appendChild(row);
    document.body.appendChild(box);
  }

  function start() {
    var choice = read();
    if (choice === 'yes') { load(); } else if (choice !== 'no') { show(); }
    var links = document.querySelectorAll('[data-cookie-settings]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function () { show(); if (box) { box.querySelector('button').focus(); } });
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
