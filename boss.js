/* =========================================================
   BOSS.JS - EXECUTIVE COMMAND CENTER & BRANCH MANAGEMENT
========================================================= */

function renderBossDashboard(){
    const realties = db.realties || [];
    const reservations = db.reservations || [];
    const moneyIn = db.moneyIn || [];
    const moneyOut = db.moneyOut || [];
    const refunds = db.refunds || [];

    const pendingRefunds = refunds.filter(r => r.status === "PENDING");
    const totalGroupCollections = moneyIn.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalGroupExpenses = moneyOut.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalGroupNet = totalGroupCollections - totalGroupExpenses;
    const totalGroupReceivables = reservations.reduce((sum, r) => sum + Number(r.balance || 0), 0);

    const realtyStats = realties.map(r => {
        const rMoneyIn = moneyIn.filter(x => x.realtyId === r.id).reduce((sum, x) => sum + Number(x.amount || 0), 0);
        const rMoneyOut = moneyOut.filter(x => x.realtyId === r.id).reduce((sum, x) => sum + Number(x.amount || 0), 0);
        const rRes = reservations.filter(x => x.realtyId === r.id);
        const rStaff = db.staff.filter(s => s.realtyId === r.id);
        const rProj = db.projects.filter(p => p.realtyId === r.id);
        return {
            ...r,
            moneyIn: rMoneyIn,
            moneyOut: rMoneyOut,
            net: rMoneyIn - rMoneyOut,
            salesCount: rRes.length,
            staffCount: rStaff.length,
            projectCount: rProj.length
        };
    }).sort((a,b) => b.moneyIn - a.moneyIn);

    document.getElementById("content").innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
            <div>
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0;">👑 Executive Command Center</h3>
                <small style="color:#64748b;">Consolidated group realty oversight &amp; master switcher</small>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-primary" onclick="openBossPasswordModal()">🔒 Change My Personal Password</button>
            </div>
        </div>

        ${pendingRefunds.length > 0 ? `
            <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #f87171; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:#991b1b; font-size:14px;">⚠️ PENDING REFUND CLEARANCE REQUESTS (${pendingRefunds.length})</strong>
                    <p style="color:#7f1d1d; font-size:12px; margin-top:2px;">Branch administrators submitted refund requests for executive approval.</p>
                </div>
                <button class="btn btn-danger" onclick="showPage('approvals')">Review Clearances</button>
            </div>
        ` : ''}

        <div class="grid-4" style="margin-bottom:24px;">
            <div class="card-3d" style="border-top:4px solid #16a34a;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Gross Inflow (Money In)</small>
                <h3 style="color:#15803d; font-size:26px; margin-top:8px;">${money(totalGroupCollections)}</h3>
                <p style="font-size:11px; color:#16a34a; margin-top:4px;">All Branches Combined</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #dc2626;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Gross Outflows (Expenses)</small>
                <h3 style="color:#b91c1c; font-size:26px; margin-top:8px;">${money(totalGroupExpenses)}</h3>
                <p style="font-size:11px; color:#dc2626; margin-top:4px;">Expenses + Comm Payouts</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #2563eb;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Net Retained Capital</small>
                <h3 style="color:#1d4ed8; font-size:26px; margin-top:8px;">${money(totalGroupNet)}</h3>
                <p style="font-size:11px; color:#2563eb; margin-top:4px;">Actual Net Balance</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #f59e0b;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Total Receivables</small>
                <h3 style="color:#d97706; font-size:26px; margin-top:8px;">${money(totalGroupReceivables)}</h3>
                <p style="font-size:11px; color:#d97706; margin-top:4px;">Future Amortization</p>
            </div>
        </div>

        <div class="card-3d">
            <div class="panel-header" style="margin-bottom:12px;">
                <div>
                    <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">🏢 Managed Realty Branches</h4>
                    <small style="color:#64748b;">Maaari kang mag-isyu ng temporary password o pumasok sa branch room nito.</small>
                </div>
                <button class="btn btn-primary" onclick="showPage('add-realty')">+ Add Realty Branch</button>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Branch Name</th>
                            <th>Projects</th>
                            <th>Staff Count</th>
                            <th>Collections</th>
                            <th>Net Contribution</th>
                            <th>Executive Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${realtyStats.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:15px; color:#888;">No branches configured.</td></tr>` :
                          realtyStats.map((r, i) => `
                            <tr>
                                <td>
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="width:32px; height:32px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #cbd5e1;">
                                            ${renderLogoHTML(r.logo || '🏢')}
                                        </div>
                                        <div>
                                            <strong>${i===0 ? '🏆 ' : ''}${esc(r.name)}</strong>${r.isLocked ? '<span class="badge badge-red" style="font-size:10px; margin-left:6px;">LOCKED</span>' : ''}
                                            <br><small style="color:#64748b;">Contact: ${esc(r.owner)}</small>
                                        </div>
                                    </div>
                                </td>
                                <td><span class="badge badge-purple">${r.projectCount} Projects</span></td>
                                <td><span class="badge badge-blue">${r.staffCount} Staff</span></td>
                                <td style="color:#16a34a; font-weight:bold;">${money(r.moneyIn)}</td>
                                <td style="color:#2563eb; font-weight:bold;">${money(r.net)}</td>
                                <td>
                                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                        <button class="btn btn-secondary" style="padding:6px 10px; font-size:12px; font-weight:bold;" onclick="openIssueRealtyTempPasswordModal('${r.id}')">
                                            🔑 Issue Temp Pwd
                                        </button>
                                        <button class="btn btn-success" style="padding:6px 12px; font-size:12px; font-weight:bold;" onclick="universalSwitchBranch('${r.id}')">
                                            🚪 Enter Branch Room
                                        </button>
                                    </div>
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

function openBossPasswordModal(){
    showModal(`
        <div class="modal-header">
            <h3>🔒 CHANGE BOSS PERSONAL PASSWORD</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div class="form-group">
            <label>Current Password:</label>
            <input id="bossOldPassword" type="password" placeholder="Enter current password">
        </div>
        <div class="form-group">
            <label>New Personal Password (minimum 6 characters):</label>
            <input id="bossNewPassword" type="password" minlength="6" placeholder="Enter new password">
        </div>
        <div class="form-group">
            <label>Confirm New Personal Password:</label>
            <input id="bossConfirmPassword" type="password" minlength="6" placeholder="Confirm new password">
        </div>
        <button class="btn btn-primary full" onclick="saveBossPersonalPassword()">UPDATE BOSS PASSWORD</button>
    `);
}

function saveBossPersonalPassword(){
    const current = document.getElementById("bossOldPassword")?.value;
    const newPwd = document.getElementById("bossNewPassword")?.value.trim();
    const confirm = document.getElementById("bossConfirmPassword")?.value.trim();

    const actualCurrent = db.settings.bossPassword || "boss123";

    if(current !== actualCurrent){
        alert("Incorrect Current Password! Please try again.");
        return;
    }
    if(!newPwd || newPwd.length < 6){
        alert("New password must be at least 6 characters long.");
        return;
    }
    if(newPwd !== confirm){
        alert("New passwords do not match!");
        return;
    }

    db.settings.bossPassword = newPwd;
    saveDB();
    closeModal();
    alert("✅ Boss Personal Password updated successfully!");
}

function openIssueRealtyTempPasswordModal(realtyId){
    const branch = db.realties.find(r => r.id === realtyId);
    if(!branch) return;

    let adminStaff = db.staff.find(s => s.realtyId === branch.id && s.role === "ADMIN") 
                  || db.staff.find(s => s.realtyId === branch.id);
    
    if(!adminStaff){
        const defaultUsername = branch.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || ("admin" + Math.floor(100 + Math.random()*900));
        adminStaff = {
            id: uid("S"),
            name: branch.owner || `${branch.name} Admin`,
            username: defaultUsername,
            password: "admin123",
            temporaryPassword: "admin123",
            role: "ADMIN",
            status: "ACTIVE",
            realtyId: branch.id,
            mustChangePassword: false
        };
        db.staff.push(adminStaff);
        saveDB();
    }

    const suggestedTemp = generateTempPassword();

    showModal(`
        <div class="modal-header">
            <h3>🔑 ISSUE TEMPORARY PASSWORD TO REALTY</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px; margin-bottom:16px;">
            <p style="font-size:14px; color:#1e40af; font-weight:bold; margin-bottom:4px;">🏢 Branch: ${esc(branch.name)}</p>
            <p style="font-size:13px; color:#3b82f6;">Assigned Admin: <strong>${esc(adminStaff.name)}</strong></p>
            <p style="font-size:13px; color:#1e293b; margin-top:6px;">
                Authorized Login Username: <strong style="color:#2563eb; font-size:15px; background:#fff; padding:2px 8px; border-radius:6px; border:1px solid #93c5fd;">${esc(adminStaff.username)}</strong>
                <br><small style="color:#64748b;">(Tandaan: Puwede ring i-type ang mismong branch name na <strong>"${esc(branch.name)}"</strong> bilang username sa login)</small>
            </p>
        </div>
        <div class="form-group">
            <label>New Temporary Password para sa Realty:</label>
            <input id="realtyTempPwdInput" value="${suggestedTemp}" style="font-weight:bold; font-size:16px; color:#b91c1c;" required>
            <small style="color:#64748b;">Ibigay ito sa realty admin. Papapalitan ito ng personal password pagka-login nila.</small>
        </div>
        <button class="btn btn-primary full" style="padding:12px; font-size:14px;" onclick="saveRealtyTempPassword('${branch.id}', '${adminStaff.id}')">💾 SAVE &amp; ISSUE TEMPORARY PASSWORD</button>
    `);
}

function saveRealtyTempPassword(realtyId, staffId){
    const branch = db.realties.find(r => r.id === realtyId);
    let staff = db.staff.find(s => s.id === staffId);
    const newPwd = document.getElementById("realtyTempPwdInput")?.value.trim();

    if(!newPwd){
        alert("Paki-lagay ang temporary password.");
        return;
    }

    if(staff){
        staff.password = newPwd;
        staff.temporaryPassword = newPwd;
        staff.mustChangePassword = true;
    }
    if(branch){
        branch.tempPassword = newPwd;
    }

    saveDB();
    closeModal();
    alert(`✅ Matagumpay na naitakda ang Temporary Password!\n\nBranch: ${branch ? branch.name : ''}\nLogin Username: ${staff ? staff.username : ''} (o puwedeng "${branch ? branch.name : ''}")\nTemporary Password: ${newPwd}`);
    
    if(currentPage === "dashboard") renderBossDashboard();
    else if(currentPage === "add-realty") renderAddRealty();
    else if(currentPage === "staff") renderStaff();
    else showPage(currentPage);
}

function renderAddRealty(){
    document.getElementById("content").innerHTML=`
        <div class="grid-2">
            <div class="panel">
                <div class="panel-header"><h3>🏢 ADD NEW REALTY BRANCH</h3></div>
                <form onsubmit="addRealty(event)">
                    <div class="form-group"><label>Branch Name</label><input id="realtyName" required placeholder="e.g. TARLAC BRANCH"></div>
                    <div class="form-group"><label>Branch Manager / Admin Person</label><input id="realtyOwner" required placeholder="Manager Name"></div>
                    <div class="form-group"><label>Contact Number</label><input id="realtyContact" placeholder="09123456789"></div>
                    <div class="form-group"><label>Office Address</label><textarea id="realtyAddress" rows="2"></textarea></div>
                    <button class="btn btn-primary full" type="submit">+ SAVE BRANCH &amp; GENERATE ADMIN ACCOUNT</button>
                </form>
            </div>
            <div class="panel">
                <div class="panel-header"><h3>🏢 ACTIVE BRANCHES</h3></div>
                <div class="table-wrap">
                    <table>
                        <thead><tr><th>Branch</th><th>Manager</th><th>Login Username</th><th>Actions</th></tr></thead>
                        <tbody>${db.realties.map(r=>{
                            const admin = db.staff.find(s => s.realtyId === r.id && s.role === "ADMIN") || db.staff.find(s => s.realtyId === r.id);
                            return `
                                <tr>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="width:28px; height:28px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #cbd5e1;">
                                                ${renderLogoHTML(r.logo || '🏢')}
                                            </div>
                                            <strong>${esc(r.name)}</strong>
                                        </div>
                                    </td>
                                    <td>${esc(r.owner)}</td>
                                    <td><code style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:bold;">${esc(admin ? admin.username : 'admin')}</code></td>
                                    <td>
                                        <div style="display:flex; gap:4px;">
                                            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openIssueRealtyTempPasswordModal('${r.id}')">🔑 Issue Temp Pwd</button>
                                            <button class="btn btn-success" style="padding:4px 8px; font-size:11px;" onclick="universalSwitchBranch('${r.id}'); showPage('staff');">🚪 Enter</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join("")}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function addRealty(event){
    event.preventDefault();
    const name = document.getElementById("realtyName").value.trim().toUpperCase();
    const owner = document.getElementById("realtyOwner").value.trim();
    const contact = document.getElementById("realtyContact").value.trim();
    const address = document.getElementById("realtyAddress").value.trim();

    const futureDue = new Date();
    futureDue.setDate(futureDue.getDate() + 30);

    const newRealtyId = uid("R");
    const defaultUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || ("admin" + Math.floor(100 + Math.random()*900));
    const initialTempPwd = generateTempPassword();

    db.realties.push({ 
        id: newRealtyId, 
        name, 
        owner, 
        contact, 
        address, 
        status:"ACTIVE", 
        dueDate: futureDue.toISOString().slice(0,10), 
        monthlyFee: db.settings.defaultMonthlyRate || 2500, 
        isLocked: false, 
        logo: "🏢",
        tempPassword: initialTempPwd
    });

    db.staff.push({
        id: uid("S"),
        name: owner || `${name} Admin`,
        username: defaultUsername,
        password: initialTempPwd,
        temporaryPassword: initialTempPwd,
        role: "ADMIN",
        status: "ACTIVE",
        realtyId: newRealtyId,
        mustChangePassword: true
    });

    saveDB();
    alert(`Realty Branch "${name}" successfully created!\n\nAuthorized Login Username: ${defaultUsername} (o "${name}")\nTemporary Password: ${initialTempPwd}`);
    
    universalSwitchBranch(newRealtyId);
    showPage("staff");
}

function renderApprovals(){
    if(typeof renderRefund === "function") renderRefund();
}

/* =========================================================
   PRE-LOGIN EXPIRATION POP-UP & OFFLINE MODE OVERLAY
========================================================= */

function processLoginExpiration(userRole, branchId, proceedToDashboardCallback) {
    if (userRole === "IT") {
        proceedToDashboardCallback();
        return;
    }

    let dueDateStr = null;
    let targetName = "";

    if (userRole === "BOSS") {
        dueDateStr = (db.settings && db.settings.systemDueDate) ? db.settings.systemDueDate : null;
        targetName = "Master System (Boss Account)";
    } else if (userRole === "REALTY") {
        const branch = (db.realties || []).find(r => r.id === branchId);
        dueDateStr = branch ? branch.dueDate : null;
        targetName = branch ? branch.name : "Realty Branch";
    }

    if (!dueDateStr) {
        proceedToDashboardCallback();
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && diffDays > 0) {
        // 7 Days or less warning POPUP
        showExpirationPopup(diffDays, due, targetName, proceedToDashboardCallback);
    } else if (diffDays <= 0) {
        // Expired (OFFLINE MODE OVERLAY)
        proceedToDashboardCallback();
        triggerOfflineModeGlow();
    } else {
        // Safe (tuloy agad sa dashboard)
        proceedToDashboardCallback();
    }
}

function showExpirationPopup(daysLeft, dueDate, targetName, proceedCallback) {
    const formattedDate = dueDate.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
    
    const modalHtml = `
        <div id="preLoginWarningModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);">
            <div style="background:#1e293b;border:2px solid #f59e0b;border-radius:16px;padding:30px;max-width:650px;width:90%;display:flex;gap:20px;color:#fff;box-shadow:0 15px 50px rgba(245,158,11,0.2);flex-wrap:wrap;">
                
                <div style="flex:1;min-width:250px;">
                    <h2 style="color:#f59e0b;margin-top:0;display:flex;align-items:center;gap:10px;font-size:24px;">
                        ⚠️ ${daysLeft} Araw Nalang!
                    </h2>
                    <p style="color:#cbd5e1;line-height:1.6;font-size:15px;">
                        Paalala: Ang subscription para sa <strong>${targetName}</strong> ay mag-eexpire na sa <strong>${formattedDate}</strong>.
                    </p>
                    <p style="color:#cbd5e1;line-height:1.6;font-size:15px;">
                        Upang maiwasan ang pagiging <strong>OFFLINE MODE</strong> ng system, mangyaring i-scan ang QR code sa gilid at magpadala ng resibo sa IT bago pa mag-expire.
                    </p>
                    
                    <button id="btnProceedToDash" style="margin-top:20px;background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%);color:#fff;border:none;padding:12px 24px;border-radius:8px;font-weight:bold;cursor:pointer;width:100%;font-size:16px;box-shadow:0 4px 15px rgba(245,158,11,0.4);">
                        Acknowledge & Proceed to System
                    </button>
                </div>

                <div style="width:200px;background:#ffffff;border-radius:12px;padding:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;box-shadow:inset 0 0 10px rgba(0,0,0,0.1);">
                    <p style="color:#0f172a;font-weight:900;margin:0 0 10px 0;font-size:15px;">SCAN TO RENEW</p>
                    
                    <div style="width:150px;height:150px;background:#f1f5f9;border:2px dashed #94a3b8;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
                        <span style="color:#64748b;font-size:12px;font-weight:bold;">[ GCASH QR IMAGE ]</span>
                        <!-- PALITAN MO ITO NG SARILI MONG QR CODE IMAGE LINK -->
                    </div>
                    
                    <small style="color:#64748b;margin-top:10px;font-size:11px;font-weight:bold;">Send payment proof to IT Support</small>
                </div>

            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById("btnProceedToDash").onclick = function() {
        document.getElementById("preLoginWarningModal").remove();
        proceedCallback(); 
    };
}

function triggerOfflineModeGlow() {
    const existing = document.getElementById("offlineModeOverlay");
    if(existing) existing.remove();

    const offlineHtml = `
        <div id="offlineModeOverlay" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;pointer-events:none;text-align:center;animation: glowBlink 3s ease-in-out infinite;width:100%;">
            <style>
                @keyframes glowBlink {
                    0% { opacity: 0.15; text-shadow: 0 0 20px #ef4444; transform: translate(-50%,-50%) scale(1); }
                    50% { opacity: 0.7; text-shadow: 0 0 40px #ef4444, 0 0 80px #dc2626; transform: translate(-50%,-50%) scale(1.05); }
                    100% { opacity: 0.15; text-shadow: 0 0 20px #ef4444; transform: translate(-50%,-50%) scale(1); }
                }
            </style>
            <h1 style="color:rgba(239,68,68,0.3);font-size:clamp(40px, 8vw, 120px);font-weight:900;margin:0;letter-spacing:10px;text-transform:uppercase;">
                OFFLINE MODE
            </h1>
            <p style="color:rgba(252,165,165,0.7);font-size:clamp(16px, 3vw, 24px);font-weight:bold;margin-top:0;letter-spacing:3px;">
                SUBSCRIPTION EXPIRED
            </p>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', offlineHtml);
}

/* =========================================================
   AUTO-CHECKER PARA SA OFFLINE MODE (KAHIT NASA LOOB NA)
========================================================= */
setInterval(function() {
    // 1. Kung IT ang nakalogin, walang mangyayari (Ligtas ang IT)
    if (typeof isIT === 'function' && isIT()) return;

    // 2. I-check ang expiration ng Boss
    if (db.settings && db.settings.systemDueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const due = new Date(db.settings.systemDueDate);
        due.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Kung expired na (0 days or below), i-trigger ang blinking offline mode!
        if (diffDays <= 0) {
            triggerOfflineModeGlow();
        }
    }
}, 1000);