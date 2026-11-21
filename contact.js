/* WhatsApp contact page: both agency lines. Loaded after app.js. */
const WA_LINES = [
  {number: '237679672445', display: '+237 679 672 445'},
  {number: '237652776492', display: '+237 652 776 492'}
];
const waTo = (i, text) => 'https://wa.me/' + WA_LINES[i].number + (text ? '?text=' + encodeURIComponent(text) : '');
const waButtons = (text, prefix) => WA_LINES.map((l, i) => `<a class='btn wa' style='margin:4px 8px 4px 0' href='${esc(waTo(i, text))}' target='_blank' rel='noopener'>${prefix} ${l.display}</a>`).join('');

ContactView.prototype.html = function () {
  return `<section><div class='wrap'><div class='split'><div><h1>Contact us</h1>
<p class='muted'>Planning something special? Message either of our WhatsApp lines and we will reply within 24 hours.</p>
${WA_LINES.map((l, i) => `<div class='row'><span>Line ${i + 1}</span><a href='tel:+${l.number}'>${l.display}</a></div>`).join('')}
<div class='row'><span>Based in</span><span>Buea, Cameroon</span></div>
<p>${waButtons('Hello Host with the Most, I would like to make an enquiry.', 'Chat on')}</p></div>
<form id='cf' class='card' novalidate><label for='cn'>Name</label><input id='cn' autocomplete='name'>
<label for='cp'>Your phone / WhatsApp</label><input id='cp' type='tel' autocomplete='tel'>
<label for='cl'>Send to</label><select id='cl'>${WA_LINES.map((l, i) => `<option value='${i}'>${l.display}</option>`).join('')}</select>
<label for='cm'>Message</label><textarea id='cm' rows='4'></textarea>
<div class='err' id='cerr'></div><button class='btn wa' type='submit'>Send on WhatsApp</button></form></div></div></section>`;
};

ContactView.prototype.mount = function (el) {
  const f = el.querySelector('#cf');
  f.onsubmit = e => {
    e.preventDefault();
    const name = f.cn.value.trim(), phone = f.cp.value.trim(), msg = f.cm.value.trim();
    if (!name || digits(phone).length < 8 || !msg) { el.querySelector('#cerr').textContent = 'Please fill in your name, a valid phone number and a message.'; return; }
    const text = 'Hello Host with the Most, I am ' + name + ' (' + phone + '). ' + msg;
    window.open(waTo(+f.cl.value, text), '_blank', 'noopener');
    f.innerHTML = `<h3>Almost done ✓</h3><p class='muted'>WhatsApp should have opened with your message. If not, tap a button below. You can also send it to our other line.</p>${waButtons(text, 'Send to')}`;
  };
};

// Re-render in case the visitor landed directly on the contact page.
window.dispatchEvent(new HashChangeEvent('hashchange'));
