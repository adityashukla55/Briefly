try {
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone || localStorage.getItem('briefly-returning')) document.documentElement.classList.add('returning');
} catch {}
