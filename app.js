(() => {
 const status = document.querySelector('#offline-status');
 const install = document.querySelector('#install');
 const instructions = document.querySelector('#install-instructions');
 const guide = document.querySelector('#install-guide');
 const supported = location.protocol !== 'file:' && window.isSecureContext && 'serviceWorker' in navigator;
 let prompt;
 const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
 const help = document.querySelector('#install-help');
 function showGuide() {
  if (typeof active !== 'undefined' && active && !paused) togglePause();
  instructions.textContent = !supported
   ? 'Open the game from an HTTPS website or localhost to enable installation and offline play. Opening index.html directly still lets you play, but cannot install the app.'
   : 'Once “Ready to play offline” appears, you can reopen this same address without internet. To install, use Install game when available, or your browser’s Install app / Add to Home Screen menu. On iPhone or iPad, open in Safari, tap Share, then Add to Home Screen. Scores stay in this browser on this device.';
  guide.hidden=false;help.setAttribute('aria-expanded','true');guide.focus();
 }
 help.addEventListener('click', showGuide);
 document.querySelector('#install-close').addEventListener('click',()=>{guide.hidden=true;help.setAttribute('aria-expanded','false');help.focus();});
 window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); prompt=event; install.textContent=installed()?'Game installed':'Install game'; });
 install.addEventListener('click', async () => {
  if (!prompt) { showGuide(); return; }
  const current=prompt; prompt=null;
  try { await current.prompt();await current.userChoice; } catch { instructions.textContent='Use your browser’s Install app or Add to Home Screen menu.';showGuide(); }
 });
 window.addEventListener('appinstalled', () => { prompt=null;install.hidden=true; });
 if (!supported) { status.textContent='Play here · Open from a website to enable offline installation.';return; }
 const updateStatus = () => { status.textContent=navigator.onLine?'Ready to play offline':'Offline · Your game is ready'; };
 navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => {
  updateStatus();window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
 }).catch(() => { status.textContent='Offline setup could not finish. Reopen while online to try again.'; });
})();
