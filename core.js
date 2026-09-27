/* =========================================================
   CORE.JS - DATABASE, AUTH, ROUTER & UTILITIES ENGINE
========================================================= */

const DB_KEY = "REALTY_SYSTEM_V1";
const SESSION_KEY = "REALTY_SYSTEM_SESSION";

async function promptInput(msg, def=""){
    return window.prompt(msg, def);
}

async function confirmDialog(msg){
    return window.confirm(msg);
}

function generateTempPassword(){
    return "TMP-" + Math.floor(100000 + Math.random() * 900000);
}

function money(n){
    return "₱"+Number(n||0).toLocaleString("en-PH",{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

function uid(prefix="ID"){
    return prefix+"-"+Date.now()+"-"+Math.floor(Math.random()*9999);
}

function esc(str){
    return String(str??"")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function showModal(html){
    const modal = document.getElementById("modal");
    const container = document.getElementById("modalContent");
    if(container) container.innerHTML = html;
    if(modal) modal.classList.remove("hidden");
}

function closeModal(){
    const modal = document.getElementById("modal");
    if(modal) modal.classList.add("hidden");
    const container = document.getElementById("modalContent");
    if(container) container.innerHTML = "";
}

function renderLogoHTML(logoValue){
    if(!logoValue) return "🏢";
    if(logoValue.startsWith("http://") || logoValue.startsWith("https://") || logoValue.startsWith("data:image")){
        return `<img src="${esc(logoValue)}" alt="Logo" style="width:100%;height:100%;object-fit:cover;">`;
    }
    return logoValue;
}

function processLogoUpload(fileInput, targetInputId, previewContainerId){
    const file = fileInput.files[0];
    if(!file) return;

    if(file.size > 2 * 1024 * 1024){
        alert("Paalala: Piliin ang imahe na mas mababa sa 2MB para hindi maubos ang storage.");
    }

    const reader = new FileReader();
    reader.onload = function(e){
        const base64Data = e.target.result;
        const targetInput = document.getElementById(targetInputId);
        if(targetInput) targetInput.value = base64Data;
        const preview = document.getElementById(previewContainerId);
        if(preview) preview.innerHTML = renderLogoHTML(base64Data);
    };
    reader.readAsDataURL(file);
}

/* =========================================================
   DATABASE SEED & STATE
========================================================= */

let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
    settings:{
        systemName:"REALTY SYSTEM",
        systemLogo:"🏢",
        bossPassword:"boss123",
        itPassword:"it123",
        lastBackupDate:"Sept 24, 2026",
        defaultMonthlyRate:2500
    },
    realties:[
        { 
            id:"R-PORAC", 
            name:"PORAC BRANCH", 
            owner:"Admin Mark", 
            contact:"09123456789", 
            address:"Porac, Pampanga", 
            status:"ACTIVE", 
            dueDate:"2026-10-24", 
            monthlyFee:2500, 
            isLocked:false, 
            logo:"🏢" 
        },
        { 
            id:"R-ANGELES", 
            name:"ANGELES SITE", 
            owner:"Boss Exec", 
            contact:"09987654321", 
            address:"Angeles City", 
            status:"ACTIVE", 
            dueDate:"2026-10-15", 
            monthlyFee:2500, 
            isLocked:false, 
            logo:"🏛️" 
        }
    ],
    projects:[
        {
            id:"P1",
            realtyId:"R-PORAC",
            name:"PORAC, PAMPANGA",
            areas:[
                {
                    id:"A1",
                    name:"JALUNG",
                    blocks:[
                        {
                            id:"B1",
                            name:"BLOCK 1",
                            lots:[
                                { id:"L1", name:"LOT 1", sqm:100, price:500000, status:"AVAILABLE" },
                                { id:"L2", name:"LOT 2", sqm:100, price:500000, status:"AVAILABLE" },
                                { id:"L3", name:"LOT 3", sqm:100, price:500000, status:"AVAILABLE" }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            id:"P2",
            realtyId:"R-ANGELES",
            name:"ANGELES VILLE ESTATE",
            areas:[
                {
                    id:"A2",
                    name:"CLARK GREENWAY",
                    blocks:[
                        {
                            id:"B2",
                            name:"BLOCK A",
                            lots:[
                                { id:"L4", name:"LOT 101", sqm:120, price:750000, status:"AVAILABLE" },
                                { id:"L5", name:"LOT 102", sqm:150, price:900000, status:"AVAILABLE" }
                            ]
                        }
                    ]
                }
            ]
        }
    ],
    staff:[
        { 
            id:"S1", 
            name:"Admin Mark", 
            username:"admin", 
            password:"admin123", 
            role:"ADMIN", 
            status:"ACTIVE", 
            realtyId:"R-PORAC", 
            mustChangePassword:false
        },
        { 
            id:"S2", 
            name:"Angeles Branch Officer", 
            username:"angeles", 
            password:"admin123", 
            role:"ADMIN", 
            status:"ACTIVE", 
            realtyId:"R-ANGELES", 
            mustChangePassword:false
        }
    ],
    buyers:[],
    reservations:[],
    payments:[],
    moneyIn:[],
    moneyOut:[],
    commissions:[],
    refunds:[],
    expenses:[],
    records:[],
    loginLogs:[]
};

function saveDB(){
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    applyDynamicBranding();
    checkAndDisplayLoginSubscriptionNotice();
}

db.projects = Array.isArray(db.projects) ? db.projects : [];
db.realties = Array.isArray(db.realties) ? db.realties : [];
db.loginLogs = Array.isArray(db.loginLogs) ? db.loginLogs : [];
db.refunds = Array.isArray(db.refunds) ? db.refunds : [];
db.commissions = Array.isArray(db.commissions) ? db.commissions : [];
db.reservations = Array.isArray(db.reservations) ? db.reservations : [];
db.buyers = Array.isArray(db.buyers) ? db.buyers : [];
db.payments = Array.isArray(db.payments) ? db.payments : [];
db.moneyIn = Array.isArray(db.moneyIn) ? db.moneyIn : [];
db.moneyOut = Array.isArray(db.moneyOut) ? db.moneyOut : [];
db.expenses = Array.isArray(db.expenses) ? db.expenses : [];
db.staff = Array.isArray(db.staff) ? db.staff : [];
db.settings = db.settings || {};

db.subscriptionPayments = Array.isArray(db.subscriptionPayments) ? db.subscriptionPayments : [];

db.realties.forEach(r => {
    if(!r.dueDate) r.dueDate = "2026-10-24";
    if(r.monthlyFee === undefined) r.monthlyFee = 2500;
    if(r.isLocked === undefined) r.isLocked = false;
    if(!r.logo) r.logo = "🏢";

    let hasAdmin = db.staff.some(s => s.realtyId === r.id && s.role === "ADMIN");
    if(!hasAdmin){
        const defaultUser = r.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || ("admin" + Math.floor(100 + Math.random()*900));
        db.staff.push({
            id: uid("S"),
            name: r.owner || `${r.name} Admin`,
            username: defaultUser,
            password: "admin123",
            temporaryPassword: "admin123",
            role: "ADMIN",
            status: "ACTIVE",
            realtyId: r.id,
            mustChangePassword: false
        });
    }
});

if(!db.settings.systemName) db.settings.systemName = "REALTY SYSTEM";
if(!db.settings.systemLogo) db.settings.systemLogo = "🏢";
if(!db.settings.lastBackupDate) db.settings.lastBackupDate = "Sept 24, 2026";
if(!db.settings.defaultMonthlyRate) db.settings.defaultMonthlyRate = 2500;

/* =========================================================
   USER ROLES & TENANT HELPERS
========================================================= */

function isIT(){ return currentUser?.role === "IT"; }
function isBoss(){ return currentUser?.role === "BOSS"; }
function canAccessBossFeatures(){ return isBoss() || isIT(); }

function getActiveRealtyId(){
    if(!currentUser) return null;
    if(canAccessBossFeatures()){
        return currentUser.bossBranchOverride || null;
    }
    if(currentUser.realtyId && db.realties.some(r => r.id === currentUser.realtyId)){
        return currentUser.realtyId;
    }
    return db.realties.length > 0 ? db.realties[0].id : null;
}

function getActiveBranchProfile(){
    const activeId = getActiveRealtyId();
    if(!activeId) return null;
    return db.realties.find(r => r.id === activeId) || null;
}

function getTenantProjects(){
    const activeId = getActiveRealtyId();
    if(canAccessBossFeatures()){
        if(activeId) return db.projects.filter(p => p.realtyId === activeId);
        return db.projects;
    }
    return db.projects.filter(p => p.realtyId === activeId);
}

function applyDynamicBranding(){
    const sysName = db.settings.systemName || "REALTY SYSTEM";
    const sysLogo = db.settings.systemLogo || "🏢";

    const loginTitle = document.getElementById("loginSystemNameDisplay");
    if(loginTitle) loginTitle.innerText = sysName;

    const loginLogo = document.getElementById("loginLogoPreview");
    if(loginLogo) loginLogo.innerHTML = renderLogoHTML(sysLogo);

    const sideSysName = document.getElementById("sideSystemName");
    if(sideSysName) sideSysName.innerText = sysName;

    const sideLogoWrap = document.getElementById("sideLogoWrap");
    if(sideLogoWrap) sideLogoWrap.innerHTML = renderLogoHTML(sysLogo);

    const sideBadge = document.getElementById("sideBranchBadge");
    if(sideBadge && currentUser){
        const branch = getActiveBranchProfile();
        if(currentUser.role === "BOSS"){
            sideBadge.textContent = branch ? `👑 BOSS: ${branch.name}` : "👑 BOSS: ALL BRANCHES";
            sideBadge.style.color = "#fbbf24";
        } else if(currentUser.role === "IT"){
            sideBadge.textContent = branch ? `🛠️ IT: ${branch.name}` : "🛠️ IT: MASTER OVERVIEW";
            sideBadge.style.color = "#a855f7";
        } else if(branch){
            sideBadge.textContent = `🏢 ${branch.name}`;
            sideBadge.style.color = "#38bdf8";
        } else {
            sideBadge.textContent = "🏢 NO ASSIGNED BRANCH";
            sideBadge.style.color = "#f87171";
        }
    }

    const topSwitcher = document.getElementById("topbarBranchSwitcher");
    const topSelect = document.getElementById("topbarBranchSelect");
    if(topSwitcher && topSelect){
        if(canAccessBossFeatures()){
            const currentSelected = getActiveRealtyId() || "ALL";
            topSelect.innerHTML = `
                <option value="ALL" ${currentSelected==='ALL'?'selected':''}>🌐 ALL BRANCHES (CONSOLIDATED)</option>
                ${db.realties.map(r => `
                    <option value="${r.id}" ${currentSelected===r.id?'selected':''}>🏢 ${esc(r.name)}${r.isLocked ? '[LOCKED]' : ''}</option>
                `).join("")}
            `;
            topSwitcher.classList.remove("hidden");
        } else {
            topSwitcher.classList.add("hidden");
        }
    }
}

function universalSwitchBranch(realtyId){
    if(!canAccessBossFeatures()) return;
    currentUser.bossBranchOverride = (realtyId === "ALL") ? null : realtyId;
    saveSession(currentUser, currentPage);
    applyDynamicBranding();
    renderSidebarMenu();
    showPage(currentPage);
}

function isRealtySubscriptionExpired(realtyId){
    const branch = db.realties.find(r => r.id === realtyId);
    if(!branch || !branch.dueDate) return false;

    const today = new Date();
    today.setHours(0,0,0,0);

    const due = new Date(branch.dueDate);
    due.setHours(0,0,0,0);

    return due.getTime() < today.getTime();
}

function getRealtySubscriptionState(realtyId){
    const branch = db.realties.find(r => r.id === realtyId);
    if(!branch) return "UNKNOWN";
    if(!branch.dueDate) return "ACTIVE";
    return isRealtySubscriptionExpired(realtyId) ? "EXPIRED" : "ACTIVE";
}

/* =========================================================
   LOGIN 7-DAY EXPIRATION SIDE-BY-SIDE RENDER LOGIC
========================================================= */
function checkAndDisplayLoginSubscriptionNotice(){
    const banner = document.getElementById("loginSubscriptionBanner");
    const renewalBox = document.getElementById("loginRenewalNoticeBox");
    const loginWrapper = document.getElementById("loginSideBySideContainer");

    const today = new Date();
    today.setHours(0,0,0,0);

    let showNotice = false;
    let dueSoonList = [];

    db.realties.forEach(r => {
        if(!r.dueDate) return;
        const due = new Date(r.dueDate);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if(diffDays <= 7 || r.isLocked){
            showNotice = true;
            dueSoonList.push(`• <strong>${esc(r.name)}</strong> (Due: ${r.dueDate})`);
        }
    });

    if(renewalBox && loginWrapper){
        if(showNotice){
            renewalBox.style.display = "block";
            loginWrapper.style.maxWidth = "850px";
        } else {
            renewalBox.style.display = "none";
            loginWrapper.style.maxWidth = "450px";
        }
    }

    if(!banner) return;
    if(showNotice){
        banner.className = "login-subscription-alert";
        banner.innerHTML = `
            <strong>⚠️ RENEWAL NOTICE:</strong><br>
            May mga sangay na malapit nang mapaso ang suskripsyon. Mangyaring mag-renew upang maiwasan ang pansamantalang lockout.<br>
            <div style="margin-top:4px; font-size:11px;">${dueSoonList.join("<br>")}</div>
        `;
        banner.classList.remove("hidden");
    } else {
        banner.classList.add("hidden");
    }
}

/* =========================================================
   AUTH & TEMPORARY PASSWORD MATCHING ENGINE
========================================================= */

let currentUser = null;
let currentPage = "dashboard";

function isCurrentUserSubscriptionExpired(user = currentUser){
    if(!user) return false;
    if(user.role === "IT" || user.role === "BOSS") return false;
    if(!user.realtyId) return false;
    return isRealtySubscriptionExpired(user.realtyId);
}

function getInitialPageForUser(user = currentUser){
    if(!user) return "dashboard";
    if(user.role === "IT") return "it-room";
    if(isCurrentUserSubscriptionExpired(user)) return "expired-room";
    return "dashboard";
}
function saveSession(user, page="dashboard"){
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, page }));
}

function clearSession(){
    localStorage.removeItem(SESSION_KEY);
}

function findStaffByUsernameOrBranch(inputUser){
    if(!inputUser) return null;
    const clean = inputUser.trim().toLowerCase();
    
    let found = db.staff.find(s => s.username && s.username.toLowerCase() === clean);
    if(found) return found;

    found = db.staff.find(s => s.name && s.name.toLowerCase() === clean);
    if(found) return found;

    const matchingRealty = db.realties.find(r => 
        r.id.toLowerCase() === clean || 
        r.name.toLowerCase() === clean ||
        r.name.toLowerCase().replace(/ branch| site| realty/gi, "").trim() === clean
    );

    if(matchingRealty){
        return db.staff.find(s => s.realtyId === matchingRealty.id && s.role === "ADMIN") 
            || db.staff.find(s => s.realtyId === matchingRealty.id);
    }
    return null;
}

function verifyStaffPassword(staff, inputPassword){
    if(!staff || !inputPassword) return false;
    const clean = inputPassword.trim();
    
    if(staff.password === clean) return true;
    if(staff.temporaryPassword && staff.temporaryPassword === clean) return true;
    
    if(staff.temporaryPassword && staff.temporaryPassword.toUpperCase() === clean.toUpperCase()) return true;
    if(staff.password && staff.password.toUpperCase() === clean.toUpperCase() && staff.password.toUpperCase().startsWith("TMP-")) return true;

    const normInput = clean.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const normStored = (staff.temporaryPassword || staff.password || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if(normStored && normInput && normStored === normInput && normStored.startsWith("TMP")) return true;

    return false;
}

function login(){
    try {
        const storedDB = localStorage.getItem(DB_KEY);
        if(storedDB) db = JSON.parse(storedDB);
    } catch(e){}

    const rawUsername = document.getElementById("loginUsername").value;
    const rawPassword = document.getElementById("loginPassword").value;
    const username = rawUsername.trim();
    const password = rawPassword.trim();

    if(!username || !password){
        alert("Paki-lagay ang username at password.");
        return;
    }

    const now = new Date();
    const currentDate = now.toISOString().slice(0,10);
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let isSuperUser = false;

    // 1. IT MASTER ROOT
    if((username.toLowerCase()==="it" || username.toLowerCase()==="root") && password===(db.settings.itPassword || "it123")){
        currentUser={
            username:"it",
            name:"IT Root Administrator",
            role:"IT",
            roles:["IT", "BOSS", "ADMIN"]
        };
        isSuperUser = true;
    }
    // 2. BOSS EXECUTIVE
    else if(username.toLowerCase()==="boss" && password===(db.settings.bossPassword || "boss123")){
        currentUser={
            username:"boss",
            name:"Boss Executive",
            role:"BOSS",
            roles:["BOSS"],
            bossBranchOverride: null
        };
        isSuperUser = true;
    }
    // 3. REGULAR BRANCH ADMIN / STAFF / REALTY
    else{
        const staff = findStaffByUsernameOrBranch(username);

        if(!staff || !verifyStaffPassword(staff, password)){
            alert("Maling username o password! Siguraduhing tama ang username o pangalan ng realty, at ang inisyung temporary password.");
            return;
        }

        if(staff.status !== "ACTIVE"){
            alert("Ang account na ito ay kasalukuyang INACTIVE.");
            return;
        }

        if(staff.realtyId){
            const branch = db.realties.find(r => r.id === staff.realtyId);
            if(branch && branch.isLocked && !isRealtySubscriptionExpired(branch.id)){
                alert(`🚫 ACCESS DENIED: Ang ${branch.name} ay kasalukuyang naka-lock dahil sa subscription hold.`);
                return;
            }
        }

        currentUser={
            username:staff.username,
            name:staff.name,
            role:staff.role,
            roles:[staff.role],
            realtyId:staff.realtyId || (db.realties[0]?.id || null),
            mustChangePassword: staff.mustChangePassword === true
        };
    }

    if(!isSuperUser){
        const assignedRealty = currentUser.realtyId ? (db.realties.find(r=>r.id===currentUser.realtyId)?.name || "Main Realty Branch") : "Realty Branch";

        db.loginLogs.unshift({
            id: uid("LOG"),
            username: currentUser.username,
            name: currentUser.name,
            role: currentUser.role,
            realtyName: assignedRealty,
            date: currentDate,
            time: currentTime,
            timestamp: Date.now()
        });

        saveDB();
    }

    const defaultInitialPage = getInitialPageForUser(currentUser);
    saveSession(currentUser, defaultInitialPage);
    setupUserInterface();
    showPage(defaultInitialPage);

    if(currentUser.mustChangePassword){
        showMandatoryPasswordChangeModal();
    }
}

function showMandatoryPasswordChangeModal(){
    showModal(`
        <div class="modal-header" style="border-bottom:2px solid #2563eb;">
            <h3 style="color:#1d4ed8;">🔒 CREATE YOUR PERSONAL PASSWORD</h3>
        </div>
        <div style="padding:10px 0;">
            <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:12px 14px; border-radius:10px; margin-bottom:16px;">
                <p style="font-size:13px; color:#1e40af; line-height:1.5;">
                    Naka-login ka gamit ang <strong>Temporary Password</strong>. Magtakda ng sarili mong permanent personal password bago gamitin ang system.
                </p>
            </div>
            <div class="form-group">
                <label>New Personal Password (minimum 6 characters):</label>
                <input id="personalNewPassword" type="password" minlength="6" placeholder="Enter new personal password" required>
            </div>
            <div class="form-group">
                <label>Confirm Personal Password:</label>
                <input id="personalConfirmPassword" type="password" minlength="6" placeholder="Re-type new personal password" required>
            </div>
            <button class="btn btn-primary full" style="padding:14px; font-size:14px;" onclick="savePersonalPasswordAfterLogin()">SAVE PERSONAL PASSWORD &amp; ENTER</button>
        </div>
    `);
}

function savePersonalPasswordAfterLogin(){
    const pwd = document.getElementById("personalNewPassword")?.value.trim();
    const confirm = document.getElementById("personalConfirmPassword")?.value.trim();

    if(!pwd || pwd.length < 6){
        alert("Password must be at least 6 characters long.");
        return;
    }
    if(pwd !== confirm){
        alert("Passwords do not match!");
        return;
    }

    const staff = db.staff.find(s => s.username.toLowerCase() === currentUser.username.toLowerCase());
    if(staff){
        staff.password = pwd;
        staff.mustChangePassword = false;
        delete staff.temporaryPassword;
    }

    currentUser.mustChangePassword = false;
    saveSession(currentUser, currentPage);
    saveDB();

    closeModal();
    alert("Personal Password saved successfully!");
}

/* =========================================================
   SIDEBAR MENU CONFIGURATION
========================================================= */

const SIDEBAR_MENU = [
    { id: "dashboard",   label: "Dashboard",        icon: "🏠", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN", "STAFF"] },
    { id: "projects",    label: "Project / Site",    icon: "📁", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN", "STAFF"] },
    
    { 
        id: "reservation", 
        label: "Reservation",      
        icon: "📝", 
        group: "MAIN ROOM",      
        roles: ["ADMIN", "STAFF"],
        customCheck: () => {
            if(currentUser?.role === "IT") return true;
            if(currentUser?.role === "BOSS") {
                return !!currentUser.bossBranchOverride;
            }
            return true;
        }
    },

    { id: "buyers",      label: "Buyers",           icon: "👥", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN", "STAFF"] },
    { id: "staff",       label: "Staff Management", icon: "👥", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN"] },
    { id: "money",       label: "Money In / Out",   icon: "💵", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN"] },
    { id: "commission",  label: "Commission",       icon: "🤝", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN"] },
    { id: "refund",      label: "Refund",           icon: "↩️", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN"] },
    { id: "expenses",    label: "Expenses",         icon: "📊", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN"] },
    { id: "reports",     label: "Reports",          icon: "📈", group: "MAIN ROOM",     roles: ["IT", "BOSS", "ADMIN"] },

    { id: "records",     label: "Records / Audit",  icon: "📋", group: "SYSTEM AUDIT",   roles: ["IT", "BOSS"] },
    
    { id: "control",     label: "CONTROL",          icon: "🎛️", group: "SYSTEM CONTROL", roles: ["IT"] },
    { id: "cloud-subscription", label: "Cloud Subscription", icon: "CLOUD", group: "SYSTEM CONTROL", roles: ["IT"] },

    { id: "approvals",   label: "Approvals",        icon: "✅", group: "BOSS ROOM",      roles: ["IT", "BOSS"] },
    { id: "add-realty",  label: "Add Realty",       icon: "🏢", group: "BRANCH MANAGEMENT", roles: ["IT", "BOSS"] },

    { id: "it-room",     label: "Master Technical Control", icon: "🛠️", group: "IT ROOM (VENDOR)", roles: ["IT"] }
];

function renderSidebarMenu(){
    const navContainer = document.getElementById("sidebarNavItems");
    if (!navContainer || !currentUser) return;

    const allowedItems = SIDEBAR_MENU.filter(item => {
        if(typeof item.customCheck === "function") {
            return item.customCheck();
        }
        if (currentUser.role === "IT") return true;
        return item.roles.includes(currentUser.role);
    });

    let html = "";
    let currentGroup = "";

    allowedItems.forEach(item => {
        if (item.group !== currentGroup) {
            currentGroup = item.group;
            html += `<div class="nav-title">${currentGroup}</div>`;
        }

        const isActive = (item.id === currentPage) ? "active" : "";
        html += `
            <button class="nav-btn ${isActive}" data-page="${item.id}" onclick="showPage('${item.id}', this)">
                ${item.icon} ${item.label}
            </button>
        `;
    });

    navContainer.innerHTML = html;
}

function setupUserInterface(){
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    document.getElementById("sideUser").textContent = currentUser.name;
    document.getElementById("sideRole").textContent = currentUser.role;
    document.getElementById("topRole").textContent = currentUser.role;

    renderSidebarMenu();
    applyDynamicBranding();
}

function logout(){
    currentUser=null;
    clearSession();
    closeModal();
    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("loginUsername").value="";
    document.getElementById("loginPassword").value="";
    checkAndDisplayLoginSubscriptionNotice();
}

function refreshCurrentRoom(){
    try {
        db = JSON.parse(localStorage.getItem(DB_KEY)) || db;
    } catch(e){}

    applyDynamicBranding();
    renderSidebarMenu();
    showPage(currentPage);

    const btn = document.querySelector(".btn-refresh");
    if(btn){
        const originalText = btn.innerHTML;
        btn.innerHTML = "✅ Refreshed!";
        btn.style.borderColor = "#16a34a";
        btn.style.color = "#16a34a";
        setTimeout(()=>{
            btn.innerHTML = originalText;
            btn.style.borderColor = "#cbd5e1";
            btn.style.color = "#1e293b";
        }, 800);
    }
}

/* =========================================================
   PAGE ROUTER
========================================================= */

function openSubscriptionPaymentSubmission(){
    if(!currentUser || currentUser.role === "IT" || currentUser.role === "BOSS"){
        alert("Subscription payment submission is available only for a Realty branch account.");
        return;
    }

    const branch = db.realties.find(r => r.id === currentUser.realtyId);
    if(!branch){
        alert("Realty branch information could not be found.");
        return;
    }

    const existingPending = db.subscriptionPayments.find(p =>
        p.realtyId === branch.id &&
        p.status === "PENDING"
    );

    if(existingPending){
        alert("May pending payment verification na para sa branch na ito. Please allow up to 1 working business day for verification.");
        return;
    }

    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modalContent");

    if(!modal || !modalContent){
        alert("Payment submission window is unavailable.");
        return;
    }

    modalContent.innerHTML = `
        <div style="max-width:620px;">
            <h2 style="margin-bottom:8px;">SUBMIT RENEWAL PAYMENT</h2>
            <p style="color:#64748b;margin-bottom:18px;">
                ${esc(branch.name)}
            </p>

            <label>Payment Method</label>
            <select id="subscriptionPaymentMethod" style="width:100%;margin-bottom:12px;">
                <option value="MAYA">Maya</option>
                <option value="GOTYME">GoTyme</option>
            </select>

            <label>Reference Number</label>
            <input
                type="text"
                id="subscriptionPaymentReference"
                placeholder="Enter payment reference number"
                style="width:100%;margin-bottom:12px;"
            >

            <label>Amount</label>
            <input
                type="number"
                id="subscriptionPaymentAmount"
                min="0"
                step="0.01"
                value="${Number(branch.monthlyFee || db.settings.defaultMonthlyRate || 0)}"
                style="width:100%;margin-bottom:12px;"
            >

            <label>Payment Date</label>
            <input
                type="date"
                id="subscriptionPaymentDate"
                value="${new Date().toISOString().slice(0,10)}"
                style="width:100%;margin-bottom:12px;"
            >

            <label>Payment Proof / Screenshot</label>
            <input
                type="file"
                id="subscriptionPaymentProof"
                accept="image/*,.pdf"
                style="width:100%;margin-bottom:14px;"
            >

            <div style="padding:12px;border-radius:8px;background:#f1f5f9;color:#475569;font-size:12px;line-height:1.6;margin-bottom:16px;">
                After submission, your payment will remain <strong>PENDING</strong>
                until verified by the System Administrator.
                Verification may take up to <strong>1 working business day</strong>.
            </div>

            <button
                type="button"
                class="btn btn-success full"
                onclick="submitSubscriptionPayment()">
                SUBMIT FOR VERIFICATION
            </button>

            <button
                type="button"
                class="btn btn-secondary full"
                onclick="closeModal()"
                style="margin-top:8px;">
                CANCEL
            </button>
        </div>
    `;

    modal.classList.remove("hidden");
}

async function submitSubscriptionPayment(){
    if(!currentUser || currentUser.role === "IT" || currentUser.role === "BOSS"){
        alert("Subscription payment submission is available only for a Realty branch account.");
        return;
    }

    const branch = db.realties.find(r => r.id === currentUser.realtyId);
    if(!branch){
        alert("Realty branch information could not be found.");
        return;
    }

    const method = document.getElementById("subscriptionPaymentMethod")?.value;
    const reference = document.getElementById("subscriptionPaymentReference")?.value.trim();
    const amount = Number(document.getElementById("subscriptionPaymentAmount")?.value || 0);
    const paymentDate = document.getElementById("subscriptionPaymentDate")?.value;
    const proofInput = document.getElementById("subscriptionPaymentProof");

    if(!method || !reference || !amount || amount <= 0 || !paymentDate){
        alert("Please complete the payment method, reference number, amount, and payment date.");
        return;
    }

    if(!proofInput || !proofInput.files || !proofInput.files[0]){
        alert("Please upload your payment proof or screenshot.");
        return;
    }

    const existingPending = db.subscriptionPayments.find(p =>
        p.realtyId === branch.id &&
        p.status === "PENDING"
    );

    if(existingPending){
        alert("May pending payment verification na para sa branch na ito.");
        return;
    }

    const file = proofInput.files[0];

    if(file.size > 5 * 1024 * 1024){
        alert("Payment proof must not exceed 5 MB.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(){
        db.subscriptionPayments.unshift({
            id: uid("SUBPAY"),
            realtyId: branch.id,
            realtyName: branch.name,
            submittedBy: currentUser.username,
            submittedByName: currentUser.name,
            method,
            reference,
            amount,
            paymentDate,
            proofName: file.name,
            proofType: file.type || "application/octet-stream",
            proofData: reader.result,
            status: "PENDING",
            submittedAt: new Date().toISOString()
        });

        saveDB();
        closeModal();

        alert("Payment submitted successfully. Status: PENDING. Please allow up to 1 working business day for verification.");

        renderExpiredOfflineRoom();
    };

    reader.onerror = function(){
        alert("Unable to read the payment proof file.");
    };

    reader.readAsDataURL(file);
}

function renderExpiredOfflineRoom(){
    const app = document.getElementById("app");
    const room = document.getElementById("expiredOfflineRoom");

    if(!room) return;

    const branch = currentUser?.realtyId
        ? db.realties.find(r => r.id === currentUser.realtyId)
        : null;

    if(app) app.classList.add("hidden");
    room.classList.remove("hidden");

    const branchName = document.getElementById("expiredOfflineBranchName");
    if(branchName){
        branchName.textContent = branch
            ? `${branch.name} — subscription expired`
            : "Your Realty subscription has expired.";
    }

    const pendingPayment = branch
        ? db.subscriptionPayments.find(p =>
            p.realtyId === branch.id &&
            p.status === "PENDING"
        )
        : null;

    const existingStatus = document.getElementById("subscriptionPaymentStatus");

    if(existingStatus){
        existingStatus.innerHTML = pendingPayment
            ? `<strong style="color:#fbbf24;">PAYMENT STATUS: PENDING</strong><br>
               <span style="font-size:12px;color:#94a3b8;">
               Payment submitted. Please allow up to 1 working business day for verification.
               </span>`
            : "";
    }

    const maya = document.getElementById("mayaRenewalLink");
    const gotyme = document.getElementById("gotymeRenewalLink");

    const mayaUrl = db.settings?.mayaPaymentUrl || "";
    const gotymeUrl = db.settings?.gotymePaymentUrl || "";

    if(maya){
        maya.href = mayaUrl || "#";
        maya.style.display = mayaUrl ? "flex" : "none";
    }

    if(gotyme){
        gotyme.href = gotymeUrl || "#";
        gotyme.style.display = gotymeUrl ? "flex" : "none";
    }
}

function showPage(page, btn){
    if(currentUser && isCurrentUserSubscriptionExpired(currentUser) && page !== "expired-room"){
        page = "expired-room";
    }

    if(page === "cloud-subscription" && currentUser?.role !== "IT"){
        alert("ACCESS RESTRICTED: Cloud Subscription Control is available only to the System Administrator.");
        showPage("dashboard");
        return;
    }

    if(page === "control" && currentUser?.role !== "IT"){
        alert("🚫 ACCESS RESTRICTED: Ang System Controller ay eksklusibo lamang para sa IT Master Vendor.");
        showPage("dashboard");
        return;
    }

    if(page === "reservation" && currentUser?.role === "BOSS" && !currentUser.bossBranchOverride){
        alert("⚠️ BAWAL MAG-RESERVE DITO: Pumasok muna sa loob ng isang Realty Branch bago mag-fill up ng reservation.");
        showPage("dashboard");
        return;
    }

    currentPage = page;

    const app = document.getElementById("app");
    const expiredRoom = document.getElementById("expiredOfflineRoom");

    if(page === "expired-room"){
        renderExpiredOfflineRoom();
        return;
    }

    if(expiredRoom) expiredRoom.classList.add("hidden");
    if(app) app.classList.remove("hidden");
    if(currentUser) saveSession(currentUser, currentPage);

    document.querySelectorAll(".sidebar .nav-btn").forEach(b => {
        if(b.getAttribute("data-page") === page) b.classList.add("active");
        else b.classList.remove("active");
    });

    const activeBranch = getActiveBranchProfile();

    const titles={
        dashboard:["Dashboard", currentUser?.role==="IT" ? "IT Platform Vendor Operations & Control" : (currentUser?.role==="BOSS" && !getActiveRealtyId() ? "Executive Group Realty Monitoring" : (activeBranch ? `${activeBranch.name} Overview` : "Realty Management Overview"))],
        projects:["Project / Site", canAccessBossFeatures() ? (activeBranch ? `${activeBranch.name} Projects` : "All Projects (Master View)") : `${activeBranch ? activeBranch.name : 'Branch'} Projects`],
        reservation:["Reservation", activeBranch ? `Create reservation under ${activeBranch.name}` : "Create property reservation"],
        buyers:["Buyers","Client folders, purchases & payment records"],
        money:["Money In / Out","Overall cashflow & financial movement"],
        commission:["Commission Monitoring","Agent & Team Leader Payout Ledgers and Monthly History"],
        refund:["Refund Management","Refund requests, approvals, and releases"],
        expenses:["Expenses","Business operational expenses"],
        reports:["Management Reports","Monthly sales, collections, and financial reports"],
        records:["Audit Records & Staff Logins","Staff daily activity and security logs"],
        control:["System Controller","Realty Name, Logo, & Operational Settings"],
        staff:["Staff Management", activeBranch ? `${activeBranch.name} Staff & Workers` : "Staff & User Administration"],
        approvals:["Approvals Hub","Pending refunds and executive clearances"],
        "add-realty":["Branch Management","Create and manage branch realty profiles"],
        "it-room":["IT Room","Master Technical Control & Platform Billing"],
        "cloud-subscription":["Cloud Subscription","Hosting, Storage & Billing Control"]
    };

    if(titles[page]){
        document.getElementById("pageTitle").textContent=titles[page][0];
        document.getElementById("pageSubtitle").textContent=titles[page][1];
    }

    if(page === "dashboard"){
        if(currentUser?.role === "IT" && typeof renderITRoom === "function") renderITRoom();
        else if(currentUser?.role === "BOSS" && !getActiveRealtyId() && typeof renderBossDashboard === "function") renderBossDashboard();
        else if(typeof renderAdminDashboard === "function") renderAdminDashboard();
    }
    else if(page === "projects" && typeof renderProjects === "function") renderProjects();
    else if(page === "reservation" && typeof renderReservation === "function") renderReservation();
    else if(page === "buyers" && typeof renderBuyers === "function") renderBuyers();
    else if(page === "money" && typeof renderMoney === "function") renderMoney();
    else if(page === "commission" && typeof renderCommission === "function") renderCommission();
    else if(page === "refund" && typeof renderRefund === "function") renderRefund();
    else if(page === "expenses" && typeof renderExpenses === "function") renderExpenses();
    else if(page === "reports" && typeof renderReports === "function") renderReports();
    else if(page === "records" && typeof renderRecords === "function") renderRecords();
    else if(page === "control" && typeof renderControl === "function") renderControl();
    else if(page === "staff" && typeof renderStaff === "function") renderStaff();
    else if(page === "approvals" && typeof renderApprovals === "function") renderApprovals();
    else if(page === "add-realty" && typeof renderAddRealty === "function") renderAddRealty();
    else if(page === "cloud-subscription" && typeof renderCloudSubscription === "function") renderCloudSubscription();
    else if(page === "it-room" && typeof renderITRoom === "function") renderITRoom();
}

/* =========================================================
   AUTO RESTORE SESSION ON LOAD
========================================================= */

window.addEventListener("DOMContentLoaded", () => {
    try {
        applyDynamicBranding();
        checkAndDisplayLoginSubscriptionNotice();

        const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
        if(saved && saved.user){
            currentUser = saved.user;
            currentPage = isCurrentUserSubscriptionExpired(currentUser) ? "expired-room" : (saved.page || getInitialPageForUser(currentUser));
            setupUserInterface();
            showPage(currentPage);

            if(currentUser.mustChangePassword){
                showMandatoryPasswordChangeModal();
            }
            return;
        }
    } catch(e){}
});

/* =========================================================
   MASTER SYSTEM EXPIRATION CHECKER & WARNING BANNER
========================================================= */

function checkSystemExpirationWarning() {
    // 1. EXEMPTION RULE: Kapag IT ang nakalog-in, itigil na agad ang function.
    // Boss at Realty (Branches) lang ang kasama sa expiration check at lockout.
    const isUserIT = typeof isIT === 'function' ? isIT() : false;
    
    if (isUserIT) {
        // Siguraduhing walang banner na lalabas sa IT
        const existingBanner = document.getElementById("master-expiration-banner");
        if (existingBanner) existingBanner.remove();
        document.body.style.paddingTop = "0px";
        return; // Dito pa lang, stop na agad ang check. Safe ang IT!
    }

    // 2. EXECUTED ONLY PARA SA BOSS AT REALTY:
    if (!db.settings || !db.settings.systemDueDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(db.settings.systemDueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Burahin ang lumang banner kung meron man
    const existingBanner = document.getElementById("master-expiration-banner");
    if (existingBanner) existingBanner.remove();

    // 3. LOCKOUT PARA SA BOSS AT REALTY: Kapag expired na (-1 day pataas)
    if (diffDays < 0) {
        document.body.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;text-align:center;padding:20px;font-family:sans-serif;">
                <div style="font-size:60px;margin-bottom:10px;">🔒</div>
                <h1 style="color:#ef4444;font-size:36px;margin:0 0 10px 0;font-weight:900;">SYSTEM LOCKED</h1>
                <p style="color:#cbd5e1;font-size:18px;max-width:500px;margin:0;">
                    Ang Master Subscription para sa platform na ito ay expired na.
                </p>
                <div style="margin-top:30px;background:#1e293b;padding:20px;border-radius:12px;border:1px solid #334155;">
                    <p style="color:#94a3b8;font-size:14px;margin:0;">
                        Mangyaring makipag-ugnayan sa iyong <strong>IT Platform Administrator</strong> upang makapag-renew at maibalik ang access sa system.
                    </p>
                </div>
                <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="margin-top:30px;padding:10px 20px;background:#334155;color:#fff;border:none;border-radius:8px;cursor:pointer;">
                    Bumalik sa Login Page
                </button>
            </div>
        `;
        return; // Pigilan ang pag-load ng ibang parts ng system para sa Boss/Realty
    }

    // 4. Huwag magpakita ng warning kung higit pa sa 7 days ang natitira
    if (diffDays > 7) return;

    let bannerHTML = "";

    if (diffDays === 0) {
        // LAST DAY NGAYON (Para lang sa Boss at Realty)
        bannerHTML = `
            <div id="master-expiration-banner" style="background:#dc2626;color:#fff;text-align:center;padding:10px;font-weight:bold;font-size:14px;position:fixed;top:0;left:0;width:100%;z-index:99999;box-shadow:0 4px 6px rgba(0,0,0,0.2);animation: pulse 2s infinite;">
                ⚠️ CRITICAL WARNING: Ngayon na ang LAST DAY ng inyong System Subscription! Makipag-ugnayan sa IT agad para hindi ma-lock ang system bukas.
            </div>
        `;
    } else {
        // WARNING: 7 days or less (Para lang sa Boss at Realty)
        bannerHTML = `
            <div id="master-expiration-banner" style="background:#d97706;color:#fff;text-align:center;padding:10px;font-weight:bold;font-size:13px;position:fixed;top:0;left:0;width:100%;z-index:99999;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                ⏳ PAALALA: Ang inyong System Subscription ay mag-eexpire sa loob ng ${diffDays} araw (Due Date: ${formatDisplayDate(db.settings.systemDueDate)}).
            </div>
        `;
    }

    // Ilagay ang banner sa pinakataas ng page
    if (bannerHTML) {
        document.body.style.paddingTop = "40px"; // Adjust based sa height ng banner
        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
    }
}