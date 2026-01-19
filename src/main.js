// Sayfa Navigasyonu
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Aktif nav linkini güncelle
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Sayfa ID'sini al
        const pageId = link.getAttribute('href').substring(1);
        
        // Tüm sayfaları gizle
        pages.forEach(page => page.classList.remove('active'));
        
        // İstenen sayfayı göster
        const activePage = document.getElementById(pageId);
        if (activePage) {
            activePage.classList.add('active');
        }
        
        // Mobil menu'yü kapat
        closeMenu();
        
        // Sayfanın başına git
        window.scrollTo(0, 0);
    });
});

// Hamburger Menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

function closeMenu() {
    navMenu.classList.remove('active');
}

// Dış alana tıklanıyorsa menüyü kapat
document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
        closeMenu();
    }
});

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
    console.log('Web sitesi yüklendi!');
});

// Contact form: client-side validation, honeypot handling, disable button + spinner
const contactForm = document.getElementById('contactForm');
// Configuration: set these values if you want Zapier webhook, reCAPTCHA or hCaptcha
const ZAPIER_WEBHOOK = ''; // e.g. 'https://hooks.zapier.com/hooks/catch/xxxx/yyyy'
const HCAPTCHA_SITEKEY = ''; // add your hCaptcha sitekey if using hCaptcha
const RECAPTCHA_SITEKEY = ''; // add your reCAPTCHA v3 sitekey if using reCAPTCHA

function loadScript(src, id) {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.id = id;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load ' + src));
        document.head.appendChild(s);
    });
}

async function ensureCaptchaScripts() {
    const promises = [];
    if (HCAPTCHA_SITEKEY) {
        promises.push(loadScript('https://js.hcaptcha.com/1/api.js?render=explicit', 'hcaptcha-js'));
    }
    if (RECAPTCHA_SITEKEY) {
        promises.push(loadScript('https://www.google.com/recaptcha/api.js?render=' + RECAPTCHA_SITEKEY, 'recaptcha-js'));
    }
    return Promise.all(promises);
}

if (contactForm) {
    const statusEl = contactForm.querySelector('.form-status');
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const spinner = submitBtn ? submitBtn.querySelector('.spinner') : null;

    // Modal elements
    const modal = document.getElementById('thankYouModal');
    const modalClose = document.getElementById('modalClose');
    const modalOverlay = document.getElementById('modalOverlay');

    function showModal(message) {
        if (modal) {
            const msg = modal.querySelector('#modalMessage');
            if (msg) msg.textContent = message || 'Mesajınız başarıyla gönderildi.';
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('active');
        }
    }

    function hideModal() {
        if (modal) {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('active');
        }
    }

    if (modalClose) modalClose.addEventListener('click', hideModal);
    if (modalOverlay) modalOverlay.addEventListener('click', hideModal);
    // When the modal's "Ana Sayfaya Dön" link is clicked, hide the modal
    const modalGotoHome = document.getElementById('modalGotoHome');
    if (modalGotoHome) modalGotoHome.addEventListener('click', () => {
        hideModal();
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Honeypot: if filled, silently ignore
        const honey = contactForm.querySelector('input[name="_honey"]');
        if (honey && honey.value.trim() !== '') {
            return;
        }

        const name = contactForm.querySelector('#name');
        const email = contactForm.querySelector('#email');
        const phone = contactForm.querySelector('#phone');
        const message = contactForm.querySelector('#message');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?\d{7,15}$/; // general international

        // Basic validations
        if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
            if (statusEl) statusEl.textContent = 'Lütfen tüm zorunlu alanları doldurun.';
            return;
        }

        if (!emailRegex.test(email.value.trim())) {
            if (statusEl) statusEl.textContent = 'Lütfen geçerli bir e‑posta adresi girin.';
            return;
        }

        if (phone && phone.value.trim()) {
            if (!phoneRegex.test(phone.value.trim())) {
                if (statusEl) statusEl.textContent = 'Telefon numarası geçerli formata uymuyor.';
                return;
            }
        }

        if (message.value.length > 1000) {
            if (statusEl) statusEl.textContent = 'Mesaj çok uzun; lütfen 1000 karaktere kadar yazın.';
            return;
        }

        // Passed validation: show spinner, disable button
        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.style.opacity = '1';
        if (statusEl) {
            statusEl.textContent = 'Gönderiliyor...';
            statusEl.classList.remove('success');
        }

        // Ensure captcha scripts loaded if keys provided
        try {
            await ensureCaptchaScripts();
        } catch (err) {
            console.warn('Captcha script yüklenemedi:', err);
        }

        // Prepare payloads
        const formData = new FormData(contactForm);

        // If hCaptcha available, attempt to get token and append
        if (HCAPTCHA_SITEKEY && window.hcaptcha && typeof window.hcaptcha.execute === 'function') {
            try {
                const widgetId = undefined;
                const token = await new Promise((resolve) => {
                    // render invisible if needed; here we attempt execute
                    window.hcaptcha.execute(widgetId).then(resolve).catch(() => resolve(''));
                });
                if (token) formData.append('h-captcha-response', token);
            } catch (err) {
                console.warn('hCaptcha token alınamadı', err);
            }
        }

        // If reCAPTCHA v3 available
        if (RECAPTCHA_SITEKEY && window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
            try {
                const token = await window.grecaptcha.execute(RECAPTCHA_SITEKEY, {action: 'contact'});
                if (token) formData.append('g-recaptcha-response', token);
            } catch (err) {
                console.warn('reCAPTCHA token alınamadı', err);
            }
        }

        // Send to Zapier webhook (optional) in parallel
        const zapierPromise = (async () => {
            if (!ZAPIER_WEBHOOK) return {ok: true, skipped: true};
            try {
                const payload = {
                    name: name.value.trim(),
                    email: email.value.trim(),
                    phone: phone ? phone.value.trim() : '',
                    message: message.value.trim(),
                    sentAt: new Date().toISOString()
                };
                const res = await fetch(ZAPIER_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                return {ok: res.ok, status: res.status};
            } catch (err) {
                return {ok: false, error: err.message};
            }
        })();

        // Send to Formsubmit via AJAX
        const formsubmitPromise = (async () => {
            try {
                const res = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
                const json = await res.json().catch(() => null);
                return {ok: res.ok, status: res.status, json};
            } catch (err) {
                return {ok: false, error: err.message};
            }
        })();

        const [zapRes, formRes] = await Promise.all([zapierPromise, formsubmitPromise]);

        // Handle results
        if (formRes && formRes.ok) {
            // Success
            if (statusEl) {
                statusEl.textContent = '';
                statusEl.classList.add('success');
            }
            showModal('Mesajınız başarıyla gönderildi. En kısa sürede sizinle iletişime geçeceğiz.');
            contactForm.reset();
        } else {
            let msg = 'Gönderim sırasında hata oluştu. Lütfen tekrar deneyin.';
            if (formRes && formRes.json && formRes.json.message) msg = formRes.json.message;
            if (statusEl) statusEl.textContent = msg;
        }

        // Re-enable UI
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.style.opacity = '0';
    });
}
