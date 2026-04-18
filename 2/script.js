/**
 * Virtual Tribal Tourism - Iruliga Tribe
 * Logic for Popup, Tabs, Navigation, and Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Initialize Supabase (Using window.supabase to avoid shadowing)
    let db = null;
    let LIVE_SETTINGS = {
        upi_id: null,
        upi_name: null
    };

    try {
        if (typeof window.supabase !== 'undefined' && PAYMENT_CONFIG.SUPABASE.URL) {
            db = window.supabase.createClient(PAYMENT_CONFIG.SUPABASE.URL, PAYMENT_CONFIG.SUPABASE.ANON_KEY);
            
            // Fetch live settings (UPI ID) from DB
            loadLiveSettings();
        }
    } catch (e) {
        console.error("Supabase Init Error:", e);
    }

    async function loadLiveSettings() {
        if (!db) return;
        try {
            const { data, error } = await db.from('settings').select('*');
            if (error) throw error;
            
            data.forEach(s => {
                if (s.id === 'upi_id') {
                    LIVE_SETTINGS.upi_id = s.value;
                    // Update UI text display
                    const upiText = document.getElementById('upiIdText');
                    if (upiText) upiText.innerText = s.value;
                }
                if (s.id === 'upi_name') {
                    LIVE_SETTINGS.upi_name = s.value;
                }
            });
        } catch (e) {
            console.error("Failed to load live settings:", e);
        }
    }

    async function saveDonationToDB(data) {
        if (!db) {
            console.warn("Database not initialized. Saving locally for demo.");
            alert("Donation records simulated. Transaction ID: " + data.transaction_id);
            return;
        }
        const { error } = await db
            .from('donations')
            .insert([
                { 
                    donor_name: data.name, 
                    email: data.email, 
                    amount: data.amount,
                    transaction_id: data.transaction_id,
                    status: 'verified'
                }
            ]);
        
        if (error) {
            console.error("Database error:", error);
            alert("Error saving record. Please contact support.");
        } else {
            alert("Thank you! Your donation has been recorded and is being verified.");
            document.querySelector('.donation-form').reset();
            const donateModal = document.getElementById('donateModal');
            if (donateModal) donateModal.style.display = 'none';
        }
    }

    // Handle Donation Form Submission
    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Basic data extraction
            const name = donationForm.querySelector('input[type="text"]').value;
            const email = donationForm.querySelector('input[type="email"]').value;
            const amountField = document.getElementById('customAmountInput');
            const amount = (amountField && amountField.style.display === 'block') ? amountField.value : 1000;
            const txnId = document.getElementById('txnId').value;

            if (txnId.length !== 12) {
                alert("Please enter a valid 12-digit UPI Transaction ID.");
                return;
            }

            const submitBtn = donationForm.querySelector('.submit-proof-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "Processing...";
            submitBtn.disabled = true;

            await saveDonationToDB({
                name,
                email,
                amount,
                transaction_id: txnId
            });

            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        });
    }

    // 1. Show Welcome Modal on Load
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
        setTimeout(() => {
            welcomeModal.style.display = 'flex';
        }, 1000); 
    }

    // Global Close Modal function
    window.closeModal = () => {
        if (welcomeModal) welcomeModal.style.display = 'none';
    };

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
            const isDropdownBtn = link.classList.contains('dropbtn');
            
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
                    const tabBtn = document.querySelector(`[data-tab="${tabMap[key]}"]`);
                    const tabPanel = document.getElementById(tabMap[key]);
                    
                    if (tabBtn && tabPanel) {
                        tabBtns.forEach(b => b.classList.remove('active'));
                        tabPanels.forEach(p => p.classList.remove('active'));
                        
                        tabBtn.classList.add('active');
                        tabPanel.classList.add('active');
                    }
                    break;
                }
            }

            // Only close the main menu if it's NOT a dropdown toggle on mobile
            if (!isDropdownBtn || window.innerWidth > 768) {
                navLinksList.classList.remove('active');
            }
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

    // 8. Mobile Dropdown Toggle Logic
    const dropBtn = document.querySelector('.dropbtn');
    const dropdown = document.querySelector('.dropdown');
    
    if (dropBtn && dropdown) {
        dropBtn.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault(); // Stop immediate jump on mobile to allow toggle
                dropdown.classList.toggle('active');
            }
        });
    }

    // Reset dropdown when clicking any link inside it
    document.querySelectorAll('.dropdown-content a').forEach(link => {
        link.addEventListener('click', () => {
            if (dropdown) dropdown.classList.remove('active');
        });
    });

    // 11. Footer Tab Links — activate the correct tab and scroll to #explore
    const footerTabMap = {
        '#food': 'food',
        '#attire': 'attire',
        '#music': 'music',
        '#beverages': 'beverages',
        '#rituals': 'rituals'
    };

    document.querySelectorAll('footer a').forEach(link => {
        const href = link.getAttribute('href');
        if (footerTabMap[href]) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = footerTabMap[href];

                // Activate the correct tab button and panel
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                const targetBtn = document.querySelector(`[data-tab="${targetTab}"]`);
                const targetPanel = document.getElementById(targetTab);
                if (targetBtn) targetBtn.classList.add('active');
                if (targetPanel) targetPanel.classList.add('active');

                // Scroll to the explore section
                const exploreSection = document.getElementById('explore');
                if (exploreSection) {
                    exploreSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Fix Donate link in footer
        if (href === '#donate') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const donateSection = document.getElementById('donate');
                if (donateSection) {
                    donateSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    });

    // 9. Tab Scrolling Logic
    window.scrollTabs = (direction) => {
        const nav = document.querySelector('.tabs-nav');
        if (nav) {
            const scrollAmount = 150 * direction;
            nav.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // 10. Donation Form Logic
    window.setAmount = (amount) => {
        // Update UI
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Hide custom field if preset selected
        document.getElementById('customAmountInput').style.display = 'none';
        
        console.log(`Amount set to: ${amount}`);
    };

    window.toggleCustomAmount = () => {
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        const customField = document.getElementById('customAmountInput');
        customField.style.display = 'block';
        customField.focus();
    };

    window.openPaymentApp = () => {
        // Use live settings from DB if available, otherwise fallback to config
        const upiId = LIVE_SETTINGS.upi_id || PAYMENT_CONFIG.UPI.ID;
        const upiName = LIVE_SETTINGS.upi_name || PAYMENT_CONFIG.UPI.NAME;

        const amountField = document.getElementById('customAmountInput');
        const amount = (amountField && amountField.style.display === 'block') 
            ? amountField.value 
            : 1000;
        
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`;
        window.location.href = upiUrl;
    };
});
