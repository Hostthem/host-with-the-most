// Uses logo.jpg from this folder when present. Otherwise shows a vector recreation of the logo.
const LOGO = 'logo.jpg';
const LOGO_SVG = "<svg viewBox='295 355 535 320' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='Host with the Most Agency'><polygon points='307,368 352,395 352,502 307,502' fill='#fff'/><polygon points='415,395 458,420 458,597 415,597' fill='#fff'/><polygon points='381,403 405,438 381,468 357,438' fill='#ec1c0f'/><polygon points='369,466 393,466 405,583 381,618 355,583' fill='#ec1c0f'/><text x='484' y='462' font-family='Montserrat,Arial,sans-serif' font-weight='800' font-size='63' fill='#fff' textLength='328' lengthAdjust='spacingAndGlyphs'>HOST WITH</text><text x='486' y='530' font-family='Montserrat,Arial,sans-serif' font-weight='800' font-size='63' fill='#fff' textLength='320' lengthAdjust='spacingAndGlyphs'>THE MOST</text><text x='480' y='597' font-family='Montserrat,Arial,sans-serif' font-weight='300' font-size='92' fill='#ec1c0f' textLength='323' lengthAdjust='spacingAndGlyphs'>agency</text><text x='308' y='658' font-family='Montserrat,Arial,sans-serif' font-weight='500' font-size='28' fill='#fff' textLength='480' lengthAdjust='spacing'>Your Event Our Passion</text></svg>";
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.hasAttribute('data-logo')) {
    const s = document.createElement('span');
    s.className = 'logosvg'; s.innerHTML = LOGO_SVG; t.replaceWith(s);
  }
}, true);
