/* 
   ADMIN_SCRIPT.JS
   Shared logic for VTT Admin Dashboard pages
*/

// --- State & Config ---
let db = null;
const AUTH_KEY = 'vtt_admin_authenticated';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    checkAuthStatus();
});

function initSupabase() {
    try {
        const supabaseUrl = PAYMENT_CONFIG.SUPABASE.URL;
        const supabaseKey = PAYMENT_CONFIG.SUPABASE.ANON_KEY;
        
        if (typeof window.supabase !== 'undefined' && 
            supabaseUrl && 
            !supabaseUrl.includes('your-project-id')) {
            db = window.supabase.createClient(supabaseUrl, supabaseKey);
        }
    } catch (e) {
        console.warn('Supabase initialization failed:', e);
    }
}

// --- Authentication Logic ---
function checkAuthStatus() {
    const isAuth = sessionStorage.getItem(AUTH_KEY);
    const overlay = document.getElementById('authOverlay');
    
    if (isAuth === 'true') {
        if (overlay) overlay.style.display = 'none';
        initDashboard();
    } else {
        if (overlay) overlay.style.display = 'flex';
    }
}

function authenticate() {
    const passInput = document.getElementById('passInput');
    if (passInput.value === "prasanth") {
        sessionStorage.setItem(AUTH_KEY, 'true');
        const overlay = document.getElementById('authOverlay');
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.style.display = 'none';
            initDashboard();
        }, 800);
    } else {
        handleAuthError(passInput);
    }
}

function handleAuthError(input) {
    input.style.borderColor = "#ff4444";
    input.style.boxShadow = "0 0 0 4px rgba(255, 68, 68, 0.1)";
    input.placeholder = "Wrong password — try again";
    setTimeout(() => {
        input.style.borderColor = '';
        input.style.boxShadow = '';
        input.placeholder = '••••••••';
    }, 2000);
    input.value = "";
    input.focus();
}

function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    window.location.reload();
}

// Support for Enter key
if (document.getElementById('passInput')) {
    document.getElementById('passInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authenticate();
    });
}

// --- Data Fetching ---
async function initDashboard() {
    if (!db) {
        handleNoDatabase();
        return;
    }

    // Determine which page we are on and load relevant data
    const page = window.location.pathname.split('/').pop() || 'admin.html';
    
    if (page === 'admin.html') {
        loadOverviewData();
    } else if (page === 'admin_donations.html') {
        fetchTransactions();
    } else if (page === 'admin_media.html') {
        fetchMedia();
    }
}

function handleNoDatabase() {
    const selectors = ['statRevenue', 'statDonors', 'statMedia'];
    selectors.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = id === 'statRevenue' ? '₹0' : '0';
    });

    const bodies = ['transactionBody', 'mediaBody'];
    bodies.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:30px">No database connected</td></tr>';
    });
}

// --- Page Specific Logic ---

// Overview Page
async function loadOverviewData() {
    try {
        const { data: donations } = await db.from('donations').select('amount');
        const total = donations ? donations.reduce((sum, d) => sum + Number(d.amount), 0) : 0;
        const donorCount = donations ? donations.length : 0;
        
        if (document.getElementById('statRevenue')) 
            document.getElementById('statRevenue').innerText = `₹${total.toLocaleString()}`;
        if (document.getElementById('statDonors')) 
            document.getElementById('statDonors').innerText = donorCount;

        const { count } = await db.from('media').select('*', { count: 'exact', head: true });
        if (document.getElementById('statMedia')) 
            document.getElementById('statMedia').innerText = count || 0;

        fetchTransactions(5); // Show last 5
        fetchMedia(5); // Show last 5
    } catch (e) { console.error('Overview error:', e); }
}

// Donations Page
async function fetchTransactions(limit = null) {
    try {
        let query = db.from('donations').select('*').order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        
        const { data } = await query;
        const body = document.getElementById('transactionBody');
        if (!body) return;

        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:30px">No donations yet</td></tr>';
            return;
        }

        body.innerHTML = data.map(trx => `
            <tr>
                <td>
                    <div class="donor-info">${trx.donor_name}</div>
                    <div class="donor-sub">${trx.email}</div>
                </td>
                <td class="td-amount">₹${Number(trx.amount).toLocaleString()}</td>
                <td class="timestamp">${new Date(trx.created_at).toLocaleString()}</td>
                <td><span class="status-pill status-success">Verified</span></td>
                <td class="ref-id">${trx.transaction_id || 'LOCAL_SIM'}</td>
            </tr>
        `).join('');
    } catch (e) { console.error('Transactions error:', e); }
}

// Media Page
async function fetchMedia(limit = null) {
    try {
        let query = db.from('media').select('*').order('created_at', { ascending: false });
        if (limit) query = query.limit(limit);
        
        const { data } = await query;
        const body = document.getElementById('mediaBody');
        if (!body) return;

        if (!data || data.length === 0) {
            body.innerHTML = '<tr><td colspan="5" style="text-align:center;opacity:0.5;padding:30px">No media assets found</td></tr>';
            return;
        }

        body.innerHTML = data.map(m => `
            <tr>
                <td><span class="asset-title">${m.title}</span></td>
                <td><span class="asset-cat">${m.category}</span></td>
                <td><span class="asset-type">${m.type}</span></td>
                <td><span class="asset-status">● Active</span></td>
                <td>
                    <button class="btn-action" onclick="removeMedia('${m.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Media error:', e); }
}

async function removeMedia(id) {
    if (!db) return;
    if (confirm("Permanently delete this asset?")) {
        const { error } = await db.from('media').delete().eq('id', id);
        if (!error) fetchMedia();
    }
}

// --- CSV Export Logic ---
async function exportDonationsToCSV() {
    if (!db) {
        alert("Database not connected. Cannot export data.");
        return;
    }

    try {
        const { data, error } = await db.from('donations').select('*').order('created_at', { ascending: false });
        
        if (error) throw error;
        if (!data || data.length === 0) {
            alert("No donation records found to export.");
            return;
        }

        // CSV Headers
        const headers = ["Donor Name", "Email", "Amount (INR)", "Date", "Transaction ID"];
        
        // Convert rows
        const csvRows = [
            headers.join(','),
            ...data.map(row => [
                `"${row.donor_name}"`,
                `"${row.email}"`,
                row.amount,
                `"${new Date(row.created_at).toLocaleString()}"`,
                `"${row.transaction_id || 'LOCAL'}"`
            ].join(','))
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `vtt_donations_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    } catch (e) {
        console.error('Export Error:', e);
        alert("Failed to generate CSV: " + e.message);
    }
}

// --- Media Upload Logic ---
function showUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.add('active');
}

function hideUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.classList.remove('active');
}

async function handleMediaUpload(event) {
    event.preventDefault();
    if (!db) {
        alert("Database not connected.");
        return;
    }

    const title = document.getElementById('uploadTitle').value;
    const category = document.getElementById('uploadCategory').value;
    const type = document.getElementById('uploadType').value;
    const url = document.getElementById('uploadUrl').value;

    if (!title || !url) {
        alert("Please provide at least a title and a source URL.");
        return;
    }

    try {
        const { error } = await db.from('media').insert([
            { title, category, type, source_url: url }
        ]);

        if (error) throw error;

        alert("Asset uploaded successfully!");
        hideUploadModal();
        event.target.reset();
        
        // Refresh media lists if they exist on current page
        const page = window.location.pathname.split('/').pop() || 'admin.html';
        if (page === 'admin.html' || page === 'admin_media.html') {
            fetchMedia();
        }
    } catch (e) {
        console.error('Upload Error:', e);
        alert("Failed to save asset: " + e.message);
    }
}

// --- Dynamic Settings Control ---
async function loadSettingsIntoUI() {
    if (!db) return;
    try {
        const { data, error } = await db.from('settings').select('*');
        if (error) throw error;
        
        data.forEach(setting => {
            if (setting.id === 'upi_id') {
                const input = document.getElementById('upi_id_input');
                if (input) input.value = setting.value;
            }
            if (setting.id === 'upi_name') {
                const input = document.getElementById('upi_name_input');
                if (input) input.value = setting.value;
            }
        });
    } catch (e) {
        console.error('Load Settings Error:', e);
    }
}

async function updateSystemSettings() {
    if (!db) return;
    const upiId = document.getElementById('upi_id_input').value;
    const upiName = document.getElementById('upi_name_input').value;

    if (!upiId || !upiName) {
        alert("UPI ID and Name cannot be empty.");
        return;
    }

    try {
        const { error: err1 } = await db.from('settings').upsert({ id: 'upi_id', value: upiId });
        const { error: err2 } = await db.from('settings').upsert({ id: 'upi_name', value: upiName });

        if (err1 || err2) throw (err1 || err2);

        alert("Settings updated successfully! Changes are live on the frontend.");
    } catch (e) {
        console.error('Update Settings Error:', e);
        alert("Failed to update settings: " + e.message);
    }
}



