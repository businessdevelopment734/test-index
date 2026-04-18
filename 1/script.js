/**
 * Virtual Tribal Tourism - Iruliga Tribe
 * Logic for Popup, Tabs, Navigation, and Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Show Welcome Modal on Load
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
        setTimeout(() => {
            welcomeModal.style.display = 'flex';
        }, 1000); // 1 second delay for better user experience
    }

    // 2. Sticky Navbar Logic
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('sticky');
        } else {
            navbar.classList.remove('sticky');
        }
    });

    // 3. Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');

            // Deactivate all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Activate current
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // 4. Mobile Menu Navigation
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinksList = document.getElementById('navLinks');

    window.toggleMenu = () => {
        navLinksList.classList.toggle('active');
    };

    // Close menu and switch tabs when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            const linkText = link.innerText.toLowerCase();
            const tabMap = {
                'food': 'food',
                'beverages': 'beverages',
                'attire': 'attire',
                'music': 'music',
                'rituals': 'rituals'
            };

            for (const key in tabMap) {
                if (linkText.includes(key)) {
                    // Activate corresponding tab
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabPanels.forEach(p => p.classList.remove('active'));
                    
                    document.querySelector(`[data-tab="${tabMap[key]}"]`).classList.add('active');
                    document.getElementById(tabMap[key]).classList.add('active');
                    break;
                }
            }
            navLinksList.classList.remove('active');
        });
    });

    // 5. Video Opening Logic
    window.openVideo = (url) => {
        window.open(url, '_blank');
    };

    // 6. Modal Close Logic
    window.closeModal = () => {
        welcomeModal.style.display = 'none';
    };

    // 7. UPI Copy Logic
    window.copyUPI = () => {
        const upiText = document.getElementById('upiIdText').innerText;
        navigator.clipboard.writeText(upiText).then(() => {
            const copyBtn = document.querySelector('.copy-btn');
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            copyBtn.style.background = '#2d5a27';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.background = 'white';
                copyBtn.style.color = '#2d5a27';
            }, 2000);
        });
    };
});
