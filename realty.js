/* =========================================================
   REALTY.JS - REALTY OPERATIONS, STAFF, BUYERS & INVENTORY
   WITH RESTRICTED RECEIPT AUDIT & TAMPER RADAR
========================================================= */

/* =========================================================
   RECEIPT AUDIT ENGINE HELPERS (BACKGROUND ENGINE)
========================================================= */

function recordReceiptAuditLog(receiptData) {
    db.receiptAuditLogs = db.receiptAuditLogs || [];

    const cleanOr = String(receiptData.orNo || "").trim();
    const existingSameOR = db.receiptAuditLogs.filter(r => String(r.orNo || "").trim().toLowerCase() === cleanOr.toLowerCase());
    const printCount = existingSameOR.length + 1;
    const isDuplicate = existingSameOR.length > 0;

    const logEntry = {
        id: uid("AUD-RCT"),
        orNo: cleanOr,
        printCount: printCount,
        isDuplicate: isDuplicate,
        recordedAt: new Date().toISOString(),
        date: receiptData.date || new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString(),
        buyerName: receiptData.buyerName || "—",
        lotInfo: receiptData.lotInfo || "—",
        amount: Number(receiptData.amount || 0),
        paymentMethod: receiptData.paymentMethod || "CASH",
        paymentType: receiptData.paymentType || "PAYMENT",
        month: receiptData.month || null,
        issuedBy: currentUser ? (currentUser.name || currentUser.username) : "Admin / Cashier",
        realtyId: receiptData.realtyId || getActiveRealtyId() || null
    };

    db.receiptAuditLogs.push(logEntry);
    saveDB();

    return logEntry;
}

function getReceiptAuditHistory(orNo) {
    db.receiptAuditLogs = db.receiptAuditLogs || [];
    const cleanOr = String(orNo || "").trim().toLowerCase();
    return db.receiptAuditLogs.filter(r => String(r.orNo || "").trim().toLowerCase() === cleanOr);
}

/* =========================================================
   1. ADMIN DASHBOARD
========================================================= */

function renderAdminDashboard(){
    const activeRealtyId = getActiveRealtyId();
    const activeBranch = getActiveBranchProfile();
    const isPrivilegedUser = canAccessBossFeatures();

    const tenantProjects = getTenantProjects();
    const allLots = tenantProjects
        .flatMap(p=>p.areas||[])
        .flatMap(a=>a.blocks||[])
        .flatMap(b=>b.lots||[]);

    const totalLots = allLots.length;
    const availableLots = allLots.filter(l => l.status === "AVAILABLE").length;
    const reservedLots = allLots.filter(l => l.status === "RESERVED").length;
    const soldLots = allLots.filter(l => l.status === "SOLD").length;
    const cancelledLots = allLots.filter(l => l.status === "CANCELLED" || l.status === "BACKOUT").length;

    const currentMonthStr = new Date().toISOString().slice(0,7);

    const filteredMoneyIn = db.moneyIn.filter(m => {
        if(activeRealtyId) return m.realtyId === activeRealtyId;
        if(isPrivilegedUser) return true;
        return false;
    });
    const filteredMoneyOut = db.moneyOut.filter(m => {
        if(activeRealtyId) return m.realtyId === activeRealtyId;
        if(isPrivilegedUser) return true;
        return false;
    });

    const monthIn = filteredMoneyIn.filter(m => String(m.date||"").slice(0,7) === currentMonthStr).reduce((sum, x) => sum + Number(x.amount||0), 0);
    const monthOut = filteredMoneyOut.filter(m => String(m.date||"").slice(0,7) === currentMonthStr).reduce((sum, x) => sum + Number(x.amount||0), 0);
    const netCashflow = monthIn - monthOut;

    let duplicateOrCount = 0;
    if (isPrivilegedUser) {
        const allReceiptLogs = db.receiptAuditLogs || [];
        const orCounts = {};
        for(let i = 0; i < allReceiptLogs.length; i++) {
            const o = String(allReceiptLogs[i].orNo || "").trim();
            if(o) orCounts[o] = (orCounts[o] || 0) + 1;
        }
        duplicateOrCount = Object.values(orCounts).filter(c => c > 1).length;
    }

    document.getElementById("content").innerHTML=`
        <div class="panel" style="background:#fff; border-left:5px solid #2563eb; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:42px; height:42px; border-radius:10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #cbd5e1;">
                    ${renderLogoHTML(activeBranch ? activeBranch.logo : '🏢')}
                </div>
                <div>
                    <h3 style="margin:0; font-size:18px;">${activeBranch ? esc(activeBranch.name) : "Branch Overview"}</h3>
                    <small style="color:#64748b;">Private Branch Room • Multi-Tenant Protection Active</small>
                </div>
            </div>
            <div>
                <span class="badge badge-purple">${tenantProjects.length} Projects Active</span>
            </div>
        </div>

        ${(isPrivilegedUser && duplicateOrCount > 0) ? `
            <div class="panel" style="background:#fef2f2; border:1px solid #f87171; border-left:5px solid #dc2626; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#991b1b; font-size:14px;">⚠️ [EXECUTIVE ALERT] DUPLICATE RECEIPT SERIES DETECTED</strong>
                        <p style="margin:4px 0 0 0; font-size:12px; color:#b91c1c;">May nakitang ${duplicateOrCount} serye ng resibo na na-print o na-issue nang mahigit sa isang beses. Tingnan sa Reports Tab.</p>
                    </div>
                    <button class="btn btn-danger" style="font-size:11px; padding:6px 12px;" onclick="renderReports('RECEIPT_AUDIT')">AUDIT RECEIPTS</button>
                </div>
            </div>
        ` : ''}

        <div class="grid-4" style="margin-bottom:22px;">
            <div class="stat-card-3d" style="border-top:4px solid #16a34a;">
                <small style="color:#16a34a; font-weight:bold;">🟢 Available Lots</small>
                <h3 style="color:#15803d; font-size:26px; margin-top:6px;">${availableLots} <span style="font-size:13px; font-weight:normal; color:#64748b;">/ ${totalLots}</span></h3>
            </div>
            <div class="stat-card-3d" style="border-top:4px solid #f59e0b;">
                <small style="color:#f59e0b; font-weight:bold;">🟡 Reserved Lots</small>
                <h3 style="color:#d97706; font-size:26px; margin-top:6px;">${reservedLots}</h3>
            </div>
            <div class="stat-card-3d" style="border-top:4px solid #2563eb;">
                <small style="color:#2563eb; font-weight:bold;">🔵 Sold Properties</small>
                <h3 style="color:#1d4ed8; font-size:26px; margin-top:6px;">${soldLots}</h3>
            </div>
            <div class="stat-card-3d" style="border-top:4px solid #dc2626;">
                <small style="color:#dc2626; font-weight:bold;">🔴 Backout / Cancelled</small>
                <h3 style="color:#b91c1c; font-size:26px; margin-top:6px;">${cancelledLots}</h3>
            </div>
        </div>

        <div class="grid-3" style="margin-bottom:24px;">
            <div class="card-3d" style="border-top:4px solid #10b981;">
                <small style="color:#94a3b8; font-weight:bold; text-transform:uppercase;">Month Collections</small>
                <h4 style="font-size:1.6rem; font-weight:900; color:#0f172a; margin:8px 0 4px 0;">${money(monthIn)}</h4>
            </div>
            <div class="card-3d" style="border-top:4px solid #ef4444;">
                <small style="color:#94a3b8; font-weight:bold; text-transform:uppercase;">Month Expenses</small>
                <h4 style="font-size:1.6rem; font-weight:900; color:#0f172a; margin:8px 0 4px 0;">${money(monthOut)}</h4>
            </div>
            <div class="card-3d" style="border-top:4px solid #3b82f6;">
                <small style="color:#94a3b8; font-weight:bold; text-transform:uppercase;">Net Cash Flow</small>
                <h4 style="font-size:1.6rem; font-weight:900; color:#2563eb; margin:8px 0 4px 0;">${money(netCashflow)}</h4>
            </div>
        </div>
    `;
}

/* =========================================================
   2. STAFF MANAGEMENT
========================================================= */

function renderStaff(){
    const activeRealtyId = getActiveRealtyId();
    const activeBranch = getActiveBranchProfile();

    let displayStaff = [];
    if(canAccessBossFeatures() && !activeRealtyId){
        displayStaff = db.staff;
    } else {
        const targetId = activeRealtyId || currentUser?.realtyId;
        displayStaff = db.staff.filter(s => s.realtyId === targetId);
    }

    document.getElementById("content").innerHTML = `
        <div class="panel">
            <div class="panel-header" style="flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="font-size:18px;">👥 ${activeBranch ? `${esc(activeBranch.name)} - STAFF &amp; WORKERS` : "ALL REALTY STAFF"}</h3>
                    <small style="color:#64748b;">Manage branch cashiers, accountants, and staff members.</small>
                </div>
                <button class="btn btn-primary" onclick="openAddStaffModal()">+ ADD WORKER TO THIS REALTY</button>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Username</th>
                            <th>Assigned Branch</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${displayStaff.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:18px; color:#888;">Walang nakalistang staff sa realty na ito. Pindutin ang <strong>+ ADD WORKER TO THIS REALTY</strong> para maglagay.</td></tr>` :
                          displayStaff.map(s => {
                            const branch = db.realties.find(r => r.id === s.realtyId);
                            return `
                                <tr>
                                    <td><strong>${esc(s.name)}</strong></td>
                                    <td><code style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:bold;">${esc(s.username)}</code></td>
                                    <td><span class="badge badge-purple">${branch ? esc(branch.name) : "Main Branch"}</span></td>
                                    <td><span class="badge badge-blue">${esc(s.role)}</span></td>
                                    <td><span class="badge ${s.status==='ACTIVE'?'badge-green':'badge-red'}">${esc(s.status)}</span></td>
                                    <td>
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openResetStaffPasswordModal('${s.id}')">🔑 Issue Temp Pwd</button>
                                    </td>
                                </tr>
                            `;
                          }).join("")
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openAddStaffModal(){
    const activeRealtyId = getActiveRealtyId() || currentUser?.realtyId;
    const activeBranch = activeRealtyId ? db.realties.find(r => r.id === activeRealtyId) : null;
    const suggestedTemp = generateTempPassword();

    let branchHTML = "";
    if(activeBranch){
        branchHTML = `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; margin-bottom:14px; font-size:13px; color:#166534;">
                🏢 Adding worker to: <strong>${esc(activeBranch.name)}</strong>
            </div>
            <input type="hidden" id="newStaffBranch" value="${activeBranch.id}">
        `;
    } else {
        const branchOptions = db.realties.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join("");
        branchHTML = `
            <div class="form-group">
                <label>Select Realty Branch:</label>
                <select id="newStaffBranch">${branchOptions}</select>
            </div>
        `;
    }

    showModal(`
        <div class="modal-header">
            <h3>ADD NEW STAFF / WORKER</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        ${branchHTML}
        <div class="form-group"><label>Worker Full Name:</label><input id="newStaffName" placeholder="Full name" required></div>
        <div class="form-group"><label>Login Username:</label><input id="newStaffUsername" placeholder="e.g. cashier1" required></div>
        <div class="form-group">
            <label>Initial Temporary Password:</label>
            <input id="newStaffPassword" value="${suggestedTemp}" required>
        </div>
        <div class="form-group">
            <label>Role:</label>
            <select id="newStaffRole">
                <option value="ADMIN">ADMIN / CASHIER</option>
                <option value="ACCOUNTANT">ACCOUNTANT</option>
                <option value="STAFF">STAFF</option>
            </select>
        </div>
        <button class="btn btn-primary full" onclick="saveNewStaff()">CREATE WORKER ACCOUNT</button>
    `);
}

function saveNewStaff(){
    const realtyId = document.getElementById("newStaffBranch")?.value;
    const name = document.getElementById("newStaffName")?.value.trim();
    const username = document.getElementById("newStaffUsername")?.value.trim();
    const password = document.getElementById("newStaffPassword")?.value.trim();
    const role = document.getElementById("newStaffRole")?.value;

    if(!name || !username || !password){ alert("Please fill all fields."); return; }

    const exists = db.staff.some(s => s.username.toLowerCase() === username.toLowerCase());
    if(exists){
        alert("Username already in use. Please choose another username.");
        return;
    }

    db.staff.push({ 
        id: uid("S"), 
        name, 
        username, 
        password, 
        temporaryPassword: password, 
        role, 
        status: "ACTIVE", 
        realtyId,
        mustChangePassword: true 
    });

    saveDB();
    closeModal();
    alert(`Worker successfully created!\n\nUser: ${name} (@${username})\nTemporary Password: ${password}`);
    renderStaff();
}

function openResetStaffPasswordModal(staffId){
    const s = db.staff.find(x => x.id === staffId);
    if(!s) return;
    const suggestedTemp = generateTempPassword();

    showModal(`
        <div class="modal-header">
            <h3>ISSUE TEMPORARY PASSWORD</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div class="form-group">
            <label>Temporary Password for ${esc(s.name)} (Username: <strong>${esc(s.username)}</strong>):</label>
            <input id="staffResetPasswordInput" value="${suggestedTemp}" style="font-weight:bold; color:#b91c1c;">
        </div>
        <button class="btn btn-warning full" onclick="saveStaffPasswordReset('${s.id}')">SET TEMPORARY PASSWORD</button>
    `);
}

function saveStaffPasswordReset(staffId){
    const s = db.staff.find(x => x.id === staffId);
    if(!s) return;
    const pwd = document.getElementById("staffResetPasswordInput")?.value.trim();
    if(!pwd) return;

    s.password = pwd;
    s.temporaryPassword = pwd;
    s.mustChangePassword = true;

    saveDB();
    closeModal();
    alert(`Temporary password set to: ${pwd}\n\nMaaari na siyang mag-login gamit ang username na "${s.username}" at ang temporary password na ito.`);
    renderStaff();
}

/* =========================================================
   3. PROJECTS, AREAS, BLOCKS & LOTS INVENTORY
========================================================= */

function renderProjects(){
    renderProjectFolders();
}

function renderProjectFolders() {
    const el = document.getElementById("content");
    const activeBranch = getActiveBranchProfile();
    const displayProjects = getTenantProjects();

    el.innerHTML = `
        <div class="panel">
            <div class="panel-header" style="flex-wrap:wrap; gap:10px;">
                <div>
                    <h3>📁 PROJECTS &amp; SITE INVENTORY</h3>
                    <small style="color:#64748b;">
                        ${canAccessBossFeatures() ? (activeBranch ? `Super Admin View: ${activeBranch.name}` : 'Super Admin Master View: All Branches') : `Private inventory for ${activeBranch ? activeBranch.name : 'Branch'}`}
                    </small>
                </div>
                <button class="btn btn-primary" onclick="addProject()">+ ADD PROJECT</button>
            </div>

            <div class="folder-grid">
                ${
                    displayProjects.length === 0 ? `<p style="padding:20px; color:#888;">No projects found. Click <strong>+ ADD PROJECT</strong> to add one.</p>` :
                    displayProjects.map(p => {
                        const branch = db.realties.find(r => r.id === p.realtyId);
                        return `
                            <div class="folder">
                                <div class="folder-icon">📍</div>
                                <h4>${esc(p.name)}</h4>
                                <div style="margin-bottom:6px;">
                                    <span class="badge badge-purple">${branch ? esc(branch.name) : "Branch"}</span>
                                </div>
                                <p>${(p.areas||[]).length} area(s)</p>
                                <div style="margin-top:8px;">
                                    <button class="btn btn-primary" onclick="openProject('${p.id}')">OPEN</button>
                                    <button class="btn btn-danger" onclick="deleteProject('${p.id}')">DELETE</button>
                                </div>
                            </div>
                        `;
                    }).join("")
                }
            </div>
        </div>
    `;
}

async function addProject() {
    let targetRealtyId = getActiveRealtyId();

    if(canAccessBossFeatures() && !targetRealtyId){
        const options = db.realties.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join("");
        showModal(`
            <div class="modal-header">
                <h3>CREATE NEW PROJECT (SELECT BRANCH)</h3>
                <button class="close" onclick="closeModal()">×</button>
            </div>
            <div class="form-group">
                <label>Assign to Realty Branch:</label>
                <select id="newProjBranchPick">${options}</select>
            </div>
            <div class="form-group">
                <label>Project / Location Name:</label>
                <input id="newProjNameInput" placeholder="e.g. GRAND RESIDENCES" required>
            </div>
            <button class="btn btn-primary full" onclick="saveNewProjectFromModal()">CREATE PROJECT</button>
        `);
        return;
    }

    if(!targetRealtyId && db.realties.length > 0) targetRealtyId = db.realties[0].id;

    const name = (await promptInput("Project / Location Name (e.g. GRAND RESIDENCES):") || "").trim();
    if(!name) return;

    db.projects.push({ 
        id: uid("P"), 
        realtyId: targetRealtyId, 
        name: name.toUpperCase(), 
        areas: [] 
    });

    saveDB();
    renderProjectFolders();
}

function saveNewProjectFromModal(){
    const realtyId = document.getElementById("newProjBranchPick")?.value;
    const name = document.getElementById("newProjNameInput")?.value.trim();

    if(!name){ alert("Please enter project name."); return; }

    db.projects.push({ 
        id: uid("P"), 
        realtyId, 
        name: name.toUpperCase(), 
        areas: [] 
    });

    saveDB();
    closeModal();
    renderProjectFolders();
}

async function deleteProject(id) {
    if(!(await confirmDialog("Delete this project and all its lots?"))) return;
    db.projects = db.projects.filter(x => x.id !== id);
    saveDB();
    renderProjectFolders();
}

function openProject(id) {
    const p = db.projects.find(x => x.id === id);
    if(!p) return;
    p.areas = p.areas || [];
    const el = document.getElementById("content");
    el.innerHTML = `
        <div class="breadcrumb"><span onclick="renderProjectFolders()">Projects</span> / <strong>${esc(p.name)}</strong></div>
        <div class="panel">
            <div class="panel-header">
                <h3>📍 AREAS IN ${esc(p.name)}</h3>
                <button class="btn btn-primary" onclick="addArea('${p.id}')">+ ADD AREA</button>
            </div>
            <div class="folder-grid">
                ${
                    p.areas.length === 0 ? `<p style="padding:15px; color:#888;">No areas added yet.</p>` :
                    p.areas.map(a => `
                        <div class="folder">
                            <div class="folder-icon">📌</div>
                            <h4>${esc(a.name)}</h4>
                            <p>${(a.blocks||[]).length} block(s)</p>
                            <div style="margin-top:8px;">
                                <button class="btn btn-primary" onclick="openArea('${p.id}', '${a.id}')">OPEN</button>
                                <button class="btn btn-danger" onclick="deleteArea('${p.id}', '${a.id}')">DELETE</button>
                            </div>
                        </div>
                    `).join("")
                }
            </div>
        </div>
    `;
}

async function addArea(projectId) {
    const p = db.projects.find(x => x.id === projectId);
    const name = (await promptInput("Area Name:") || "").trim();
    if(!name) return;
    p.areas = p.areas || [];
    p.areas.push({ id: uid("A"), name: name.toUpperCase(), blocks: [] });
    saveDB();
    openProject(projectId);
}

async function deleteArea(projectId, areaId) {
    if(!(await confirmDialog("Delete area?"))) return;
    const p = db.projects.find(x => x.id === projectId);
    p.areas = (p.areas || []).filter(a => a.id !== areaId);
    saveDB();
    openProject(projectId);
}

function openArea(projectId, areaId) {
    const p = db.projects.find(x => x.id === projectId);
    const a = (p.areas || []).find(x => x.id === areaId);
    if(!a) return;
    a.blocks = a.blocks || [];
    const el = document.getElementById("content");
    el.innerHTML = `
        <div class="breadcrumb"><span onclick="renderProjectFolders()">Projects</span> / <span onclick="openProject('${p.id}')">${esc(p.name)}</span> / <strong>${esc(a.name)}</strong></div>
        <div class="panel">
            <div class="panel-header">
                <h3>🧱 BLOCKS IN ${esc(a.name)}</h3>
                <button class="btn btn-primary" onclick="addBlock('${p.id}', '${a.id}')">+ ADD BLOCK</button>
            </div>
            <div class="folder-grid">
                ${
                    a.blocks.length === 0 ? `<p style="padding:15px; color:#888;">No blocks added yet.</p>` :
                    a.blocks.map(b => `
                        <div class="folder">
                            <div class="folder-icon">🧱</div>
                            <h4>${esc(b.name)}</h4>
                            <p>${(b.lots||[]).length} lot(s)</p>
                            <div style="margin-top:8px;">
                                <button class="btn btn-primary" onclick="openBlock('${p.id}', '${a.id}', '${b.id}')">OPEN</button>
                                <button class="btn btn-danger" onclick="deleteBlock('${p.id}', '${a.id}', '${b.id}')">DELETE</button>
                            </div>
                        </div>
                    `).join("")
                }
            </div>
        </div>
    `;
}

async function addBlock(projectId, areaId) {
    const p = db.projects.find(x => x.id === projectId);
    const a = (p.areas || []).find(x => x.id === areaId);
    const name = (await promptInput("Block Name:") || "").trim();
    if(!name) return;
    a.blocks = a.blocks || [];
    a.blocks.push({ id: uid("B"), name: name.toUpperCase(), lots: [] });
    saveDB();
    openArea(projectId, areaId);
}

async function deleteBlock(projectId, areaId, blockId) {
    if(!(await confirmDialog("Delete block?"))) return;
    const p = db.projects.find(x => x.id === projectId);
    const a = (p.areas || []).find(x => x.id === areaId);
    a.blocks = (a.blocks || []).filter(b => b.id !== blockId);
    saveDB();
    openArea(projectId, areaId);
}

function openBlock(projectId, areaId, blockId) {
    const p = db.projects.find(x => x.id === projectId);
    const a = (p.areas || []).find(x => x.id === areaId);
    const b = (a.blocks || []).find(x => x.id === blockId);
    if(!b) return;
    b.lots = b.lots || [];
    const el = document.getElementById("content");
    el.innerHTML = `
        <div class="breadcrumb"><span onclick="renderProjectFolders()">Projects</span> / <span onclick="openProject('${p.id}')">${esc(p.name)}</span> / <span onclick="openArea('${p.id}', '${a.id}')">${esc(a.name)}</span> / <strong>${esc(b.name)}</strong></div>
        <div class="panel">
            <div class="panel-header">
                <h3>🏡 LOTS IN ${esc(b.name)}</h3>
                <button class="btn btn-primary" onclick="addLot('${p.id}', '${a.id}', '${b.id}')">+ ADD LOT</button>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Lot Name</th><th>SQM</th><th>Price</th><th>Status</th><th>Buyer / Reserver</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${b.lots.length === 0 ? `<tr><td colspan="6">No lots found.</td></tr>` : b.lots.map(l => `
                            <tr>
                                <td><strong>${esc(l.name)}</strong></td>
                                <td>${l.sqm} sqm</td>
                                <td>${money(l.price)}</td>
                                <td><span class="badge ${l.status === 'AVAILABLE' ? 'badge-green' : l.status === 'SOLD' ? 'badge-blue' : 'badge-yellow'}">${l.status}</span></td>
                                <td><strong>${esc(l.buyerName || '—')}</strong></td>
                                <td><button class="btn btn-danger" onclick="deleteLot('${p.id}', '${a.id}', '${b.id}', '${l.id}')">Delete</button></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function addLot(projectId, areaId, blockId) {
    const p = db.projects.find(x => x.id === projectId);
    const a = (p.areas || []).find(x => x.id === areaId);
    const b = (a.blocks || []).find(x => x.id === blockId);
    const name = (await promptInput("Lot Name:") || "").trim();
    if(!name) return;
    const sqm = (await promptInput("Area in SQM:", "100") || "").trim();
    const price = (await promptInput("Total Price (PHP):", "500000") || "").trim();
    if(!sqm || !price) return;
    b.lots = b.lots || [];
    b.lots.push({ id: uid("L"), name: name.toUpperCase(), sqm: Number(sqm), price: Number(price), status: "AVAILABLE", buyerName: "—" });
    saveDB();
    openBlock(projectId, areaId, blockId);
}

async function deleteLot(projectId, areaId, blockId, lotId) {
    if(!(await confirmDialog("Delete lot?"))) return;
    const p = db.projects.find(x => x.id === projectId);
    const a = (p.areas || []).find(x => x.id === areaId);
    const b = (a.blocks || []).find(x => x.id === blockId);
    b.lots = (b.lots || []).filter(l => l.id !== lotId);
    saveDB();
    openBlock(projectId, areaId, blockId);
}

/* =========================================================
   4. LOT PICKER ENGINE & RESERVATION
========================================================= */

window.reservationSelectedLots = [];
window.lotPickerState = { step: "AREA", selectedAreaId: null, selectedBlockId: null };

function getAllAreas(){
    const tenantProjects = getTenantProjects();
    const areas = [];
    tenantProjects.forEach(p => {
        (p.areas || []).forEach(a => {
            areas.push({ ...a, projectId: p.id, projectName: p.name, realtyId: p.realtyId });
        });
    });
    return areas;
}

function getAreaById(areaId){
    return getAllAreas().find(a => a.id === areaId) || null;
}

function getBlockById(areaId, blockId){
    const area = getAreaById(areaId);
    if(!area) return null;
    return (area.blocks || []).find(b => b.id === blockId) || null;
}

function toggleLotPickerBox(){
    const box = document.getElementById("lotPickerContainer");
    if(!box) return;
    if(box.classList.contains("hidden")){
        box.classList.remove("hidden");
        window.lotPickerState.step = "AREA";
        renderLotPickerContent();
    } else {
        box.classList.add("hidden");
    }
}

function renderLotPickerContent(){
    const content = document.getElementById("lotPickerContent");
    if(!content) return;
    const { step, selectedAreaId, selectedBlockId } = window.lotPickerState;

    if(step === "AREA"){
        const areas = getAllAreas();
        content.innerHTML = `
            <div style="font-size:12px; font-weight:bold; color:#64748b; margin-bottom:8px;">CHOOSE LOCATION / AREA</div>
            ${areas.length === 0 ? `<p style="padding:10px; color:#888;">No projects found.</p>` : areas.map(a => {
                const branch = db.realties.find(r => r.id === a.realtyId);
                return `
                    <div class="lot-nav-card" onclick="selectAreaStep('${a.id}')">
                        <span>📍 ${esc(a.name)} (${esc(a.projectName)}) <span class="badge badge-purple" style="font-size:9px; margin-left:6px;">${branch ? branch.name : ''}</span></span>
                        <span style="color:#2563eb;">&rarr;</span>
                    </div>
                `;
            }).join("")}
        `;
    } 
    else if(step === "BLOCK"){
        const area = getAreaById(selectedAreaId);
        const blocks = area ? (area.blocks || []) : [];
        content.innerHTML = `
            <div class="lot-picker-header">
                <button type="button" onclick="window.lotPickerState.step='AREA'; renderLotPickerContent();">&larr; Back to Areas</button>
                <strong>📍 ${esc(area ? area.name : '')}</strong>
            </div>
            ${blocks.length === 0 ? `<p style="padding:10px; color:#888;">No blocks found.</p>` : blocks.map(b => `
                <div class="lot-nav-card" onclick="selectBlockStep('${b.id}')">
                    <span>🧱 ${esc(b.name)}</span>
                    <span style="color:#2563eb;">&rarr;</span>
                </div>
            `).join("")}
        `;
    }
    else if(step === "LOT"){
        const area = getAreaById(selectedAreaId);
        const block = getBlockById(selectedAreaId, selectedBlockId);
        const availableLots = (block ? block.lots : []).filter(l => l.status === "AVAILABLE");

        content.innerHTML = `
            <div class="lot-picker-header">
                <button type="button" onclick="window.lotPickerState.step='BLOCK'; renderLotPickerContent();">&larr; Back to Blocks</button>
                <strong>${esc(area.name)} &bull; ${esc(block.name)}</strong>
            </div>
            ${availableLots.length === 0 ? `<p style="padding:10px; color:#888;">No available lots in this block.</p>` : `
              <div class="lot-checkbox-grid">
                ${availableLots.map(l => {
                    const isChecked = window.reservationSelectedLots.some(item => item.id === l.id);
                    return `
                        <label class="lot-checkbox-label">
                            <input type="checkbox" ${isChecked ? "checked" : ""} onchange="toggleLotSelection('${area.id}', '${block.id}', '${l.id}', this.checked)">
                            <div>
                                <strong style="display:block; font-size:13px;">${esc(l.name)}</strong>
                                <small style="display:block; color:#64748b;">${l.sqm} sqm</small>
                                <span style="font-size:12px; font-weight:bold; color:#166534;">${money(l.price)}</span>
                            </div>
                        </label>
                    `;
                }).join("")}
              </div>`
            }
            <div style="margin-top:14px; text-align:right;">
                <button type="button" class="btn btn-primary" onclick="document.getElementById('lotPickerContainer').classList.add('hidden')">Confirm Selection</button>
            </div>
        `;
    }
}

function selectAreaStep(areaId){
    window.lotPickerState.selectedAreaId = areaId;
    window.lotPickerState.step = "BLOCK";
    renderLotPickerContent();
}

function selectBlockStep(blockId){
    window.lotPickerState.selectedBlockId = blockId;
    window.lotPickerState.step = "LOT";
    renderLotPickerContent();
}

function toggleLotSelection(areaId, blockId, lotId, isChecked){
    const area = getAreaById(areaId);
    const block = getBlockById(areaId, blockId);
    const lot = (block ? block.lots : []).find(l => l.id === lotId);
    if(!lot) return;

    if(isChecked){
        if(!window.reservationSelectedLots.some(item => item.id === lot.id)){
            window.reservationSelectedLots.push({
                ...lot,
                areaId,
                areaName: area.name,
                blockId,
                blockName: block.name,
                projectId: area.projectId,
                projectName: area.projectName,
                realtyId: area.realtyId
            });
        }
    } else {
        window.reservationSelectedLots = window.reservationSelectedLots.filter(item => item.id !== lot.id);
    }

    updateSelectedLotDisplayButton();
    calculateReservationTotals();
}

function updateSelectedLotDisplayButton(){
    const label = document.getElementById("selectedLotSummaryLabel");
    if(!label) return;
    if(window.reservationSelectedLots.length === 0){
        label.innerText = "-- Choose Lot --";
    } else {
        const lotNames = window.reservationSelectedLots.map(l => l.name).join(", ");
        label.innerText = `${window.reservationSelectedLots[0].areaName} > ${window.reservationSelectedLots[0].blockName} > [ ${lotNames} ] (${window.reservationSelectedLots.length} lot(s))`;
    }
}

function findLotById(id){
    for(const p of db.projects)
        for(const a of (p.areas||[]))
            for(const b of (a.blocks||[]))
                for(const l of (b.lots||[]))
                    if(l.id===id) return l;
    return null;
}

function addMonths(dateStr, months){
    const d=new Date(dateStr+"T00:00:00");
    d.setMonth(d.getMonth()+months);
    return d.toISOString().slice(0,10);
}

function renderReservation() {
    window.reservationSelectedLots = [];

    document.getElementById("content").innerHTML = `
        <div class="panel">
            <div class="panel-header"><h3>📝 NEW RESERVATION ENTRY</h3></div>
            <div class="grid-2">
                <div>
                    <h4 style="margin-bottom:10px; color:#2563eb;">CLIENT &amp; AGENT INFORMATION</h4>
                    <div class="form-group"><label>Buyer Full Name</label><input type="text" id="resBuyerName" placeholder="Enter buyer full name"></div>
                    <div class="form-group"><label>Contact Number</label><input type="text" id="resBuyerContact" placeholder="09123456789"></div>
                    <div class="form-group"><label>Address</label><input type="text" id="resBuyerAddress" placeholder="Complete address"></div>
                    <div class="form-group"><label>Agent Name</label><input type="text" id="resAgentName" placeholder="Agent Name"></div>
                    <div class="form-group"><label>Agent Commission Rate (₱ / SQM)</label><input type="number" id="resAgentRate" placeholder="0.00" oninput="calculateReservationTotals()"></div>
                    <div class="form-group"><label>Team Leader Name</label><input type="text" id="resTeamLeader" placeholder="Team Leader Name"></div>
                    <div class="form-group"><label>Team Leader Commission Rate (₱ / SQM)</label><input type="number" id="resTlRate" placeholder="0.00" oninput="calculateReservationTotals()"></div>
                </div>
                <div>
                    <h4 style="margin-bottom:10px; color:#2563eb;">PROPERTY &amp; PAYMENT TERM</h4>
                    <div class="form-group">
                        <label>Select Lot (Area &rarr; Block &rarr; Multiple Lots)</label>
                        <div class="lot-picker-btn" onclick="toggleLotPickerBox()">
                            <span id="selectedLotSummaryLabel">-- Choose Lot --</span>
                            <span style="color:#64748b;">▼</span>
                        </div>
                        <div id="lotPickerContainer" class="lot-picker-box hidden">
                            <div id="lotPickerContent"></div>
                        </div>
                    </div>

                    <div class="grid-2" style="gap:10px;">
                        <div class="form-group">
                            <label>Payment Term</label>
                            <select id="resTerm" onchange="calculateReservationTotals()">
                                <option value="12">12 Months</option>
                                <option value="18">18 Months</option>
                                <option value="24">24 Months</option>
                                <option value="36">36 Months</option>
                                <option value="48">48 Months</option>
                                <option value="60">5 Years (60 Mos)</option>
                                <option value="120">10 Years (120 Mos)</option>
                            </select>
                        </div>
                        <div class="form-group" style="padding-top:24px;">
                            <label style="cursor:pointer; display:flex; gap:8px;"><input type="checkbox" id="resSpotCash" onchange="calculateReservationTotals()"> <strong>SPOT CASH</strong></label>
                        </div>
                    </div>
                    <div class="grid-2" style="gap:10px;">
                        <div class="form-group"><label>Reservation Fee / Initial Payment</label><input type="number" id="resFee" placeholder="0.00" oninput="calculateReservationTotals()"></div>
                        <div class="form-group"><label>Title Processing Fee</label><input type="number" id="resTitleFee" placeholder="0.00" oninput="calculateReservationTotals()"></div>
                    </div>
                    <div class="grid-2" style="gap:10px;">
                        <div class="form-group">
                            <label>Payment Method</label>
                            <select id="resPaymentMethod"><option value="CASH">CASH</option><option value="BANK TRANSFER">BANK TRANSFER</option><option value="GCASH">GCASH</option><option value="OTHER">OTHER</option></select>
                        </div>
                        <div class="form-group"><label>Official Receipt / Ref No.</label><input type="text" id="resOrNo" placeholder="OR-000000"></div>
                    </div>

                    <div style="background:#f8f9fa; padding:15px; border-radius:8px; border:1px solid #ddd; margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Total SQM:</span><strong id="displayTotalSqm">0 sqm</strong></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Total Property Price:</span><strong id="displayLotPrice">₱0.00</strong></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Remaining Balance:</span><strong id="displayRemainingBalance" style="color:#d9534f;">₱0.00</strong></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Monthly Amortization:</span><strong id="displayMonthlyAmort" style="color:#0275d8;">₱0.00</strong></div>
                        <hr style="margin:8px 0; border:0; border-top:1px solid #ccc;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#047857;"><span>Agent Commission:</span><strong id="displayAgentComm">₱0.00</strong></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#1d4ed8;"><span>Team Leader Commission:</span><strong id="displayTlComm">₱0.00</strong></div>
                    </div>

                    <button class="btn btn-success full" onclick="processReservation()">SAVE RESERVATION + GENERATE RECORD</button>
                </div>
            </div>
        </div>
    `;
}

function calculateReservationTotals(){
    const selected = window.reservationSelectedLots || [];
    const totalPrice = selected.reduce((sum, l) => sum + Number(l.price || 0), 0);
    const totalSqm = selected.reduce((sum, l) => sum + Number(l.sqm || 0), 0);

    const fee = Number(document.getElementById("resFee")?.value || 0);
    const titleFee = Number(document.getElementById("resTitleFee")?.value || 0);
    const term = Number(document.getElementById("resTerm")?.value || 12);
    const isSpotCash = document.getElementById("resSpotCash")?.checked || false;
    const agentRate = Number(document.getElementById("resAgentRate")?.value || 0);
    const tlRate = Number(document.getElementById("resTlRate")?.value || 0);

    const remainingBalance = Math.max(0, totalPrice + titleFee - fee);
    const monthlyAmort = isSpotCash ? 0 : (remainingBalance>0 ? remainingBalance/term : 0);

    const agentComm = totalSqm * agentRate;
    const tlComm = totalSqm * tlRate;

    if(document.getElementById("displayTotalSqm")) document.getElementById("displayTotalSqm").innerText = `${totalSqm} sqm`;
    if(document.getElementById("displayLotPrice")) document.getElementById("displayLotPrice").innerText = money(totalPrice);
    if(document.getElementById("displayRemainingBalance")) document.getElementById("displayRemainingBalance").innerText = money(remainingBalance);
    if(document.getElementById("displayMonthlyAmort")) document.getElementById("displayMonthlyAmort").innerText = isSpotCash ? "N/A (Spot Cash)" : money(monthlyAmort);

    if(document.getElementById("displayAgentComm")) document.getElementById("displayAgentComm").innerText = money(agentComm);
    if(document.getElementById("displayTlComm")) document.getElementById("displayTlComm").innerText = money(tlComm);
}

function processReservation() {
    const selected = window.reservationSelectedLots || [];
    if(selected.length === 0){
        alert("Please choose at least one available lot first.");
        return;
    }

    const buyerName = document.getElementById("resBuyerName").value.trim();
    const contact = document.getElementById("resBuyerContact").value.trim();
    const address = document.getElementById("resBuyerAddress").value.trim();
    const agentName = document.getElementById("resAgentName").value.trim() || "DIRECT";
    const teamLeader = document.getElementById("resTeamLeader").value.trim() || "NONE";
    const agentRate = Number(document.getElementById("resAgentRate").value || 0);
    const tlRate = Number(document.getElementById("resTlRate").value || 0);
    const term = Number(document.getElementById("resTerm").value || 12);
    const isSpotCash = document.getElementById("resSpotCash").checked;
    const fee = Number(document.getElementById("resFee").value || 0);
    const titleFee = Number(document.getElementById("resTitleFee").value || 0);
    const inputOrNo = document.getElementById("resOrNo")?.value.trim() || `OR-${Date.now()}`;
    const paymentMethod = document.getElementById("resPaymentMethod")?.value || "CASH";

    if(!buyerName || !fee){
        alert("Please provide Buyer Name and Initial Fee.");
        return;
    }

    const totalPrice = selected.reduce((sum, l) => sum + Number(l.price || 0), 0);
    const totalSqm = selected.reduce((sum, l) => sum + Number(l.sqm || 0), 0);
    const remainingBalance = Math.max(0, totalPrice + titleFee - fee);
    const monthlyAmort = isSpotCash ? 0 : remainingBalance / term;

    const agentCommTotal = totalSqm * agentRate;
    const tlCommTotal = totalSqm * tlRate;
    const currentDate = new Date().toISOString().slice(0,10);
    const reservationNo = "RES-" + Date.now();
    const reservationId = uid("R");
    
    const targetRealtyId = selected[0].realtyId || getActiveRealtyId() || "R-PORAC";

    let buyer = db.buyers.find(b=>b.name.trim().toLowerCase() === buyerName.toLowerCase() && b.realtyId === targetRealtyId);
    if(!buyer){
        buyer={ id:uid("B"), name:buyerName, contact, address, purchases:[], realtyId: targetRealtyId };
        db.buyers.push(buyer);
    }

    selected.forEach(l => {
        const realLot = findLotById(l.id);
        if(realLot){
            realLot.status = isSpotCash ? "SOLD" : "RESERVED";
            realLot.buyerName = buyerName;
        }
    });

    const lotNamesFormatted = `${selected[0].areaName} > ${selected[0].blockName} > [ ${selected.map(x=>x.name).join(", ")} ]`;

    const reservation = {
        id:reservationId,
        reservationNo,
        buyerId:buyer.id,
        buyerName,
        contact,
        address,
        project:selected[0].projectName,
        area:selected[0].areaName,
        block:selected[0].blockName,
        lot:lotNamesFormatted,
        sqm:totalSqm,
        lotPrice:totalPrice,
        term,
        downPayment:fee,
        balance:remainingBalance,
        monthlyAmortization:monthlyAmort,
        agentName,
        agentRate,
        teamLeader,
        tlRate,
        agentCommTotal,
        tlCommTotal,
        fee,
        titleFee,
        paymentMethod,
        orNo: inputOrNo,
        isSpotCash,
        date:currentDate,
        status:"ACTIVE",
        realtyId: targetRealtyId
    };

    db.reservations.push(reservation);
    buyer.purchases.push(reservationId);

    if(fee>0){
        db.moneyIn.push({
            id:uid("IN"),
            date:currentDate,
            type:"RESERVATION",
            reference:inputOrNo,
            buyer:buyerName,
            amount:fee,
            method:paymentMethod,
            realtyId: targetRealtyId
        });

        recordReceiptAuditLog({
            orNo: inputOrNo,
            date: currentDate,
            buyerName: buyerName,
            lotInfo: lotNamesFormatted,
            amount: fee,
            paymentMethod: paymentMethod,
            paymentType: "RESERVATION FEE",
            month: "DOWNPAYMENT",
            realtyId: targetRealtyId
        });
    }

    if(!isSpotCash){
        for(let i=1;i<=term;i++){
            db.payments.push({
                id:uid("PAY"),
                reservationId,
                buyerId:buyer.id,
                buyerName,
                month:i,
                dueDate:addMonths(currentDate,i),
                amount:monthlyAmort,
                status:i===1 ? "DUE" : "PENDING",
                paidDate:null,
                method:"",
                orNo:"",
                receiptId:null,
                realtyId: targetRealtyId
            });
        }
    }

    if(agentCommTotal > 0 && agentName && agentName.toUpperCase() !== "NONE"){
        db.commissions.push({
            id: uid("COM"),
            reservationId,
            role: "AGENT",
            recipientName: agentName,
            buyerName,
            ratePerSqm: agentRate,
            sqm: totalSqm,
            total: agentCommTotal,
            released: 0,
            remaining: agentCommTotal,
            releaseHistory: [],
            date: currentDate,
            realtyId: targetRealtyId
        });
    }

    if(tlCommTotal > 0 && teamLeader && teamLeader.toUpperCase() !== "NONE"){
        db.commissions.push({
            id: uid("COM"),
            reservationId,
            role: "TEAM LEADER",
            recipientName: teamLeader,
            buyerName,
            ratePerSqm: tlRate,
            sqm: totalSqm,
            total: tlCommTotal,
            released: 0,
            remaining: tlCommTotal,
            releaseHistory: [],
            date: currentDate,
            realtyId: targetRealtyId
        });
    }

    saveDB();
    alert("Reservation saved successfully!");
    renderReservation();
}

/* =========================================================
   5. BUYERS DIRECTORY
========================================================= */

function renderBuyers(){
    document.getElementById("content").innerHTML=`
        <div class="panel">
            <div class="panel-header">
                <h3>👥 BUYER FOLDERS</h3>
                <input id="buyerSearch" placeholder="🔎 Search buyer..." style="padding:10px; border:1px solid #ddd; border-radius:8px;" oninput="filterBuyerFolders()">
            </div>
            <div id="buyerFolders" class="folder-grid"></div>
        </div>
    `;
    filterBuyerFolders();
}

function filterBuyerFolders(){
    const search=(document.getElementById("buyerSearch")?.value||"").toLowerCase();
    const activeRealtyId = getActiveRealtyId();

    const list = db.buyers.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(search);
        if(!matchesSearch) return false;
        if(canAccessBossFeatures()){
            if(activeRealtyId) return b.realtyId === activeRealtyId;
            return true;
        }
        return b.realtyId === activeRealtyId;
    });

    document.getElementById("buyerFolders").innerHTML=list.length ? list.map(b=>{
        const branch = db.realties.find(r => r.id === b.realtyId);
        return `
            <div class="folder">
                <div class="folder-icon">📁</div>
                <h4>${esc(b.name)}</h4>
                <p><span class="badge badge-purple" style="font-size:10px;">${branch ? esc(branch.name) : "Branch"}</span></p>
                <p>${(b.purchases||[]).length} purchase(s)</p>
                <button class="btn btn-primary" onclick="openBuyer('${b.id}')">OPEN FOLDER</button>
            </div>
        `;
    }).join("") : `<p style="padding:20px; color:#888;">No buyers found.</p>`;
}

function openBuyer(id){
    const b = db.buyers.find(x => x.id === id);
    if(!b) return;

    const purchases = (b.purchases || []).map(pid => db.reservations.find(r => r.id === pid)).filter(Boolean);
    const latestPurchase = purchases.length > 0 ? purchases[purchases.length - 1] : null;
    const assignedAgent = latestPurchase?.agentName || "DIRECT / NONE";

    document.getElementById("content").innerHTML = `
        <div class="panel">
            <div class="breadcrumb"><span onclick="renderBuyers()">Buyers</span> → <strong>${esc(b.name)}</strong></div>
            <div class="panel-header">
                <h3>📁 ${esc(b.name)}</h3>
                <button class="btn btn-secondary" onclick="renderBuyers()">← BACK</button>
            </div>
            <div class="grid-2">
                <div class="panel" style="background:#f8fafc;">
                    <h4>👤 CLIENT INFORMATION</h4>
                    <p style="margin-top:10px;"><strong>Name:</strong> ${esc(b.name)}</p>
                    <p><strong>Contact:</strong> ${esc(b.contact || '—')}</p>
                    <p><strong>Address:</strong> ${esc(b.address || '—')}</p>
                    <p><strong>Assigned Agent:</strong> <span class="badge badge-green" style="font-size:12px;">${esc(assignedAgent)}</span></p>
                </div>
                <div class="panel" style="background:#f8fafc;">
                    <h4>📊 SUMMARY</h4>
                    <p style="margin-top:10px;">Purchases: <strong>${purchases.length}</strong></p>
                    <p>Total Value: <strong>${money(purchases.reduce((a,r) => a + Number(r.lotPrice || 0), 0))}</strong></p>
                </div>
            </div>

            <h3 style="margin:20px 0 12px;">🏠 PURCHASES</h3>
            <div class="folder-grid">
                ${purchases.map(r => `
                    <div class="folder">
                        <div class="folder-icon">🏠</div>
                        <h4>${esc(r.area)} &bull; ${esc(r.block)}</h4>
                        <p>${esc(r.lot)}</p>
                        <p>${r.sqm} sqm<br>${money(r.lotPrice)}</p>
                        <p style="font-size:12px; color:#166534; margin:6px 0;"><strong>Agent:</strong> ${esc(r.agentName || 'DIRECT')}</p>
                        <button class="btn btn-primary" onclick="openPurchase('${r.id}')">VIEW RECORD</button>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function openPurchase(id){
    const r=db.reservations.find(x=>x.id===id);
    if(!r)return;

    const payments=db.payments.filter(p=>p.reservationId===r.id).sort((a,b)=>a.month-b.month);
    const isBoss = canAccessBossFeatures();

    document.getElementById("content").innerHTML=`
        <div class="panel">
            <button class="btn btn-secondary" onclick="openBuyer('${r.buyerId}')">← BACK TO BUYER</button>
            <h3 style="margin:20px 0;">🏠 ${esc(r.lot)}</h3>
            <div class="grid-4">
                <div class="stat-card-3d"><small>Total Price</small><h3>${money(r.lotPrice)}</h3></div>
                <div class="stat-card-3d"><small>Down Payment</small><h3>${money(r.downPayment)}</h3></div>
                <div class="stat-card-3d"><small>Balance</small><h3>${money(calculateCurrentBalance(r.id))}</h3></div>
                <div class="stat-card-3d"><small>Monthly</small><h3>${money(r.monthlyAmortization)}</h3></div>
            </div>

            <h3 style="margin:20px 0 12px;">AMORTIZATION SCHEDULE</h3>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Month</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Receipt OR</th><th>Action</th></tr></thead>
                    <tbody>
                        ${payments.map(p=>`
                            <tr>
                                <td>Month ${p.month}</td>
                                <td>${p.dueDate}</td>
                                <td>${money(p.amount)}</td>
                                <td><span class="badge ${p.status==='PAID'?'badge-green':p.status==='DUE'?'badge-yellow':'badge-gray'}">${p.status}</span></td>
                                <td>
                                    ${p.orNo ? (isBoss ? `<button class="btn btn-light" style="padding:2px 6px; font-size:11px; font-weight:bold; cursor:pointer;" onclick="openReceiptReviewModal('${esc(p.orNo)}')">🔍 ${esc(p.orNo)}</button>` : `<code style="font-weight:bold;">${esc(p.orNo)}</code>`) : '—'}
                                </td>
                                <td>
                                    ${p.status==='PAID' ? `<button class="btn btn-light" onclick="viewReceipt('${p.receiptId}')">VIEW RECEIPT</button>` :
                                      p.status==='DUE' ? `<button class="btn btn-success" onclick="payInstallment('${p.id}')">PAY NOW</button>` :
                                      `<span style="color:#888;">Pending</span>`}
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function calculateCurrentBalance(reservationId){
    const r=db.reservations.find(x=>x.id===reservationId);
    if(!r)return 0;
    const paid=db.payments.filter(p=>p.reservationId===reservationId && p.status==="PAID").reduce((a,p)=>a+p.amount,0);
    return Math.max(0, r.balance-paid);
}

/* =========================================================
   6. PAYMENT PORTAL & RECEIPTS
========================================================= */

function renderPayment(){
    document.getElementById("content").innerHTML=`
        <div class="panel">
            <div class="panel-header">
                <h3>💰 PAYMENT</h3>
                <input id="paymentSearch" placeholder="🔎 Search buyer..." style="padding:10px; border:1px solid #ddd; border-radius:8px;" oninput="filterPaymentFolders()">
            </div>
            <div id="paymentFolders" class="folder-grid"></div>
        </div>
    `;
    filterPaymentFolders();
}

function filterPaymentFolders(){
    const search=(document.getElementById("paymentSearch")?.value||"").toLowerCase();
    const activeRealtyId = getActiveRealtyId();
    const cards=[];

    const buyers = db.buyers.filter(b => {
        if(canAccessBossFeatures()){
            if(activeRealtyId) return b.realtyId === activeRealtyId;
            return true;
        }
        return b.realtyId === activeRealtyId;
    });

    buyers.forEach(b=>{
        const payments=db.payments.filter(p=>p.buyerId===b.id);
        if(!payments.length)return;
        const next=payments.find(p=>p.status==="DUE" || p.status==="PENDING");
        const reservation=db.reservations.find(r=>r.id===next?.reservationId);

        if(b.name.toLowerCase().includes(search)){
            cards.push({ buyer:b, payment:next, reservation });
        }
    });

    document.getElementById("paymentFolders").innerHTML=cards.length ? cards.map(x=>`
        <div class="folder">
            <div class="folder-icon">📁</div>
            <h4>${esc(x.buyer.name)}</h4>
            <p>${x.reservation ? esc(x.reservation.lot) : "No property"}</p>
            ${x.payment ? `
                <p>Monthly: <strong>${money(x.payment.amount)}</strong></p>
                <p>Month ${x.payment.month} <span class="badge ${x.payment.status==='DUE'?'badge-yellow':'badge-gray'}">${x.payment.status}</span></p>
                <button class="btn btn-primary" onclick="openPurchase('${x.reservation.id}')">OPEN</button>
            ` : `<p>Fully paid.</p>`}
        </div>
    `).join("") : `<p style="padding:20px; color:#888;">No payment records found.</p>`;
}

function payInstallment(paymentId){
    const p=db.payments.find(x=>x.id===paymentId);
    if(!p)return;

    showModal(`
        <div class="modal-header"><h3>💰 RECORD PAYMENT</h3><button class="close" onclick="closeModal()">×</button></div>
        <p><strong>Buyer:</strong> ${esc(p.buyerName)}</p>
        <p style="margin-top:8px;"><strong>Month:</strong> ${p.month}</p>
        <p style="margin-top:8px;"><strong>Amount:</strong> ${money(p.amount)}</p>
        <div class="form-group" style="margin-top:18px;">
            <label>Payment Method</label>
            <select id="payMethod"><option>CASH</option><option>BANK TRANSFER</option><option>GCASH</option><option>OTHER</option></select>
        </div>
        <div class="form-group">
            <label>Official Receipt / Series Ref No. (e.g. 0001):</label>
            <input id="payOR" placeholder="0001" value="${p.orNo || `OR-${Date.now()}`}">
        </div>
        <button class="btn btn-success full" onclick="saveInstallmentPayment('${p.id}')">SAVE PAYMENT + OFFICIAL RECEIPT</button>
    `);
}

function saveInstallmentPayment(paymentId){
    const p=db.payments.find(x=>x.id===paymentId);
    if(!p)return;

    const orNoInput = document.getElementById("payOR").value.trim() || `OR-${Date.now()}`;
    const methodInput = document.getElementById("payMethod").value;
    const paidDate = new Date().toISOString().slice(0,10);
    const receiptId = uid("RCT");

    p.status = "PAID";
    p.paidDate = paidDate;
    p.method = methodInput;
    p.orNo = orNoInput;
    p.receiptId = receiptId;

    db.moneyIn.push({
        id: uid("IN"),
        date: paidDate,
        type: "AMORTIZATION",
        reference: orNoInput,
        buyer: p.buyerName,
        amount: p.amount,
        method: methodInput,
        realtyId: p.realtyId || getActiveRealtyId() || null
    });

    const r = db.reservations.find(x => x.id === p.reservationId);

    recordReceiptAuditLog({
        orNo: orNoInput,
        date: paidDate,
        buyerName: p.buyerName,
        lotInfo: r ? r.lot : "—",
        amount: p.amount,
        paymentMethod: methodInput,
        paymentType: "AMORTIZATION",
        month: `Month ${p.month}`,
        realtyId: p.realtyId || null
    });

    const next=db.payments.filter(x=>x.reservationId===p.reservationId && x.status==="PENDING").sort((a,b)=>a.month-b.month)[0];
    if(next) next.status="DUE";

    saveDB();
    closeModal();
    showReceipt(p);
}

function showReceipt(payment){
    const r=db.reservations.find(x=>x.id===payment.reservationId);
    const isBoss = canAccessBossFeatures();

    const html=`
        <div class="receipt" style="position:relative; background:#fff; padding:24px; border:2px solid #cbd5e1; border-radius:8px;">
            <h2>${esc(db.settings.systemName || "REALTY SYSTEM")}</h2>
            <h3 style="letter-spacing:1px; margin-top:4px;">OFFICIAL RECEIPT</h3>
            <hr style="margin:16px 0;">
            
            <div class="receipt-line">
                <span>OR Series No.</span>
                <strong style="color:#1d4ed8;">${esc(payment.orNo)}</strong>
            </div>
            <div class="receipt-line"><span>Date</span><strong>${payment.paidDate}</strong></div>
            <div class="receipt-line"><span>Buyer</span><strong>${esc(payment.buyerName)}</strong></div>
            <div class="receipt-line"><span>Property</span><strong>${r ? esc(r.lot) : ""}</strong></div>
            <div class="receipt-line"><span>Payment</span><strong>Month ${payment.month}</strong></div>
            <div class="receipt-line"><span>Method</span><strong>${payment.method}</strong></div>
            <div class="receipt-total" style="font-size:20px; color:#15803d; margin:16px 0;">TOTAL PAID: ${money(payment.amount)}</div>
            
            <p style="margin-top:24px; text-align:center; font-size:12px; color:#64748b;">
                Permanent Audit Record ID: <code>${payment.receiptId || payment.id}</code><br>
                Issued by: <strong>${esc(currentUser?.name || "Cashier")}</strong>
            </p>

            <div style="margin-top:20px; text-align:center; display:flex; justify-content:center; gap:8px;">
                <button class="btn btn-primary" onclick="window.print()">PRINT RECEIPT</button>
                ${isBoss ? `<button class="btn btn-secondary" onclick="openReceiptReviewModal('${esc(payment.orNo)}')">AUDIT SERIES</button>` : ''}
                <button class="btn btn-light" onclick="closeModal()">CLOSE</button>
            </div>
        </div>
    `;
    showModal(html);
}

function viewReceipt(receiptId){
    const p=db.payments.find(x=>x.receiptId===receiptId);
    if(p) showReceipt(p);
}

/* =========================================================
   RESTRICTED BOSS & IT VIEW REVIEW MODAL
========================================================= */

function openReceiptReviewModal(orNo) {
    if(!canAccessBossFeatures()){
        alert("Access Denied: Only Executive / IT master accounts can audit receipt series.");
        return;
    }

    const logs = getReceiptAuditHistory(orNo);
    if(!logs || logs.length === 0) {
        alert(`Walang nahanap na audit record para sa Series OR: ${orNo}`);
        return;
    }

    const hasDifferentAmounts = new Set(logs.map(l => Number(l.amount))).size > 1;
    const isMultiPrint = logs.length > 1;

    let warningNotice = "";
    if(hasDifferentAmounts) {
        warningNotice = `
            <div style="background:#fee2e2; border-left:5px solid #ef4444; padding:12px; border-radius:6px; margin-bottom:16px;">
                <strong style="color:#991b1b; font-size:14px;">🚨 FRAUD ALERT / AMOUNT DISCREPANCY DETECTED!</strong>
                <p style="margin:4px 0 0; color:#b91c1c; font-size:12px;">
                    Ang seryeng ito (${esc(orNo)}) ay na-print nang may <strong>magkakaibang halaga</strong>! Maaaring binago o itinapon ang unang resibo.
                </p>
            </div>
        `;
    } else if(isMultiPrint) {
        warningNotice = `
            <div style="background:#fef3c7; border-left:5px solid #f59e0b; padding:12px; border-radius:6px; margin-bottom:16px;">
                <strong style="color:#92400e; font-size:14px;">⚠️ MULTIPLE PRINTS DETECTED (${logs.length} COPIES)</strong>
                <p style="margin:4px 0 0; color:#b45309; font-size:12px;">
                    Ang parehong OR series ay na-issue o na-print muli nang mahigit sa isang beses.
                </p>
            </div>
        `;
    }

    showModal(`
        <div class="modal-header">
            <h3>🔍 EXECUTIVE RECEIPT AUDIT: <span style="color:#2563eb;">${esc(orNo)}</span></h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        ${warningNotice}
        <div class="table-wrap" style="max-height:360px; overflow-y:auto;">
            <table>
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th>Copy #</th>
                        <th>Date &amp; Time</th>
                        <th>Amount</th>
                        <th>Buyer Name</th>
                        <th>Payment Purpose</th>
                        <th>Issued By</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map((l, idx) => {
                        const isFirst = idx === 0;
                        const isMismatch = idx > 0 && Number(l.amount) !== Number(logs[0].amount);
                        return `
                            <tr style="${isMismatch ? 'background:#fff1f2;' : ''}">
                                <td><strong>#${l.printCount || (idx + 1)}</strong> ${isFirst ? '<span class="badge badge-green">ORIGINAL</span>' : '<span class="badge badge-red">DUPLICATE</span>'}</td>
                                <td>${l.date} <small style="display:block; color:#64748b;">${l.time || ''}</small></td>
                                <td style="font-weight:bold; ${isMismatch ? 'color:#b91c1c;' : 'color:#15803d;'}">${money(l.amount)}</td>
                                <td>${esc(l.buyerName)}</td>
                                <td>${esc(l.paymentType || 'PAYMENT')} (${esc(l.month || '—')})</td>
                                <td><strong>${esc(l.issuedBy || 'Cashier')}</strong></td>
                                <td>
                                    ${isMismatch ? '<span class="badge badge-red">TAMPER WARNING</span>' : '<span class="badge badge-gray">LOGGED</span>'}
                                </td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
        <div style="margin-top:20px; text-align:right;">
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        </div>
    `);
}

/* =========================================================
   7. COMMISSION MODULE
========================================================= */

window.currentCommTab = "LEDGERS";

function renderCommission(){
    const activeRealtyId = getActiveRealtyId();
    const commissions = db.commissions.filter(c => {
        if(canAccessBossFeatures()){
            if(activeRealtyId) return c.realtyId === activeRealtyId;
            return true;
        }
        return c.realtyId === activeRealtyId;
    });

    const totalAgentComm = commissions.filter(c => c.role === "AGENT").reduce((s, c) => s + (c.total || 0), 0);
    const totalTlComm = commissions.filter(c => c.role === "TEAM LEADER").reduce((s, c) => s + (c.total || 0), 0);
    const totalPending = commissions.reduce((s, c) => s + (c.remaining || 0), 0);

    const currentMonthStr = new Date().toISOString().slice(0,7);
    let totalReleasedThisMonth = 0;
    const allReleases = [];

    commissions.forEach(c => {
        (c.releaseHistory || []).forEach(r => {
            allReleases.push({
                ...r,
                recipientName: c.recipientName,
                role: c.role,
                buyerName: c.buyerName,
                commissionId: c.id
            });
            if(String(r.month || r.date).slice(0,7) === currentMonthStr){
                totalReleasedThisMonth += Number(r.amount || 0);
            }
        });
    });

    allReleases.sort((a,b) => new Date(b.date) - new Date(a.date));

    document.getElementById("content").innerHTML = `
        <div class="grid-4" style="margin-bottom:20px;">
            <div class="stat-card-3d" style="border-top:4px solid #16a34a;">
                <small style="color:#16a34a; font-weight:bold;">Total Agent Commissions</small>
                <h3 style="color:#15803d; margin-top:6px;">${money(totalAgentComm)}</h3>
            </div>
            <div class="stat-card-3d" style="border-top:4px solid #2563eb;">
                <small style="color:#2563eb; font-weight:bold;">Total TL Commissions</small>
                <h3 style="color:#1d4ed8; margin-top:6px;">${money(totalTlComm)}</h3>
            </div>
            <div class="stat-card-3d" style="border-top:4px solid #10b981;">
                <small style="color:#059669; font-weight:bold;">Released This Month (${currentMonthStr})</small>
                <h3 style="color:#059669; margin-top:6px;">${money(totalReleasedThisMonth)}</h3>
            </div>
            <div class="stat-card-3d" style="border-top:4px solid #f59e0b;">
                <small style="color:#f59e0b; font-weight:bold;">Total Pending Payouts</small>
                <h3 style="color:#d97706; margin-top:6px;">${money(totalPending)}</h3>
            </div>
        </div>

        <div class="panel">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:18px;">
                <div style="display:flex; gap:8px;">
                    <button class="tab-btn ${window.currentCommTab==='LEDGERS'?'active':''}" onclick="window.currentCommTab='LEDGERS'; renderCommission();">📋 All Commission Ledgers</button>
                    <button class="tab-btn ${window.currentCommTab==='HISTORY'?'active':''}" onclick="window.currentCommTab='HISTORY'; renderCommission();">📅 Monthly Released History</button>
                    <button class="tab-btn ${window.currentCommTab==='PENDING'?'active':''}" onclick="window.currentCommTab='PENDING'; renderCommission();">⏳ Pending Payouts List</button>
                </div>
            </div>

            <div id="commTabContent">
                ${renderCommTabContent(commissions, allReleases)}
            </div>
        </div>
    `;
}

function renderCommTabContent(commissions, allReleases){
    if(window.currentCommTab === "HISTORY"){
        return `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Release Date</th>
                            <th>Recipient Name</th>
                            <th>Role</th>
                            <th>Buyer Property</th>
                            <th>Amount Released</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allReleases.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:15px; color:#888;">No records found.</td></tr>` :
                          allReleases.map(r => `
                            <tr>
                                <td>${r.date}</td>
                                <td><strong>${esc(r.recipientName)}</strong></td>
                                <td><span class="badge ${r.role==='TEAM LEADER'?'badge-blue':'badge-green'}">${r.role}</span></td>
                                <td>${esc(r.buyerName)}</td>
                                <td style="color:#16a34a; font-weight:bold;">${money(r.amount)}</td>
                            </tr>
                          `).join("")
                        }
                    </tbody>
                </table>
            </div>
        `;
    }

    if(window.currentCommTab === "PENDING"){
        const pendingList = commissions.filter(c => (c.remaining || 0) > 0);
        return `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Recipient</th>
                            <th>Role</th>
                            <th>Buyer</th>
                            <th>Total Comm</th>
                            <th>Remaining</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendingList.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:15px; color:#16a34a; font-weight:bold;">🎉 All commissions have been fully released!</td></tr>` :
                          pendingList.map(c => `
                            <tr>
                                <td><strong>${esc(c.recipientName)}</strong></td>
                                <td><span class="badge ${c.role==='TEAM LEADER'?'badge-blue':'badge-green'}">${c.role}</span></td>
                                <td>${esc(c.buyerName)}</td>
                                <td>${money(c.total)}</td>
                                <td style="color:#dc2626; font-weight:bold;">${money(c.remaining)}</td>
                                <td><button class="btn btn-success" style="padding:4px 10px; font-size:11px;" onclick="openReleaseCommissionModal('${c.id}')">💸 Release Payout</button></td>
                            </tr>
                          `).join("")
                        }
                    </tbody>
                </table>
            </div>
        `;
    }

    return `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Recipient</th>
                        <th>Role</th>
                        <th>Buyer Name</th>
                        <th>Total Comm</th>
                        <th>Released</th>
                        <th>Remaining</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${commissions.length ? commissions.map(c => {
                        const isTL = c.role === "TEAM LEADER";
                        const isPaidOut = (c.remaining || 0) <= 0;
                        return `
                            <tr>
                                <td><strong style="font-size:14px;">${esc(c.recipientName)}</strong></td>
                                <td><span class="badge ${isTL ? 'badge-blue' : 'badge-green'}">${c.role || "AGENT"}</span></td>
                                <td>${esc(c.buyerName)}</td>
                                <td style="font-weight:bold;">${money(c.total)}</td>
                                <td style="color:#16a34a; font-weight:bold;">${money(c.released)}</td>
                                <td style="color:#dc2626; font-weight:bold;">${money(c.remaining)}</td>
                                <td><span class="badge ${isPaidOut ? 'badge-gray' : 'badge-yellow'}">${isPaidOut ? 'COMPLETED' : 'PENDING'}</span></td>
                                <td>
                                    ${isPaidOut ? `<small style="color:#16a34a; font-weight:bold;">✓ Fully Released</small>` :
                                      `<button class="btn btn-success" style="padding:4px 10px; font-size:11px;" onclick="openReleaseCommissionModal('${c.id}')">💸 Release Payout</button>`
                                    }
                                </td>
                            </tr>
                        `;
                    }).join("") : `<tr><td colspan="8" style="text-align:center; padding:15px; color:#888;">No commission ledgers found.</td></tr>`}
                </tbody>
            </table>
        </div>
    `;
}

function openReleaseCommissionModal(commissionId){
    const c = db.commissions.find(x => x.id === commissionId);
    if(!c) return;

    showModal(`
        <div class="modal-header">
            <h3>💸 RELEASE COMMISSION PAYOUT</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div style="margin-bottom:14px; padding:12px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; font-size:13px;">
            <p>Recipient: <strong>${esc(c.recipientName)}</strong></p>
            <p>Remaining Balance: <strong style="color:#dc2626;">${money(c.remaining)}</strong></p>
        </div>
        <div class="form-group">
            <label>Amount to Release (PHP):</label>
            <input id="releaseAmount" type="number" value="${c.remaining}" max="${c.remaining}" min="1">
        </div>
        <button class="btn btn-primary full" onclick="saveCommissionRelease('${c.id}')">CONFIRM PAYOUT RELEASE</button>
    `);
}

function saveCommissionRelease(commissionId){
    const c = db.commissions.find(x => x.id === commissionId);
    if(!c) return;

    const amount = Number(document.getElementById("releaseAmount")?.value || 0);
    if(!amount || amount <= 0 || amount > c.remaining){
        alert("Please provide a valid release amount.");
        return;
    }

    const currentDate = new Date().toISOString().slice(0,10);
    c.released = (c.released || 0) + amount;
    c.remaining = Math.max(0, (c.total || 0) - c.released);
    
    c.releaseHistory = c.releaseHistory || [];
    c.releaseHistory.push({
        id: uid("REL"),
        date: currentDate,
        amount,
        releasedBy: currentUser.name
    });

    db.moneyOut.push({
        id: uid("OUT"),
        date: currentDate,
        type: "COMMISSION RELEASE",
        description: `Commission for ${c.recipientName} (${c.role})`,
        amount,
        realtyId: c.realtyId || getActiveRealtyId() || null
    });

    saveDB();
    closeModal();
    alert("Commission payout released!");
    renderCommission();
}

/* =========================================================
   8. REFUND MODULE
========================================================= */

function renderRefund(){
    const isBossUser = canAccessBossFeatures();
    const activeRealtyId = getActiveRealtyId();
    const list = db.refunds.filter(r => {
        if(canAccessBossFeatures()){
            if(activeRealtyId) return r.realtyId === activeRealtyId;
            return true;
        }
        return r.realtyId === activeRealtyId;
    });

    document.getElementById("content").innerHTML=`
        <div class="panel">
            <div class="panel-header">
                <h3>↩️ REFUND MANAGEMENT</h3>
                ${!isBossUser ? `<button class="btn btn-primary" onclick="openAddRefundModal()">+ File Refund Request</button>` : `<span class="badge badge-purple">Executive Clearance Mode</span>`}
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Buyer Name</th>
                            <th>Refund Amount</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${list.length===0 ? `<tr><td colspan="6" style="text-align:center; padding:15px; color:#888;">No refund requests recorded.</td></tr>` : 
                          list.map(x=>`
                            <tr>
                                <td>${x.date}</td>
                                <td><strong>${esc(x.buyer)}</strong></td>
                                <td style="color:#dc2626; font-weight:bold;">${money(x.amount)}</td>
                                <td>${esc(x.reason)}</td>
                                <td><span class="badge ${x.status==='APPROVED'?'badge-green':x.status==='REJECTED'?'badge-red':'badge-yellow'}">${x.status}</span></td>
                                <td>
                                    ${isBossUser && x.status === "PENDING" ? `
                                        <button class="btn btn-success" style="padding:4px 8px; font-size:11px;" onclick="approveRefund('${x.id}')">Approve</button>
                                        <button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" onclick="rejectRefund('${x.id}')">Reject</button>
                                    ` : `<small style="color:#64748b;">${x.status}</small>`}
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

function openAddRefundModal(){
    showModal(`
        <div class="modal-header">
            <h3>FILE REFUND REQUEST</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div class="form-group"><label>Buyer Name:</label><input id="refundBuyerName" placeholder="Enter buyer name" required></div>
        <div class="form-group"><label>Refund Amount (PHP):</label><input id="refundAmount" type="number" placeholder="Enter amount" required></div>
        <div class="form-group"><label>Reason for Refund:</label><textarea id="refundReason" rows="3" placeholder="Provide reason" required></textarea></div>
        <button class="btn btn-primary full" onclick="saveRefundRequest()">SUBMIT FOR EXECUTIVE APPROVAL</button>
    `);
}

function saveRefundRequest(){
    const buyer = document.getElementById("refundBuyerName")?.value.trim();
    const amount = Number(document.getElementById("refundAmount")?.value || 0);
    const reason = document.getElementById("refundReason")?.value.trim();

    if(!buyer || !amount || !reason){
        alert("Please complete the required fields.");
        return;
    }

    db.refunds.unshift({
        id: uid("REF"),
        date: new Date().toISOString().slice(0,10),
        buyer,
        amount,
        reason,
        status: "PENDING",
        realtyId: getActiveRealtyId() || "R-PORAC",
        requestedBy: currentUser.name
    });

    saveDB();
    closeModal();
    alert("Refund request submitted!");
    renderRefund();
}

function approveRefund(id){
    const r = db.refunds.find(x => x.id === id);
    if(!r) return;

    r.status = "APPROVED";
    db.moneyOut.push({
        id: uid("OUT"),
        date: new Date().toISOString().slice(0,10),
        type: "REFUND RELEASE",
        description: `Refund for ${r.buyer} (${r.reason})`,
        amount: r.amount,
        realtyId: r.realtyId || null
    });

    saveDB();
    alert(`Refund of ${money(r.amount)} approved.`);
    renderRefund();
}

function rejectRefund(id){
    const r = db.refunds.find(x => x.id === id);
    if(!r) return;
    r.status = "REJECTED";
    saveDB();
    alert("Refund rejected.");
    renderRefund();
}

/* =========================================================
   9. EXPENSES MODULE
========================================================= */

function renderExpenses(){
    const isBossUser = canAccessBossFeatures();
    const activeRealtyId = getActiveRealtyId();
    const expenses = db.expenses.filter(x => {
        if(canAccessBossFeatures()){
            if(activeRealtyId) return x.realtyId === activeRealtyId;
            return true;
        }
        return x.realtyId === activeRealtyId;
    });

    document.getElementById("content").innerHTML=`
        <div class="panel">
            <div class="panel-header">
                <h3>📊 OPERATIONAL EXPENSES LOG</h3>
                ${!isBossUser ? `<button class="btn btn-primary" onclick="openAddExpenseModal()">+ Add Expense</button>` : `<span class="badge badge-purple">Executive Expense Audit Mode</span>`}
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Recorded By</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:15px; color:#888;">No expenses recorded.</td></tr>` :
                          expenses.map(x=>`
                            <tr>
                                <td><strong>${x.date}</strong></td>
                                <td><span class="badge badge-gray">${esc(x.category)}</span></td>
                                <td>${esc(x.description)}</td>
                                <td style="color:#dc2626; font-weight:bold;">${money(x.amount)}</td>
                                <td>${esc(x.recordedBy || "Admin")}</td>
                            </tr>
                          `).join("")
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openAddExpenseModal(){
    showModal(`
        <div class="modal-header">
            <h3>RECORD EXPENSE</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div class="form-group"><label>Category</label><input id="expenseCategory" placeholder="e.g. Utilities, Fuel, Marketing"></div>
        <div class="form-group"><label>Description</label><input id="expenseDescription" placeholder="Description of expense"></div>
        <div class="form-group"><label>Amount (PHP)</label><input id="expenseAmount" type="number" placeholder="0.00"></div>
        <button class="btn btn-primary full" onclick="saveExpense()">SAVE EXPENSE RECORD</button>
    `);
}

function saveExpense(){
    const category = document.getElementById("expenseCategory")?.value.trim();
    const description = document.getElementById("expenseDescription")?.value.trim();
    const amount = Number(document.getElementById("expenseAmount")?.value || 0);

    if(!category || !amount){
        alert("Please complete required fields.");
        return;
    }

    const currentDate = new Date().toISOString().slice(0,10);
    const activeRealtyId = getActiveRealtyId() || "R-PORAC";

    db.expenses.unshift({
        id: uid("EXP"),
        date: currentDate,
        category,
        description,
        amount,
        recordedBy: currentUser.name,
        realtyId: activeRealtyId
    });

    db.moneyOut.push({
        id: uid("OUT"),
        date: currentDate,
        type: "EXPENSE",
        description: `Expense: ${category} - ${description}`,
        amount,
        realtyId: activeRealtyId
    });

    saveDB();
    closeModal();
    alert("Expense recorded!");
    renderExpenses();
}

/* =========================================================
   10. REPORTS (EXECUTIVE AUDIT TAB INCLUDED)
========================================================= */

window.currentReportTab = "MONTHLY";

function renderReports(tabOverride){
    if(tabOverride) window.currentReportTab = tabOverride;

    const activeRealtyId = getActiveRealtyId();
    const isBoss = canAccessBossFeatures();
    const now = new Date();
    const defaultMonth = now.toISOString().slice(0,7);

    if(!isBoss) window.currentReportTab = "MONTHLY";

    const inMonth = (dateStr, monthStr) => String(dateStr||"").slice(0,7) === monthStr;
    const monthLabel = (m) => {
        const d = new Date(m + "-01T00:00:00");
        return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    };

    const generateReportHTML = (selectedMonth) => {
        const month = selectedMonth || defaultMonth;
        const reservations = db.reservations.filter(r => {
            if(canAccessBossFeatures()){
                if(activeRealtyId) return r.realtyId === activeRealtyId;
                return true;
            }
            return r.realtyId === activeRealtyId;
        });
        const moneyIn = db.moneyIn.filter(m => {
            if(canAccessBossFeatures()){
                if(activeRealtyId) return m.realtyId === activeRealtyId;
                return true;
            }
            return m.realtyId === activeRealtyId;
        });
        const moneyOut = db.moneyOut.filter(m => {
            if(canAccessBossFeatures()){
                if(activeRealtyId) return m.realtyId === activeRealtyId;
                return true;
            }
            return m.realtyId === activeRealtyId;
        });

        const monthReservations = reservations.filter(r => inMonth(r.date, month));
        const totalSales = monthReservations.reduce((sum, r) => sum + Number(r.lotPrice || 0), 0);
        const totalCollections = moneyIn.filter(x => inMonth(x.date, month)).reduce((sum, x) => sum + Number(x.amount || 0), 0);
        const totalExpenses = moneyOut.filter(x => inMonth(x.date, month)).reduce((sum, x) => sum + Number(x.amount || 0), 0);
        const netCash = totalCollections - totalExpenses;

        const activeBranch = getActiveBranchProfile();
        const activeRealtyName = activeBranch ? activeBranch.name : (db.settings.systemName || "ALL REALTY OPERATIONS");

        let orGroups = {};
        if (isBoss) {
            const allAuditLogs = (db.receiptAuditLogs || []).filter(l => {
                if(activeRealtyId) return l.realtyId === activeRealtyId;
                return true;
            });

            for(let i = 0; i < allAuditLogs.length; i++){
                const l = allAuditLogs[i];
                const or = String(l.orNo || "").trim();
                if(!orGroups[or]) orGroups[or] = [];
                orGroups[or].push(l);
            }
        }

        return `
            <div class="panel" style="max-width:1150px; margin:auto; background:#fff; padding:28px;">
                <div class="report-no-print" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #e2e8f0;">
                    <div style="display:flex; gap:8px;">
                        <button class="tab-btn ${window.currentReportTab==='MONTHLY'?'active':''}" onclick="window.currentReportTab='MONTHLY'; renderReports();">📈 Monthly Financials</button>
                        ${isBoss ? `<button class="tab-btn ${window.currentReportTab==='RECEIPT_AUDIT'?'active':''}" onclick="window.currentReportTab='RECEIPT_AUDIT'; renderReports();">🧾 Receipt Series Audit Trail</button>` : ''}
                    </div>

                    ${window.currentReportTab === 'MONTHLY' ? `
                        <div style="display:flex; align-items:center; gap:10px;">
                            <label style="font-size:13px; font-weight:bold; color:#475569;">MONTH:</label>
                            <input id="reportMonthInput" type="month" value="${month}" style="padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-weight:bold;">
                            <button class="btn btn-primary" onclick="renderReportsWithMonth()">LOAD</button>
                        </div>
                    ` : ''}

                    <button class="btn btn-secondary" onclick="window.print()">🖨️ PRINT</button>
                </div>

                ${window.currentReportTab === 'MONTHLY' ? `
                    <div id="reportPrintArea">
                        <div style="text-align:center; margin-bottom:25px; border-bottom:3px double #94a3b8; padding-bottom:16px;">
                            <h2 style="font-size:24px; color:#0f172a; margin-bottom:4px;">${esc(activeRealtyName)}</h2>
                            <h3 style="font-size:16px; color:#475569; font-weight:600;">OFFICIAL MONTHLY MANAGEMENT REPORT</h3>
                            <p style="font-size:13px; color:#64748b; margin-top:5px;">For the Month of: <strong>${monthLabel(month)}</strong></p>
                        </div>

                        <div class="grid-4" style="gap:12px; margin-bottom:24px;">
                            <div style="padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;">
                                <small style="color:#64748b; font-weight:bold;">Total Sales</small>
                                <h3 style="color:#1e293b; margin-top:6px; font-size:20px;">${money(totalSales)}</h3>
                            </div>
                            <div style="padding:14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px;">
                                <small style="color:#166534; font-weight:bold;">Total Collections</small>
                                <h3 style="color:#15803d; margin-top:6px; font-size:20px;">${money(totalCollections)}</h3>
                            </div>
                            <div style="padding:14px; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">
                                <small style="color:#991b1b; font-weight:bold;">Total Expenses</small>
                                <h3 style="color:#b91c1c; margin-top:6px; font-size:20px;">${money(totalExpenses)}</h3>
                            </div>
                            <div style="padding:14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px;">
                                <small style="color:#1e40af; font-weight:bold;">Net Cash Flow</small>
                                <h3 style="color:#1d4ed8; margin-top:6px; font-size:20px;">${money(netCash)}</h3>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div>
                        <div style="margin-bottom:18px;">
                            <h3 style="font-size:18px; color:#0f172a;">🧾 RECEIPT SERIES AUDIT TRAIL &amp; TAMPER RADAR</h3>
                            <small style="color:#64748b;">Exclusive for BOSS &amp; IT Root. I-click ang Series Number upang makita ang buong history ng bawat resibo.</small>
                        </div>

                        <div class="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Series / OR No.</th>
                                        <th>Total Print Count</th>
                                        <th>First Issued Date</th>
                                        <th>Buyer Name</th>
                                        <th>Last Amount Logged</th>
                                        <th>Audit Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${Object.keys(orGroups).length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:20px; color:#888;">Walang nakatalang receipts sa audit log.</td></tr>` :
                                      Object.keys(orGroups).map(or => {
                                          const logs = orGroups[or];
                                          const count = logs.length;
                                          const latest = logs[logs.length - 1];
                                          const first = logs[0];
                                          const hasDiffAmount = new Set(logs.map(l => Number(l.amount))).size > 1;

                                          return `
                                              <tr style="${hasDiffAmount ? 'background:#fff1f2;' : count > 1 ? 'background:#fefce8;' : ''}">
                                                  <td>
                                                      <button class="btn btn-light" style="font-weight:bold; font-size:13px; color:#2563eb;" onclick="openReceiptReviewModal('${esc(or)}')">
                                                          🔍 ${esc(or)}
                                                      </button>
                                                  </td>
                                                  <td>
                                                      <strong>${count} copy/copies</strong>
                                                      ${count > 1 ? '<span class="badge badge-yellow" style="margin-left:6px;">RE-PRINTED</span>' : '<span class="badge badge-green" style="margin-left:6px;">SINGLE</span>'}
                                                  </td>
                                                  <td>${first.date} <small style="color:#64748b;">${first.time || ''}</small></td>
                                                  <td><strong>${esc(first.buyerName)}</strong></td>
                                                  <td style="font-weight:bold; ${hasDiffAmount ? 'color:#b91c1c;' : 'color:#15803d;'}">${money(latest.amount)}</td>
                                                  <td>
                                                      ${hasDiffAmount ? 
                                                          `<span class="badge badge-red" style="font-weight:bold;">🚨 MISMATCH / SUSPICIOUS</span>` : 
                                                          count > 1 ? 
                                                          `<span class="badge badge-yellow">DUPLICATE DETECTED</span>` : 
                                                          `<span class="badge badge-green">VERIFIED NORMAL</span>`
                                                      }
                                                  </td>
                                                  <td>
                                                      <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openReceiptReviewModal('${esc(or)}')">View Review</button>
                                                  </td>
                                              </tr>
                                          `;
                                      }).join("")
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                `}
            </div>
        `;
    };

    window.renderReportsWithMonth = () => {
        const val = document.getElementById("reportMonthInput")?.value || defaultMonth;
        document.getElementById("content").innerHTML = generateReportHTML(val);
    };

    document.getElementById("content").innerHTML = generateReportHTML(defaultMonth);
}

/* =========================================================
   11. MONEY IN / OUT OVERVIEW
========================================================= */

function renderMoney(){
    const activeRealtyId = getActiveRealtyId();
    const filteredIn = db.moneyIn.filter(m => {
        if(canAccessBossFeatures()){
            if(activeRealtyId) return m.realtyId === activeRealtyId;
            return true;
        }
        return m.realtyId === activeRealtyId;
    });
    const filteredOut = db.moneyOut.filter(m => {
        if(canAccessBossFeatures()){
            if(activeRealtyId) return m.realtyId === activeRealtyId;
            return true;
        }
        return m.realtyId === activeRealtyId;
    });

    const totalIn = filteredIn.reduce((a,b)=>a+Number(b.amount||0),0);
    const totalOut = filteredOut.reduce((a,b)=>a+Number(b.amount||0),0);

    document.getElementById("content").innerHTML=`
        <div class="stats">
            <div class="stat-card-3d"><small>Money In</small><h3>${money(totalIn)}</h3></div>
            <div class="stat-card-3d"><small>Money Out</small><h3>${money(totalOut)}</h3></div>
            <div class="stat-card-3d"><small>Net Cash Balance</small><h3>${money(totalIn-totalOut)}</h3></div>
        </div>
        <div class="grid-2">
            <div class="panel">
                <div class="panel-header"><h3>💵 MONEY IN</h3></div>
                <div class="table-wrap"><table>
                    <tr><th>Date</th><th>Buyer / Ref</th><th>Amount</th></tr>
                   ${filteredIn.length === 0 ? `<tr><td colspan="3" style="text-align:center; color:#888;">Walang tala ng Money In.</td></tr>` : filteredIn.map(x=>`<tr><td>${x.date}</td><td>${esc(x.buyer || x.reference || "—")}</td><td>${money(x.amount)}</td></tr>`).join("")}
                </table></div>
            </div>
            <div class="panel">
                <div class="panel-header"><h3>💸 MONEY OUT</h3></div>
                <div class="table-wrap"><table>
                    <tr><th>Date</th><th>Description</th><th>Amount</th></tr>
                    ${filteredOut.length === 0 ? `<tr><td colspan="3" style="text-align:center; color:#888;">Walang tala ng Money Out.</td></tr>` : filteredOut.map(x=>`<tr><td>${x.date}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td></tr>`).join("")}
                </table></div>
            </div>
        </div>
    `;
}

/* =========================================================
   12. AUDIT LOGS
========================================================= */

function renderRecords(){
    if(!canAccessBossFeatures()){
        document.getElementById("content").innerHTML=`<div class="panel"><h3>Access Denied</h3></div>`;
        return;
    }

    db.loginLogs = (db.loginLogs || []).filter(l => 
        l.role !== "IT" && 
        l.username !== "it" && 
        l.username !== "root" && 
        !String(l.name || "").toUpperCase().includes("IT ROOT")
    );
    saveDB();

    const logs = db.loginLogs;

    document.getElementById("content").innerHTML=`
        <div class="panel">
            <div class="panel-header">
                <h3>📋 SYSTEM AUDIT LOGS (STAFF &amp; ADMIN ONLY)</h3>
                <span class="badge badge-blue">${logs.length} Records</span>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>User</th>
                            <th>Role</th>
                            <th>Branch</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:15px; color:#888;">No staff login records found.</td></tr>` : 
                          logs.map(l => `
                            <tr>
                                <td>${l.date}</td>
                                <td>${l.time}</td>
                                <td><strong>${esc(l.name)}</strong></td>
                                <td><span class="badge badge-blue">${esc(l.role)}</span></td>
                                <td>${esc(l.realtyName || "Main Branch")}</td>
                            </tr>
                          `).join("")
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/* =========================================================
   13. SYSTEM CONTROLLER & RESET TOOLS
========================================================= */

function renderControl(){
    if(!canAccessBossFeatures()){
        document.getElementById("content").innerHTML = `<div class="panel"><h3>Access Denied</h3></div>`;
        return;
    }

    const activeBranch = getActiveBranchProfile();

    document.getElementById("content").innerHTML = `
        <div class="panel" style="background: linear-gradient(135deg, #1e293b, #0f172a); color:#fff; border:0; margin-bottom:20px;">
            <h3 style="color:#38bdf8; font-size:20px; margin-bottom:4px;">🎛️ SYSTEM CONTROLLER &amp; BRANDING HUB</h3>
            <p style="color:#94a3b8; font-size:13px;">Manage System Name, Branch Identity, Logo Uploads, and Maintenance Tools.</p>
        </div>

        <div class="grid-2">
            <div class="panel">
                <div class="panel-header">
                    <h3 style="font-size:16px;">🌐 GLOBAL SYSTEM BRANDING</h3>
                    <span class="badge badge-blue">Admin Access</span>
                </div>
                <div class="form-group">
                    <label>Platform System Name:</label>
                    <input id="ctrlSystemName" value="${esc(db.settings.systemName || 'REALTY SYSTEM')}">
                </div>
                <div class="form-group">
                    <label>Upload System Logo (Image File):</label>
                    <input type="file" accept="image/*" onchange="processLogoUpload(this, 'ctrlSystemLogo', 'ctrlSystemLogoPreview')">
                </div>
                <div class="form-group">
                    <label>Or Image URL / Emoji:</label>
                    <input id="ctrlSystemLogo" value="${esc(db.settings.systemLogo || '🏢')}" oninput="document.getElementById('ctrlSystemLogoPreview').innerHTML = renderLogoHTML(this.value)">
                </div>
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
                    <span style="font-size:12px; font-weight:bold; color:#64748b;">Logo Preview:</span>
                    <div id="ctrlSystemLogoPreview" style="width:48px; height:48px; border-radius:10px; background:#991b1b; display:flex; align-items:center; justify-content:center; font-size:28px; overflow:hidden;">
                        ${renderLogoHTML(db.settings.systemLogo)}
                    </div>
                </div>
                <button class="btn btn-primary full" onclick="saveGlobalControlSettings()">SAVE GLOBAL BRANDING</button>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <h3 style="font-size:16px;">🏢 BRANCH BRAND CONTROLLER</h3>
                    <span class="badge badge-purple">${activeBranch ? activeBranch.name : 'ALL BRANCHES'}</span>
                </div>
                ${activeBranch ? `
                    <div class="form-group">
                        <label>Branch Name:</label>
                        <input id="ctrlBranchName" value="${esc(activeBranch.name)}">
                    </div>
                    <div class="form-group">
                        <label>Upload Branch Logo (Image File):</label>
                        <input type="file" accept="image/*" onchange="processLogoUpload(this, 'ctrlBranchLogo', 'ctrlBranchLogoPreview')">
                    </div>
                    <div class="form-group">
                        <label>Or Image URL / Emoji:</label>
                        <input id="ctrlBranchLogo" value="${esc(activeBranch.logo || '🏢')}" oninput="document.getElementById('ctrlBranchLogoPreview').innerHTML = renderLogoHTML(this.value)">
                    </div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
                        <span style="font-size:12px; font-weight:bold; color:#64748b;">Branch Logo Preview:</span>
                        <div id="ctrlBranchLogoPreview" style="width:48px; height:48px; border-radius:10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:24px; overflow:hidden; border:1px solid #cbd5e1;">
                            ${renderLogoHTML(activeBranch.logo || '🏢')}
                        </div>
                    </div>
                    <button class="btn btn-success full" onclick="saveCurrentBranchControlSettings('${activeBranch.id}')">SAVE BRANCH PROFILE &amp; LOGO</button>
                ` : `
                    <p style="color:#64748b; padding:20px; text-align:center;">You are currently in Consolidated Overview mode. Use the <strong>VIEW ROOM dropdown</strong> at the top bar to select a specific branch to edit.</p>
                `}
            </div>
        </div>

        <div class="panel" style="border:1px solid #fecaca; background:#fff5f5; margin-top:20px;">
            <div class="panel-header">
                <h3 style="color:#b91c1c; font-size:16px;">🧹 DATABASE MAINTENANCE &amp; CASHFLOW RESET</h3>
                <span class="badge badge-red">Danger Zone</span>
            </div>
            <p style="font-size:13px; color:#7f1d1d; margin-bottom:14px;">
                Kung may mga lumang test transaction na nagdudulot ng halaga sa Month Collections kahit walang mga lote, pindutin ito upang linisin ang lahat ng lumang tala ng cash inflows, outflows, at reservations. (Mananatili ang Permanent Receipt Audit Logs para sa security).
            </p>
            <button class="btn btn-danger" onclick="clearTestTransactions()">🧹 RESET TEST TRANSACTIONS (Pera / Inflows / Outflows)</button>
        </div>
    `;
}

function clearTestTransactions(){
    if(!confirm("Sigurado ka bang nais mong linisin ang lahat ng nakatagong Collections (Money In), Expenses (Money Out), at lumang Reservations? Babalik sa ₱0.00 ang lahat ng cash flow counters.")) return;
    
    db.moneyIn = [];
    db.moneyOut = [];
    db.expenses = [];
    db.payments = [];
    db.reservations = [];
    db.commissions = [];
    db.refunds = [];

    db.projects.forEach(p => {
        (p.areas || []).forEach(a => {
            (a.blocks || []).forEach(b => {
                (b.lots || []).forEach(l => {
                    l.status = "AVAILABLE";
                    l.buyerName = "—";
                });
            });
        });
    });

    saveDB();
    alert("✅ Matagumpay na na-reset ang lahat ng test transactions at cash records!");
    showPage(currentPage);
}

function saveGlobalControlSettings(){
    const name = document.getElementById("ctrlSystemName")?.value.trim();
    const logo = document.getElementById("ctrlSystemLogo")?.value.trim();

    if(!name){
        alert("System Name cannot be empty.");
        return;
    }

    db.settings.systemName = name;
    db.settings.systemLogo = logo || "🏢";

    saveDB();
    applyDynamicBranding();
    alert("✅ Global System Branding updated successfully!");
    renderControl();
}

function saveCurrentBranchControlSettings(realtyId){
    const branch = db.realties.find(r => r.id === realtyId);
    if(!branch) return;

    const name = document.getElementById("ctrlBranchName")?.value.trim();
    const logo = document.getElementById("ctrlBranchLogo")?.value.trim();

    if(!name){
        alert("Branch Name cannot be empty.");
        return;
    }

    branch.name = name;
    branch.logo = logo || "🏢";

    saveDB();
    applyDynamicBranding();
    alert(`✅ Branch controller settings updated for ${name}!`);
    renderControl();
}