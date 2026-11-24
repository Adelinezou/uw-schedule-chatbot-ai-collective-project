/* Toggles the opening state: assistant view shown and no message in the thread yet. */
(function () {
  const conv = document.querySelector('.conversation'), thread = document.getElementById('thread');
  if (!conv || !thread) return;
  let intro = null, timer;
  function sync() {
    const now = !conv.classList.contains('hidden') && thread.children.length === 0;
    if (now === intro) return;
    if (intro === true && !now) {                     // first message sent: play the settle-in animation
      document.body.classList.add('intro-exit');
      clearTimeout(timer); timer = setTimeout(() => document.body.classList.remove('intro-exit'), 700);
    }
    intro = now;
    document.body.classList.toggle('is-intro', now);
  }
  sync();
  const watch = new MutationObserver(sync);
  watch.observe(thread, { childList: true });
  watch.observe(conv, { attributes: true, attributeFilter: ['class'] });
})();
