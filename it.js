/* =
   IT.JS - PLATFORM VENDOR, SUBSCRIPTIONS & DATABASE BACKUPS
   Checkpoint V2 Implementation: 2026-09-27
   Consolidated Modules: Pricing, Verification, Lockouts, 
   Room Extensions, Master Security & JSON Backup/Restore
= */

// =
// 1. IT MASTER OPERATIONS HUB (DASHBOARD DISPATCH)
// =
// =
// MULTI-LANGUAGE SYSTEM (I18N)
// =
let currentLang = localStorage.getItem("system_language") || "EN";

const i18n = {
    EN: {
        itTitle: "IT Platform Control Room",
        itDesc: "Global subscription identity enforcement, rate configuration & verification engine",
        sysLang: "Language",
        totalLots: "Total Lots",
        noLots: "No registered lots.",
        addLot: "+ Add Lot",
        availLotsMulti: "AVAILABLE LOTS (SELECT MULTIPLE IF APPLICABLE)",
        selectedLotsCount: "selected lot(s)",
        lotsToReserve: "Selected Lots to Reserve:",
        agentName: "Sales Agent Name",
        tlName: "Team Leader Name",
        agentRate: "Agent Rate / sqm (?)",
        tlRate: "TL Rate / sqm (?)",
        saveChanges: "SAVE CHANGES",
        bossOnlyEdit: "Only BOSS accounts can modify lots.",
        bossOnlyDelete: "Only BOSS accounts can delete lots."
    },
    TL: {
        itTitle: "IT Platform Control Room",
        itDesc: "Pamamahala ng subscription, rate configuration at verification engine",
        sysLang: "Wika",
        totalLots: "Kabuuang Lote",
        noLots: "Walang lote na nakarehistro.",
        addLot: "+ Magdagdag ng Lote",
        availLotsMulti: "AVAILABLE LOTS (CHECK PARA SA MULTIPLE LOTS)",
        selectedLotsCount: "napiling lote",
        lotsToReserve: "Mga Lote na Kukunin:",
        agentName: "Pangalan ng Sales Agent",
        tlName: "Pangalan ng Team Leader",
        agentRate: "Agent Rate / sqm (?)",
        tlRate: "TL Rate / sqm (?)",
        saveChanges: "I-SAVE ANG PAGBABAGO",
        bossOnlyEdit: "Pang-BOSS lamang ang karapatang mag-edit ng lote.",
        bossOnlyDelete: "Pang-BOSS lamang ang karapatang magbura ng lote."
    }
};

function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || key;
}

function changeSystemLanguage(lang) {
    localStorage.setItem("system_language", lang);
    currentLang = lang;
    alert("System language updated to " + (lang === "EN" ? "English" : "Tagalog") + "!");
    location.reload();
}



function renderITRoom() {
    const realties = db.realties || [];
    const payments = db.subscriptionPayments || [];
    const pendingCount = payments.filter(p => p.status === "PENDING").length;

    const bossSub = getSubscriptionState("BOSS");
    const bossRate = Number(db.settings.bossMonthlyRate || 3500);
    const realtyRate = Number(db.settings.defaultMonthlyRate || 2500);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
            <div>
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0;">👑 IT Platform Control Room</h3>
                <small style="color:#64748b;">Global subscription identity enforcement, rate configuration &amp; verification engine</small>
            </div>
           <div style="display:flex; gap:8px; align-items:center;">
                <select onchange="changeSystemLanguage(this.value)" style="padding:7px 12px; border-radius:6px; font-weight:700; border:1px solid #cbd5e1; background:#ffffff; color:#1e293b; cursor:pointer;">
                    <option value="EN" ${currentLang === 'EN' ? 'selected' : ''}>🇺🇸 English</option>
                    <option value="TL" ${currentLang === 'TL' ? 'selected' : ''}>tl­ Tagalog</option>
                </select>
                <button class="btn btn-primary" onclick="showPage('cloud-subscription')">☁️ Cloud Billing &amp; Verification (${pendingCount})</button>
                <button class="btn btn-secondary" onclick="showPage('control')">⚙️ System Control &amp; Backups</button>
            </div>
        </div>

        <!-- KPI SUMMARY TILES -->

        <!-- IT Master Control Panel -->
    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; color: #fff; margin-top: 20px; border: 1px solid #333;">
        <h3 style="color: #ff4d4d; margin-top: 0;">🛠️ IT Master System Control</h3>
        <p style="font-size: 13px; color: #aaa;">Dito binabago ni IT ang pangalan at permanent room IDs ng Boss at Realty.</p>
        
        <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #ccc;">Realty Name:</label>
            <input type="text" id="itRealtyNameInput" value="${db.realties[0] ? db.realties[0].name : 'TARLAC CENTRAL REALTY'}" style="width: 100%; padding: 8px; margin-top: 4px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px;">
        </div>
        <div style="margin-bottom: 12px;">
            <label style="font-size: 12px; color: #ccc;">Realty Permanent Room ID:</label>
            <input type="text" id="itRealtyIdInput" value="${db.realties[0] ? db.realties[0].id : ''}" style="width: 100%; padding: 8px; margin-top: 4px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px;">
        </div>
        <div style="margin-bottom: 15px;">
            <label style="font-size: 12px; color: #ccc;">Boss Permanent Room ID:</label>
            <input type="text" id="itBossIdInput" value="${db.settings.bossSubscription ? db.settings.bossSubscription.id : 'BOSS'}" style="width: 100%; padding: 8px; margin-top: 4px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px;">
        </div>

<div style="margin-top: 15px; margin-bottom: 15px; background: #222; padding: 10px; border-radius: 6px;">
        <label style="font-size: 12px; color: #ccc; display: flex; align-items: center; cursor: pointer;">
           <input type="checkbox" id="itHideRenewalEngine" ${JSON.parse(localStorage.getItem('realty_system_config') || '{}').hideRenewalEngine ? 'checked' : ''} style="margin-right: 8px; transform: scale(1.2);">
            Hide Multi-Branch Renewal Engine (Repair Mode)
        </label>
    </div>

        <button onclick="saveITMasterConfig()" style="background: #cc0000; color: #fff; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">
            💾 Save Master Settings
        </button>
    </div>


        <div class="grid-4" style="margin-bottom:24px;">
            <div class="card-3d" style="border-top:4px solid #2563eb;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Boss Room Status</small>
                <h3 style="color:#1d4ed8; font-size:22px; margin-top:8px;">${bossSub.state}</h3>
                <p style="font-size:11px; color:#64748b; margin-top:4px;">Due: ${bossSub.dueDate} (${bossSub.daysRemaining}d)</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #16a34a;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Managed Branches</small>
                <h3 style="color:#15803d; font-size:22px; margin-top:8px;">${realties.length}</h3>
                <p style="font-size:11px; color:#16a34a; margin-top:4px;">Permanent Room IDs active</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #f59e0b;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Pending Verification</small>
                <h3 style="color:#d97706; font-size:22px; margin-top:8px;">${pendingCount}</h3>
                <p style="font-size:11px; color:#d97706; margin-top:4px;">Awaiting proof inspection</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #9333ea;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Configured Rates</small>
                <h3 style="color:#7e22ce; font-size:18px; margin-top:8px;">${money(bossRate)} / ${money(realtyRate)}</h3>
                <p style="font-size:11px; color:#9333ea; margin-top:4px;">Boss / Realty Monthly</p>
            </div>
        </div>

        <!-- PERMANENT ROOM ACCOUNTS TABLE -->
        <div class="card-3d" style="margin-bottom:24px;">
            <div class="panel-header">
                <div>
                    <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">💲Permanent Room Subscriptions</h4>
                    <small style="color:#64748b;">Manage due dates, locks, and credentials directly</small>
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Room ID &amp; Name</th>
                            <th>Role / Type</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Executive Room Row -->
                        <tr style="background:#f8fafc;">
                            <td>
                                <strong>💲Boss Executive Suite</strong>
                                <br><small style="color:#64748b;">Permanent ID: <code>BOSS</code></small>
                            </td>
                            <td><span class="badge badge-purple">EXECUTIVE</span></td>
                            <td>${bossSub.dueDate}</td>
                            <td>
                                <span class="badge ${bossSub.state === 'ACTIVE' ? 'badge-green' : (bossSub.state === 'NEAR_EXPIRY' ? 'badge-purple' : 'badge-red')}">
                                    ${bossSub.state}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-primary" style="padding:4px 8px; font-size:11px;" onclick="openITExtendRoomModal('BOSS')">
                                    📅… Extend +30 Days
                                </button>
                            </td>
                        </tr>

                        <!-- Branch Room Rows -->
                        ${realties.map(r => {
                            const sub = getSubscriptionState(r.id);
                            return `
                                <tr>
                                    <td>
                                        <strong>💲${esc(r.name)}</strong>
                                        <br><small style="color:#64748b;">Permanent ID: <code>${r.id}</code> \vert{} Contact:${esc(r.owner)}</small>
                                    </td>
                                    <td><span class="badge badge-blue">REALTY BRANCH</span></td>
                                    <td>${r.dueDate || 'N/A'}</td>
                                    <td>
                                        <span class="badge ${sub.state === 'ACTIVE' ? 'badge-green' : (sub.state === 'NEAR_EXPIRY' ? 'badge-purple' : 'badge-red')}">
                                            ${sub.state}
                                        </span>
                                        ${r.isLocked ? '<span class="badge badge-red" style="margin-left:4px;">LOCKED</span>' : ''}
                                    </td>
                                    <td>
                                        <div style="display:flex; gap:4px; flex-wrap:wrap;">
                                            <button class="btn btn-primary" style="padding:4px 8px; font-size:11px;" onclick="openITExtendRoomModal('${r.id}')">
                                               📅… Extend
                                            </button>
                                            <button class="btn ${r.isLocked ? 'btn-success' : 'btn-danger'}" style="padding:4px 8px; font-size:11px;" onclick="toggleBranchLock('${r.id}')">
                                                ${r.isLocked ? '💲Unlock' : '🔒 Lock'}
                                            </button>
                                            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openITResetStaffPasswordModal('${r.id}')">
                                                ⏳‘ Reset Pass
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// =
// 2. CLOUD BILLING, RATES & PAYMENT VERIFICATION QUEUE
// =

function renderCloudSubscription() {
    const payments = db.subscriptionPayments || [];
    const bossRate = Number(db.settings.bossMonthlyRate || 3500);
    const realtyRate = Number(db.settings.defaultMonthlyRate || 2500);
    const mayaUrl = db.settings.mayaPaymentUrl || "";
    const gotymeUrl = db.settings.gotymePaymentUrl || "";
    const subscriptionQR = db.settings.subscriptionPaymentQR || "";
    const bossDueDate = db.settings?.bossSubscription?.dueDate || "";

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div class="grid-2" style="margin-bottom:24px;">
            <!-- IT PRICING CONFIGURATION PANEL -->
            <div class="panel">
                <div class="panel-header">
                    <h3 style="font-size:1rem; font-weight:800; color:#1e293b;">💲Configure Subscription Prices</h3>
                </div>
                <form onsubmit="saveITSubscriptionPricing(event)">
                    <div class="form-group">
                        <label>Boss Executive Room Monthly Price (?)</label>
                        <input type="number" id="itBossRateInput" value="${bossRate}" required min="0" step="50">
                        <small style="color:#64748b;">Singil sa Boss Executive Room subscription.</small>
                    </div>
                    <div class="form-group">
                        <label>Realty Branch Default Monthly Price (?)</label>
                        <input type="number" id="itRealtyRateInput" value="${realtyRate}" required min="0" step="50">
                        <small style="color:#64748b;">Standard base price sa bawat branch account.</small>
                    </div>
                    <div class="form-group">
                        <label>Boss Executive Room Expiration Date & Time</label>
                        <input type="datetime-local" id="itBossExpirationInput" value="${bossDueDate ? bossDueDate.slice(0,16) : ""}">
                        <small style="color:#64748b;">IT ang nagse-set ng exact expiration date at oras ng Boss. Puwedeng today mismo.</small>
                    </div>
                    <hr style="margin: 20px 0; border: 0; border-top: 1px dashed #cbd5e1;">
<div class="form-group">
    <label>SELECT REALTY BRANCH</label>
    <select id="itRealtySelectInput" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
        <option value="">-- Select Branch to Update --</option>
        ${(db.realties || []).map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
    </select>
</div>
<div class="form-group">
    <label>BRANCH EXPIRATION DATE & TIME</label>
    <input type="datetime-local" id="itRealtyExpirationInput" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">
    <p style="font-size: 11px; color: #64748b; margin-top: 4px;">Pumili ng branch sa itaas at i-set ang expiration date nito.</p>
</div>
<hr style="margin: 20px 0; border: 0; border-top: 1px dashed #cbd5e1;">

<div class="form-group">
    <label>Master Subscription Payment QR Code</label>
                        <input type="file" id="itSubscriptionQRInput" accept="image/*">
                        <small style="color:#64748b;">QR code image na gagamitin ng Boss at Realty para sa subscription payment.</small>
                        ${subscriptionQR ? `<div style="margin-top:10px;"><img src="${subscriptionQR}" alt="Master Subscription QR" style="max-width:220px;max-height:220px;border:1px solid #e2e8f0;border-radius:8px;padding:6px;background:#fff;"></div>` : ""}
                    </div>
                    
                    <button class="btn btn-primary full" type="submit" style="padding:10px;">💲SAVE CONFIGURATION</button>
                </form>
            </div>

            <!-- PAYMENT CHANNELS PREVIEW & SUMMARY -->
            <div class="panel">
                <div class="panel-header">
                    <h3 style="font-size:1rem; font-weight:800; color:#1e293b;">💲Payment Gateway Status</h3>
                </div>
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:14px;">
                    <strong style="color:#0f172a; font-size:14px;">Gateway URLs:</strong>
                    <p style="font-size:13px; color:#475569; margin-top:6px;">
                        <strong>Maya QR:</strong> ${mayaUrl ? `<a href="${mayaUrl}" target="_blank" style="color:#2563eb;">${esc(mayaUrl)}</a>` : '<span style="color:#dc2626;">Not Configured</span>'}
                    </p>
                    <p style="font-size:13px; color:#475569; margin-top:4px;">
                        <strong>GoTyme:</strong> ${gotymeUrl ? `<a href="${gotymeUrl}" target="_blank" style="color:#2563eb;">${esc(gotymeUrl)}</a>` : '<span style="color:#dc2626;">Not Configured</span>'}
                    </p>
                </div>
                <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:16px;">
                    <strong style="color:#1e40af; font-size:14px;">Verification Policy:</strong>
                    <p style="font-size:12px; color:#3b82f6; margin-top:4px; line-height:1.5;">

                        "Approving a branch or Boss payment will automatically add +30 days to the account's due date and remove any lockout restriction."

                        Ang pag-apruba sa bayad ng branch o ng Boss ay awtomatikong magdaragdag ng <strong>+30 araw</strong> sa due date ng account at magtatanggal sa anumang lockout restriction.

                    </p>
                </div>
            </div>
        </div>

        <!-- VERIFICATION QUEUE TABLE -->
        <div class="card-3d">
            <div class="panel-header">
                <div>
                    <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">💲Subscription Payment Verification Queue</h4>
                    <small style="color:#64748b;">Inspect uploaded screenshots and verify client bank payments</small>
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Room ID &amp; Target</th>
                            <th>Channel &amp; Ref #</th>
                            <th>Amount</th>
                            <th>Payment Date</th>
                            <th>Submitted By</th>
                            <th>Proof Screenshot</th>
                            <th>Status</th>
                            <th>Verification Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.length === 0 ? `<tr><td colspan="8" style="text-align:center; padding:18px; color:#888;">Walang nakabinbing payment submission.</td></tr>` :
                            payments.map(p => `
                                <tr>
                                    <td>
                                        <strong>${esc(p.realtyName || p.realtyId)}</strong>
                                        <br><small style="color:#64748b;">ID: <code>${p.realtyId}</code></small>${Array.isArray(p.coveredRooms) && p.coveredRooms.length > 1 ? `<br><span class="badge badge-purple" style="font-size:10px;">BUNDLE (${p.coveredRooms.length} ROOMS)</span>` : ''}
                                    </td>
                                    <td>
                                        <span class="badge badge-blue">${p.method}</span>
                                        <br><strong style="font-size:12px; color:#0f172a;">${esc(p.reference)}</strong>
                                    </td>
                                    <td style="color:#16a34a; font-weight:bold;">${money(p.amount)}</td>
                                    <td>${p.paymentDate || 'N/A'}</td>
                                    <td>
                                        ${esc(p.submittedByName || p.submittedBy)}
                                        <br><small style="color:#64748b;">${new Date(p.submittedAt).toLocaleDateString()}</small>
                                    </td>
                                    <td>
                                        ${p.proofData ? `
                                            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openProofViewerModal('${p.id}')">
                                                💲View Proof
                                            </button>
                                        ` : '<span style="color:#94a3b8; font-size:12px;">No Attachment</span>'}
                                    </td>
                                    <td>
                                        <span class="badge ${p.status === 'APPROVED' ? 'badge-green' : (p.status === 'REJECTED' ? 'badge-red' : 'badge-purple')}">
                                            ${p.status}
                                        </span>
                                    </td>
                                    <td>
                                        ${p.status === 'PENDING' ? `
                                            <div style="display:flex; gap:4px;">
                                                <button class="btn btn-success" style="padding:4px 8px; font-size:11px;" onclick="approveSubscriptionPayment('${p.id}')">
                                                    ? Approve
                                                </button>
                                                <button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="rejectSubscriptionPayment('${p.id}')">
                                                    ? Reject
                                                </button>
                                            </div>
                                        ` : `<span style="font-size:11px; color:#64748b;">Resolved (${p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : 'N/A'})</span>`}
                                    </td>
                                </tr>
                            `).join("")
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function saveITSubscriptionPricing(event) {
    event.preventDefault();
    const bossRate = Number(document.getElementById("itBossRateInput")?.value || 3500);
    const realtyRate = Number(document.getElementById("itRealtyRateInput")?.value || 2500);
    const mayaUrl = document.getElementById("itMayaUrlInput")?.value?.trim() || "";
    const gotymeUrl = document.getElementById("itGotymeUrlInput")?.value?.trim() || "";
    
    const bossExpiration = document.getElementById("itBossExpirationInput")?.value || "";
    const realtySelect = document.getElementById("itRealtySelectInput")?.value || "";
    const realtyExpiration = document.getElementById("itRealtyExpirationInput")?.value || "";
    const qrFile = document.getElementById("itSubscriptionQRInput")?.files?.[0];

    function applyDatesAndSave() {
        db.settings.bossMonthlyRate = bossRate;
        db.settings.defaultMonthlyRate = realtyRate;
        db.settings.mayaPaymentUrl = mayaUrl;
        db.settings.gotymePaymentUrl = gotymeUrl;

        if (bossExpiration) {
            if (!db.settings.bossSubscription) db.settings.bossSubscription = { id: "BOSS", status: "ACTIVE", dueDate: "" };
            db.settings.bossSubscription.dueDate = bossExpiration;
        }

        if (realtySelect && realtyExpiration) {
            const branch = db.realties.find(r => r.id === realtySelect);
            if (branch) {
                branch.dueDate = realtyExpiration;
            }
        }

        saveDB();
        alert("✅ Configuration and Expiration Dates updated successfully!");
        renderCloudSubscription();
    }

    if (qrFile) {
        const reader = new FileReader();
        reader.onload = function() {
            db.settings.subscriptionPaymentQR = reader.result;
            applyDatesAndSave();
        };
        reader.readAsDataURL(qrFile);
    } else {
        applyDatesAndSave();
    }
}

// =
// 3. APPROVAL, REJECTION & ACCESS RESTORATION ENGINE
// =

function approveSubscriptionPayment(paymentId) {
    const payment = (db.subscriptionPayments || []).find(p => p.id === paymentId);
    if (!payment) return;

    if (!confirm(`Are you sure you want to APPROVE payment ref ${payment.reference} for ${payment.realtyName}? Access will be restored immediately.`)) {
        return;
    }

    payment.status = "APPROVED";
    payment.verifiedBy = currentUser ? currentUser.username : "IT";
    payment.verifiedAt = new Date().toISOString();

    // Determine target rooms to extend
    let targetRooms = [];
    if (Array.isArray(payment.coveredRooms) && payment.coveredRooms.length > 0) {
        targetRooms = payment.coveredRooms;
    } else {
        targetRooms = [payment.realtyId];
    }

    targetRooms.forEach(roomId => {
        const termMonths = Number(payment.termMonths || 1);
        const extensionDays = termMonths === 12 ? 365 : 30;
        extendRoomSubscription(roomId, extensionDays);
    });

    saveDB();
    alert(`? Payment approved successfully! ${targetRooms.length} room(s) extended by ${Number(payment.termMonths || 1) === 12 ? 365 : 30} days and unlocked.`);
    renderCloudSubscription();
}

function rejectSubscriptionPayment(paymentId) {
    const payment = (db.subscriptionPayments || []).find(p => p.id === paymentId);
    if (!payment) return;

    const reason = prompt("Ilagay ang dahilan ng pag-reject (e.g., Unclear receipt, Invalid Reference):", "Invalid Transaction Reference");
    if (!reason) return;

    payment.status = "REJECTED";
    payment.rejectReason = reason;
    payment.verifiedBy = currentUser ? currentUser.username : "IT";
    payment.verifiedAt = new Date().toISOString();

    saveDB();
    alert("? Payment marked as REJECTED.");
    renderCloudSubscription();
}

function extendRoomSubscription(roomId, days = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (roomId === "BOSS") {
        if (!db.settings.bossSubscription) {
            db.settings.bossSubscription = { id: "BOSS", status: "ACTIVE", dueDate: "" };
        }
        let currentDue = db.settings.bossSubscription.dueDate ? new Date(db.settings.bossSubscription.dueDate) : today;
        if (isNaN(currentDue.getTime()) || currentDue < today) {
            currentDue = new Date(today);
        }
        currentDue.setDate(currentDue.getDate() + days);
        db.settings.bossSubscription.dueDate = currentDue.toISOString().slice(0, 10);
        db.settings.bossSubscription.status = "ACTIVE";
    } else {
        const branch = (db.realties || []).find(r => r.id === roomId);
        if (branch) {
            let currentDue = branch.dueDate ? new Date(branch.dueDate) : today;
            if (isNaN(currentDue.getTime()) || currentDue < today) {
                currentDue = new Date(today);
            }
            currentDue.setDate(currentDue.getDate() + days);
            branch.dueDate = currentDue.toISOString().slice(0, 10);
            branch.status = "ACTIVE";
            branch.isLocked = false;
        }
    }
}

// =
// 4. PROOF VIEWER & ROOM OVERRIDES
// =

function openProofViewerModal(paymentId) {
    const payment = (db.subscriptionPayments || []).find(p => p.id === paymentId);
    if (!payment || !payment.proofData) {
        alert("Walang kalakip na resibo.");
        return;
    }

    showModal(`
        <div class="modal-header">
            <h3>💲PAYMENT PROOF INSPECTION</h3>
            <button class="close" onclick="closeModal()">ï¿½</button>
        </div>
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; margin-bottom:12px; font-size:13px;">
            <p><strong>Room Target:</strong> ${esc(payment.realtyName)} (ID: <code>${payment.realtyId}</code>)</p>
            <p><strong>Channel &amp; Ref:</strong> ${payment.method} ï¿½ <code>${esc(payment.reference)}</code></p>
            <p><strong>Amount:</strong> <span style="color:#16a34a; font-weight:bold;">${money(payment.amount)}</span></p>
        </div>
        <div style="text-align:center; max-height:420px; overflow-y:auto; background:#000; border-radius:8px; padding:10px; margin-bottom:14px;">
            <img src="${payment.proofData}" style="max-width:100%; border-radius:4px;" alt="Receipt Screenshot">
        </div>
        <div style="display:flex; justify-content:space-between; gap:10px;">
            <a href="${payment.proofData}" download="receipt_${payment.reference}.jpg" class="btn btn-secondary">💲Download Image</a>
            ${payment.status === 'PENDING' ? `
                <div style="display:flex; gap:6px;">
                    <button class="btn btn-danger" onclick="closeModal(); rejectSubscriptionPayment('${payment.id}')">Reject</button>
                    <button class="btn btn-success" onclick="closeModal(); approveSubscriptionPayment('${payment.id}')">Approve &amp; Activate</button>
                </div>
            ` : '<button class="btn btn-secondary" onclick="closeModal()">Close</button>'}
        </div>
    `);
}

function openITExtendRoomModal(roomId) {
    const isBoss = roomId === "BOSS";
    const name = isBoss ? "Boss Executive Suite" : (db.realties.find(r => r.id === roomId)?.name || roomId);

    showModal(`
        <div class="modal-header">
            <h3>? MANUAL EXTENSION: ${esc(name)}</h3>
            <button class="close" onclick="closeModal()">ï¿½</button>
        </div>
        <p style="font-size:13px; color:#64748b; margin-bottom:14px;">
            Magdagdag ng subscription days para sa account na ito nang walang online payment.
        </p>
        <div class="form-group">
            <label>Bilang ng Araw na Idaragdag (+Days)</label>
            <input type="number" id="itExtendDaysInput" value="30" min="1" max="365" required>
        </div>
        <button class="btn btn-primary full" style="padding:10px;" onclick="applyManualExtension('${roomId}')">
            ILAPAT ANG EXTENSION
        </button>
    `);
}

function applyManualExtension(roomId) {
    const days = Number(document.getElementById("itExtendDaysInput")?.value || 30);
    if (days <= 0) return;

    extendRoomSubscription(roomId, days);
    saveDB();
    closeModal();
    alert(`? Naidagdag ang +${days} days para sa Room ${roomId}!`);
    
    if (currentPage === "dashboard" || currentPage === "it-room") renderITRoom();
    else if (currentPage === "cloud-subscription") renderCloudSubscription();
}

function toggleBranchLock(branchId) {
    const branch = (db.realties || []).find(r => r.id === branchId);
    if (!branch) return;

    branch.isLocked = !branch.isLocked;
    saveDB();
    alert(`Branch ${branch.name} is now ${branch.isLocked ? 'LOCKED (Restricted)' : 'UNLOCKED (Normal Access)'}.`);
    renderITRoom();
}

function openITResetStaffPasswordModal(branchId) {
    const branch = db.realties.find(r => r.id === branchId);
    if (!branch) return;

    const staff = db.staff.find(s => s.realtyId === branch.id && s.role === "ADMIN") || db.staff.find(s => s.realtyId === branch.id);
    const temp = generateTempPassword();

    showModal(`
        <div class="modal-header">
            <h3>💲IT OVERRIDE: RESET BRANCH PASSWORD</h3>
            <button class="close" onclick="closeModal()">ï¿½</button>
        </div>
        <p style="font-size:13px; color:#64748b; margin-bottom:12px;">
            Branch: <strong>${esc(branch.name)}</strong> (Room ID: <code>${branch.id}</code>)
        </p>
        <div class="form-group">
            <label>New Temporary Password</label>
            <input id="itNewTempPass" value="${temp}" style="font-weight:bold; color:#b91c1c; font-size:15px;" required>
        </div>
        <button class="btn btn-primary full" style="padding:10px;" onclick="saveITStaffPassword('${branch.id}', '${staff ? staff.id : ''}')">
            UPDATE CREDENTIALS
        </button>
    `);
}

function saveITStaffPassword(branchId, staffId) {
    const newPwd = document.getElementById("itNewTempPass")?.value.trim();
    if (!newPwd) return;

    const branch = db.realties.find(r => r.id === branchId);
    let staff = db.staff.find(s => s.id === staffId);

    if (staff) {
        staff.password = newPwd;
        staff.temporaryPassword = newPwd;
        staff.mustChangePassword = true;
    }
    if (branch) {
        branch.tempPassword = newPwd;
    }

    saveDB();
    closeModal();
    alert("? Password successfully overridden!");
    renderITRoom();
}

// =
// 5. DATABASE BACKUP, RESTORE & SYSTEM CONTROL
// =

function renderControl() {
    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div class="grid-2" style="margin-bottom:24px;">
            <!-- GENERAL BRANDING -->
            <div class="panel">
                <div class="panel-header">
                    <h3 style="font-size:1rem; font-weight:800; color:#1e293b;">💲General Branding</h3>
                </div>
                <form onsubmit="saveITBrandingSettings(event)">
                    <div class="form-group">
                        <label>System Platform Name</label>

                        <input id="itSysNameInput" value="${esc(db.settings.systemName || 'KHAINEJOSH REALTY')}" required>

                        <input id="itSysNameInput" value="${esc(db.settings.systemName || 'REALTY SYSTEM')}" required>

                    </div>
                    <div class="form-group">
                        <label>Main Office Name</label>
                        <input id="itMainRealtyInput" value="${esc(db.settings.realtyName || 'Main Office')}">
                    </div>
                    <div class="form-group">
                        <label>System Icon / Logo (Emoji or Image URL)</label>
                        <input id="itLogoInput" value="${esc(db.settings.logo || '??')}">
                    </div>
                    <button class="btn btn-primary full" type="submit">SAVE BRANDING</button>
                </form>
            </div>

            <!-- IT CREDENTIAL SECURITY -->
            <div class="panel">
                <div class="panel-header">
                    <h3 style="font-size:1rem; font-weight:800; color:#1e293b;">💲IT Master Security</h3>
                </div>
                <form onsubmit="saveITPasswordChange(event)">
                    <div class="form-group">
                        <label>Current IT Password</label>
                        <input type="password" id="itCurrentPassInput" required>
                    </div>
                    <div class="form-group">
                        <label>New IT Password (min 6 characters)</label>
                        <input type="password" id="itNewPassInput" minlength="6" required>
                    </div>
                    <div class="form-group">
                        <label>Confirm New IT Password</label>
                        <input type="password" id="itConfirmPassInput" minlength="6" required>
                    </div>
                    <button class="btn btn-danger full" type="submit">UPDATE IT PASSWORD</button>
                </form>
            </div>
        </div>

        <!-- DATABASE BACKUP & DISASTER RECOVERY PANEL -->
        <div class="card-3d">
            <div class="panel-header">
                <div>
                    <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">💲Database Backup &amp; Disaster Recovery</h4>
                    <small style="color:#64748b;">Export full system data snapshots or restore from JSON backup</small>
                </div>
            </div>
            
            <div class="grid-2" style="margin-top:16px;">
                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px;">
                    <strong style="color:#0f172a; font-size:14px;">💲Export System Snapshot</strong>
                    <p style="font-size:12px; color:#64748b; margin:6px 0 14px 0;">
                        I-download ang buong database kasama ang realties, reservations, payments, buyers, at mga password sa iisang file.
                    </p>
                    <button class="btn btn-success full" onclick="exportDatabaseBackup()">
                        💲DOWNLOAD BACKUP FILE (.JSON)
                    </button>
                </div>

                <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:16px;">
                    <strong style="color:#0f172a; font-size:14px;">💲Restore Database Snapshot</strong>
                    <p style="font-size:12px; color:#64748b; margin:6px 0 10px 0;">
                        Mag-upload ng dati nang na-download na backup JSON file upang maibalik ang system state.
                    </p>
                    <input type="file" id="dbImportFile" accept=".json" style="margin-bottom:10px; font-size:12px; width:100%;">
                    <button class="btn btn-primary full" onclick="importDatabaseBackup()">
                        💲RESTORE BACKUP FILE
                    </button>
                </div>
            </div>

            <div style="margin-top:20px; padding-top:16px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                    <strong style="color:#dc2626; font-size:13px;">💲Danger Zone: Factory Reset</strong>
                    <p style="font-size:12px; color:#64748b;">Burahin ang lahat ng custom data at ibalik ang system sa bagong seed state.</p>
                </div>
                <button class="btn btn-danger" onclick="resetDatabase()">
                    💲FACTORY RESET DATABASE
                </button>
            </div>
        </div>
    `;
}

function saveITBrandingSettings(event) {
    event.preventDefault();

    db.settings.systemName = document.getElementById("itSysNameInput")?.value.trim() || "KHAINEJOSH REALTY";

    db.settings.systemName = document.getElementById("itSysNameInput")?.value.trim() || "REALTY SYSTEM";

    db.settings.realtyName = document.getElementById("itMainRealtyInput")?.value.trim() || "Main Office";
    db.settings.logo = document.getElementById("itLogoInput")?.value.trim() || "??";

    saveDB();
    applyDynamicBranding();
    alert("? Branding settings saved successfully!");
}

function saveITPasswordChange(event) {
    event.preventDefault();
    const current = document.getElementById("itCurrentPassInput")?.value;
    const newPwd = document.getElementById("itNewPassInput")?.value.trim();
    const confirmPwd = document.getElementById("itConfirmPassInput")?.value.trim();

    if (current !== (db.settings.itPassword || "it123")) {
        alert("Incorrect Current IT Password.");
        return;
    }
    if (!newPwd || newPwd.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }
    if (newPwd !== confirmPwd) {
        alert("Passwords do not match.");
        return;
    }

    db.settings.itPassword = newPwd;
    saveDB();
    alert("? IT Master Password updated successfully!");
    renderControl();
}

// =
// 6. BACKUP / RESTORE / RESET UTILITY HANDLERS
// =

function exportDatabaseBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchor = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `REALTY_SYSTEM_BACKUP_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importDatabaseBackup() {
    const fileInput = document.getElementById("dbImportFile");
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert("Pumili muna ng valid na JSON backup file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.settings || !Array.isArray(importedData.realties)) {
                alert("Maling format ng backup file. Kinakailangan ang valid Realty System database backup.");
                return;
            }

            if (!confirm("BABALA: Papalitan ng backup na ito ang kasalukuyang data sa database. Nais mo bang magpatuloy?")) {
                return;
            }

            db = importedData;
            normalizeDBSchema();
            saveDB();
            alert("? Database matagumpay na naibalik! Mare-reload ang application.");
            location.reload();
        } catch (err) {
            alert("Error sa pagbasa ng JSON file: " + err.message);
        }
    };

    reader.readAsText(file);
}

function resetDatabase() {
    const pass = prompt("Para kumpirmahin ang FACTORY RESET, ilagay ang IT Master Password:");
    if (!pass) return;

    if (pass !== (db.settings.itPassword || "it123")) {
        alert("Maling password! Kanselado ang factory reset.");
        return;
    }

    if (!confirm("TALAGANG SIGURADO KA BA? Mabubura ang LAHAT ng branches, buyers, lots, at transaksyon!")) {
        return;
    }

    localStorage.removeItem(DB_KEY);
    clearSession();
    alert("? Na-reset na ang database sa default seed data.");
    location.reload();
}










// --- IT MASTER CONTROL PANEL CODE ---
function saveITMasterConfig() {
    const savedConfig = JSON.parse(localStorage.getItem("realty_system_config")) || {};
    
    savedConfig.realtyName = document.getElementById('itRealtyNameInput').value;
    savedConfig.realtyRoomId = document.getElementById('itRealtyIdInput').value;
    savedConfig.bossRoomId = document.getElementById('itBossIdInput').value;
    savedConfig.hideRenewalEngine = document.getElementById('itHideRenewalEngine').checked;

    localStorage.setItem("realty_system_config", JSON.stringify(savedConfig));
    
    if(db.realties && db.realties.length > 0) {
        db.realties[0].name = savedConfig.realtyName;
        db.realties[0].id = savedConfig.realtyRoomId;
    }
    if(db.settings && db.settings.bossSubscription) {
        db.settings.bossSubscription.id = savedConfig.bossRoomId;
    }
    
    saveDB();
    alert("Tagumpay! Na-update na ang master settings.");
    location.reload();
}


