/* Hide / show the left and right sidebars.
   Buttons live in the top bar; shortcuts: Ctrl+B (left), Ctrl+Shift+B (right). State is not saved. */
(function () {
  const left = document.getElementById('toggleRail'), right = document.getElementById('toggleContext');
  if (!left || !right) return;
  function toggle(button, cls, side) {
    const hidden = document.body.classList.toggle(cls);
    const label = `${hidden ? 'Show' : 'Hide'} ${side} sidebar`;
    button.setAttribute('aria-expanded', String(!hidden));
    button.setAttribute('aria-label', label);
    button.title = label;
  }
  left.addEventListener('click', () => toggle(left, 'rail-hidden', 'left'));
  right.addEventListener('click', () => toggle(right, 'context-hidden', 'right'));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      (event.shiftKey ? right : left).click();
    }
  });
})();
