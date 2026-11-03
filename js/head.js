// Runs before paint: marks JS availability and restores the sound preference class.
document.documentElement.classList.replace('no-js', 'js');
try { if (localStorage.getItem('mtbr-sound') === 'on') document.documentElement.classList.add('is-sound-on'); } catch (e) {}
// Vercel Web Analytics queue (the script itself is deferred from /_vercel/insights/script.js)
window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
