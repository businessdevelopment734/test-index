/* 
   PAYMENT_CONFIG.JS
   Secure separation of sensitive payment information 
*/

const PAYMENT_CONFIG = {
    // UPI Details
    UPI: {
        ID: "8248678722@nyes",
        NAME: "Prasanth",
        CURRENCY: "INR",
        get LINK() {
            return `upi://pay?pa=${this.ID}&pn=${encodeURIComponent(this.NAME)}&cu=${this.CURRENCY}`;
        }
    },

    // Razorpay Details
    RAZORPAY: {
        KEY_ID: "rzp_test_YourKeyHere", // Replace with actual key in production
        THEME_COLOR: "#c0622f"
    },

    // Supabase Database Config
    SUPABASE: {
        URL: "https://voeexzppfklinbfbhxsx.supabase.co",
        ANON_KEY: "sb_publishable_mCRVyNKBxwyjguU0cCZ0Jw_Hfdrzswh"
    }
};

// Freeze object to prevent runtime modification
Object.freeze(PAYMENT_CONFIG);
Object.freeze(PAYMENT_CONFIG.UPI);
Object.freeze(PAYMENT_CONFIG.RAZORPAY);
