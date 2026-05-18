/* ══════════════════════════════════════
   CAMPAIGN WEBSITE — main.js
   Integrations: Formspree + Paystack
══════════════════════════════════════

   SETUP INSTRUCTIONS:
   ─────────────────────────────────────
   1. FORMSPREE (Free forms → email)
      a. Go to https://formspree.io and sign up
      b. Create two forms: "Volunteer" and "Contact"
      c. Copy each form's endpoint (looks like https://formspree.io/f/xxxxxxxx)
      d. Paste them into FORMSPREE_VOLUNTEER_URL and FORMSPREE_CONTACT_URL below

   2. PAYSTACK (Real Nigerian payments)
      a. Go to https://paystack.com and create a free account
      b. From your dashboard → Settings → API Keys
      c. Copy your PUBLIC key (starts with pk_test_ or pk_live_)
      d. Paste it into PAYSTACK_PUBLIC_KEY below
      e. Replace CAMPAIGN_EMAIL with the campaign's official email address

   ─────────────────────────────────────
   That's it — no backend needed!
══════════════════════════════════════ */

/* ── CONFIGURATION — fill these in ── */
const FORMSPREE_VOLUNTEER_URL = 'https://formspree.io/f/YOUR_VOLUNTEER_FORM_ID';
const FORMSPREE_CONTACT_URL   = 'https://formspree.io/f/YOUR_CONTACT_FORM_ID';
const PAYSTACK_PUBLIC_KEY     = 'pk_test_YOUR_PAYSTACK_PUBLIC_KEY';
const CAMPAIGN_EMAIL          = 'donor@johndoe2025.ng'; // Paystack sends receipt here


function toggleNews(){

  const news = document.getElementById("news1");

  news.classList.toggle("show");

}

/* ══════════════════════════════════════
   HELPER: Show toast notification
══════════════════════════════════════ */
function showToast(message, type = 'success') {
  // Remove existing toast if any
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    padding: 1rem 1.8rem;
    font-family: 'Jost', sans-serif;
    font-size: 0.88rem;
    letter-spacing: 0.05em;
    color: ${type === 'success' ? '#0A0F1E' : '#F8F5EE'};
    background: ${type === 'success' ? '#C9A84C' : '#c0392b'};
    border-left: 4px solid ${type === 'success' ? '#E8C97A' : '#e74c3c'};
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transition: opacity 0.4s ease;
    max-width: 360px;
    line-height: 1.5;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}


/* ══════════════════════════════════════
   HELPER: Set button loading state
══════════════════════════════════════ */
function setButtonState(btn, loading) {
  if (loading) {
    btn.dataset.original = btn.textContent;
    btn.textContent = 'Please wait...';
    btn.disabled = true;
    btn.style.opacity = '0.7';
  } else {
    btn.textContent = btn.dataset.original || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}


/* ══════════════════════════════════════
   HELPER: Parse Naira amount to kobo
   Paystack uses kobo (₦1 = 100 kobo)
══════════════════════════════════════ */
function parseAmountToKobo(text) {
  // Remove ₦ and commas, convert to number
  const cleaned = text.replace(/[₦,]/g, '').trim();
  const naira   = parseFloat(cleaned);
  return isNaN(naira) ? null : Math.round(naira * 100);
}


/* ══════════════════════════════════════
   MAIN: DOMContentLoaded
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // ── 1. NAVBAR: Scrolled state ──
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    highlightActiveNavLink();
  });


  // ── 2. MOBILE MENU ──
  window.toggleMenu = function () {
    document.getElementById('mobileMenu').classList.toggle('open');
  };


  // ── 3. FADE-IN ON SCROLL ──
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));


  // ── 4. DONATE: Amount selector ──
  window.selectAmount = function (btn) {
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // If "Custom" is selected, show an input field
    if (btn.textContent.trim() === 'Custom') {
      showCustomAmountInput();
    } else {
      hideCustomAmountInput();
    }
  };

  function showCustomAmountInput() {
    if (document.getElementById('customAmountWrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'customAmountWrap';
    wrap.style.cssText = 'margin: 0.5rem 0 1.5rem; display:flex; gap:0.5rem; align-items:center;';
    wrap.innerHTML = `
      <span style="color:var(--gold);font-size:1.2rem;">₦</span>
      <input id="customAmountInput" type="number" min="100" placeholder="Enter amount"
        style="flex:1; background:rgba(201,168,76,0.04); border:1px solid rgba(201,168,76,0.3);
               color:var(--white); padding:0.75rem 1rem; font-family:var(--font-body);
               font-size:0.9rem; outline:none;" />
    `;
    const grid = document.querySelector('.amount-grid');
    grid.insertAdjacentElement('afterend', wrap);
    document.getElementById('customAmountInput').focus();
  }

  function hideCustomAmountInput() {
    const wrap = document.getElementById('customAmountWrap');
    if (wrap) wrap.remove();
  }


  // ── 5. ACTIVE NAV LINK ──
  const sections = document.querySelectorAll('section[id]');

  function highlightActiveNavLink() {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.style.color = link.getAttribute('href') === `#${current}` ? 'var(--gold)' : '';
    });
  }


  /* ════════════════════════════════════
     6. VOLUNTEER FORM → Formspree
  ════════════════════════════════════ */
  const volunteerBtn = document.getElementById('volunteerSubmit');
  if (volunteerBtn) {
    volunteerBtn.addEventListener('click', async () => {
      const firstName = document.getElementById('volunteerFirstName')?.value.trim();
      const lastName  = document.getElementById('volunteerLastName')?.value.trim();
      const email     = document.getElementById('volunteerEmail')?.value.trim();
      const phone     = document.getElementById('volunteerPhone')?.value.trim();
      const ward      = document.getElementById('volunteerWard')?.value.trim();
      const role      = document.getElementById('volunteerRole')?.value;

      // Basic validation
      if (!firstName || !email) {
        showToast('Please fill in at least your name and email.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      setButtonState(volunteerBtn, true);

      try {
        const response = await fetch(FORMSPREE_VOLUNTEER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name:  `${firstName} ${lastName}`,
            email, phone, ward,
            role:  role !== 'Select an option' ? role : 'Not specified',
            _subject: `New Volunteer: ${firstName} ${lastName}`
          })
        });

        if (response.ok) {
          showToast(`Welcome aboard, ${firstName}! We'll be in touch soon.`);
          // Clear form fields
          ['volunteerFirstName','volunteerLastName','volunteerEmail',
           'volunteerPhone','volunteerWard'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
        } else {
          throw new Error('Formspree error');
        }
      } catch {
        showToast('Something went wrong. Please try again or contact us directly.', 'error');
      } finally {
        setButtonState(volunteerBtn, false);
      }
    });
  }


  /* ════════════════════════════════════
     7. CONTACT FORM → Formspree
  ════════════════════════════════════ */
  const contactBtn = document.getElementById('contactSubmit');
  if (contactBtn) {
    contactBtn.addEventListener('click', async () => {
      const name    = document.getElementById('contactName')?.value.trim();
      const email   = document.getElementById('contactEmail')?.value.trim();
      const subject = document.getElementById('contactSubject')?.value.trim();
      const message = document.getElementById('contactMessage')?.value.trim();

      if (!name || !email || !message) {
        showToast('Please fill in your name, email, and message.', 'error');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      setButtonState(contactBtn, true);

      try {
        const response = await fetch(FORMSPREE_CONTACT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name, email, message,
            subject: subject || '(No subject)',
            _subject: `Campaign Enquiry from ${name}`
          })
        });

        if (response.ok) {
          showToast(`Message sent, ${name}! We'll respond within 24 hours.`);
          ['contactName','contactEmail','contactSubject','contactMessage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
          });
        } else {
          throw new Error('Formspree error');
        }
      } catch {
        showToast('Something went wrong. Please try again or email us directly.', 'error');
      } finally {
        setButtonState(contactBtn, false);
      }
    });
  }


  /* ════════════════════════════════════
     8. DONATE BUTTON → Paystack
  ════════════════════════════════════ */
  const donateBtn = document.getElementById('donateNow');
  if (donateBtn) {
    donateBtn.addEventListener('click', () => {

      // Get selected or custom amount
      const activeBtn    = document.querySelector('.amount-btn.active');
      const customInput  = document.getElementById('customAmountInput');
      const amountText   = customInput
        ? customInput.value
        : activeBtn?.textContent || '';

      const amountKobo = parseAmountToKobo(amountText);

      if (!amountKobo || amountKobo < 10000) { // minimum ₦100
        showToast('Please select or enter a donation amount (minimum ₦100).', 'error');
        return;
      }

      // Prompt for donor email (Paystack requires it)
      const donorEmail = prompt(
        'Please enter your email address to proceed with your donation:'
      );
      if (!donorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
        showToast('A valid email address is required to process your donation.', 'error');
        return;
      }

      // Launch Paystack inline popup
      const handler = PaystackPop.setup({
        key:       PAYSTACK_PUBLIC_KEY,
        email:     donorEmail.trim(),
        amount:    amountKobo,
        currency:  'NGN',
        ref:       'CAMPAIGN_' + Date.now(),
        metadata: {
          custom_fields: [
            { display_name: 'Campaign', value: 'Hon. John A. Doe — State House 2025' }
          ]
        },
        callback: function (response) {
          // Payment successful
          showToast(`Thank you! Donation confirmed. Ref: ${response.reference}`);
          console.log('Paystack reference:', response.reference);
        },
        onClose: function () {
          showToast('Payment window closed. You can try again anytime.', 'error');
        }
      });

      handler.openIframe();
    });
  }

}); // end DOMContentLoaded