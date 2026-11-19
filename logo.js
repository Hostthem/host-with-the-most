// The logo is loaded from logo.jpg in this folder. If it is missing, a text name is shown instead.
const LOGO = 'logo.jpg';
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.hasAttribute('data-logo')) {
    const s = document.createElement('span');
    s.textContent = 'HOST WITH THE MOST AGENCY';
    s.style.cssText = 'color:#fff;font:800 1rem Montserrat,sans-serif;letter-spacing:.04em';
    t.replaceWith(s);
  }
}, true);
