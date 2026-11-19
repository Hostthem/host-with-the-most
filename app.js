'use strict';
const WA = '237679672445';
const money = n => new Intl.NumberFormat('en-US').format(Math.round(n)) + ' FRS';
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).split(String.fromCharCode(39)).join('&#39;').split(String.fromCharCode(34)).join('&quot;');
const digits = s => String(s).replace(/[^0-9]/g, '');
const waLink = t => 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);
const NL = String.fromCharCode(10);

/* ---------- Domain models ---------- */
class Service {
  constructor(id, name, icon, desc, rate) { Object.assign(this, {id, name, icon, desc, rate}); }
}
class Catalog {
  constructor() {
    // Edit rates here (FRS per person per day).
    this.items = [
      new Service('host', 'Event Hostesses', '💐', 'Polished, warm greeters who set the tone from the first hello.', 15000),
      new Service('usher', 'Ushers & Registration', '🎟️', 'Smooth check-in, seating and guest flow without the queues.', 15000),
      new Service('vip', 'VIP & Protocol Hosts', '🥂', 'Discreet, well-trained hosts for dignitaries and special guests.', 20000),
      new Service('brand', 'Brand Ambassadors', '🌟', 'Charming promoters who make your product the talk of the room.', 40000),
      new Service('serve', 'Catering & Service Staff', '🍽️', 'Attentive servers who keep every glass and plate on point.', 35000)
    ];
  }
  find(id) { return this.items.find(s => s.id === id); }
}
class Store {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
}
class PricingPolicy {
  discountFor(staffDays) { return staffDays >= 40 ? 0.10 : staffDays >= 20 ? 0.05 : 0; }
}
class Cart {
  constructor(catalog, store, policy) {
    this.catalog = catalog; this.store = store; this.policy = policy;
    const s = store.get('hwtm-cart', {});
    this.lines = s.lines || {}; this.days = s.days || 1; this.date = s.date || '';
  }
  save() { this.store.set('hwtm-cart', {lines: this.lines, days: this.days, date: this.date}); }
  setQty(id, q) { q = Math.max(0, Math.min(200, q)); if (q) this.lines[id] = q; else delete this.lines[id]; this.save(); }
  setDays(d) { this.days = Math.max(1, Math.min(60, +d || 1)); this.save(); }
  get staff() { return Object.values(this.lines).reduce((a, b) => a + b, 0); }
  get staffDays() { return this.staff * this.days; }
  get entries() { return Object.entries(this.lines).map(([id, q]) => ({s: this.catalog.find(id), qty: q, total: this.catalog.find(id).rate * q * this.days})); }
  get subtotal() { return this.entries.reduce((a, e) => a + e.total, 0); }
  get discount() { return this.subtotal * this.policy.discountFor(this.staffDays); }
  get total() { return this.subtotal - this.discount; }
  clear() { this.lines = {}; this.days = 1; this.date = ''; this.save(); }
}
class Order {
  constructor(cart, d) {
    this.ref = 'HWM-' + Date.now().toString(36).toUpperCase().slice(-6);
    this.details = d; this.entries = cart.entries; this.days = cart.days; this.date = cart.date;
    this.total = cart.total; this.discount = cart.discount;
  }
  get message() {
    const d = this.details;
    const L = ['*New booking request ' + this.ref + '*', 'Name: ' + d.name, 'Phone: ' + d.phone, 'Event date: ' + this.date, 'Venue: ' + d.venue, ''];
    this.entries.forEach(e => L.push(e.qty + ' x ' + e.s.name + ' x ' + this.days + ' day(s) = ' + money(e.total)));
    if (this.discount) L.push('Volume discount: -' + money(this.discount));
    L.push('Total: ' + money(this.total), 'Payment: ' + d.pay + ' (' + money(d.amount) + ' now)');
    if (d.txid) L.push('MoMo ID: ' + d.txid + ' from ' + d.sender);
    if (d.email) L.push('Email: ' + d.email);
    if (d.notes) L.push('Notes: ' + d.notes);
    return L.join(NL);
  }
}
class CheckoutValidator {
  validEmail(e) { const i = e.indexOf('@'); return i > 0 && e.indexOf('.', i) > i + 1; }
  validate(d, cart) {
    const e = {};
    if (!cart.staff) e.cart = 'Add at least one staff member first.';
    if (!cart.date) e.date = 'Please pick your event date.';
    else if (new Date(cart.date) < new Date(new Date().toDateString())) e.date = 'Event date must be in the future.';
    if (!d.name.trim()) e.name = 'Your name is required.';
    if (digits(d.phone).length < 8) e.phone = 'Enter a valid phone number.';
    if (d.email && !this.validEmail(d.email)) e.email = 'That email does not look right.';
    if (!d.venue.trim()) e.venue = 'Tell us where the event is.';
    if (d.pay === 'MTN Mobile Money') {
      if (digits(d.sender).length < 8) e.sender = 'Enter the number you paid from.';
      if (d.txid.trim().length < 6) e.txid = 'Enter the transaction ID from your MoMo SMS.';
    }
    if (!d.terms) e.terms = 'Please accept the booking terms.';
    return e;
  }
}

/* ---------- Views ---------- */
class View {
  constructor(app) { this.app = app; }
  html() { return ''; }
  mount(el) {}
}
class HomeView extends View {
  html() {
    const a = this.app;
    return `<div class='hero'><div class='wrap'><p class='tag'>Your Event Our Passion</p><h1>Every great event starts with a great welcome.</h1>
<p>Trained, elegant and reliable hostesses and hospitality staff for weddings, conferences, launches and galas.</p>
<a class='btn' href='#book'>Book your staff</a><a class='btn alt' href='#services'>See services</a><a class='btn wa' href='https://wa.me/${WA}' target='_blank' rel='noopener'>Chat on WhatsApp</a></div></div>
<section><div class='wrap'><h2>What we do</h2><div class='grid'>${a.catalog.items.map(s => `<div class='card'><div class='ic'>${s.icon}</div><h3>${s.name}</h3><p class='muted'>${s.desc}</p><div class='price'>from ${money(s.rate)} / day</div></div>`).join('')}</div></div></section>
<section class='alt-bg'><div class='wrap'><div class='stats'><div><b>500+</b>events staffed</div><div><b>10 to 200</b>team sizes</div><div><b>24h</b>quote response</div></div></div></section>
<section><div class='wrap'><h2>Kind words</h2><div class='grid'>${a.testimonials.map(t => `<div class='card'><p class='quote'>“${t.q}”</p><p class='who'>${t.n}</p></div>`).join('')}</div></div></section>`;
  }
}
class AboutView extends View {
  html() {
    const ticks = ['Vetted staff', 'Briefed before every event', 'Uniforms and grooming standards', 'On-site team lead', 'Backup staff on standby'];
    const vals = [['Warmth', 'Every guest is greeted like a friend.'], ['Reliability', 'We show up early and stay until the last guest leaves.'], ['Professionalism', 'Discreet, polished and prepared.'], ['Care', 'We look after our staff, so they can look after your guests.']];
    return `<section><div class='wrap'><div class='split'><div><h1>About us</h1>
<p>Host with the Most is an event planning and hospitality staffing agency. We supply well-groomed, well-trained hostesses and service staff to businesses, families and institutions who want their guests to feel looked after.</p>
<p>We started with a simple belief: guests forget the speeches but remember how they were treated. So we train for warmth, punctuality and calm under pressure.</p>
<a class='btn' href='#contact'>Talk to our team</a></div>
<div class='card'><h3>Our promise</h3>${ticks.map(t => `<div class='row'><span>${t}</span><span>✓</span></div>`).join('')}</div></div></div></section>
<section class='alt-bg'><div class='wrap'><h2>Our values</h2><div class='grid'>${vals.map(v => `<div class='card'><h3>${v[0]}</h3><p class='muted'>${v[1]}</p></div>`).join('')}</div></div></section>`;
  }
}
class ServicesView extends View {
  html() {
    return `<section><div class='wrap'><h1>Services & rates</h1><p class='muted'>Rates are per person, per day. Larger bookings earn automatic discounts: 5% from 20 staff-days, 10% from 40.</p>
<div class='grid'>${this.app.catalog.items.map(s => `<div class='card'><div class='ic'>${s.icon}</div><h3>${s.name}</h3><p class='muted'>${s.desc}</p><div class='price'>${money(s.rate)} / person / day</div></div>`).join('')}</div>
<p style='margin-top:28px'><a class='btn' href='#book'>Build your booking</a></p></div></section>`;
  }
}
class BookView extends View {
  html() {
    const c = this.app.cart;
    return `<section><div class='wrap'><h1>Book your staff</h1><div class='split'><div>
${this.app.catalog.items.map(s => `<div class='card' style='margin-bottom:12px'><div class='top'><div><b>${s.icon} ${s.name}</b><div class='muted'>${money(s.rate)} / day</div></div>
<div class='qty'><button data-id='${s.id}' data-d='-1' aria-label='Fewer ${s.name}'>−</button><b>${c.lines[s.id] || 0}</b><button data-id='${s.id}' data-d='1' aria-label='More ${s.name}'>+</button></div></div></div>`).join('')}
<label for='days'>Number of days</label><input id='days' type='number' min='1' max='60' value='${c.days}'></div>
<div class='card'><h3>Your booking</h3>${this.summary(c)}
<a class='btn' href='#checkout' ${c.staff ? '' : `style='opacity:.5;pointer-events:none'`}>Continue to checkout</a></div></div></div></section>`;
  }
  summary(c) {
    if (!c.staff) return `<p class='muted'>Nothing here yet. Add staff to see your price.</p>`;
    return c.entries.map(e => `<div class='row'><span>${e.qty} × ${e.s.name} × ${c.days}d</span><span>${money(e.total)}</span></div>`).join('') +
      (c.discount ? `<div class='row'><span>Volume discount</span><span>−${money(c.discount)}</span></div>` : '') +
      `<div class='row total'><span>Total</span><span>${money(c.total)}</span></div>`;
  }
  mount(el) {
    const c = this.app.cart;
    el.querySelectorAll('.qty button').forEach(b => b.onclick = () => { c.setQty(b.dataset.id, (c.lines[b.dataset.id] || 0) + +b.dataset.d); this.app.render(); });
    el.querySelector('#days').onchange = e => { c.setDays(e.target.value); this.app.render(); };
  }
}
class CheckoutView extends View {
  html() {
    const c = this.app.cart;
    if (!c.staff) return `<section><div class='wrap ok'><h2>Your booking is empty</h2><a class='btn' href='#book'>Choose staff</a></div></section>`;
    const err = k => `<div class='err' data-e='${k}'></div>`;
    return `<section><div class='wrap'><h1>Checkout</h1><form id='f' novalidate class='split'><div>
<h3>Event details</h3>
<label for='date'>Event date</label><input id='date' type='date' value='${esc(c.date)}'>${err('date')}
<label for='venue'>Venue / location</label><input id='venue'>${err('venue')}
<h3 style='margin-top:24px'>Your details</h3>
<label for='name'>Full name</label><input id='name' autocomplete='name'>${err('name')}
<label for='phone'>Phone / WhatsApp</label><input id='phone' type='tel' autocomplete='tel'>${err('phone')}
<label for='email'>Email (optional)</label><input id='email' type='email' autocomplete='email'>${err('email')}
<label for='notes'>Notes (dress code, languages, timing)</label><textarea id='notes' rows='3'></textarea>
<h3 style='margin-top:24px'>Payment method</h3>
<p class='muted' style='margin:0 0 8px'>Online: Mobile Money. Offline: bank transfer or cash.</p>
<div class='pay'><label><input type='radio' name='pay' value='MTN Mobile Money' checked> MTN MoMo (online)</label><label><input type='radio' name='pay' value='Orange Money'> Orange Money (online)</label><label><input type='radio' name='pay' value='Bank transfer'> Bank transfer (offline)</label><label><input type='radio' name='pay' value='Cash / invoice'> Cash / invoice (offline)</label></div>
<div class='card' id='payinfo' style='margin-top:12px'></div>
<div id='momo'><label for='amt'>Amount to pay now</label><select id='amt'><option value='deposit'>Deposit (50%)</option><option value='full'>Full amount</option></select>
<label for='sender'>Number you paid from</label><input id='sender' type='tel'>${err('sender')}
<label for='txid'>MoMo transaction ID</label><input id='txid' placeholder='From your confirmation SMS'>${err('txid')}</div>
</div><div class='card'><h3>Order summary</h3>${new BookView(this.app).summary(c)}
<div class='row'><span class='muted'>Deposit due now (50%)</span><span>${money(c.total / 2)}</span></div>
<label class='chk'><input type='checkbox' id='terms'> I accept the booking terms and cancellation policy.</label>${err('terms')}${err('cart')}
<button class='btn' type='submit' style='width:100%'>Place booking request</button>
<p class='muted' style='font-size:.85rem'>Your booking details open in WhatsApp so they reach us instantly. We verify your payment and confirm within 24 hours.</p></div></form></div></section>`;
  }
  mount(el) {
    const form = el.querySelector('#f');
    if (!form) return;
    const app = this.app, v = new CheckoutValidator();
    const panel = form.querySelector('#payinfo'), mf = form.querySelector('#momo'), amt = form.querySelector('#amt');
    const method = () => form.querySelector('input[name=pay]:checked').value;
    const due = () => method() === 'MTN Mobile Money' && amt.value === 'full' ? app.cart.total : app.cart.total / 2;
    const note = (t, b) => `<b>${t}</b><p class='muted' style='margin:4px 0 0'>${b}</p>`;
    const refresh = () => {
      const p = method(); mf.hidden = p !== 'MTN Mobile Money';
      panel.innerHTML = p === 'MTN Mobile Money' ? `<b>Pay ${money(due())} by MTN Mobile Money</b><ol style='margin:8px 0 0;padding-left:20px'><li>Dial *126# or open the MoMo app and choose Transfer Money.</li><li>Send ${money(due())} to <b>679 672 445</b> or <b>652 776 492</b>.</li><li>Enter the number you paid from and the transaction ID below.</li></ol>`
        : p === 'Orange Money' ? note('Orange Money', 'Submit your request and we will send our Orange Money number on WhatsApp within minutes.')
        : p === 'Bank transfer' ? note('Offline: bank transfer', 'Submit your request and we will send our bank details. Your date is held once the deposit arrives.')
        : note('Offline: cash or invoice', 'Pay cash at our office or settle against an invoice. We will confirm details after you submit.');
    };
    form.querySelectorAll('input[name=pay]').forEach(r => r.onchange = refresh); amt.onchange = refresh; refresh();
    form.onsubmit = ev => {
      ev.preventDefault();
      const g = id => form.querySelector('#' + id).value;
      app.cart.date = g('date');
      const d = {name: g('name'), phone: g('phone'), email: g('email'), venue: g('venue'), notes: g('notes'), pay: method(), amount: due(), sender: g('sender'), txid: g('txid'), terms: form.querySelector('#terms').checked};
      const errs = v.validate(d, app.cart);
      form.querySelectorAll('[data-e]').forEach(n => n.textContent = errs[n.dataset.e] || '');
      if (Object.keys(errs).length) { const first = form.querySelector('.err:not(:empty)'); if (first) first.scrollIntoView({block: 'center'}); return; }
      app.lastOrder = new Order(app.cart, d);
      const all = app.store.get('hwtm-orders', []); all.push(app.lastOrder); app.store.set('hwtm-orders', all);
      window.open(waLink(app.lastOrder.message), '_blank', 'noopener');
      app.cart.clear(); location.hash = 'confirmation';
    };
  }
}
class ConfirmView extends View {
  html() {
    const o = this.app.lastOrder;
    if (!o) return `<section><div class='wrap ok'><h2>No recent booking</h2><a class='btn' href='#book'>Start a booking</a></div></section>`;
    return `<section><div class='wrap ok'><div style='font-size:3rem'>🎉</div><h1>Thank you, ${esc(o.details.name.split(' ')[0])}!</h1>
<p>Your booking request is ready. Reference:</p><div class='ref'>${o.ref}</div>
<p class='muted'>If WhatsApp did not open, tap the green button to send us your booking. We verify your payment and confirm within 24 hours.</p>
<div class='card' style='max-width:460px;margin:24px auto;text-align:left'>${o.entries.map(e => `<div class='row'><span>${e.qty} × ${e.s.name}</span><span>${money(e.total)}</span></div>`).join('')}<div class='row total'><span>Total</span><span>${money(o.total)}</span></div></div>
<a class='btn wa' href='${waLink(o.message)}' target='_blank' rel='noopener'>Send booking on WhatsApp</a> <a class='btn alt' href='#home'>Back home</a></div></section>`;
  }
}
class FaqView extends View {
  html() {
    const q = [['How far ahead should I book?', 'Two weeks is ideal. For large events or peak season, book a month ahead. Last-minute requests are welcome and handled as availability allows.'],
      ['Can I request specific skills or languages?', 'Yes. Mention English, French, local languages, dress code or experience in your booking notes.'],
      ['How does payment work?', 'A 50% deposit secures your date. The balance is due before the event. You can pay by MTN Mobile Money, Orange Money, bank transfer or cash.'],
      ['What if someone cannot make it?', 'We keep trained backup staff on standby and replace anyone at no extra cost.'],
      ['Can I cancel or change my booking?', 'You can change staff numbers up to 72 hours before. Deposits are refundable within the policy window we send with your confirmation.']];
    return `<section><div class='wrap' style='max-width:760px'><h1>FAQ</h1>${q.map(x => `<details><summary>${x[0]}</summary><p class='muted'>${x[1]}</p></details>`).join('')}</div></section>`;
  }
}
class ContactView extends View {
  html() {
    return `<section><div class='wrap'><div class='split'><div><h1>Contact us</h1><p class='muted'>Planning something special? Tell us about it and we will reply within 24 hours.</p>
<div class='row'><span>Phone / WhatsApp</span><a href='tel:+237679672445'>+237 679 672 445</a></div><div class='row'><span>Phone / WhatsApp</span><a href='tel:+237652776492'>+237 652 776 492</a></div><div class='row'><span>Based in</span><span>Buea, Cameroon</span></div>
<p><a class='btn wa' href='https://wa.me/${WA}' target='_blank' rel='noopener'>Chat on WhatsApp</a></p></div>
<form id='cf' class='card' novalidate><label for='cn'>Name</label><input id='cn'><label for='cp'>Phone / WhatsApp</label><input id='cp' type='tel'><label for='cm'>Message</label><textarea id='cm' rows='4'></textarea>
<div class='err' id='cerr'></div><button class='btn' type='submit'>Send on WhatsApp</button></form></div></div></section>`;
  }
  mount(el) {
    const f = el.querySelector('#cf');
    f.onsubmit = e => {
      e.preventDefault();
      if (!f.cn.value.trim() || digits(f.cp.value).length < 8 || !f.cm.value.trim()) { el.querySelector('#cerr').textContent = 'Please fill in your name, a valid phone number and a message.'; return; }
      const text = 'Hello Host with the Most, I am ' + f.cn.value.trim() + ' (' + f.cp.value.trim() + '). ' + f.cm.value.trim();
      const link = waLink(text);
      window.open(link, '_blank', 'noopener');
      f.innerHTML = `<h3>Almost done ✓</h3><p class='muted'>WhatsApp should have opened with your message. If not, tap below.</p><a class='btn wa' href='${link}' target='_blank' rel='noopener'>Open WhatsApp</a>`;
    };
  }
}

/* ---------- Router & App ---------- */
class Router {
  constructor(routes, onChange) { this.routes = routes; this.onChange = onChange; addEventListener('hashchange', () => this.go()); }
  current() { const h = location.hash.slice(1); return this.routes[h] ? h : 'home'; }
  go() { this.onChange(this.current()); }
}
class App {
  constructor() {
    this.store = new Store(); this.catalog = new Catalog();
    this.cart = new Cart(this.catalog, this.store, new PricingPolicy());
    // Sample testimonials. Replace with real client feedback.
    this.testimonials = [
      {q: 'Our conference check-in was seamless. Guests kept asking where we found such a polished team.', n: 'Corporate client, Douala'},
      {q: 'They made our wedding feel effortless. Warm, punctual and beautifully turned out.', n: 'Wedding client, Buea'},
      {q: 'Professional from the first call to the last guest. We will book again.', n: 'Product launch organiser, Yaoundé'}];
    this.nav = {home: 'Home', about: 'About', services: 'Services', book: 'Book', faq: 'FAQ', contact: 'Contact'};
    this.titles = {home: 'Home', about: 'About', services: 'Services', book: 'Book', checkout: 'Checkout', confirmation: 'Booking confirmed', faq: 'FAQ', contact: 'Contact'};
    const views = {home: HomeView, about: AboutView, services: ServicesView, book: BookView, checkout: CheckoutView, confirmation: ConfirmView, faq: FaqView, contact: ContactView};
    this.router = new Router(views, r => { this.route = r; this.render(); scrollTo(0, 0); });
    this.route = this.router.current(); this.render();
  }
  render() {
    const view = new (this.router.routes[this.route])(this);
    const el = document.getElementById('app'); el.innerHTML = view.html(); view.mount(el);
    document.title = this.titles[this.route] + ' | Host with the Most Agency';
    document.getElementById('nav').innerHTML = Object.entries(this.nav).map(([k, v]) =>
      `<a href='#${k}' class='${k === this.route ? 'on' : ''}'>${v}${k === 'book' && this.cart.staff ? `<span class='badge'>${this.cart.staff}</span>` : ''}</a>`).join('');
    document.querySelectorAll('img[data-logo]').forEach(i => { i.src = LOGO; });
  }
}
new App();
