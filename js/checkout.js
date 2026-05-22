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
document.getElementById('checkoutPayBtn').textContent = `Pay ${sym}${basePrice.toLocaleString()}`;
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

// ===== Modals =====
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-bg').forEach(bg => {
  bg.addEventListener('click', e => {
    if (e.target === bg) { bg.classList.remove('active'); document.body.style.overflow = ''; }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-bg.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});

// ===== Method Picker =====
function toggleMethodPicker() {
  document.getElementById('methodPicker').classList.toggle('hidden');
}

// ===== Transfer Modal =====
let btnTimeout;
let transferAttempts = 0;
let timerInterval;

function openTransferModal() {
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name || !phone || !address) {
    alert('Please fill in your full name, phone number and delivery address before continuing.');
    return;
  }

  const total = getTotal();
  document.getElementById('transferAmount').textContent = `${sym}${total.toLocaleString()}`;
  document.getElementById('methodPicker').classList.add('hidden');

  document.getElementById('confirmTransferBtn').classList.add('hidden');
  document.getElementById('verifyBar').classList.remove('hidden');
  document.getElementById('paymentNotFound').classList.add('hidden');
  transferAttempts = 0;

  startTimer();
  openModal('transferModal');

  clearTimeout(btnTimeout);
  btnTimeout = setTimeout(() => {
    document.getElementById('verifyBar').classList.add('hidden');
    document.getElementById('confirmTransferBtn').classList.remove('hidden');
  }, 60000);
}

function startTimer() {
  clearInterval(timerInterval);
  let seconds = 30 * 60;
  const el = document.getElementById('transferTimer');
  timerInterval = setInterval(() => {
    seconds--;
    if (seconds <= 0) { clearInterval(timerInterval); el.textContent = 'Expired'; return; }
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

function confirmTransfer() {
  const btn = document.getElementById('confirmTransferBtn');
  const orig = btn.textContent;
  btn.innerHTML = '<span class="spinner"></span> Verifying...';
  btn.disabled = true;

  transferAttempts++;

  setTimeout(() => {
    btn.textContent = orig;
    btn.disabled = false;

    if (transferAttempts < 2) {
      document.getElementById('paymentNotFound').classList.remove('hidden');
    } else {
      document.getElementById('paymentNotFound').classList.add('hidden');
      clearInterval(timerInterval);
      clearTimeout(btnTimeout);
      closeModal('transferModal');
      trackPurchase();
      document.getElementById('successMessage').textContent =
        `Your ${pkg.name} order has been placed! We'll contact you shortly to confirm delivery.`;
      openModal('successModal');
    }
  }, 2000);
}
