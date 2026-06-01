export function showView(id, direction) {
  document.querySelectorAll('.view').forEach((v) => {
    v.classList.remove('active', 'anim-forward', 'anim-back');
  });
  const view = document.getElementById(id);
  view.classList.add('active');
  if (direction === 'forward') view.classList.add('anim-forward');
  if (direction === 'back')    view.classList.add('anim-back');
  if (id === 'viewAdd') {
    setTimeout(() => document.getElementById('inputName').focus(), 50);
  }
}
