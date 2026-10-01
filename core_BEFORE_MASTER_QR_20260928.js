/* =========================================================
   CORE.JS - REALTY MULTI-TENANT SYSTEM ENGINE
   Checkpoint V2 Implementation: 2026-09-27
   Consolidated Parts 1 - 9 (Storage, Auth, Subscriptions, Router)
========================================================= */

const DB_KEY = "REALTY_SYSTEM_V1";
const SESSION_KEY = "REALTY_ACTIVE_SESSION";

let db = {
   settings: {
        systemName: "REALTY SYSTEM",
        realtyName: "Main Office",
        realtyAddress: "Philippines",
        logo: "🏢",
        mayaPaymentUrl: "",
        gotymePaymentUrl: "QRCODE.png",
        defaultMonthlyRate: 2500,
        bossMonthlyRate: 3500,
        bossPassword: "boss123",
        itPassword: "it123",
        bossSubscription: {
            id: "BOSS",
            status: "ACTIVE",
            dueDate: ""
        }
    },
    realties: [],
    projects: [],
    areas: [],
    blocks: [],
    lots: [],
    buyers: [],
    reservations: [],
    moneyIn: [],
    moneyOut: [],
    commissions: [],
    refunds: [],
    expenses: [],
    staff: [],
    subscriptionPayments: [],
    auditLogs: []
};

let currentUser = null;
let currentPage = "dashboard";

/* =========================================================
   1. UTILITIES & GLOBAL STRING/NUMBER HELPERS
========================================================= */

function uid(prefix = "ID") {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
}

function money(val) {
    const num = Number(val || 0);
    return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generateTempPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
}

function renderLogoHTML(logo) {
    if (!logo) return "🏢";
    if (String(logo).startsWith("data:image/") || String(logo).startsWith("http")) {
        return `<img src="${logo}" style="width:100%; height:100%; object-fit:contain; border-radius:inherit;" alt="Logo">`;
    }
    return `<span style="font-size:18px;">${logo}</span>`;
}

/* =========================================================
   2. STORAGE LAYER & DATABASE NORMALIZATION
========================================================= */

function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            db = { ...db, ...parsed };
            normalizeDBSchema();
        } else {
            seedInitialData();
            saveDB();
        }
    } catch (e) {
        console.error("Storage error. Initializing default data.", e);
        seedInitialData();
        saveDB();
    }
}

function saveDB() {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        alert("CRITICAL WARNING: Storage quota exceeded! Please back up data and clear space.");
    }
}

function seedInitialData() {
    const futureDue = new Date();
    futureDue.setDate(futureDue.getDate() + 30);
    const dueStr = futureDue.toISOString().slice(0, 10);

    db.settings.bossSubscription = {
        id: "BOSS",
        status: "ACTIVE",
        dueDate: dueStr
    };

    const initialBranchId = uid("R");
    db.realties.push({
        id: initialBranchId,
        name: "TARLAC CENTRAL REALTY",
        owner: "Branch Manager",
        contact: "09123456789",
        address: "Tarlac City, Tarlac",
        status: "ACTIVE",
        dueDate: dueStr,
        monthlyFee: 2500,
        isLocked: false,
        logo: "🏢",
        tempPassword: ""
    });

    db.staff.push({
        id: uid("S"),
        name: "Branch Admin",
        username: "admin",
        password: "admin123",
        temporaryPassword: "",
        role: "ADMIN",
        status: "ACTIVE",
        realtyId: initialBranchId,
        mustChangePassword: false
    });
}

function normalizeDBSchema() {
    if (!db.settings) db.settings = {};
    if (!db.settings.bossMonthlyRate) db.settings.bossMonthlyRate = 3500;
    if (!db.settings.defaultMonthlyRate) db.settings.defaultMonthlyRate = 2500;

    if (!db.settings.bossSubscription) {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        db.settings.bossSubscription = { id: "BOSS", status: "ACTIVE", dueDate: d.toISOString().slice(0, 10) };
    }

    const collections = [
        "realties", "projects", "areas", "blocks", "lots",
        "buyers", "reservations", "moneyIn", "moneyOut",
        "commissions", "refunds", "expenses", "staff",
        "subscriptionPayments", "auditLogs"
    ];

    collections.forEach(key => {
        if (!Array.isArray(db[key])) db[key] = [];
    });
}

/* =========================================================
   3. SUBSCRIPTION IDENTITY & 7-DAY ENGINE (CHECKPOINT V2)
========================================================= */

function resolveUserRoomIdentity(user) {
    if (!user) return null;
    if (user.role === "IT") {
        return { roomId: "IT", type: "IT", name: "IT System Administrator" };
    }
    if (user.role === "BOSS") {
        return { roomId: "BOSS", type: "BOSS", name: "Executive Suite" };
    }

    const branch = db.realties.find(r => r.id === user.realtyId);
    if (branch) {
        return {
            roomId: branch.id, // Permanent ID
            type: "REALTY",
            name: branch.name,
            branch: branch
        };
    }
    return null;
}

function getSubscriptionState(roomId) {
    if (roomId === "IT") {
        return { state: "ACTIVE", daysRemaining: 9999, dueDate: "PERMANENT", isLocked: false };
    }

    let dueDateStr = "";
    let isLocked = false;

    if (roomId === "BOSS") {
        dueDateStr = db.settings?.bossSubscription?.dueDate || "";
    } else {
        const branch = db.realties.find(r => r.id === roomId);
        if (branch) {
            dueDateStr = branch.dueDate || "";
            isLocked = !!branch.isLocked;
        }
    }

    if (isLocked) {
        return { state: "EXPIRED", daysRemaining: 0, dueDate: dueDateStr, isLocked: true };
    }

    if (!dueDateStr) {
        return { state: "EXPIRED", daysRemaining: 0, dueDate: "NOT_SET", isLocked: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffMs = due.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
        return { state: "EXPIRED", daysRemaining, dueDate: dueDateStr, isLocked: false };
    } else if (daysRemaining <= 7) {
        return { state: "NEAR_EXPIRY", daysRemaining, dueDate: dueDateStr, isLocked: false };
    } else {
        return { state: "ACTIVE", daysRemaining, dueDate: dueDateStr, isLocked: false };
    }
}

function isCurrentUserSubscriptionExpired(user) {
    if (!user || user.role === "IT") return false;
    const identity = resolveUserRoomIdentity(user);
    if (!identity) return true;
    const sub = getSubscriptionState(identity.roomId);
    return sub.state === "EXPIRED";
}

/* =========================================================
   4. AUTHENTICATION & LOGIN FLOW
========================================================= */

function saveSession(user, page) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user, page }));
    } catch (e) {}
}

function clearSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
}

function handleLoginSubmit(event) {
    event.preventDefault();
    const uInput = document.getElementById("loginUsername")?.value;
    const pInput = document.getElementById("loginPassword")?.value;
    loginUser(uInput, pInput);
}

function loginUser(usernameInput, passwordInput) {
    const username = (usernameInput || "").trim();
    const password = (passwordInput || "").trim();

    if (!username || !password) {
        alert("Please provide both username and password.");
        return;
    }

    // 1. IT Vendor Account
    if (username.toUpperCase() === "IT" && password === (db.settings.itPassword || "it123")) {
        currentUser = {
            id: "IT_MASTER",
            name: "IT System Administrator",
            username: "IT",
            role: "IT",
            realtyId: null
        };
        finalizeLogin();
        return;
    }

    // 2. Boss Executive Account
    if (username.toUpperCase() === "BOSS" && password === (db.settings.bossPassword || "boss123")) {
        currentUser = {
            id: "BOSS_EXEC",
            name: "Boss Executive",
            username: "BOSS",
            role: "BOSS",
            realtyId: null,
            bossBranchOverride: null
        };
        finalizeLogin();
        return;
    }

    // 3. Branch Staff or Branch Name Login
    let matchedStaff = db.staff.find(s => 
        s.username.toLowerCase() === username.toLowerCase() && 
        s.status === "ACTIVE"
    );

    let matchedBranch = null;

    if (!matchedStaff) {
        matchedBranch = db.realties.find(r => 
            r.name.toLowerCase() === username.toLowerCase() && 
            r.status === "ACTIVE"
        );
        if (matchedBranch) {
            matchedStaff = db.staff.find(s => s.realtyId === matchedBranch.id && s.role === "ADMIN");
        }
    } else {
        matchedBranch = db.realties.find(r => r.id === matchedStaff.realtyId);
    }

    if (!matchedStaff || !matchedBranch) {
        alert("Invalid username or password.");
        return;
    }

    const isValidPass = (password === matchedStaff.password) || 
                        (matchedStaff.temporaryPassword && password === matchedStaff.temporaryPassword) ||
                        (matchedBranch.tempPassword && password === matchedBranch.tempPassword);

    if (!isValidPass) {
        alert("Invalid username or password.");
        return;
    }

    currentUser = {
        id: matchedStaff.id,
        name: matchedStaff.name,
        username: matchedStaff.username,
        role: matchedStaff.role,
        realtyId: matchedBranch.id,
        mustChangePassword: !!matchedStaff.mustChangePassword
    };

    finalizeLogin();
}

function finalizeLogin() {
    const loginPortal = document.getElementById("loginPortal");
    if (loginPortal) loginPortal.classList.add("hidden");

    setupUserInterface();

    if (currentUser.role !== "IT" && isCurrentUserSubscriptionExpired(currentUser)) {
        showPage("expired-room");
        return;
    }

    currentPage = getInitialPageForUser(currentUser);
    showPage(currentPage);

    if (currentUser.mustChangePassword) {
        showMandatoryPasswordChangeModal();
    }
}

function logoutUser() {
    currentUser = null;
    clearSession();
    location.reload();
}

function getInitialPageForUser(user) {
    if (!user) return "dashboard";
    return "dashboard";
}

function canAccessBossFeatures() {
    return currentUser && currentUser.role === "BOSS";
}

function getActiveRealtyId() {
    if (!currentUser) return null;
    if (currentUser.role === "BOSS") return currentUser.bossBranchOverride || null;
    return currentUser.realtyId || null;
}

function getActiveBranchProfile() {
    const rid = getActiveRealtyId();
    if (!rid) return null;
    return db.realties.find(r => r.id === rid) || null;
}

function universalSwitchBranch(realtyId) {
    if (!currentUser) return;
    if (currentUser.role === "BOSS") {
        currentUser.bossBranchOverride = realtyId === "ALL" ? null : realtyId;
        saveSession(currentUser, currentPage);
        setupUserInterface();
        showPage(currentPage);
    }
}

/* =========================================================
   5. UI STATE & BRANDING CONFIGURATION
========================================================= */

function applyDynamicBranding() {
    const sysName = db.settings.systemName || "REALTY SYSTEM";
    const logo = db.settings.logo || "🏢";

    const portalName = document.getElementById("portalSystemName");
    if (portalName) portalName.textContent = sysName;

    const portalLogo = document.getElementById("portalLogo");
    if (portalLogo) portalLogo.innerHTML = renderLogoHTML(logo);

    const sideName = document.getElementById("sideBrandName");
    if (sideName) sideName.textContent = sysName;

    const sideLogo = document.getElementById("sideBrandLogo");
    if (sideLogo) sideLogo.innerHTML = renderLogoHTML(logo);
}

function setupUserInterface() {
    if (!currentUser) return;

    const badgeRole = document.getElementById("userBadgeRole");
    const badgeName = document.getElementById("userBadgeName");

    if (badgeRole) badgeRole.textContent = currentUser.role;
    if (badgeName) badgeName.textContent = currentUser.name;

    const isIT = currentUser.role === "IT";
    const isBoss = currentUser.role === "BOSS";

    const navITRoom = document.getElementById("navITRoom");
    const navCloudSub = document.getElementById("navCloudSub");
    const navControl = document.getElementById("navControl");
    const navAddRealty = document.getElementById("navAddRealty");

    if (navITRoom) navITRoom.classList.toggle("hidden", !isIT);
    if (navCloudSub) navCloudSub.classList.toggle("hidden", !isIT);
    if (navControl) navControl.classList.toggle("hidden", !isIT);
    if (navAddRealty) navAddRealty.classList.toggle("hidden", !isBoss && !isIT);

    renderBranchSelector();
}

function renderBranchSelector() {
    const container = document.getElementById("topbarBranchSelector");
    if (!container) return;

    if (currentUser?.role === "BOSS") {
        const branches = db.realties || [];
        const currentActive = currentUser.bossBranchOverride || "ALL";

        container.innerHTML = `
            <label style="font-size:12px; font-weight:bold; color:#64748b;">Branch Workspace:</label>
            <select style="padding:6px 12px; border-radius:6px; border:1px solid #cbd5e1; font-weight:bold; font-size:13px; color:#1e293b; outline:none;" onchange="universalSwitchBranch(this.value)">
                <option value="ALL" ${currentActive === "ALL" ? "selected" : ""}>👑 Consolidated Group (All Branches)</option>
                ${branches.map(b => `<option value="${b.id}" ${currentActive === b.id ? "selected" : ""}>🏢 ${esc(b.name)}</option>`).join("")}
            </select>
        `;
    } else {
        const branch = getActiveBranchProfile();
        container.innerHTML = branch ? `<span class="badge badge-purple" style="font-size:13px;">🏢 ${esc(branch.name)}</span>` : "";
    }
}

/* =========================================================
   6. OFFLINE RENEWAL ROOM & PROOF SUBMISSION (CHECKPOINT V2)
========================================================= */

function renderExpiredOfflineRoom() {
    const app = document.getElementById("app");
    const room = document.getElementById("expiredOfflineRoom");
    const loginPortal = document.getElementById("loginPortal");

    if (loginPortal) loginPortal.classList.add("hidden");
    if (app) app.classList.add("hidden");
    if (room) room.classList.remove("hidden");

    const identity = resolveUserRoomIdentity(currentUser);
    const titleElem = document.getElementById("expiredRoomTitle");
    const idTextElem = document.getElementById("expiredRoomIdText");
    const amountElem = document.getElementById("expiredRoomAmountText");

    let requiredFee = 0;
    if (identity?.type === "BOSS") {
        requiredFee = Number(db.settings.bossMonthlyRate || 3500);
    } else {
        requiredFee = Number(identity?.branch?.monthlyFee || db.settings.defaultMonthlyRate || 2500);
    }

    if (titleElem) {
        titleElem.textContent = identity ? `${identity.name} — Subscription Expired` : "Subscription Expired";
    }

    if (idTextElem) {
        idTextElem.textContent = identity ? identity.roomId : "UNKNOWN";
    }

    if (amountElem) {
        amountElem.textContent = money(requiredFee);
    }

    const pendingPayment = identity
        ? db.subscriptionPayments.find(p => p.realtyId === identity.roomId && p.status === "PENDING")
        : null;

    const statusContainer = document.getElementById("subscriptionPaymentStatus");
    if (statusContainer) {
        statusContainer.innerHTML = pendingPayment
            ? `<div style="background:#451a03; border:1px solid #b45309; border-radius:8px; padding:10px;">
                 <strong style="color:#fbbf24; font-size:13px;">PAYMENT VERIFICATION PENDING</strong><br>
                 <span style="font-size:12px; color:#fde68a;">Ref: ${esc(pendingPayment.reference)} | Submitted: ${new Date(pendingPayment.submittedAt).toLocaleDateString()}</span>
               </div>`
            : "";
    }

    const maya = document.getElementById("mayaRenewalLink");
    const gotyme = document.getElementById("gotymeRenewalLink");
    const mayaUrl = db.settings?.mayaPaymentUrl || "";
    const gotymeUrl = db.settings?.gotymePaymentUrl || "";

    if (maya) {
        maya.href = mayaUrl || "#";
        maya.style.display = mayaUrl ? "inline-flex" : "none";
    }

    if (gotyme) {
        gotyme.href = gotymeUrl || "#";
        gotyme.style.display = gotymeUrl ? "inline-flex" : "none";
    }
}

function openSubmitProofModal() {
    const identity = resolveUserRoomIdentity(currentUser);
    if (!identity) {
        alert("Cannot resolve room identity.");
        return;
    }

    let defaultAmount = 0;
    if (identity.type === "BOSS") {
        defaultAmount = Number(db.settings.bossMonthlyRate || 3500);
    } else {
        defaultAmount = Number(identity.branch?.monthlyFee || db.settings.defaultMonthlyRate || 2500);
    }

    showModal(`
        <div class="modal-header">
            <h3>📄 SUBMIT RENEWAL PAYMENT</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; margin-bottom:14px; font-size:13px; color:#1e40af;">
            Submitting payment for Room: <strong>${esc(identity.name)}</strong> (ID: <code>${identity.roomId}</code>)
        </div>
        <div class="form-group">
            <label>Payment Method</label>
            <select id="subPayMethod">
                <option value="MAYA">Maya Payment</option>
                <option value="GOTYME">GoTyme Bank</option>
                <option value="BANK_TRANSFER">Gcash</option>
                <option value="BANK_TRANSFER">PalawanPay</option>
                <option value="CASH">Bank</option>
            </select>
        </div>
        <div class="form-group">
            <label>Reference Number / Transaction Hash</label>
            <input id="subPayRef" placeholder="e.g. 1029384756" required>
        </div>
        <div class="form-group">
            <label>Amount Paid (₱)</label>
            <input id="subPayAmount" type="number" value="${defaultAmount}" required>
        </div>
        <div class="form-group">
            <label>Date of Payment</label>
            <input id="subPayDate" type="date" value="${new Date().toISOString().slice(0, 10)}" required>
        </div>
        <div class="form-group">
            <label>Upload Receipt / Proof (Image File, max 5MB)</label>
            <input id="subPayProof" type="file" accept="image/*" required>
        </div>
        <button class="btn btn-success full" style="padding:12px; margin-top:8px;" onclick="submitSubscriptionPayment()">
            SUBMIT FOR VERIFICATION
        </button>
    `);
}

function submitSubscriptionPayment() {
    const identity = resolveUserRoomIdentity(currentUser);
    if (!identity) {
        alert("Authorization failed: Room identity could not be verified.");
        return;
    }

    const method = document.getElementById("subPayMethod")?.value;
    const reference = document.getElementById("subPayRef")?.value.trim();
    const amount = Number(document.getElementById("subPayAmount")?.value || 0);
    const paymentDate = document.getElementById("subPayDate")?.value;
    const proofInput = document.getElementById("subPayProof");

    if (!method || !reference || amount <= 0 || !paymentDate) {
        alert("Please complete the payment method, reference number, amount, and payment date.");
        return;
    }

    if (!proofInput || !proofInput.files || !proofInput.files[0]) {
        alert("Please upload your payment proof screenshot.");
        return;
    }

    const existingPending = db.subscriptionPayments.find(p => 
        p.realtyId === identity.roomId && 
        p.status === "PENDING"
    );

    if (existingPending) {
        alert("A pending payment verification is already queued for this Room ID. Please allow IT to verify.");
        return;
    }

    const file = proofInput.files[0];
    if (file.size > 5 * 1024 * 1024) {
        alert("Receipt file must not exceed 5 MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function() {
        db.subscriptionPayments.unshift({
            id: uid("SUBPAY"),
            realtyId: identity.roomId,
            realtyName: identity.name,
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
        alert("Payment submitted successfully! IT verification is required to unlock your room.");
        renderExpiredOfflineRoom();
    };

    reader.onerror = function() {
        alert("Error reading payment proof file.");
    };

    reader.readAsDataURL(file);
}

/* =========================================================
   7. MASTER PAGE ROUTER & DISPATCHER
========================================================= */

function showPage(page) {
    if (currentUser && currentUser.role !== "IT" && isCurrentUserSubscriptionExpired(currentUser) && page !== "expired-room") {
        page = "expired-room";
    }

    // Role Security Guards
    if ((page === "cloud-subscription" || page === "control" || page === "it-room") && currentUser?.role !== "IT") {
        alert("ACCESS RESTRICTED: Exclusively reserved for IT Platform Administrator.");
        showPage("dashboard");
        return;
    }

    if (page === "add-realty" && currentUser?.role !== "BOSS" && currentUser?.role !== "IT") {
        alert("ACCESS RESTRICTED: Exclusively for Executive and IT Management.");
        showPage("dashboard");
        return;
    }

    if (page === "reservation" && currentUser?.role === "BOSS" && !currentUser.bossBranchOverride) {
        alert("BRANCH SCOPE REQUIRED: Please select a specific branch workspace before creating reservations.");
        showPage("dashboard");
        return;
    }

    currentPage = page;

    const app = document.getElementById("app");
    const expiredRoom = document.getElementById("expiredOfflineRoom");

    if (page === "expired-room") {
        renderExpiredOfflineRoom();
        return;
    }

    if (expiredRoom) expiredRoom.classList.add("hidden");
    if (app) app.classList.remove("hidden");
    if (currentUser) saveSession(currentUser, currentPage);

    document.querySelectorAll(".sidebar .nav-btn").forEach(b => {
        if (b.getAttribute("data-page") === page) b.classList.add("active");
        else b.classList.remove("active");
    });

    const activeBranch = getActiveBranchProfile();

    const titles = {
        dashboard: ["Dashboard", currentUser?.role === "IT" ? "IT Operations & Cloud Management" : (currentUser?.role === "BOSS" && !getActiveRealtyId() ? "Consolidated Executive Overview" : (activeBranch ? `${activeBranch.name} Dashboard` : "Overview"))],
        projects: ["Projects / Sites", activeBranch ? `${activeBranch.name} Projects` : "Consolidated Projects View"],
        reservation: ["Reservation", activeBranch ? `New Reservation under ${activeBranch.name}` : "Property Reservation"],
        buyers: ["Buyers Folder", "Buyer dossiers, payment schedules & amortization records"],
        money: ["Money Movement", "Overall collections, remittances, and disbursements"],
        commission: ["Commissions Ledger", "Agent, Broker & Team Leader Payout Tracker"],
        refund: ["Refunds & Withdrawals", "Refund applications, releases, and executive approvals"],
        expenses: ["Operational Expenses", "Branch overhead and development expenditures"],
        reports: ["Executive Reports", "Consolidated monthly performance & ledger statements"],
        records: ["System Audit Logs", "Staff daily actions, login records, and security trail"],
        staff: ["Staff Administration", activeBranch ? `${activeBranch.name} Team` : "User Management"],
        approvals: ["Approvals Hub", "Refund clearances and executive verification"],
        "add-realty": ["Branch Realties", "Create and maintain branch realty units"],
        "it-room": ["IT Operations", "Platform licenses and system billing engine"],
        "cloud-subscription": ["Cloud Billing", "Rates, verification, and payment gateways"],
        control: ["System Settings", "Branding, credentials, and configuration"]
    };

    if (titles[page]) {
        document.getElementById("pageTitle").textContent = titles[page][0];
        document.getElementById("pageSubtitle").textContent = titles[page][1];
    }

    // View Dispatches
    if (page === "dashboard") {
        if (currentUser?.role === "IT" && typeof renderITRoom === "function") renderITRoom();
        else if (currentUser?.role === "BOSS" && !getActiveRealtyId() && typeof renderBossDashboard === "function") renderBossDashboard();
        else if (typeof renderAdminDashboard === "function") renderAdminDashboard();
    }
    else if (page === "projects" && typeof renderProjects === "function") renderProjects();
    else if (page === "reservation" && typeof renderReservation === "function") renderReservation();
    else if (page === "buyers" && typeof renderBuyers === "function") renderBuyers();
    else if (page === "money" && typeof renderMoney === "function") renderMoney();
    else if (page === "commission" && typeof renderCommission === "function") renderCommission();
    else if (page === "refund" && typeof renderRefund === "function") renderRefund();
    else if (page === "expenses" && typeof renderExpenses === "function") renderExpenses();
    else if (page === "reports" && typeof renderReports === "function") renderReports();
    else if (page === "records" && typeof renderRecords === "function") renderRecords();
    else if (page === "staff" && typeof renderStaff === "function") renderStaff();
    else if (page === "approvals" && typeof renderApprovals === "function") renderApprovals();
    else if (page === "add-realty" && typeof renderAddRealty === "function") renderAddRealty();
    else if (page === "it-room" && typeof renderITRoom === "function") renderITRoom();
    else if (page === "cloud-subscription" && typeof renderCloudSubscription === "function") renderCloudSubscription();
    else if (page === "control" && typeof renderControl === "function") renderControl();
}

/* =========================================================
   8. MODAL ENGINE & MANDATORY SECURITY
========================================================= */

function showModal(html) {
    const modal = document.getElementById("globalModal");
    const content = document.getElementById("globalModalContent");
    if (!modal || !content) return;
    content.innerHTML = html;
    modal.classList.remove("hidden");
}

function closeModal() {
    const modal = document.getElementById("globalModal");
    if (modal) modal.classList.add("hidden");
}

function showMandatoryPasswordChangeModal() {
    showModal(`
        <div class="modal-header">
            <h3>🔒 MANDATORY: SET PERMANENT PASSWORD</h3>
        </div>
        <p style="font-size:13px; color:#64748b; margin-bottom:12px;">You are currently logged in with a temporary password. You must set a permanent password to continue.</p>
        <div class="form-group">
            <label>New Permanent Password (min 6 characters)</label>
            <input type="password" id="mandNewPass" minlength="6" placeholder="Enter new password" required>
        </div>
        <div class="form-group">
            <label>Confirm Permanent Password</label>
            <input type="password" id="mandConfirmPass" minlength="6" placeholder="Confirm new password" required>
        </div>
        <button class="btn btn-primary full" style="padding:12px;" onclick="saveMandatoryPassword()">SAVE &amp; CONTINUE</button>
    `);
}

function saveMandatoryPassword() {
    const nPass = document.getElementById("mandNewPass")?.value.trim();
    const cPass = document.getElementById("mandConfirmPass")?.value.trim();

    if (!nPass || nPass.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }
    if (nPass !== cPass) {
        alert("Passwords do not match.");
        return;
    }

    const staff = db.staff.find(s => s.id === currentUser.id);
    if (staff) {
        staff.password = nPass;
        staff.temporaryPassword = "";
        staff.mustChangePassword = false;
        currentUser.mustChangePassword = false;
        saveDB();
        saveSession(currentUser, currentPage);
        closeModal();
        alert("Password updated successfully.");
    }
}

/* =========================================================
   9. LIFECYCLE & INITIALIZATION
========================================================= */

window.addEventListener("DOMContentLoaded", () => {
    loadDB();
    applyDynamicBranding();

    try {
        const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (saved && saved.user) {
            currentUser = saved.user;
            const loginPortal = document.getElementById("loginPortal");
            if (loginPortal) loginPortal.classList.add("hidden");

            setupUserInterface();

            if (currentUser.role !== "IT" && isCurrentUserSubscriptionExpired(currentUser)) {
                showPage("expired-room");
            } else {
                currentPage = saved.page || getInitialPageForUser(currentUser);
                showPage(currentPage);
            }

            if (currentUser.mustChangePassword) {
                showMandatoryPasswordChangeModal();
            }
            return;
        }
    } catch (e) {
        clearSession();
    }
});
/* =========================================================
   10. IT STEALTH AUDIT PROTECTION & MASTER LOGGING ENGINE
========================================================= */

// Proteksyon sa pag-render ng table: Awtomatikong alisin si IT sa paningin ni Boss at Realty
(function injectAuditStealthFilter() {
    const originalRenderAudit = window.renderAudit || window.renderAuditLogs || window.loadAuditTrail;
    
    // I-intercept ang render function kung mayroon na sa window
    window.filterAuditLogsForViewer = function(logs) {
        if (!logs || !Array.isArray(logs)) return [];
        
        // Kapag si IT ang nakatingin, ipakita ang LAHAT ng galaw ni Boss at ng mga Realty
        if (window.currentUser && (window.currentUser.role === "IT" || window.currentUser.username === "IT")) {
            return logs;
        }
        
        // Kapag si Boss o Realty Staff ang nakatingin: ITAGO SI IT NANG BUO
        return logs.filter(item => {
            const userName = String(item.user || "").toUpperCase();
            const userRole = String(item.role || "").toUpperCase();
            return userName !== "IT" && userRole !== "IT";
        });
    };
})();
