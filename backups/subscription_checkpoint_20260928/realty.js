/* =========================================================
   REALTY.JS - WORKSPACE, INVENTORY, TRANSACTIONS & LEDGERS
   Checkpoint V2 Implementation: 2026-09-27
   LOCKED ZONE: Preserved Computations, Ledgers & Workflows
========================================================= */

// =========================================================
// 1. BRANCH ADMIN DASHBOARD
// =========================================================

function renderAdminDashboard() {
    const activeRealtyId = getActiveRealtyId();
    const branch = getActiveBranchProfile();

    const reservations = (db.reservations || []).filter(r => !activeRealtyId || r.realtyId === activeRealtyId);
    const moneyIn = (db.moneyIn || []).filter(m => !activeRealtyId || m.realtyId === activeRealtyId);
    const moneyOut = (db.moneyOut || []).filter(m => !activeRealtyId || m.realtyId === activeRealtyId);
    const lots = (db.lots || []).filter(l => !activeRealtyId || l.realtyId === activeRealtyId);
    const buyers = (db.buyers || []).filter(b => !activeRealtyId || b.realtyId === activeRealtyId);

    const totalInflow = moneyIn.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalOutflow = moneyOut.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const netBalance = totalInflow - totalOutflow;
    const totalReceivables = reservations.reduce((sum, r) => sum + Number(r.balance || 0), 0);

    const availableLots = lots.filter(l => l.status === "AVAILABLE").length;
    const reservedLots = lots.filter(l => l.status === "RESERVED" || l.status === "SOLD").length;

    const sub = activeRealtyId ? getSubscriptionState(activeRealtyId) : { state: "ACTIVE", daysRemaining: 999 };

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
            <div>
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0;">
                    ${branch ? `🏢 ${esc(branch.name)} Operations` : "📊 Consolidated Realty Workspace"}
                </h3>
                <small style="color:#64748b;">Daily transactions, property allocations, and client portfolios</small>
            </div>
            ${sub.state === "NEAR_EXPIRY" ? `
                <div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:6px 14px; font-size:12px; color:#92400e; font-weight:bold;">
                    ⚠️ SUBSCRIPTION REMINDER: ${sub.daysRemaining} days remaining before due (${sub.dueDate}).
                </div>
            ` : ''}
        </div>

        <div class="grid-4" style="margin-bottom:24px;">
            <div class="card-3d" style="border-top:4px solid #16a34a;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Collections (Money In)</small>
                <h3 style="color:#15803d; font-size:24px; margin-top:8px;">${money(totalInflow)}</h3>
                <p style="font-size:11px; color:#16a34a; margin-top:4px;">Total payments collected</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #dc2626;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Disbursements (Money Out)</small>
                <h3 style="color:#b91c1c; font-size:24px; margin-top:8px;">${money(totalOutflow)}</h3>
                <p style="font-size:11px; color:#dc2626; margin-top:4px;">Expenses and commissions</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #2563eb;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Net Cash on Hand</small>
                <h3 style="color:#1d4ed8; font-size:24px; margin-top:8px;">${money(netBalance)}</h3>
                <p style="font-size:11px; color:#2563eb; margin-top:4px;">Net retained balance</p>
            </div>

            <div class="card-3d" style="border-top:4px solid #f59e0b;">
                <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Total Receivables</small>
                <h3 style="color:#d97706; font-size:24px; margin-top:8px;">${money(totalReceivables)}</h3>
                <p style="font-size:11px; color:#d97706; margin-top:4px;">Pending amortizations</p>
            </div>
        </div>

        <div class="grid-2">
            <div class="panel">
                <div class="panel-header">
                    <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">📌 Inventory Snapshot</h4>
                </div>
                <div style="display:flex; justify-content:space-around; align-items:center; padding:16px 0;">
                    <div style="text-align:center;">
                        <span style="font-size:28px; font-weight:800; color:#16a34a;">${availableLots}</span>
                        <p style="font-size:12px; color:#64748b; font-weight:bold; margin-top:4px;">AVAILABLE LOTS</p>
                    </div>
                    <div style="width:1px; height:50px; background:#e2e8f0;"></div>
                    <div style="text-align:center;">
                        <span style="font-size:28px; font-weight:800; color:#dc2626;">${reservedLots}</span>
                        <p style="font-size:12px; color:#64748b; font-weight:bold; margin-top:4px;">RESERVED / SOLD</p>
                    </div>
                    <div style="width:1px; height:50px; background:#e2e8f0;"></div>
                    <div style="text-align:center;">
                        <span style="font-size:28px; font-weight:800; color:#2563eb;">${buyers.length}</span>
                        <p style="font-size:12px; color:#64748b; font-weight:bold; margin-top:4px;">TOTAL CLIENTS</p>
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-header">
                    <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">⚡ Quick Management Actions</h4>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <button class="btn btn-primary" onclick="showPage('reservation')">+ New Reservation</button>
                    <button class="btn btn-success" onclick="openReceivePaymentModal()">💰 Accept Payment</button>
                    <button class="btn btn-secondary" onclick="showPage('projects')">🏗️ Property Catalog</button>
                    <button class="btn btn-secondary" onclick="showPage('buyers')">👥 Buyer Dossiers</button>
                </div>
            </div>
        </div>
    `;
}

// =========================================================
// 2. PROJECTS, AREAS, BLOCKS & LOTS INVENTORY
// =========================================================

function renderProjects() {
    const activeRealtyId = getActiveRealtyId();
    const projects = (db.projects || []).filter(p => !activeRealtyId || p.realtyId === activeRealtyId);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">🏗️ Project Subdivisions &amp; Lots</h3>
                <small style="color:#64748b;">Manage locations, project maps, and lot price matrices</small>
            </div>
            <button class="btn btn-primary" onclick="openAddProjectModal()">+ Add New Project</button>
        </div>

        <div class="grid-2">
            ${projects.length === 0 ? `<div class="card-3d" style="grid-column:span 2; text-align:center; padding:30px; color:#888;">Walang nakarehistrong proyekto para sa sangay na ito.</div>` :
                projects.map(p => {
                    const projectLots = (db.lots || []).filter(l => l.projectId === p.id);
                    const avail = projectLots.filter(l => l.status === "AVAILABLE").length;
                    const taken = projectLots.filter(l => l.status !== "AVAILABLE").length;

                    return `
                        <div class="card-3d">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <div>
                                    <h4 style="font-size:16px; font-weight:800; color:#0f172a; margin:0;">${esc(p.name)}</h4>
                                    <small style="color:#64748b;">📍 ${esc(p.location || 'Location Not Specified')}</small>
                                </div>
                                <span class="badge badge-purple">${projectLots.length} Total Lots</span>
                            </div>
                            <div style="margin:16px 0; background:#f8fafc; border-radius:8px; padding:12px; display:flex; justify-content:space-between;">
                                <div><small style="color:#64748b;">Available Lots:</small><br><strong style="color:#16a34a;">${avail}</strong></div>
                                <div><small style="color:#64748b;">Sold/Reserved:</small><br><strong style="color:#dc2626;">${taken}</strong></div>
                                <div><small style="color:#64748b;">Default Price/sqm:</small><br><strong>${money(p.pricePerSqm || 0)}</strong></div>
                            </div>
                            <div style="display:flex; gap:8px;">
                                <button class="btn btn-secondary" style="flex:1; font-size:12px;" onclick="openManageProjectLotsModal('${p.id}')">📋 View &amp; Add Lots</button>
                                <button class="btn btn-danger" style="font-size:12px;" onclick="deleteProject('${p.id}')">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join("")
            }
        </div>
    `;
}

// Helper parser para sa range o comma list (hal. "1-5", "1,2,3,4,5,6")
function parseRangeList(inputStr) {
    if (!inputStr) return [];
    const parts = String(inputStr).split(/[\s,]+/);
    const result = new Set();
    
    parts.forEach(part => {
        part = part.trim();
        if (!part) return;
        if (part.includes('-')) {
            const [startStr, endStr] = part.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
                const min = Math.min(start, end);
                const max = Math.max(start, end);
                for (let i = min; i <= max; i++) {
                    result.add(i);
                }
            }
        } else {
            const num = parseInt(part, 10);
            if (!isNaN(num)) {
                result.add(num);
            }
        }
    });
    
    return Array.from(result).sort((a, b) => a - b);
}

function openAddProjectModal() {
    const activeRealtyId = getActiveRealtyId();
    if (!activeRealtyId && currentUser?.role === "BOSS") {
        alert("Pumili muna ng Branch Workspace sa itaas bago magdagdag ng Project.");
        return;
    }

    showModal(`
        <div class="modal-header">
            <h3>🏗️ ADD PROJECT & GENERATE LOTS</h3>
            <button class="close" onclick="closeModal()">✕</button>
        </div>
        <form onsubmit="saveNewProject(event)">
            <div class="form-group">
                <label>Project Name</label>
                <input id="projNameInput" required placeholder="e.g. GREEN VALLEY ESTATES">
            </div>
            <div class="form-group">
                <label>Project Location</label>
                <input id="projLocationInput" required placeholder="e.g. Brgy. Maliwalo, Tarlac City">
            </div>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin:12px 0;">
                <div style="font-weight:bold; font-size:12px; color:#0369a1; margin-bottom:8px; text-transform:uppercase;">⚡ Batch Multi-Block & Lot Setup</div>
                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
                    <div class="form-group" style="margin:0;">
                        <label style="font-size:11px;">Blocks (e.g. 1-6 o 1,2,3,4,5,6)</label>
                        <input id="projBlockCount" type="text" value="1" required placeholder="e.g. 1-5 o 1,2,3">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label style="font-size:11px;">Lots per Block (e.g. 1-10 o 1,2,3,4,5,6)</label>
                        <input id="projLotCount" type="text" value="1-10" required placeholder="e.g. 1-20 o 1,2,3,4">
                    </div>
                </div>

                <div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="form-group" style="margin:0;">
                        <label style="font-size:11px;">Default Area (sqm)</label>
                        <input id="projDefaultArea" type="number" min="1" value="100" required placeholder="e.g. 100">
                    </div>
                    <div class="form-group" style="margin:0;">
                        <label style="font-size:11px;">Price per SQM (₱)</label>
                        <input id="projBasePriceInput" type="number" required min="100" step="50" value="4500" placeholder="e.g. 4500">
                    </div>
                </div>
            </div>

            <button class="btn btn-primary full" style="padding:12px; margin-top:8px; font-weight:bold;" type="submit">GENERATE PROJECT & LOTS</button>
        </form>
    `);
}

function saveNewProject(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const name = document.getElementById("projNameInput")?.value.trim().toUpperCase();
    const location = document.getElementById("projLocationInput")?.value.trim();
    const pricePerSqm = Number(document.getElementById("projBasePriceInput")?.value || 0);

    const blockInput = document.getElementById("projBlockCount")?.value || "1";
    const lotInput = document.getElementById("projLotCount")?.value || "1";
    const area = Number(document.getElementById("projDefaultArea")?.value || 100);

    if (!name || pricePerSqm <= 0) return;

    const blocks = parseRangeList(blockInput);
    const lots = parseRangeList(lotInput);

    if (blocks.length === 0 || lots.length === 0) {
        alert("Pakisuri ang format ng blocks o lots (Halimbawa: 1-6 o 1,2,3,4,5,6).");
        return;
    }

    const newProject = {
        id: uid("P"),
        realtyId: activeRealtyId,
        name,
        location,
        pricePerSqm,
        createdAt: new Date().toISOString()
    };

    if (!db.projects) db.projects = [];
    db.projects.push(newProject);

    if (!db.lots) db.lots = [];
    let totalGeneratedLots = 0;
    const tcp = area * pricePerSqm;

    blocks.forEach(b => {
        lots.forEach(l => {
            db.lots.push({
                id: uid("L"),
                projectId: newProject.id,
                realtyId: activeRealtyId,
                block: String(b),
                lotNumber: String(l),
                lot: String(l),
                area: area,
                price: tcp,
                tcp: tcp,
                status: "AVAILABLE",
                createdAt: new Date().toISOString()
            });
            totalGeneratedLots++;
        });
    });

    logAuditEvent("ADD_PROJECT", `Added project: ${name} with ${totalGeneratedLots} lots`);
    saveDB();
    closeModal();
    alert(`Project "${name}" successfully registered with ${totalGeneratedLots} lots!`);
    renderProjects();
}
function deleteProject(projId) {
    const hasLots = (db.lots || []).some(l => l.projectId === projId);
    if (hasLots) {
        alert("Hindi maaaring burahin ang proyektong ito dahil may mga nakapaloob na lots/lote rito.");
        return;
    }
    if (!confirm("Sigurado ka bang nais mong burahin ang proyektong ito?")) return;

    db.projects = db.projects.filter(p => p.id !== projId);
    logAuditEvent("DELETE_PROJECT", `Deleted project ID: ${projId}`);
    saveDB();
    renderProjects();
}


function openManageProjectLotsModal(projId) {
    const project = db.projects.find(function(p) { return p.id === projId; });
    if (!project) return;

    const lots = (db.lots || []).filter(function(l) { return l.projectId === projId; });
    const isBoss = currentUser && currentUser.role === "BOSS";

    let rowsHtml = '';
    if (lots.length === 0) {
        rowsHtml = '<tr><td colspan="' + (isBoss ? 6 : 5) + '" style="text-align:center; padding:15px; color:#888;">Walang lote na nakarehistro.</td></tr>';
    } else {
        rowsHtml = lots.map(function(l) {
            const pricePerSqm = Number(l.area) > 0 ? (Number(l.tcp || l.price || 0) / Number(l.area)) : (project.pricePerSqm || 0);
            const statusBadge = l.status === 'AVAILABLE' ? 'badge-green' : 'badge-red';
            let actionCol = '';
            if (isBoss) {
                actionCol = '<td style="text-align:center; white-space:nowrap;">' +
                    '<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openEditLotModal(\'' + l.id + '\')">✏️ Edit</button> ' +
                    '<button class="btn btn-danger" style="padding:4px 8px; font-size:11px; margin-left:4px;" onclick="deleteLot(\'' + l.id + '\')">🗑️</button>' +
                    '</td>';
            }
            return '<tr>' +
                '<td><strong>Block ' + (l.block || 1) + ' Lot ' + (l.lotNumber || l.lot) + '</strong></td>' +
                '<td>' + l.area + ' sqm</td>' +
                '<td>' + money(pricePerSqm) + '</td>' +
                '<td><strong style="color:#1d4ed8;">' + money(l.tcp || l.price || 0) + '</strong></td>' +
                '<td><span class="badge ' + statusBadge + '">' + (l.status || 'AVAILABLE') + '</span></td>' +
                actionCol +
                '</tr>';
        }).join('');
    }

    const addBtn = isBoss ? '<button class="btn btn-primary" style="font-size:12px;" onclick="openAddLotModal(\'' + projId + '\')">+ Add Lot</button>' : '';
    const actionHeader = isBoss ? '<th style="text-align:center;">Action</th>' : '';

    showModal(
        '<div class="modal-header">' +
            '<h3>📋 LOT INVENTORY: ' + esc(project.name) + '</h3>' +
            '<button class="close" onclick="closeModal()">✕</button>' +
        '</div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">' +
            '<span style="font-size:13px; color:#64748b;">Kabuuang Lote: <strong>' + lots.length + '</strong></span>' +
            addBtn +
        '</div>' +
        '<div class="table-wrap" style="max-height:350px; overflow-y:auto;">' +
            '<table>' +
                '<thead>' +
                    '<tr>' +
                        '<th>Block - Lot</th>' +
                        '<th>Area (sqm)</th>' +
                        '<th>Price/sqm</th>' +
                        '<th>Total Contract Price</th>' +
                        '<th>Status</th>' +
                        actionHeader +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    rowsHtml +
                '</tbody>' +
            '</table>' +
        '</div>'
    );
}

function openEditLotModal(lotId) {
    if (!currentUser || currentUser.role !== "BOSS") {
        alert("Pang-BOSS lamang ang karapatang mag-edit ng lote.");
        return;
    }

    const lot = (db.lots || []).find(function(l) { return l.id === lotId; });
    if (!lot) return;

    const currentTcp = Number(lot.tcp || lot.price || 0);
    const currentArea = Number(lot.area || 100);
    const currentPricePerSqm = currentArea > 0 ? Math.round(currentTcp / currentArea) : 0;

    showModal(
        '<div class="modal-header">' +
            '<h3>✏️ Edit Lot (Block ' + lot.block + ' Lot ' + (lot.lotNumber || lot.lot) + ')</h3>' +
            '<button class="close" onclick="openManageProjectLotsModal(\'' + lot.projectId + '\')">✕</button>' +
        '</div>' +
        '<form onsubmit="saveEditedLot(event, \'' + lot.id + '\')">' +
            '<div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">' +
                '<div class="form-group">' +
                    '<label style="font-size:12px; font-weight:bold;">Block</label>' +
                    '<input id="editLotBlock" type="text" value="' + lot.block + '" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label style="font-size:12px; font-weight:bold;">Lot Number</label>' +
                    '<input id="editLotNum" type="text" value="' + (lot.lotNumber || lot.lot) + '" required>' +
                '</div>' +
            '</div>' +
            '<div class="grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">' +
                '<div class="form-group">' +
                    '<label style="font-size:12px; font-weight:bold;">Area (sqm)</label>' +
                    '<input id="editLotArea" type="number" min="1" step="any" value="' + currentArea + '" required oninput="calcEditLotTcp()">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label style="font-size:12px; font-weight:bold;">Price per SQM (₱)</label>' +
                    '<input id="editLotRate" type="number" min="1" step="any" value="' + currentPricePerSqm + '" required oninput="calcEditLotTcp()">' +
                '</div>' +
            '</div>' +
            '<div class="form-group" style="margin-bottom:12px;">' +
                '<label style="font-size:12px; font-weight:bold;">Total Contract Price (TCP)</label>' +
                '<input id="editLotTcp" type="number" min="1" step="any" value="' + currentTcp + '" required style="font-weight:bold; color:#1d4ed8;">' +
            '</div>' +
            '<div class="form-group" style="margin-bottom:16px;">' +
                '<label style="font-size:12px; font-weight:bold;">Status</label>' +
                '<select id="editLotStatus" style="width:100%; padding:8px; border-radius:6px; border:1px solid #cbd5e1;">' +
                    '<option value="AVAILABLE"' + (lot.status === 'AVAILABLE' ? ' selected' : '') + '>AVAILABLE</option>' +
                    '<option value="RESERVED"' + (lot.status === 'RESERVED' ? ' selected' : '') + '>RESERVED</option>' +
                    '<option value="SOLD"' + (lot.status === 'SOLD' ? ' selected' : '') + '>SOLD</option>' +
                '</select>' +
            '</div>' +
            '<button class="btn btn-primary full" style="padding:10px; font-weight:bold;" type="submit">💾 I-SAVE ANG PAGBABAGO</button>' +
        '</form>'
    );
}

function calcEditLotTcp() {
    const areaInput = document.getElementById("editLotArea");
    const rateInput = document.getElementById("editLotRate");
    const tcpInput = document.getElementById("editLotTcp");
    const area = parseFloat(areaInput ? areaInput.value : 0);
    const rate = parseFloat(rateInput ? rateInput.value : 0);
    if (tcpInput && area > 0 && rate > 0) {
        tcpInput.value = Math.round(area * rate);
    }
}

function saveEditedLot(event, lotId) {
    event.preventDefault();
    if (!currentUser || currentUser.role !== "BOSS") {
        alert("Pang-BOSS lamang ang karapatang magbago ng lote.");
        return;
    }

    const lot = (db.lots || []).find(function(l) { return l.id === lotId; });
    if (!lot) return;

    lot.block = document.getElementById("editLotBlock").value.trim();
    lot.lotNumber = document.getElementById("editLotNum").value.trim();
    lot.lot = lot.lotNumber;
    lot.area = parseFloat(document.getElementById("editLotArea").value) || 0;
    lot.tcp = parseFloat(document.getElementById("editLotTcp").value) || 0;
    lot.price = lot.tcp;
    lot.status = document.getElementById("editLotStatus").value;

    logAuditEvent("EDIT_LOT", "Updated lot Block " + lot.block + " Lot " + lot.lotNumber + " TCP to " + lot.tcp);
    saveDB();
    openManageProjectLotsModal(lot.projectId);
}

function deleteLot(lotId) {
    if (!currentUser || currentUser.role !== "BOSS") {
        alert("Pang-BOSS lamang ang karapatang magbura ng lote.");
        return;
    }

    const lot = (db.lots || []).find(function(l) { return l.id === lotId; });
    if (!lot) return;

    if (lot.status !== "AVAILABLE") {
        alert("Hindi maaaring burahin ang lote dahil ito ay RESERVED o SOLD na.");
        return;
    }

    if (!confirm("Sigurado ka bang nais mong burahin ang Block " + lot.block + " Lot " + (lot.lotNumber || lot.lot) + "?")) return;

    db.lots = db.lots.filter(function(l) { return l.id !== lotId; });
    logAuditEvent("DELETE_LOT", "Deleted lot Block " + lot.block + " Lot " + (lot.lotNumber || lot.lot));
    saveDB();
    openManageProjectLotsModal(lot.projectId);
}





function openAddLotModal(projId) {
    const project = db.projects.find(p => p.id === projId);
    if (!project) return;

    showModal(`
        <div class="modal-header">
            <h3>+ ADD LOT: ${esc(project.name)}</h3>
            <button class="close" onclick="openManageProjectLotsModal('${projId}')">← Back</button>
        </div>
        <form onsubmit="saveNewLot(event, '${projId}')">
            <div class="grid-2">
                <div class="form-group">
                    <label>Block Number</label>
                    <input id="lotBlockInput" type="number" required min="1" placeholder="e.g. 1">
                </div>
                <div class="form-group">
                    <label>Lot Number</label>
                    <input id="lotNumInput" type="number" required min="1" placeholder="e.g. 5">
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Lot Area (SQM)</label>
                    <input id="lotAreaInput" type="number" required min="10" placeholder="e.g. 120" oninput="calculateLotTCP('${projId}')">
                </div>
                <div class="form-group">
                    <label>Price per SQM (₱)</label>
                    <input id="lotPriceSqmInput" type="number" value="${project.pricePerSqm || 4000}" required oninput="calculateLotTCP('${projId}')">
                </div>
            </div>
            <div class="form-group">
                <label>Total Contract Price (TCP)</label>
                <input id="lotCalculatedTCP" readonly style="font-weight:bold; color:#15803d; background:#f1f5f9;">
            </div>
            <button class="btn btn-success full" style="padding:10px; margin-top:8px;" type="submit">SAVE LOT</button>
        </form>
    `);

    calculateLotTCP(projId);
}

function calculateLotTCP(projId) {
    const area = Number(document.getElementById("lotAreaInput")?.value || 0);
    const price = Number(document.getElementById("lotPriceSqmInput")?.value || 0);
    const tcpInput = document.getElementById("lotCalculatedTCP");
    if (tcpInput) {
        tcpInput.value = money(area * price);
        tcpInput.setAttribute("data-tcp", area * price);
    }
}

function saveNewLot(event, projId) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const block = document.getElementById("lotBlockInput")?.value.trim();
    const lot = document.getElementById("lotNumInput")?.value.trim();
    const area = Number(document.getElementById("lotAreaInput")?.value || 0);
    const pricePerSqm = Number(document.getElementById("lotPriceSqmInput")?.value || 0);
    const tcp = Number(document.getElementById("lotCalculatedTCP")?.getAttribute("data-tcp") || (area * pricePerSqm));

    const lotExists = (db.lots || []).some(l => l.projectId === projId && String(l.block) === String(block) && String(l.lot) === String(lot));
    if (lotExists) {
        alert(`Ang Block ${block} Lot ${lot} ay nakarehistro na sa proyektong ito!`);
        return;
    }

    db.lots.push({
        id: uid("LOT"),
        realtyId: activeRealtyId,
        projectId: projId,
        block,
        lot,
        area,
        pricePerSqm,
        tcp,
        status: "AVAILABLE",
        createdAt: new Date().toISOString()
    });

    logAuditEvent("ADD_LOT", `Added Block ${block} Lot ${lot} in Project ${projId}`);
    saveDB();
    alert("✅ Lote matagumpay na naidagdag!");
    openManageProjectLotsModal(projId);
}

// =========================================================
// 3. PROPERTY RESERVATIONS (LOCKED TRANSACTION WORKFLOW)
// =========================================================

function renderReservation() {
    const activeRealtyId = getActiveRealtyId();
    const reservations = (db.reservations || []).filter(r => !activeRealtyId || r.realtyId === activeRealtyId);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">📝 Property Reservations</h3>
                <small style="color:#64748b;">LOCKED ZONE: Reservation records, contract computation, and payment schedules</small>
            </div>
            <button class="btn btn-primary" onclick="openNewReservationModal()">+ Create New Reservation</button>
        </div>

        <div class="card-3d">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Ref Code</th>
                            <th>Buyer Name</th>
                            <th>Property Unit</th>
                            <th>Total Price (TCP)</th>
                            <th>Balance</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reservations.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:18px; color:#888;">Walang reservation records.</td></tr>` :
                            reservations.map(r => `
                                <tr>
                                    <td><code style="font-weight:bold; color:#0369a1;">${esc(r.id)}</code></td>
                                    <td>
                                        <strong>${esc(r.buyerName)}</strong>
                                        <br><small style="color:#64748b;">${esc(r.buyerContact || 'No contact')}</small>
                                    </td>
                                    <td>
                                        <strong>${esc(r.projectName)}</strong>
                                        <br><small style="color:#64748b;">Blk ${r.block} Lot ${r.lot} (${r.area} sqm)</small>
                                    </td>
                                    <td>${money(r.tcp)}</td>
                                    <td style="color:#b91c1c; font-weight:bold;">${money(r.balance)}</td>
                                    <td>
                                        <span class="badge ${r.balance <= 0 ? 'badge-green' : 'badge-purple'}">
                                            ${r.balance <= 0 ? 'FULLY PAID' : 'ACTIVE AMORTIZATION'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openReservationDetailsModal('${r.id}')">
                                            🔍 Ledger
                                        </button>
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

function openNewReservationModal() {
    const activeRealtyId = getActiveRealtyId();
    if (!activeRealtyId && currentUser?.role === "BOSS") {
        alert("Pumili muna ng Branch Workspace sa itaas bago mag-book ng Reservation.");
        return;
    }

    const availableLots = (db.lots || []).filter(l => (!activeRealtyId || l.realtyId === activeRealtyId) && l.status === "AVAILABLE");

    if (availableLots.length === 0) {
        alert("Walang available na lote para sa reservation. Magdagdag muna sa Projects / Sites.");
        return;
    }

    showModal(`
        <div class="modal-header">
            <h3>📝 NEW BUYER RESERVATION</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveReservation(event)">
            <h4 style="font-size:13px; color:#475569; margin-bottom:8px; text-transform:uppercase;">1. Buyer Particulars</h4>
            <div class="grid-2">
                <div class="form-group">
                    <label>Buyer Full Name</label>
                    <input id="resBuyerName" required placeholder="e.g. Juan Dela Cruz">
                </div>
                <div class="form-group">
                    <label>Contact Number</label>
                    <input id="resBuyerContact" required placeholder="09123456789">
                </div>
            </div>
            <div class="form-group">
                <label>Address</label>
                <input id="resBuyerAddress" placeholder="Barangay, City, Province">
            </div>
<h4 style="font-size:13px; color:#475569; margin:14px 0 8px 0; text-transform:uppercase;">2. Property Selection (Multi-Lot)</h4>

<!-- STEP 1: PROJECT SELECT -->
<div class="form-group">
    <label>Select Project / Site</label>
  <select id="selResProject" onchange="onProjectSelectChanged()">
    <option value="">-- Pumili ng Project (Hal. Jalung / Pampanga) --</option>
    ${(db.projects || []).filter(p => {
        const rid = typeof getActiveRealtyId === 'function' ? getActiveRealtyId() : null;
        return !rid || p.realtyId === rid;
    }).map(p => `
        <option value="${p.id}">${esc(p.name)} - ${esc(p.site || p.location || '')}</option>
    `).join("")}
</select>
</div>

<!-- STEP 2: BLOCK SELECT (Kusang lilitaw pagkapili ng Project) -->
<div class="form-group" id="blockSelectGroup" style="display:none;">
    <label>Select Block</label>
    <select id="selResBlock" onchange="onBlockSelectChanged()">
        <option value="">${currentLang === 'TL' ? '-- Pumili ng Block --' : '-- Select Block --'}</option>
    </select>
</div>

<!-- STEP 3: MULTI-LOT CHECKBOXES (Kusang lilitaw pagkapili ng Block) -->
<div class="form-group" id="lotSelectGroup" style="display:none;">
    <label style="display:flex; justify-content:space-between; align-items:center;">
        <span>${currentLang === 'TL' ? 'Available Lots (Piliin kung maramihang lote)' : 'Available Lots (Select multiple if applicable)'}</span>
        <small id="selectedLotsCount" style="color:#2563eb; font-weight:bold;">0 ${currentLang === 'TL' ? 'napiling lote' : 'selected lot(s)'}</small>
    </label>
    <div id="lotCheckboxList" style="max-height:160px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:6px; padding:8px; background:#ffffff; display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:8px;"></div>
</div>

<!-- SUMMARY BOX NG MGA NAPILING LOTE -->
<div id="selectedLotsSummary" style="display:none; background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:10px; margin-bottom:12px;">
    <div style="font-size:12px; color:#64748b; margin-bottom:4px;">${currentLang === 'TL' ? 'Mga Lote na Kukunin:' : 'Selected Lots to Reserve:'}</div>
    <div id="selectedLotsTags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:6px;"></div>
</div>
<!-- SALES TEAM & DYNAMIC COMMISSION RATES (MANO-MANONG INPUT NI ADMIN) -->
<h4 style="font-size:13px; color:#475569; margin:14px 0 8px 0; text-transform:uppercase;">Sales Team &amp; Commission Rates</h4>
<div class="grid-2" style="margin-bottom:8px;">
    <div class="form-group">
        <label>Agent Name</label>
        <input id="resAgentName" placeholder="${currentLang === 'TL' ? 'Pangalan ng Sales Agent' : 'Sales Agent Name'}">
    </div>
    <div class="form-group">
        <label>Team Leader Name</label>
        placeholder="${currentLang === 'TL' ? 'Pangalan ng Team Leader' : 'Team Leader Name'}"
    </div>
</div>

<div class="grid-2" style="margin-bottom:12px;">
    <div class="form-group">
        <label>Agent Rate / sqm (₱)</label>
        <input type="number" id="resAgentRate" value="300" placeholder="Hal. 150, 200, 300, 500" oninput="calculateCommissionsAndFinance()">
    </div>
    <div class="form-group">
        <label>TL Rate / sqm (₱)</label>
        <input type="number" id="resTLRate" value="100" placeholder="Hal. 50, 100, 200" oninput="calculateCommissionsAndFinance()">
    </div>
</div>

<!-- NAKA-HIDE ANG PAYOUT TERMS (6/12 MOS) PARA MALINIS PERO BUO PA RIN SA SYSTEM -->
<div style="display:none !important;">
    <input type="number" id="resAgent1stRelease" value="3000">
    <input type="number" id="resTL1stRelease" value="1000">
    <select id="resAgentMonths">
        <option value="6" selected>6 Months</option>
        <option value="12">12 Months</option>
    </select>
    <select id="resTLMonths">
        <option value="6" selected>6 Months</option>
        <option value="12">12 Months</option>
    </select>
</div>

<!-- 3. FINANCIAL TERMS -->
<h4 style="font-size:13px; color:#475569; margin:14px 0 8px 0; text-transform:uppercase;">3. Financial Terms</h4>
<div class="grid-2" style="margin-bottom:8px;">
    <div class="form-group">
        <label>Total Contract Price (TCP)</label>
        <input id="resTCP" readonly style="font-weight:bold; background:#f8fafc;">
    </div>
    <div class="form-group">
        <label>Reservation Fee (₱)</label>
        <input id="resFeeInput" type="number" required min="0" placeholder="e.g. 10000" oninput="calculateCommissionsAndFinance()">
    </div>
</div>

<div class="grid-2" style="margin-bottom:12px;">
    <div class="form-group">
        <label>Title Fee (₱)</label>
        <input type="number" id="resTitleFee" min="0" value="0" placeholder="0.00" oninput="calculateCommissionsAndFinance()">
        <small style="color:#64748b; font-size:11px;">Processing at transfer fee.</small>
    </div>
    <div class="form-group">
        <label>Remaining Amortization Balance</label>
        <input id="resCalculatedBalance" readonly style="font-weight:bold; color:#b91c1c; background:#f8fafc;">
    </div>
</div>

<!-- LIVE SUMMARY BOX (DITO LALABAS ANG LAHAT NG TOTALS SA IBABA) -->
<div id="liveSummaryBox" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:14px; font-size:12px;">
    <div style="font-weight:bold; color:#0f172a; margin-bottom:8px; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">📋 Live Computation Summary</div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; color:#334155;">
        <div>Bilang ng Lote: <strong id="sumLotsCount">0 lote</strong></div>
        <div>Kabuuang Sukat: <strong id="sumTotalArea">0 sqm</strong></div>
        <div>Total Price (TCP): <strong id="sumTcp">₱0.00</strong></div>
        <div>Title Fee: <strong id="sumTitleFee">₱0.00</strong></div>
        <div>Agent Total Com: <strong id="sumAgentCom" style="color:#16a34a;">₱0.00</strong></div>
        <div>TL Total Com: <strong id="sumTlCom" style="color:#16a34a;">₱0.00</strong></div>
    </div>
    <button class="btn btn-primary full" style="padding:12px; margin-top:12px;" type="submit">CONFIRM RESERVATION &amp; ISSUE RECEIPT</button>
    `);
}

// =========================================================
// CASCADING MULTI-LOT CONTROLLER & TITLE FEE ENGINE
// =========================================================

let currentSelectedLotIds = [];

function onProjectSelectChanged() {
    const projectId = document.getElementById("selResProject")?.value;
    const blockGroup = document.getElementById("blockSelectGroup");
    const blockSelect = document.getElementById("selResBlock");
    const lotGroup = document.getElementById("lotSelectGroup");
    const summaryBox = document.getElementById("selectedLotsSummary");

    currentSelectedLotIds = [];
    updateSelectedLotsDisplay();

    if (!projectId) {
        if (blockGroup) blockGroup.style.display = "none";
        if (lotGroup) lotGroup.style.display = "none";
        if (summaryBox) summaryBox.style.display = "none";
        return;
    }

    const availableLots = (db.lots || []).filter(l => 
        l.projectId === projectId && 
        (l.status === "AVAILABLE" || !l.status)
    );

    const uniqueBlocks = [...new Set(availableLots.map(l => String(l.block || "1")))]
        .sort((a, b) => Number(a) - Number(b));

    if (uniqueBlocks.length === 0) {
        blockSelect.innerHTML = `<option value="">-- Walang Available Lots sa Project na ito --</option>`;
    } else {
        blockSelect.innerHTML = `<option value="">-- Pumili ng Block --</option>` + 
            uniqueBlocks.map(blk => `<option value="${blk}">Block ${blk}</option>`).join("");
    }

    blockGroup.style.display = "block";
    if (lotGroup) lotGroup.style.display = "none";
}

function onBlockSelectChanged() {
    const projectId = document.getElementById("selResProject")?.value;
    const blockNum = document.getElementById("selResBlock")?.value;
    const lotGroup = document.getElementById("lotSelectGroup");
    const listContainer = document.getElementById("lotCheckboxList");

    if (!projectId || !blockNum) {
        if (lotGroup) lotGroup.style.display = "none";
        return;
    }

    const availableLots = (db.lots || []).filter(l => 
        l.projectId === projectId && 
        String(l.block || "1") === String(blockNum) &&
        (l.status === "AVAILABLE" || !l.status)
    );

    if (availableLots.length === 0) {
        listContainer.innerHTML = `<div style="grid-column:1/-1; color:#94a3b8; font-size:12px; text-align:center; padding:10px;">Walang available lots sa Block ${blockNum}</div>`;
    } else {
        listContainer.innerHTML = availableLots.map(lot => {
            const isChecked = currentSelectedLotIds.includes(lot.id);
            return `
                <label style="display:flex; align-items:flex-start; gap:6px; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; cursor:pointer; background:#ffffff; font-size:12px;">
                    <input type="checkbox" value="${lot.id}" ${isChecked ? "checked" : ""} onchange="toggleLotSelection('${lot.id}', this.checked)" style="margin-top:2px;">
                    <div>
                        <strong>Lot ${esc(lot.lotNumber || lot.lot)}</strong>
                        <div style="color:#64748b; font-size:11px;">${lot.area || 0} sqm</div>
                        <div style="color:#16a34a; font-weight:700;">${money(lot.price || lot.tcp || 0)}</div>
                    </div>
                </label>
            `;
        }).join("");
    }

    lotGroup.style.display = "block";
}

function toggleLotSelection(lotId, isChecked) {
    if (isChecked) {
        if (!currentSelectedLotIds.includes(lotId)) {
            currentSelectedLotIds.push(lotId);
        }
    } else {
        currentSelectedLotIds = currentSelectedLotIds.filter(id => id !== lotId);
    }
    updateSelectedLotsDisplay();
    calculateCommissionsAndFinance();
}

function updateSelectedLotsDisplay() {
    const summaryBox = document.getElementById("selectedLotsSummary");
    const tagsContainer = document.getElementById("selectedLotsTags");
    const countElem = document.getElementById("selectedLotsCount");
    const tcpInput = document.getElementById("resTCP");

    if (countElem) countElem.textContent = `${currentSelectedLotIds.length} napiling lote`;

    if (!summaryBox || !tagsContainer) return;

    if (currentSelectedLotIds.length === 0) {
        summaryBox.style.display = "none";
        if (tcpInput) {
            tcpInput.value = money(0);
            tcpInput.setAttribute("data-raw", "0");
        }
        return;
    }

    const selectedLots = (db.lots || []).filter(l => currentSelectedLotIds.includes(l.id));
    const grandTcp = selectedLots.reduce((sum, l) => sum + Number(l.price || l.tcp || 0), 0);

    tagsContainer.innerHTML = selectedLots.map(l => `
        <span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:bold;">
            Blk ${l.block} Lot ${l.lotNumber || l.lot} (${money(l.price || l.tcp || 0)})
        </span>
    `).join("");

    if (tcpInput) {
        tcpInput.value = money(grandTcp);
        tcpInput.setAttribute("data-raw", grandTcp);
    }
    summaryBox.style.display = "block";
    calculateCommissionsAndFinance();
}

// ==========================================
// UNIFIED REAL-TIME FINANCE & COMMISSION ENGINE
// ==========================================
function calculateCommissionsAndFinance() {
    // 1. Kunin ang mga napiling lote
    const selectedLots = (db.lots || []).filter(l => (typeof currentSelectedLotIds !== 'undefined' && currentSelectedLotIds || []).includes(l.id));
    
    // 2. Sukat (sqm) at TCP
    const totalArea = selectedLots.reduce((sum, l) => sum + Number(l.area || 0), 0);
    
    let grandTcp = selectedLots.reduce((sum, l) => sum + Number(l.price || l.tcp || 0), 0);
    const tcpInput = document.getElementById("resTCP");
    if (grandTcp === 0 && tcpInput) {
        grandTcp = Number(tcpInput.getAttribute("data-raw") || tcpInput.value.replace(/[^0-9.-]+/g, "") || 0);
    } else if (tcpInput) {
        tcpInput.value = typeof money === 'function' ? money(grandTcp) : `₱${grandTcp.toLocaleString()}`;
        tcpInput.setAttribute("data-raw", grandTcp);
    }

    // 3. Fees at Balance
    const resFee = Number(document.getElementById("resFeeInput")?.value || 0);
    const titleFee = Number(document.getElementById("resTitleFee")?.value || 0);
    const balance = Math.max(0, grandTcp - resFee);

    const balElem = document.getElementById("resCalculatedBalance");
    if (balElem) {
        balElem.value = typeof money === 'function' ? money(balance) : `₱${balance.toLocaleString()}`;
        balElem.setAttribute("data-balance", balance);
    }

    // 4. Commission mula sa manual input ni Admin
    const agentRate = Number(document.getElementById("resAgentRate")?.value || 0);
    const tlRate = Number(document.getElementById("resTLRate")?.value || 0);

    const agentGross = totalArea * agentRate;
    const tlGross = totalArea * tlRate;

    // 5. I-update ang Live Summary Box sa ibaba
    const setTxt = (id, val) => { 
        const el = document.getElementById(id); 
        if (el) el.textContent = val; 
    };

    const fmt = (n) => typeof money === 'function' ? money(n) : `₱${Number(n).toLocaleString()}`;

    setTxt("sumLotsCount", `${selectedLots.length} lote`);
    setTxt("sumTotalArea", `${totalArea} sqm`);
    setTxt("sumTcp", fmt(grandTcp));
    setTxt("sumTitleFee", fmt(titleFee));
    setTxt("sumAgentCom", fmt(agentGross));
    setTxt("sumTlCom", fmt(tlGross));
}

// Fallbacks para laging tumakbo kahit ano pa ang tumawag
function calculateReservationFinance() {
    calculateCommissionsAndFinance();
}
function calculateBalance() {
    calculateCommissionsAndFinance();
}

function saveReservation(event) {
    event.preventDefault();

    if (currentSelectedLotIds.length === 0) {
        alert("Pumili ng kahit isang lote bago i-save ang reservation.");
        return;
    }

    const activeRealtyId = getActiveRealtyId();
    const buyerName = (document.getElementById("resBuyerName")?.value || "").trim().toUpperCase();
    const buyerContact = (document.getElementById("resBuyerContact")?.value || document.getElementById("resBuyerPhone")?.value || "").trim();
    const buyerAddress = (document.getElementById("resBuyerAddress")?.value || "").trim();

    const rawTCP = Number(document.getElementById("resTCP")?.getAttribute("data-raw") || 0);
    const resFee = Number(document.getElementById("resFeeInput")?.value || 0);
    const titleFee = Number(document.getElementById("resTitleFee")?.value || 0);
    const balance = Math.max(0, rawTCP - resFee);

    const selectedLots = (db.lots || []).filter(l => currentSelectedLotIds.includes(l.id));
    const firstLot = selectedLots[0];
    const proj = (db.projects || []).find(p => p.id === firstLot?.projectId);
    const propertySummary = `${proj ? proj.name : 'Project'} - ${selectedLots.map(l => `Blk ${l.block} Lot${l.lotNumber || l.lot}`).join(", ")}`;

    const buyerId = uid("B");
    if (!db.buyers) db.buyers = [];
    db.buyers.push({
        id: buyerId,
        realtyId: activeRealtyId,
        name: buyerName,
        contact: buyerContact,
        address: buyerAddress,
        registeredAt: new Date().toISOString()
    });

    const resId = uid("RES");
    if (!db.reservations) db.reservations = [];
    db.reservations.push({
        id: resId,
        realtyId: activeRealtyId,
        buyerId: buyerId,
        buyerName: buyerName,
        buyerContact: buyerContact,
        lotIds: [...currentSelectedLotIds],
        lotId: firstLot ? firstLot.id : null,
        projectId: firstLot ? firstLot.projectId : null,
        projectName: proj ? proj.name : "Subdivision",
        propertySummary: propertySummary,
        block: selectedLots.map(l => l.block).join(", "),
        lot: selectedLots.map(l => l.lotNumber || l.lot).join(", "),
        area: selectedLots.reduce((sum, l) => sum + Number(l.area || 0), 0),
        tcp: rawTCP,
        resFee: resFee,
        titleFee: titleFee,
        balance: balance,
        date: new Date().toISOString().slice(0, 10),
        status: "ACTIVE"
    });

    currentSelectedLotIds.forEach(lotId => {
        const lot = db.lots.find(l => l.id === lotId);
        if (lot) {
            lot.status = "RESERVED";
            lot.buyerName = buyerName;
            lot.buyerId = buyerId;
            lot.reservationId = resId;
        }
    });

    if (resFee > 0) {
        if (!db.moneyIn) db.moneyIn = [];
        db.moneyIn.push({
            id: uid("MIN"),
            realtyId: activeRealtyId,
            referenceId: resId,
            payerName: buyerName,
            category: "RESERVATION_FEE",
            amount: resFee,
            date: new Date().toISOString().slice(0, 10),
            remarks: `Initial Reservation Fee - ${propertySummary}`
        });
    }

    logAuditEvent("RESERVATION", `Booked reservation ${resId} for buyer ${buyerName} (${currentSelectedLotIds.length} lots)`);
    saveDB();
    closeModal();
    alert(`✅ Reservation Matagumpay na Naitala!\n\nBuyer: ${buyerName}\nRef Code: ${resId}`);
    renderReservation();
}
function openReservationDetailsModal(resId) {
    const res = (db.reservations || []).find(r => r.id === resId);
    if (!res) return;

    const payments = (db.moneyIn || []).filter(m => m.referenceId === res.id);

    showModal(`
        <div class="modal-header">
            <h3>📑 RESERVATION DOSSIER: ${esc(res.id)}</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:14px; font-size:13px;">
            <p><strong>Buyer:</strong> ${esc(res.buyerName)} | Contact: ${esc(res.buyerContact)}</p>
            <p><strong>Property:</strong> ${esc(res.projectName)} — Blk ${res.block} Lot ${res.lot} (${res.area} sqm)</p>
            <p><strong>Total Contract Price:</strong> ${money(res.tcp)}</p>
            <p><strong>Remaining Balance:</strong> <strong style="color:#b91c1c;">${money(res.balance)}</strong></p>
        </div>
        <h4 style="font-size:12px; color:#475569; text-transform:uppercase; margin-bottom:6px;">Payment History</h4>
        <div class="table-wrap" style="max-height:200px; overflow-y:auto; margin-bottom:14px;">
            <table>
                <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Remarks</th></tr></thead>
                <tbody>
                    ${payments.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:#888;">Walang karagdagang payments.</td></tr>` :
                        payments.map(p => `<tr><td>${p.date}</td><td>${p.category}</td><td style="color:#16a34a; font-weight:bold;">${money(p.amount)}</td><td>${esc(p.remarks)}</td></tr>`).join("")}
                </tbody>
            </table>
        </div>
        <button class="btn btn-secondary full" onclick="closeModal()">Close</button>
    `);
}

// =========================================================
// 4. BUYERS FOLDER & CLIENT DOSSIERS
// =========================================================

function renderBuyers() {
    const activeRealtyId = typeof getActiveRealtyId === 'function' ? getActiveRealtyId() : null;
    let buyers = db.buyers || [];
    if (activeRealtyId) {
        buyers = buyers.filter(b => !b.realtyId || b.realtyId === activeRealtyId);
    }

    const content = document.getElementById("content");
    if (!content) return;

    let folderCardsHtml = '';
    if (buyers.length === 0) {
        folderCardsHtml = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#94a3b8; background:#ffffff; border-radius:12px; border:2px dashed #e2e8f0;">' +
            '<div style="font-size:48px; margin-bottom:10px;">📂</div>' +
            '<p style="font-size:15px; margin:0;">Walang nakarehistrong buyer folder.</p>' +
        '</div>';
    } else {
        folderCardsHtml = buyers.map(b => {
            const contracts = (db.reservations || []).filter(r => r.buyerId === b.id || r.buyerName === b.name);
            let totalBal = 0;
            contracts.forEach(c => {
                totalBal += Number(c.balance !== undefined ? c.balance : (c.tcp || 0));
            });

            return '<div onclick="openBuyerDossierModal(\'' + b.id + '\')" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; cursor:pointer; transition:all 0.2s ease; box-shadow:0 1px 3px rgba(0,0,0,0.05); display:flex; flex-direction:column; justify-content:space-between;" onmouseover="this.style.transform=\'translateY(-3px)\'; this.style.boxShadow=\'0 10px 15px -3px rgba(0,0,0,0.1)\';" onmouseout="this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'0 1px 3px rgba(0,0,0,0.05)\';">' +
                '<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">' +
                    '<div style="font-size:38px;">📁</div>' +
                    '<div style="overflow:hidden;">' +
                        '<h4 style="margin:0; font-size:16px; font-weight:800; color:#0f172a; text-transform:uppercase; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">' + esc(b.name) + '</h4>' +
                        '<small style="color:#64748b; font-size:11px;">ID: ' + esc(b.id) + '</small>' +
                    '</div>' +
                '</div>' +
                '<div style="background:#f8fafc; border-radius:8px; padding:10px; font-size:12px; margin-bottom:12px;">' +
                    '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">' +
                        '<span style="color:#64748b;">Kontrata / Lote:</span>' +
                        '<strong>' + contracts.length + ' Unit(s)</strong>' +
                    '</div>' +
                    '<div style="display:flex; justify-content:space-between;">' +
                        '<span style="color:#64748b;">Kabuuang Balanse:</span>' +
                        '<strong style="color:#dc2626;">' + money(totalBal) + '</strong>' +
                    '</div>' +
                '</div>' +
                '<button class="btn btn-primary" style="width:100%; font-size:12px; padding:7px 0; border-radius:6px; font-weight:700;">📂 Buksan ang Folder</button>' +
            '</div>';
        }).join('');
    }

    content.innerHTML = 
        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">' +
            '<div>' +
                '<h2 style="font-size:22px; font-weight:800; color:#0f172a; margin:0;">📁 Buyers File Directory</h2>' +
                '<small style="color:#64748b;">Pumili ng Folder ng Buyer para makita ang Amortization, Ledger, at makapagsingil ng Resibo.</small>' +
            '</div>' +
            '<button class="btn btn-primary" onclick="openAddBuyerModal()">+ Add New Buyer</button>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">' +
            folderCardsHtml +
        '</div>';
}

function openAddBuyerModal() {
    const activeRealtyId = getActiveRealtyId();
    if (!activeRealtyId && currentUser?.role === "BOSS") {
        alert("Pumili muna ng Branch Workspace bago magdagdag ng Buyer.");
        return;
    }

    showModal(`
        <div class="modal-header">
            <h3>👥 REGISTER NEW BUYER</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveNewBuyer(event)">
            <div class="form-group">
                <label>Full Name</label>
                <input id="buyerNameInput" required placeholder="e.g. Maria Santos">
            </div>
            <div class="form-group">
                <label>Contact Number</label>
                <input id="buyerContactInput" required placeholder="09171234567">
            </div>
            <div class="form-group">
                <label>Complete Address</label>
                <textarea id="buyerAddressInput" rows="2" placeholder="Street, Barangay, City"></textarea>
            </div>
            <button class="btn btn-primary full" style="padding:10px; margin-top:6px;" type="submit">SAVE BUYER</button>
        </form>
    `);
}

function saveNewBuyer(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const name = document.getElementById("buyerNameInput")?.value.trim().toUpperCase();
    const contact = document.getElementById("buyerContactInput")?.value.trim();
    const address = document.getElementById("buyerAddressInput")?.value.trim();

    if (!name) return;

    db.buyers.push({
        id: uid("B"),
        realtyId: activeRealtyId,
        name,
        contact,
        address,
        registeredAt: new Date().toISOString()
    });

    logAuditEvent("ADD_BUYER", `Registered buyer: ${name}`);
    saveDB();
    closeModal();
    alert(`✅ Buyer "${name}" successfully registered!`);
    renderBuyers();
}

// =========================================================
// WIDE BUYER DOSSIER: AGENT, AMORTIZATION SCHEDULE & DUES
// =========================================================
function openBuyerDossierModal(buyerId) {
    const buyer = (db.buyers || []).find(b => b.id === buyerId);
    if (!buyer) return;

    const contracts = (db.reservations || []).filter(r => r.buyerId === buyer.id || r.buyerName === buyer.name);

    let totalTcp = 0;
    let totalBalance = 0;
    let assignedAgents = [];

    contracts.forEach(c => {
        let tcpVal = Number(c.tcp || c.price || c.totalPrice || 0);
        if (tcpVal === 0 && c.area && c.pricePerSqm) {
            tcpVal = Number(c.area) * Number(c.pricePerSqm);
        }
        if (tcpVal === 0 && c.balance) {
            tcpVal = Number(c.balance);
        }

        totalTcp += tcpVal;
        totalBalance += Number(c.balance !== undefined ? c.balance : tcpVal);

        if (c.agentName && !assignedAgents.includes(c.agentName)) {
            assignedAgents.push(c.agentName + (c.teamLeader ? ` (TL: ${c.teamLeader})` : ''));
        }
    });

    const totalPaid = Math.max(0, totalTcp - totalBalance);

    // Kuhanin ang mga transactions
    let transactions = [];
    (db.payments || []).forEach(p => {
        if (p.buyerId === buyer.id || p.buyerName === buyer.name || contracts.some(c => c.id === p.reservationId)) {
            transactions.push(p);
        }
    });

    // 1. Talaan ng mga Lote at Kontrata
    let contractsHtml = '';
    if (contracts.length === 0) {
        contractsHtml = '<tr><td colspan="6" style="text-align:center; padding:12px; color:#94a3b8;">Walang aktibong kontrata o lote.</td></tr>';
    } else {
        contractsHtml = contracts.map(c => {
            let cTcp = Number(c.tcp || c.price || c.totalPrice || 0);
            if (cTcp === 0 && c.area && c.pricePerSqm) cTcp = Number(c.area) * Number(c.pricePerSqm);
            if (cTcp === 0 && c.balance) cTcp = Number(c.balance);

            const cBal = Number(c.balance !== undefined ? c.balance : cTcp);
            const cPaid = Math.max(0, cTcp - cBal);
            const agentText = c.agentName ? `${esc(c.agentName)} ${c.teamLeader ? `<br><small style="color:#64748b;">TL: ${esc(c.teamLeader)}</small>` : ''}` : '<span style="color:#94a3b8;">Walang Agent</span>';

            return `<tr>
                <td><strong>${esc(c.projectName || 'Project')}</strong></td>
                <td>Blk ${c.block || 1} Lot ${c.lot || 1}</td>
                <td style="font-weight:700;">${money(cTcp)}</td>
                <td style="color:#16a34a; font-weight:700;">${money(cPaid)}</td>
                <td style="color:#dc2626; font-weight:700;">${money(cBal)}</td>
                <td>${agentText}</td>
            </tr>`;
        }).join('');
    }

    // 2. Buwanang Amortization Schedule (Naka-breakdown bawat buwan na may Status & Pay Button)
    let scheduleHtml = '';
    if (contracts.length === 0) {
        scheduleHtml = '<tr><td colspan="7" style="text-align:center; padding:16px; color:#94a3b8;">Walang nakatakdang amortization schedule.</td></tr>';
    } else {
        contracts.forEach(c => {
            let cTcp = Number(c.tcp || c.price || c.totalPrice || 0);
            if (cTcp === 0 && c.balance) cTcp = Number(c.balance);

            const terms = Number(c.terms || c.months || 36); 
            const monthlyAmort = Number(c.monthlyAmortization || c.monthly || (terms > 0 ? cTcp / terms : 0));
            const startDate = c.firstDueDate || c.date || c.reservationDate || new Date().toISOString();
            const payments = Array.isArray(c.payments) ? c.payments : [];

            const paidCount = Number(c.paidMonthsCount || payments.length || 0);

            for (let i = 1; i <= Math.min(terms, 36); i++) {
                const dueDate = new Date(startDate);
                dueDate.setMonth(dueDate.getMonth() + i);
                const dueStr = dueDate.toLocaleDateString();

                const isPaid = (i <= paidCount);
                const refCode = `AR-M${i}-${c.id ? c.id.slice(-4) : 'REF'}`;

                scheduleHtml += `<tr style="${isPaid ? 'background:#f0fdf4;' : ''}">
                    <td><strong>Buwan ${i} ng ${terms}</strong></td>
                    <td>Blk ${c.block || 1} Lot ${c.lot || 1}</td>
                    <td><span style="font-family:monospace; font-weight:600;">${dueStr}</span></td>
                    <td style="font-weight:800; color:#1e293b;">${money(monthlyAmort)}</td>
                    <td>
                        ${isPaid 
                            ? '<span class="badge" style="background:#dcfce7; color:#15803d; padding:4px 10px; border-radius:12px; font-weight:800; font-size:11px;">✅ PAID</span>' 
                            : '<span class="badge" style="background:#fee2e2; color:#b91c1c; padding:4px 10px; border-radius:12px; font-weight:800; font-size:11px;">⏳ DUE / PENDING</span>'}
                    </td>
                    <td style="text-align:center;">
                        ${isPaid 
                            ? `<button class="btn btn-secondary" style="padding:4px 10px; font-size:11px; font-weight:700;" onclick="showReceiptModal('${refCode}', '${esc(buyer.name)}', ${monthlyAmort}, 'Amortization Month ${i} (Blk ${c.block} Lot ${c.lot})', '${dueStr}', 'Cash', '${buyer.id}')">🖨️ Resibo</button>`
                            : `<button class="btn btn-primary" style="padding:4px 12px; font-size:11px; font-weight:800; background:#16a34a; border-color:#16a34a;" onclick="quickPayMonthlyAmort('${buyer.id}', '${c.id}',${i}, ${monthlyAmort}, '${dueStr}')">💳 Bayaran ang Due</button>`}
                    </td>
                </tr>`;
            }
        });
    }

    // Malapad na Window Layout (950px)
    showModal(`
        <div style="max-width:950px; width:95vw; margin:0 auto;">
            <div class="modal-header" style="border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:14px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:24px;">📁</span>
                    <div>
                        <h3 style="margin:0; font-size:18px; font-weight:800; color:#0f172a; text-transform:uppercase;">BUYER DOSSIER: ${esc(buyer.name)}</h3>
                        <small style="color:#64748b;">Komprehensibong talaan ng kontrata, amortization dues, at transaksyon</small>
                    </div>
                </div>
                <button class="close" onclick="closeModal()">✕</button>
            </div>

            <!-- Profile & Agent -->
            <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; margin-bottom:14px; font-size:13px; display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
                <div><span style="color:#64748b;">Buyer ID:</span><br><code style="color:#2563eb; font-weight:700;">${esc(buyer.id)}</code></div>
                <div><span style="color:#64748b;">Contact:</span><br><strong>${esc(buyer.contact || 'Walang Contact')}</strong></div>
                <div><span style="color:#64748b;">Address:</span><br><strong>${esc(buyer.address || 'Walang Address')}</strong></div>
                <div><span style="color:#64748b;">Assigned Agent / Team Leader:</span><br><span style="color:#1d4ed8; font-weight:700;">${assignedAgents.length ? assignedAgents.map(esc).join(', ') : 'Walang Naka-assign'}</span></div>
            </div>

            <!-- Summary Cards -->
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; margin-bottom:18px; text-align:center;">
                <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:12px; border-radius:8px;">
                    <small style="color:#1e40af; font-size:11px; font-weight:800; text-transform:uppercase;">Kabuuang Lote</small>
                    <div style="font-size:20px; font-weight:800; color:#1d4ed8; margin-top:2px;">${contracts.length} Unit(s)</div>
                </div>
                <div style="background:#f1f5f9; border:1px solid #cbd5e1; padding:12px; border-radius:8px;">
                    <small style="color:#475569; font-size:11px; font-weight:800; text-transform:uppercase;">Kabuuang TCP</small>
                    <div style="font-size:20px; font-weight:800; color:#0f172a; margin-top:2px;">${money(totalTcp)}</div>
                </div>
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px;">
                    <small style="color:#166534; font-size:11px; font-weight:800; text-transform:uppercase;">Kabuuang Naibayad</small>
                    <div style="font-size:20px; font-weight:800; color:#16a34a; margin-top:2px;">${money(totalPaid)}</div>
                </div>
                <div style="background:#fef2f2; border:1px solid #fecaca; padding:12px; border-radius:8px;">
                    <small style="color:#991b1b; font-size:11px; font-weight:800; text-transform:uppercase;">Natitirang Balanse</small>
                    <div style="font-size:20px; font-weight:800; color:#dc2626; margin-top:2px;">${money(totalBalance)}</div>
                </div>
            </div>

            <!-- Section 1: Contracts Table -->
            <div style="margin-bottom:18px;">
                <h4 style="font-size:12px; color:#475569; text-transform:uppercase; margin-bottom:8px;">
                    📑 Mga Pag-aaring Lote at Naka-assign na Sales Team
                </h4>
                <div class="table-wrap" style="max-height:120px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px;">
                    <table>
                        <thead>
                            <tr><th>Proyekto</th><th>Blk / Lot</th><th>TCP</th><th>Naibayad</th><th>Balanse</th><th>Assigned Agent</th></tr>
                        </thead>
                        <tbody>${contractsHtml}</tbody>
                    </table>
                </div>
            </div>

            <!-- Section 2: Amortization Schedule Table -->
            <div style="margin-bottom:16px;">
                <h4 style="font-size:12px; color:#475569; text-transform:uppercase; margin-bottom:8px;">
                    📅 Monthly Amortization Schedule (Due Dates, Status &amp; Bayad)
                </h4>
                <div class="table-wrap" style="max-height:260px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px;">
                    <table>
                        <thead style="position:sticky; top:0; background:#f8fafc; z-index:1;">
                            <tr><th>Schedule</th><th>Lote</th><th>Due Date</th><th>Buwanang Hulog</th><th>Status</th><th style="text-align:center;">Aksyon</th></tr>
                        </thead>
                        <tbody>${scheduleHtml}</tbody>
                    </table>
                </div>
            </div>

            <div style="display:flex; justify-content:flex-end;">
                <button class="btn btn-secondary" style="padding:8px 24px; font-weight:700;" onclick="closeModal()">Isara ang Folder</button>
            </div>
        </div>
    `);
}

// =========================================================
// 1-CLICK DUE PAYMENT & RECEIPT LOGIC
// =========================================================
// =========================================================
// 1-CLICK RECORD PAYMENT & AUTO SHOW RECEIPT MODAL
// =========================================================
function quickPayMonthlyAmort(buyerId, contractId, monthNumber, amount, dueStr) {
    const buyer = (db.buyers || []).find(b => b.id === buyerId);
    const contract = (db.reservations || []).find(r => r.id === contractId);
    if (!buyer || !contract) return;

    if (!confirm(`Tanggapin ang bayad para sa Buwan ${monthNumber} (${money(amount)}) ni ${buyer.name}?`)) return;

    const refNo = "AR-" + Date.now().toString().slice(-6);
    const pDate = new Date().toLocaleDateString();
    const descText = `Monthly Amortization (Buwan ${monthNumber}) - Blk ${contract.block || 1} Lot ${contract.lot || 1}`;

    const paymentRecord = {
        id: "PAY-" + Date.now(),
        refNo: refNo,
        amount: amount,
        paymentType: "Cash",
        type: `Amortization Month ${monthNumber}`,
        date: new Date().toISOString()
    };

    if (!Array.isArray(contract.payments)) contract.payments = [];
    contract.payments.push(paymentRecord);
    contract.paidMonthsCount = Math.max(Number(contract.paidMonthsCount || 0), monthNumber);

    // Bawasan ang balanse
    const currentBal = Number(contract.balance !== undefined ? contract.balance : (contract.tcp || 0));
    contract.balance = Math.max(0, currentBal - amount);

    // I-log sa global payments db
    if (!Array.isArray(db.payments)) db.payments = [];
    db.payments.push({
        ...paymentRecord,
        buyerId: buyer.id,
        buyerName: buyer.name,
        reservationId: contract.id
    });

    logAuditEvent("COLLECT_PAYMENT", `Quick paid Amortization Month ${monthNumber} (${money(amount)}) for ${buyer.name}`);
    saveDB();

    // Diretso nang bubuksan ang Acknowledgement Receipt sa mismong screen
    showReceiptModal(refNo, buyer.name, amount, descText, pDate, "Cash", buyer.id);
}

// =========================================================
// IN-APP ACKNOWLEDGEMENT RECEIPT MODAL
// =========================================================
// =========================================================
// IN-APP ACKNOWLEDGEMENT RECEIPT (FIXED HALF A4 / A5 SIZE)
// =========================================================
function showReceiptModal(refNo, buyerName, amount, desc, date, method, buyerId) {
    showModal(`
        <style>
            @media print {
                @page {
                    size: A4 portrait;
                    margin: 8mm;
                }
                body * {
                    visibility: hidden !important;
                }
                #printableReceiptArea, #printableReceiptArea * {
                    visibility: visible !important;
                }
                #printableReceiptArea {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .receipt-half-a4 {
                    width: 100% !important;
                    max-width: 190mm !important;
                    height: 135mm !important; /* Eksaktong kalahati ng A4 paper */
                    box-sizing: border-box !important;
                    border: 1.5px solid #000 !important;
                    padding: 16px 20px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    page-break-inside: avoid !important;
                }
                .no-print {
                    display: none !important;
                }
            }
        </style>

        <div id="printableReceiptArea" style="max-width:520px; margin:0 auto; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div class="receipt-half-a4" style="border: 2px dashed #94a3b8; border-radius: 10px; padding: 20px; background: #ffffff;">
                <!-- Header -->
                <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
                    <div style="font-size: 17px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">ACKNOWLEDGEMENT RECEIPT</div>
                    <div style="font-size: 11px; color: #475569; font-weight: 600;">REALTY INVENTORY &amp; COLLECTION MANAGEMENT</div>
                </div>

                <!-- Info Grid -->
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:6px 14px; font-size:12px; margin-bottom: 10px;">
                    <div><span style="color:#64748b;">AR / Ref No:</span> <strong style="color:#1d4ed8; font-family:monospace; font-size:13px;">${refNo}</strong></div>
                    <div style="text-align:right;"><span style="color:#64748b;">Petsa:</span> <strong>${date}</strong></div>
                    <div style="grid-column: 1 / -1;"><span style="color:#64748b;">Natanggap Mula Kay:</span> <strong style="font-size:13px; text-transform:uppercase;">${esc(buyerName)}</strong></div>
                    <div style="grid-column: 1 / -1;"><span style="color:#64748b;">Para Sa:</span> <strong>${esc(desc)}</strong></div>
                    <div><span style="color:#64748b;">Pamamaraan:</span> <span class="badge" style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-weight:bold; font-size:11px;">${esc(method)}</span></div>
                </div>

                <!-- Amount Box -->
                <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 10px; text-align: center; margin: 8px 0;">
                    <small style="font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase;">Kabuuang Halagang Ibinayad</small>
                    <div style="font-size: 22px; font-weight: 900; color: #15803d; margin-top:2px;">${money(amount)}</div>
                </div>

                <!-- Signatures -->
                <div style="margin-top:16px; display:flex; justify-content:space-between; font-size:11px; color:#334155;">
                    <div style="text-align:center;">
                        <br>____________________________<br>
                        <strong>Authorized Cashier / Staff</strong>
                    </div>
                    <div style="text-align:center;">
                        <br>____________________________<br>
                        <strong>Lagda ng Buyer / Client</strong>
                    </div>
                </div>

                <!-- Footer Note -->
                <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 10px; border-top: 1px dotted #cbd5e1; padding-top: 6px;">
                    Opisyal na katibayan ng pagtanggap ng bayad • Valid without dry seal
                </div>
            </div>

            <!-- On-Screen Controls -->
            <div class="no-print" style="display: flex; gap: 10px; margin-top: 14px;">
                <button class="btn btn-secondary full" onclick="openBuyerDossierModal('${buyerId}')">⬅ Bumalik sa Folder</button>
                <button class="btn btn-primary full" style="background:#2563eb;" onclick="window.print()">🖨️ I-print (Half A4)</button>
            </div>
        </div>
    `);
}

// =========================================================
// 5. MONEY MOVEMENT (INFLOW & OUTFLOW LEDGER)
// =========================================================

function renderMoney() {
    const activeRealtyId = getActiveRealtyId();
    const moneyIn = (db.moneyIn || []).filter(m => !activeRealtyId || m.realtyId === activeRealtyId);
    const moneyOut = (db.moneyOut || []).filter(m => !activeRealtyId || m.realtyId === activeRealtyId);

    const totalIn = moneyIn.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalOut = moneyOut.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const net = totalIn - totalOut;

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">💰 Money In / Money Out Ledger</h3>
                <small style="color:#64748b;">Comprehensive dual-entry cashflow tracking</small>
            </div>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-success" onclick="openReceivePaymentModal()">+ Receive Payment (In)</button>
                <button class="btn btn-danger" onclick="openDisburseMoneyModal()">- Record Payout (Out)</button>
            </div>
        </div>

        <div class="grid-4" style="margin-bottom:20px;">
            <div class="card-3d" style="border-top:3px solid #16a34a;"><small>Total Inflow</small><h4 style="color:#16a34a; font-size:20px; margin-top:4px;">${money(totalIn)}</h4></div>
            <div class="card-3d" style="border-top:3px solid #dc2626;"><small>Total Outflow</small><h4 style="color:#dc2626; font-size:20px; margin-top:4px;">${money(totalOut)}</h4></div>
            <div class="card-3d" style="border-top:3px solid #2563eb;"><small>Net Cashflow</small><h4 style="color:#2563eb; font-size:20px; margin-top:4px;">${money(net)}</h4></div>
            <div class="card-3d" style="border-top:3px solid #64748b;"><small>Transactions</small><h4 style="color:#0f172a; font-size:20px; margin-top:4px;">${moneyIn.length + moneyOut.length}</h4></div>
        </div>

        <div class="grid-2">
            <div class="card-3d">
                <div class="panel-header"><h4 style="color:#15803d; margin:0;">📥 Recent Collections (In)</h4></div>
                <div class="table-wrap" style="max-height:300px; overflow-y:auto;">
                    <table>
                        <thead><tr><th>Date</th><th>Payer / Buyer</th><th>Category</th><th>Amount</th></tr></thead>
                        <tbody>${moneyIn.slice(0, 15).map(m => `<tr><td>${m.date}</td><td><strong>${esc(m.payerName)}</strong></td><td><span class="badge badge-green">${m.category}</span></td><td style="color:#16a34a; font-weight:bold;">${money(m.amount)}</td></tr>`).join("")}</tbody>
                    </table>
                </div>
            </div>

            <div class="card-3d">
                <div class="panel-header"><h4 style="color:#b91c1c; margin:0;">📤 Recent Disbursements (Out)</h4></div>
                <div class="table-wrap" style="max-height:300px; overflow-y:auto;">
                    <table>
                        <thead><tr><th>Date</th><th>Recipient / Purpose</th><th>Category</th><th>Amount</th></tr></thead>
                        <tbody>${moneyOut.slice(0, 15).map(m => `<tr><td>${m.date}</td><td><strong>${esc(m.recipient)}</strong></td><td><span class="badge badge-red">${m.category}</span></td><td style="color:#dc2626; font-weight:bold;">${money(m.amount)}</td></tr>`).join("")}</tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openReceivePaymentModal() {
    const activeRealtyId = getActiveRealtyId();
    const reservations = (db.reservations || []).filter(r => (!activeRealtyId || r.realtyId === activeRealtyId) && r.balance > 0);

    showModal(`
        <div class="modal-header">
            <h3>💰 RECEIVE CLIENT PAYMENT</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveReceivedPayment(event)">
            <div class="form-group">
                <label>Select Reservation Contract</label>
                <select id="payResSelect" required onchange="syncPayBalance()">
                    <option value="">-- Pumili ng Reservation / Buyer --</option>
                    ${reservations.map(r => `<option value="${r.id}" data-bal="${r.balance}">${esc(r.buyerName)} — ${esc(r.projectName)} Blk${r.block} Lot ${r.lot} (Bal:${money(r.balance)})</option>`).join("")}
                </select>
            </div>
            <div class="form-group">
                <label>Current Remaining Balance</label>
                <input id="payCurrentBal" readonly style="font-weight:bold; background:#f8fafc; color:#b91c1c;">
            </div>
            <div class="form-group">
                <label>Payment Category</label>
                <select id="payCategory">
                    <option value="MONTHLY_AMORTIZATION">Monthly Amortization</option>
                    <option value="DOWNPAYMENT">Downpayment / Equity</option>
                    <option value="FULL_PAYMENT">Full Contract Settlement</option>
                    <option value="PENALTY_FEE">Penalty / Late Surcharge</option>
                </select>
            </div>
            <div class="form-group">
                <label>Payment Amount (₱)</label>
                <input type="number" id="payAmountInput" required min="1" step="50" placeholder="e.g. 5000">
            </div>
            <div class="form-group">
                <label>Payment Date</label>
                <input type="date" id="payDateInput" value="${new Date().toISOString().slice(0, 10)}" required>
            </div>
            <div class="form-group">
                <label>Acknowledgement Receipt / Remarks</label>
<input id="payRemarksInput" placeholder="e.g. AR #10492">
            </div>
            <button class="btn btn-success full" style="padding:12px; margin-top:8px;" type="submit">RECORD PAYMENT &amp; UPDATE BALANCE</button>
        </form>
    `);
}

function syncPayBalance() {
    const sel = document.getElementById("payResSelect");
    const opt = sel.options[sel.selectedIndex];
    const bal = opt ? opt.getAttribute("data-bal") : 0;
    const balField = document.getElementById("payCurrentBal");
    if (balField) balField.value = money(bal);
}

function saveReceivedPayment(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const resId = document.getElementById("payResSelect")?.value;
    const res = (db.reservations || []).find(r => r.id === resId);
    if (!res) return;

    const amount = Number(document.getElementById("payAmountInput")?.value || 0);
    const category = document.getElementById("payCategory")?.value;
    const date = document.getElementById("payDateInput")?.value;
    const remarks = document.getElementById("payRemarksInput")?.value.trim();

    if (amount <= 0) return;

    // Deduct balance
    res.balance = Math.max(0, Number(res.balance || 0) - amount);

    db.moneyIn.push({
        id: uid("MIN"),
        realtyId: activeRealtyId || res.realtyId,
        referenceId: res.id,
        payerName: res.buyerName,
        category,
        amount,
        date,
        remarks: remarks || `Payment for ${res.projectName} Blk ${res.block} Lot ${res.lot}`
    });

    logAuditEvent("PAYMENT_RECEIVED", `Received ${money(amount)} from ${res.buyerName}`);
    saveDB();
    closeModal();
    alert(`✅ Bayad na ${money(amount)} naitala!\nBagong Balanse: ${money(res.balance)}`);
    renderMoney();
}

function openDisburseMoneyModal() {
    const activeRealtyId = getActiveRealtyId();
    showModal(`
        <div class="modal-header">
            <h3>📤 RECORD DISBURSEMENT / PAYOUT</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveDisbursement(event)">
            <div class="form-group">
                <label>Disbursement Category</label>
                <select id="disburseCat">
                    <option value="EXPENSE">Office Operating Expense</option>
                    <option value="COMMISSION">Agent / Broker Commission</option>
                    <option value="DEVELOPER_REMITTANCE">Developer Remittance</option>
                    <option value="PETTY_CASH">Petty Cash Replenishment</option>
                </select>
            </div>
            <div class="form-group">
                <label>Paid To / Recipient</label>
                <input id="disburseRecipient" required placeholder="Person or Vendor Name">
            </div>
            <div class="form-group">
                <label>Amount (₱)</label>
                <input type="number" id="disburseAmount" required min="1" step="50" placeholder="e.g. 3500">
            </div>
            <div class="form-group">
                <label>Date</label>
                <input type="date" id="disburseDate" value="${new Date().toISOString().slice(0, 10)}" required>
            </div>
            <div class="form-group">
                <label>Particulars / Notes</label>
                <textarea id="disburseRemarks" rows="2" placeholder="Details of expense"></textarea>
            </div>
            <button class="btn btn-danger full" style="padding:10px; margin-top:6px;" type="submit">RECORD PAYOUT</button>
        </form>
    `);
}

function saveDisbursement(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const category = document.getElementById("disburseCat")?.value;
    const recipient = document.getElementById("disburseRecipient")?.value.trim();
    const amount = Number(document.getElementById("disburseAmount")?.value || 0);
    const date = document.getElementById("disburseDate")?.value;
    const remarks = document.getElementById("disburseRemarks")?.value.trim();

    if (!recipient || amount <= 0) return;

    db.moneyOut.push({
        id: uid("MOUT"),
        realtyId: activeRealtyId,
        category,
        recipient,
        amount,
        date,
        remarks
    });

    logAuditEvent("DISBURSEMENT", `Disbursed ${money(amount)} to ${recipient}`);
    saveDB();
    closeModal();
    alert(`✅ Outflow na ${money(amount)} naitala!`);
    renderMoney();
}

// =========================================================
// 6. COMMISSIONS LEDGER
// =========================================================

function renderCommission() {
    const activeRealtyId = getActiveRealtyId();
    const commissions = (db.commissions || []).filter(c => !activeRealtyId || c.realtyId === activeRealtyId);
    const pendingComm = commissions.filter(c => c.status === "PENDING");
    const paidComm = commissions.filter(c => c.status === "PAID");

    const totalComms = commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalPaid = paidComm.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">💼 Commissions Ledger</h3>
                <small style="color:#64748b;">Agent commissions, broker shares, and payout clearances</small>
            </div>
            <button class="btn btn-primary" onclick="openAddCommissionModal()">+ Create Commission Voucher</button>
        </div>

        <div class="grid-4" style="margin-bottom:20px;">
            <div class="card-3d" style="border-top:3px solid #2563eb;"><small>Total Committed</small><h4 style="font-size:20px; color:#2563eb; margin-top:4px;">${money(totalComms)}</h4></div>
            <div class="card-3d" style="border-top:3px solid #16a34a;"><small>Total Paid Out</small><h4 style="font-size:20px; color:#16a34a; margin-top:4px;">${money(totalPaid)}</h4></div>
            <div class="card-3d" style="border-top:3px solid #f59e0b;"><small>Pending Payouts</small><h4 style="font-size:20px; color:#f59e0b; margin-top:4px;">${money(totalComms - totalPaid)}</h4></div>
            <div class="card-3d" style="border-top:3px solid #64748b;"><small>Pending Claims</small><h4 style="font-size:20px; color:#0f172a; margin-top:4px;">${pendingComm.length}</h4></div>
        </div>

        <div class="card-3d">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Agent / Broker</th><th>Role</th><th>Property Sold</th><th>Rate / Amount</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${commissions.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:18px; color:#888;">Walang nakarehistrong commissions.</td></tr>` :
                            commissions.map(c => `
                                <tr>
                                    <td><strong>${esc(c.agentName)}</strong></td>
                                    <td><span class="badge badge-purple">${c.role}</span></td>
                                    <td>${esc(c.propertyRef || 'General')}</td>
                                    <td><strong style="color:#1e40af;">${money(c.amount)}</strong> (${c.rate || 'Fixed'}%)</td>
                                    <td><span class="badge ${c.status === 'PAID' ? 'badge-green' : 'badge-amber'}">${c.status}</span></td>
                                    <td>
                                        ${c.status === 'PENDING' ? `
                                            <button class="btn btn-success" style="padding:4px 8px; font-size:11px;" onclick="markCommissionPaid('${c.id}')">
                                                💵 Release Payout
                                            </button>
                                        ` : `<small style="color:#64748b;">Paid on ${c.paidDate || 'N/A'}</small>`}
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

function openAddCommissionModal() {
    const activeRealtyId = getActiveRealtyId();
    showModal(`
        <div class="modal-header">
            <h3>💼 NEW COMMISSION VOUCHER</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveCommission(event)">
            <div class="form-group">
                <label>Agent / Sales Representative Name</label>
                <input id="commAgentName" required placeholder="e.g. Alex Reyes">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Role</label>
                    <select id="commRole">
                        <option value="AGENT">Property Consultant / Agent</option>
                        <option value="BROKER">Licensed Real Estate Broker</option>
                        <option value="TEAM_LEAD">Sales Team Leader</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Commission Rate (%)</label>
                    <input type="number" id="commRateInput" value="5" min="0.5" step="0.5" required>
                </div>
            </div>
            <div class="form-group">
                <label>Commission Net Amount (₱)</label>
                <input type="number" id="commAmountInput" required min="100" step="50" placeholder="e.g. 25000">
            </div>
            <div class="form-group">
                <label>Property / Buyer Reference</label>
                <input id="commPropRef" placeholder="e.g. Green Valley Blk 1 Lot 5">
            </div>
            <button class="btn btn-primary full" style="padding:10px; margin-top:6px;" type="submit">SAVE COMMISSION VOUCHER</button>
        </form>
    `);
}

function saveCommission(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const agentName = document.getElementById("commAgentName")?.value.trim().toUpperCase();
    const role = document.getElementById("commRole")?.value;
    const rate = Number(document.getElementById("commRateInput")?.value || 5);
    const amount = Number(document.getElementById("commAmountInput")?.value || 0);
    const propertyRef = document.getElementById("commPropRef")?.value.trim();

    if (!agentName || amount <= 0) return;

    db.commissions.push({
        id: uid("COMM"),
        realtyId: activeRealtyId,
        agentName,
        role,
        rate,
        amount,
        propertyRef,
        status: "PENDING",
        createdAt: new Date().toISOString().slice(0, 10)
    });

    logAuditEvent("ADD_COMMISSION", `Created commission voucher of ${money(amount)} for ${agentName}`);
    saveDB();
    closeModal();
    alert("✅ Commission voucher naitala!");
    renderCommission();
}

function markCommissionPaid(commId) {
    const comm = (db.commissions || []).find(c => c.id === commId);
    if (!comm) return;

    if (!confirm(`Kumpirmahin ang pag-release ng payout na ${money(comm.amount)} para kay ${comm.agentName}?`)) return;

    comm.status = "PAID";
    comm.paidDate = new Date().toISOString().slice(0, 10);

    // Auto-record to Money Out
    db.moneyOut.push({
        id: uid("MOUT"),
        realtyId: comm.realtyId,
        category: "COMMISSION",
        recipient: comm.agentName,
        amount: Number(comm.amount || 0),
        date: comm.paidDate,
        remarks: `Commission payout for ${comm.propertyRef || 'Sale'}`
    });

    logAuditEvent("COMMISSION_PAID", `Paid commission of ${money(comm.amount)} to ${comm.agentName}`);
    saveDB();
    alert("✅ Commission payout matagumpay na nai-release at naitala sa Money Out!");
    renderCommission();
}

// =========================================================
// 7. REFUNDS & WITHDRAWALS
// =========================================================

function renderRefund() {
    const activeRealtyId = getActiveRealtyId();
    const refunds = (db.refunds || []).filter(r => !activeRealtyId || r.realtyId === activeRealtyId);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">↩️ Refunds &amp; Cancellations</h3>
                <small style="color:#64748b;">Buyer cancellations, refund filings, and executive clearance requests</small>
            </div>
            <button class="btn btn-danger" onclick="openRequestRefundModal()">+ File Refund Request</button>
        </div>

        <div class="card-3d">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Buyer Name</th><th>Reason / Details</th><th>Amount</th><th>Date Filed</th><th>Clearance Status</th></tr>
                    </thead>
                    <tbody>
                        ${refunds.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:18px; color:#888;">Walang nakatalang refund records.</td></tr>` :
                            refunds.map(r => `
                                <tr>
                                    <td><strong>${esc(r.buyerName)}</strong></td>
                                    <td>${esc(r.reason || 'Client withdrawal')}</td>
                                    <td style="color:#dc2626; font-weight:bold;">${money(r.amount)}</td>
                                    <td>${r.date || 'N/A'}</td>
                                    <td>
                                        <span class="badge ${r.status === 'APPROVED' ? 'badge-green' : (r.status === 'REJECTED' ? 'badge-red' : 'badge-amber')}">
                                            ${r.status}
                                        </span>
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

function openRequestRefundModal() {
    const activeRealtyId = getActiveRealtyId();
    showModal(`
        <div class="modal-header">
            <h3>↩️ FILE BUYER REFUND REQUEST</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveRefundRequest(event)">
            <div class="form-group">
                <label>Buyer Name</label>
                <input id="refundBuyerName" required placeholder="Name of Buyer">
            </div>
            <div class="form-group">
                <label>Refund Amount (₱)</label>
                <input type="number" id="refundAmount" required min="100" step="50" placeholder="e.g. 5000">
            </div>
            <div class="form-group">
                <label>Reason for Cancellation / Refund</label>
                <textarea id="refundReason" rows="3" required placeholder="State reason for withdrawal"></textarea>
            </div>
            <button class="btn btn-danger full" style="padding:10px; margin-top:6px;" type="submit">SUBMIT FOR BOSS APPROVAL</button>
        </form>
    `);
}

function saveRefundRequest(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const buyerName = document.getElementById("refundBuyerName")?.value.trim().toUpperCase();
    const amount = Number(document.getElementById("refundAmount")?.value || 0);
    const reason = document.getElementById("refundReason")?.value.trim();

    if (!buyerName || amount <= 0) return;

    db.refunds.push({
        id: uid("REF"),
        realtyId: activeRealtyId,
        buyerName,
        amount,
        reason,
        status: "PENDING",
        date: new Date().toISOString().slice(0, 10)
    });

    logAuditEvent("REFUND_REQUEST", `Filed refund request of ${money(amount)} for ${buyerName}`);
    saveDB();
    closeModal();
    alert("✅ Refund request naisumite para sa executive clearance ni Boss!");
    renderRefund();
}

// =========================================================
// 8. OPERATIONAL EXPENSES
// =========================================================

function renderExpenses() {
    const activeRealtyId = getActiveRealtyId();
    const expenses = (db.expenses || []).filter(e => !activeRealtyId || e.realtyId === activeRealtyId);
    const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">📉 Operational Expenses</h3>
                <small style="color:#64748b;">Office utilities, tarpaulins, marketing materials, and site maintenance</small>
            </div>
            <button class="btn btn-primary" onclick="openAddExpenseModal()">+ Add New Expense</button>
        </div>

        <div class="card-3d" style="margin-bottom:20px; border-left:4px solid #dc2626;">
            <small style="color:#64748b; font-weight:bold; text-transform:uppercase;">Total Recorded Branch Overhead</small>
            <h3 style="color:#dc2626; font-size:26px; margin-top:4px;">${money(totalExp)}</h3>
        </div>

        <div class="card-3d">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Expense Title</th><th>Category</th><th>Amount</th><th>Date</th><th>Remarks</th></tr>
                    </thead>
                    <tbody>
                        ${expenses.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:18px; color:#888;">Walang nakatalang expenses.</td></tr>` :
                            expenses.map(e => `
                                <tr>
                                    <td><strong>${esc(e.title)}</strong></td>
                                    <td><span class="badge badge-purple">${e.category}</span></td>
                                    <td style="color:#dc2626; font-weight:bold;">${money(e.amount)}</td>
                                    <td>${e.date}</td>
                                    <td>${esc(e.remarks || '-')}</td>
                                </tr>
                            `).join("")
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function openAddExpenseModal() {
    showModal(`
        <div class="modal-header">
            <h3>📉 RECORD OPERATIONAL EXPENSE</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveExpense(event)">
            <div class="form-group">
                <label>Expense Title / Payee</label>
                <input id="expTitle" required placeholder="e.g. Tarpaulin Marketing Prints">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Category</label>
                    <select id="expCategory">
                        <option value="MARKETING">Marketing &amp; Ads</option>
                        <option value="OFFICE_SUPPLIES">Office Supplies</option>
                        <option value="UTILITIES">Electricity &amp; Internet</option>
                        <option value="TRANSPORT">Fuel &amp; Site Visits</option>
                        <option value="MISC">Miscellaneous</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Amount (₱)</label>
                    <input type="number" id="expAmount" required min="1" step="50" placeholder="e.g. 1500">
                </div>
            </div>
            <div class="form-group">
                <label>Date</label>
                <input type="date" id="expDate" value="${new Date().toISOString().slice(0, 10)}" required>
            </div>
            <div class="form-group">
                <label>Notes / Receipts</label>
                <textarea id="expRemarks" rows="2" placeholder="Details of purchase"></textarea>
            </div>
            <button class="btn btn-danger full" style="padding:10px; margin-top:6px;" type="submit">SAVE EXPENSE</button>
        </form>
    `);
}

function saveExpense(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const title = document.getElementById("expTitle")?.value.trim();
    const category = document.getElementById("expCategory")?.value;
    const amount = Number(document.getElementById("expAmount")?.value || 0);
    const date = document.getElementById("expDate")?.value;
    const remarks = document.getElementById("expRemarks")?.value.trim();

    if (!title || amount <= 0) return;

    db.expenses.push({
        id: uid("EXP"),
        realtyId: activeRealtyId,
        title,
        category,
        amount,
        date,
        remarks
    });

    // Auto-record to Money Out
    db.moneyOut.push({
        id: uid("MOUT"),
        realtyId: activeRealtyId,
        category: "EXPENSE",
        recipient: title,
        amount,
        date,
        remarks
    });

    logAuditEvent("ADD_EXPENSE", `Recorded expense ${title} of ${money(amount)}`);
    saveDB();
    closeModal();
    alert("✅ Expense naitala sa ledger!");
    renderExpenses();
}

// =========================================================
// 9. STAFF ADMINISTRATION & USER ROLES
// =========================================================

function renderStaff() {
    const activeRealtyId = getActiveRealtyId();
    const staffList = (db.staff || []).filter(s => !activeRealtyId || s.realtyId === activeRealtyId);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">👷 Staff &amp; Team Directory</h3>
                <small style="color:#64748b;">Manage branch administrators, encoders, and credentials</small>
            </div>
            <button class="btn btn-primary" onclick="openAddStaffModal()">+ Add Staff Member</button>
        </div>

        <div class="card-3d">
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th>Security Actions</th></tr>
                    </thead>
                    <tbody>
                        ${staffList.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:18px; color:#888;">Walang nakarehistrong staff para sa sangay na ito.</td></tr>` :
                            staffList.map(s => `
                                <tr>
                                    <td><strong>${esc(s.name)}</strong></td>
                                    <td><code>${esc(s.username)}</code></td>
                                    <td><span class="badge badge-purple">${s.role}</span></td>
                                    <td><span class="badge ${s.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}">${s.status}</span></td>
                                    <td>
                                        <div style="display:flex; gap:4px;">
                                            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="resetStaffPassword('${s.id}')">🔑 Reset Pass</button>
                                            <button class="btn ${s.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}" style="padding:4px 8px; font-size:11px;" onclick="toggleStaffStatus('${s.id}')">
                                                ${s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

function openAddStaffModal() {
    const activeRealtyId = getActiveRealtyId();
    if (!activeRealtyId && currentUser?.role === "BOSS") {
        alert("Pumili muna ng Branch Workspace sa itaas bago magdagdag ng Staff.");
        return;
    }

    const temp = generateTempPassword();

    showModal(`
        <div class="modal-header">
            <h3>👷 ADD STAFF MEMBER</h3>
            <button class="close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="saveStaff(event)">
            <div class="form-group">
                <label>Staff Full Name</label>
                <input id="staffNameInput" required placeholder="e.g. Juan Perez">
            </div>
            <div class="form-group">
                <label>Login Username</label>
                <input id="staffUsernameInput" required placeholder="e.g. jperez">
            </div>
            <div class="form-group">
                <label>System Role</label>
                <select id="staffRoleInput">
                    <option value="ADMIN">Branch Administrator</option>
                    <option value="STAFF">Encoder / Cashier Staff</option>
                </select>
            </div>
            <div class="form-group">
                <label>Initial Temporary Password</label>
                <input id="staffTempPassInput" value="${temp}" required style="font-weight:bold; color:#b91c1c;">
                <small style="color:#64748b;">Aatasan ang staff na magpalit ng password pagka-login.</small>
            </div>
            <button class="btn btn-primary full" style="padding:10px; margin-top:6px;" type="submit">SAVE STAFF ACCOUNT</button>
        </form>
    `);
}

function saveStaff(event) {
    event.preventDefault();
    const activeRealtyId = getActiveRealtyId();
    const name = document.getElementById("staffNameInput")?.value.trim();
    const username = document.getElementById("staffUsernameInput")?.value.trim().toLowerCase();
    const role = document.getElementById("staffRoleInput")?.value;
    const pwd = document.getElementById("staffTempPassInput")?.value.trim();

    if (!name || !username || !pwd) return;

    const exists = (db.staff || []).some(s => s.username.toLowerCase() === username);
    if (exists) {
        alert("Username is already taken. Please choose another.");
        return;
    }

    db.staff.push({
        id: uid("S"),
        realtyId: activeRealtyId,
        name,
        username,
        password: pwd,
        temporaryPassword: pwd,
        role,
        status: "ACTIVE",
        mustChangePassword: true
    });

    logAuditEvent("ADD_STAFF", `Added staff account: ${username}`);
    saveDB();
    closeModal();
    alert(`✅ Staff account "${name}" created!\nUsername: ${username}\nPassword: ${pwd}`);
    renderStaff();
}

function resetStaffPassword(staffId) {
    const staff = (db.staff || []).find(s => s.id === staffId);
    if (!staff) return;

    const temp = generateTempPassword();
    staff.password = temp;
    staff.temporaryPassword = temp;
    staff.mustChangePassword = true;

    logAuditEvent("RESET_STAFF_PASS", `Reset password for staff: ${staff.username}`);
    saveDB();
    alert(`✅ Temporary Password reset para kay ${staff.name}!\n\nBagong Temp Password: ${temp}`);
}

function toggleStaffStatus(staffId) {
    const staff = (db.staff || []).find(s => s.id === staffId);
    if (!staff) return;

    staff.status = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    logAuditEvent("TOGGLE_STAFF_STATUS", `Toggled status for ${staff.username} to ${staff.status}`);
    saveDB();
    renderStaff();
}

// =========================================================
// 10. EXECUTIVE REPORTS & AUDIT TRAIL LOGS
// =========================================================

function renderReports() {
    const activeRealtyId = getActiveRealtyId();
    const moneyIn = (db.moneyIn || []).filter(m => !activeRealtyId || m.realtyId === activeRealtyId);
    const moneyOut = (db.moneyOut || []).filter(m => !activeRealtyId || m.realtyId === activeRealtyId);
    const reservations = (db.reservations || []).filter(r => !activeRealtyId || r.realtyId === activeRealtyId);

    const totalIn = moneyIn.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalOut = moneyOut.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const net = totalIn - totalOut;

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
                <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">📈 Executive Performance Reports</h3>
                <small style="color:#64748b;">Consolidated ledger statements and financial health summary</small>
            </div>
            <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Statement</button>
        </div>

        <div class="card-3d" style="margin-bottom:24px;">
            <h4 style="margin-bottom:14px; color:#1e293b;">Financial Statement Summary</h4>
            <div class="table-wrap">
                <table>
                    <tbody>
                        <tr><td><strong>Total Collections (Money In)</strong></td><td style="color:#16a34a; font-weight:bold; text-align:right;">${money(totalIn)}</td></tr>
                        <tr><td><strong>Total Disbursements (Expenses + Commissions)</strong></td><td style="color:#dc2626; font-weight:bold; text-align:right;">${money(totalOut)}</td></tr>
                        <tr style="background:#f8fafc; font-size:1.05rem;"><td><strong>Net Retained Capital</strong></td><td style="color:#2563eb; font-weight:bold; text-align:right;">${money(net)}</td></tr>
                        <tr><td><strong>Outstanding Accounts Receivable</strong></td><td style="color:#d97706; font-weight:bold; text-align:right;">${money(reservations.reduce((sum, r) => sum + Number(r.balance || 0), 0))}</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderRecords() {
    let logs = (db.auditLogs || []).filter(item => {
        // 1. Kung hindi IT ang naka-login, itago nang buo ang lahat ng galaw ni IT
        if (currentUser && currentUser.role !== "IT") {
            const logUser = String(item.user || "").trim().toUpperCase();
            const logRole = String(item.role || "").trim().toUpperCase();
            if (logUser === "IT" || logRole === "IT") {
                return false;
            }

            // 2. Kung Realty Staff/Admin ang naka-login, sariling branch logs lang ang dapat makita
            if (currentUser.role !== "BOSS") {
                const myBranchId = currentRealty ? currentRealty.id : currentUser.realtyId;
                if (item.realtyId && item.realtyId !== myBranchId) {
                    return false;
                }
            }
        }
        
        // 3. Kapag si IT ang naka-login, lulusot lahat (Boss + lahat ng Realty records)
        return true; 
    });

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="margin-bottom:16px;">
            <h3 style="font-size:1.1rem; font-weight:800; color:#1e293b; margin:0;">📜 System Audit Trail</h3>
            <small style="color:#64748b;">Chronological audit of sensitive transactions and staff activities</small>
        </div>
        <div class="panel" style="overflow-x:auto;">
            <table class="table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action Type</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.length === 0 ? `
                        <tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">No audit records found.</td></tr>
                    ` : logs.map(l => `
                        <tr>
                            <td style="font-size:12px; color:#64748b;">${new Date(l.timestamp).toLocaleString()}</td>
                            <td style="font-weight:700; color:#0f172a;">${esc(l.user)}</td>
                            <td><span class="badge badge-purple" style="font-size:11px;">${esc(l.actionType)}</span></td>
                            <td style="font-size:13px; color:#334155;">${esc(l.details)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function logAuditEvent(type, details) {
    if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
    db.auditLogs.unshift({
        id: uid("LOG"),
        type,
        details,
        username: currentUser ? currentUser.username : "ANONYMOUS",
        timestamp: new Date().toISOString()
    });
}