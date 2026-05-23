// ===== Packages =====
const PACKAGES = {
  '30':  { name: '1 Slimming Patch (Starter)', price: 18000 },
  '60':  { name: '2 Slimming Patches (Popular)', price: 33000 },
  '90':  { name: '3 Slimming Patches (Best Choice)', price: 48000 },
  '150': { name: '5 Slimming Patches (Family Pack)', price: 70000 }
};

// ===== Read package from URL or localStorage =====
const params = new URLSearchParams(window.location.search);
const pkgKey = params.get('pkg') || localStorage.getItem('selectedPkg') || '30';
const pkg = PACKAGES[pkgKey] || PACKAGES['30'];
localStorage.setItem('selectedPkg', pkgKey);

// ===== Pre-fill customer info if available =====
try {
  const saved = JSON.parse(localStorage.getItem('checkoutCustomer') || '{}');
  if (saved.name)    document.getElementById('custName').value    = saved.name;
  if (saved.phone)   document.getElementById('custPhone').value   = saved.phone;
  if (saved.address) document.getElementById('custAddress').value = saved.address;
  if (saved.city)    document.getElementById('custCity').value    = saved.city;
  if (saved.state)   document.getElementById('custState').value   = saved.state;
} catch (e) {}

const sym = '₦';
const basePrice = pkg.price;

document.getElementById('checkoutTier').textContent = pkg.name;
document.getElementById('checkoutSubPrice').textContent = `${sym}${basePrice.toLocaleString()}`;
document.getElementById('checkoutTotal').textContent = `${sym}${basePrice.toLocaleString()}`;
document.getElementById('checkoutPayBtn').textContent = `Continue on WhatsApp · ${sym}${basePrice.toLocaleString()}`;
document.title = `Checkout — ${pkg.name}`;

function getTotal() {
  return basePrice;
}

// ===== Meta Pixel Purchase tracking =====
// Fires once per successful order. Sends value in USD for consistency.
const NGN_TO_USD = 1500;
function trackPurchase() {
  if (sessionStorage.getItem('purchaseTracked') === '1') return;
  if (typeof fbq !== 'function') return;
  const valueUSD = +(basePrice / NGN_TO_USD).toFixed(2);
  fbq('track', 'Purchase', {
    value: valueUSD,
    currency: 'USD',
    content_name: pkg.name,
    content_ids: [pkgKey],
    content_type: 'product',
    num_items: 1
  });
  sessionStorage.setItem('purchaseTracked', '1');
}

// ===== Copy =====
function copyAccount(el) {
  const text = el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    el.classList.add('copied');
    const orig = el.textContent;
    el.textContent = 'Copied!';
    setTimeout(() => { el.classList.remove('copied'); el.textContent = orig; }, 1500);
  });
}

// ===== WhatsApp Checkout =====
const WHATSAPP_NUMBER = '15868631749';

function finalizeOnWhatsApp() {
  const name    = document.getElementById('custName').value.trim();
  const phone   = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const city    = document.getElementById('custCity').value.trim();
  const state   = document.getElementById('custState').value.trim();

  if (!name || !phone || !address) {
    alert('Please fill in your full name, phone number and delivery address before continuing.');
    return;
  }

  localStorage.setItem('checkoutCustomer', JSON.stringify({
    name, phone, address, city, state
  }));

  const total = getTotal();
  const lines = [
    'Hello Greenlife! I would like to place an order:',
    '',
    `*Product:* ${pkg.name}`,
    `*Total:* ${sym}${total.toLocaleString()}`,
    '',
    '*Delivery Information*',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Address: ${address}`
  ];
  if (city)  lines.push(`City: ${city}`);
  if (state) lines.push(`State: ${state}`);
  lines.push('', 'Please confirm my order. Thank you!');

  trackPurchase();

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.location.href = url;
}
