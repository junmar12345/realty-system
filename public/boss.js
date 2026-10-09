/* =
   BOSS.JS - EXECUTIVE COMMAND CENTER & BRANCH MANAGEMENT
   Checkpoint V2 Implementation: 2026-09-27
   Consolidated Parts 1 - 6 (Dashboard, Multi-Pay, Branch Provisioning, Approvals)
= */

// =
// 1. EXECUTIVE DASHBOARD & GROUP FINANCIAL OVERVIEW
// =

function applyRenewalEngineVisibility() {
    const button = document.getElementById("renewalEngineBtn");
    if (!button) return;

    let hide = false;
    try {
        const config = JSON.parse(localStorage.getItem("realty_system_config") || "{}");
        hide = !!(config && config.hideRenewalEngine);
    } catch (e) {
        hide = false;
    }

    button.style.display = hide ? "none" : "";
}

// localStorage emits this event in other tabs on the same origin, so the Boss
// button responds immediately when IT changes the checkbox without a refresh.
window.addEventListener("storage", function (event) {
    if (event.key === "realty_system_config" || event.key === null) {
        applyRenewalEngineVisibility();
    }
});
function renderBossDashboard() {
    const realties = getActiveRealties();
    const reservations = db.reservations || [];
    const moneyIn = db.moneyIn || [];
    const moneyOut = db.moneyOut || [];
    const refunds = db.refunds || [];

    const pendingRefunds = refunds.filter(r => r.status === "PENDING");
    const totalGroupCollections = moneyIn.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalGroupExpenses = moneyOut.reduce((sum, m) => sum + Number(m.amount || 0), 0);
    const totalGroupNet = totalGroupCollections - totalGroupExpenses;
    const totalGroupReceivables = reservations.reduce((sum, r) => sum + Number(r.balance || 0), 0);

    // Filter branches needing renewal (Expired or Due within 7 days)
    const dueRealties = realties.filter(r => {
        const sub = getSubscriptionState(r.id);
        return sub.state === "EXPIRED" || sub.state === "NEAR_EXPIRY";
    });

    const bossSub = getSubscriptionState("BOSS");

    const realtyStats = realties.map(r => {
        const rMoneyIn = moneyIn.filter(x => x.realtyId === r.id).reduce((sum, x) => sum + Number(x.amount || 0), 0);
        const rMoneyOut = moneyOut.filter(x => x.realtyId === r.id).reduce((sum, x) => sum + Number(x.amount || 0), 0);
        const rRes = reservations.filter(x => x.realtyId === r.id);
        const rStaff = db.staff.filter(s => s.realtyId === r.id);
        const rProj = db.projects.filter(p => p.realtyId === r.id);
        const subState = getSubscriptionState(r.id);

        return {
            ...r,
            moneyIn: rMoneyIn,
            moneyOut: rMoneyOut,
            net: rMoneyIn - rMoneyOut,
            salesCount: rRes.length,
            staffCount: rStaff.length,
            projectCount: rProj.length,
            subscriptionState: subState
        };
    }).sort((a, b) => b.moneyIn - a.moneyIn);

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:10px;">
            <div>
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0;">👑 Executive Command Center</h3>
                <small style="color:#64748b;">Consolidated group realty oversight &amp; master billing controller</small>
            </div>
            <div style="display:flex; gap:8px;">

                <button id="renewalEngineBtn" class="btn btn-success" onclick="openBossMultiPayModal()">💳 Multi-Branch Renewal Engine</button>

                

                <button class="btn btn-primary" onclick="openBossPasswordModal()">🔒 Change Personal Password</button>
            </div>
        </div>

        ${pendingRefunds.length > 0 ? `
            <div style="background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #f87171; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong style="color:#991b1b; font-size:14px;">âš ï¸ PENDING REFUND CLEARANCE REQUESTS (${pendingRefunds.length})</strong>
                    <p style="color:#7f1d1d; font-size:12px; margin-top:2px;">Branch administrators submitted refund requests awaiting executive clearance.</p>
                </div>
                <button class="btn btn-danger" onclick="showPage('approvals')">Review Clearances</button>
            </div>
        ` : ''}

        ${(bossSub.state === "EXPIRED" || bossSub.state === "NEAR_EXPIRY" || dueRealties.length > 0) ? `
            <div style="background:#fffbeb; border:1px solid #fcd34d; border-radius:12px; padding:14px 18px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>

                    <strong style="color:#b45309; font-size:14px;">⏱️️ SUBSCRIPTION ATTENTION REQUIRED</strong>

                    <strong style="color:#b45309; font-size:14px;">â° SUBSCRIPTION ATTENTION REQUIRED</strong>

                    <p style="color:#92400e; font-size:12px; margin-top:2px;">
                        ${bossSub.state !== "ACTIVE" ? `Boss Room: <strong>${bossSub.state}</strong> (${bossSub.daysRemaining} days left). ` : ''}
                        ${dueRealties.length > 0 ? `May <strong>${dueRealties.length}</strong> branch na expired o malapit nang mag-due.` : ''}
                    </p>
                </div>
                <button class="btn btn-primary" onclick="openBossMultiPayModal()">Pay Renewals Now</button>
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
                    <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">(🏢). Managed Realty Branches</h4>
                    <small style="color:#64748b;">Permanent ID tracking, subscription status, and branch operations.</small>
                </div>
                <button class="btn btn-primary" onclick="showPage('add-realty')">+ Add Realty Branch</button>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Branch / Room ID</th>
                            <th>Status &amp; Due Date</th>
                            <th>Projects &amp; Staff</th>
                            <th>Collections</th>
                            <th>Net Balance</th>
                            <th>Executive Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${realtyStats.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:15px; color:#888;">No branches registered.</td></tr>` :
                            realtyStats.map((r, i) => {
                                const sub = r.subscriptionState;
                                let badgeClass = "badge-green";
                                if (sub.state === "EXPIRED") badgeClass = "badge-red";
                                else if (sub.state === "NEAR_EXPIRY") badgeClass = "badge-purple";

                                return `
                                    <tr>
                                        <td>
                                            <div style="display:flex; align-items:center; gap:8px;">
                                                <div style="width:32px; height:32px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #cbd5e1;">
                                                    ${renderLogoHTML(r.logo || '(🏢).')}
                                                </div>
                                                <div>
                                                    <strong>${i === 0 ? '📍 ' : ''}${esc(r.name)}</strong>
                                                    <br><small style="color:#64748b;">ID: <code>${r.id}</code> \vert{} Contact:${esc(r.owner)}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span class="badge ${badgeClass}">${sub.state}</span>
                                            <br><small style="color:#64748b;">Due: ${r.dueDate || 'N/A'}</small>
                                        </td>
                                        <td>
                                            <span style="font-size:12px; font-weight:bold; color:#475569;">${r.projectCount} Projects</span> | 
                                            <span style="font-size:12px; font-weight:bold; color:#475569;">${r.staffCount} Staff</span>
                                        </td>
                                        <td style="color:#16a34a; font-weight:bold;">${money(r.moneyIn)}</td>
                                        <td style="color:#2563eb; font-weight:bold;">${money(r.net)}</td>
                                        <td>
                                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                                <button class="btn btn-secondary" style="padding:6px 10px; font-size:12px;" onclick="openIssueRealtyTempPasswordModal('${r.id}')">
                                                    🔑 Temp Pwd
                                                </button>
                                                <button class="btn btn-success" style="padding:6px 12px; font-size:12px;" onclick="universalSwitchBranch('${r.id}')">
                                                    🚪 Enter Room
                                                </button>
                                            </div>
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
    applyRenewalEngineVisibility();
}

// =
// 2. BOSS MULTI-PAY SUBSCRIPTION RENEWAL ENGINE (CHECKPOINT V2)
// =

// =
// 2. BOSS MULTI-PAY SUBSCRIPTION RENEWAL ENGINE (WITH QR)
// =

// =
// 2. BOSS MULTI-PAY SUBSCRIPTION RENEWAL ENGINE (MONTHLY / YEARLY)
// =

function openBossMultiPayModal() {
    const bossRate = Number(db.settings.bossMonthlyRate || 3500);
    const branchRate = Number(db.settings.defaultMonthlyRate || 2500);
    const bossSub = getSubscriptionState("BOSS");

    // Filter branches: ONLY due or expired branches
    const dueRealties = getActiveRealties().filter(r => {
        const sub = getSubscriptionState(r.id);
        return sub.state === "EXPIRED" || sub.state === "NEAR_EXPIRY";
    });

    const isBossDue = bossSub.state === "EXPIRED" || bossSub.state === "NEAR_EXPIRY";

    showModal(`
        <div class="modal-header">
            <h3>👑 EXECUTIVE MULTI-BRANCH RENEWAL</h3>
            <button class="close" onclick="closeModal()">Ã—</button>
        </div>
        <p style="font-size:13px; color:#64748b; margin-bottom:14px;">
            Select the accounts and billing term to renew. Active subscriptions are automatically excluded.
        </p>

        <!-- BILLING CYCLE SELECTOR (MONTHLY VS YEARLY) -->
        <div class="form-group">
            <label>Billing Cycle / Term</label>
            <select id="bossPayTerm" onchange="calculateBossRenewalTotal()">
                <option value="1" selected>Monthly Plan (1 Month Extension)</option>
                <option value="12">Annual Plan (12 Months / 1 Year Full Coverage)</option>
            </select>
        </div>

        <div class="form-group">
            <label>Select Renewal Scope</label>
            <select id="bossPayScope" multiple size="6" onchange="calculateBossRenewalTotal()" style="min-height:140px;">
                <option value="BOSS_ONLY">Boss Executive Suite Only</option>
                ${dueRealties.length > 0 ? `<option value="ALL_DUE">All Expired/Due Accounts (${isBossDue ? 'Boss + ' : ''}${dueRealties.length} Branches)</option>` : ''}
                ${dueRealties.map(r => `
                    <option value="BRANCH_${r.id}">Realty: ${esc(r.name)}</option>
                `).join("")}
            </select>
            <small style="display:block; margin-top:6px; color:#64748b;">
                Hold Ctrl and click to select multiple Realty accounts. Active accounts are excluded.
            </small>
        </div>

        <div id="bossRenewalSummary" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px; padding:12px; margin-bottom:14px; font-size:13px;">
            <!-- Dynamic calculation summary rendered here -->
        </div>
        <div id="bossPaymentQR" style="background:#ffffff; border:2px solid #2563eb; border-radius:10px; padding:14px; text-align:center; margin-bottom:16px;">
            <span style="font-size:12px; font-weight:800; color:#0f172a; display:block; margin-bottom:6px;">
                💳 SUBSCRIPTION &amp; CLOUD SERVICES PAYMENT
            </span>
            <img src="QRCODE.png" alt="Subscription Payment QR" style="max-height:180px; width:auto; max-width:100%; object-fit:contain; border-radius:6px; display:block; margin:0 auto;">
            <small style="color:#64748b; font-size:11px; display:block; margin-top:6px; font-weight:600;">
                SCAN TO PAY
            </small>
        </div>

        <div class="form-group">
            <label>Payment Method Used</label>
            <select id="bossPayChannel">
                <option value="">-- Select Payment Method --</option>
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya / PayMaya</option>
                <option value="GOTYME">GoTyme</option>
                <option value="PALAWAN">Palawan</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
            </select>
        </div>

        <div class="form-group">
            <label>Transaction Reference Number</label>
            <input id="bossPayRef" placeholder="Enter Transaction Reference Number" required>
        </div>

        <div class="form-group">
            <label>Proof of Payment Receipt (Screenshot)</label>
            <input id="bossPayProof" type="file" accept="image/*" required>
        </div>

        <button class="btn btn-success full" style="padding:12px; font-size:14px;" onclick="submitBossMultiPayment()">
            SUBMIT RENEWAL FOR IT VERIFICATION
        </button>
    `);

    calculateBossRenewalTotal();
}

function calculateBossRenewalTotal() {
    const scopeSelect = document.getElementById("bossPayScope");
    const scopes = scopeSelect ? Array.from(scopeSelect.selectedOptions).map(o => o.value) : [];
    const summaryContainer = document.getElementById("bossRenewalSummary");
    if (!summaryContainer) return;

    const bossRate = Number(db.settings.bossMonthlyRate || 3500);
    const branchRate = Number(db.settings.defaultMonthlyRate || 2500);
    const bossSub = getSubscriptionState("BOSS");
    const isBossDue = bossSub.state === "EXPIRED" || bossSub.state === "NEAR_EXPIRY";

    const dueRealties = getActiveRealties().filter(r => {
        const sub = getSubscriptionState(r.id);
        return sub.state === "EXPIRED" || sub.state === "NEAR_EXPIRY";
    });

    let items = [];
    let grandTotal = 0;

    if (scopes.includes("ALL_DUE")) {
        if (isBossDue) {
            const total = bossRate * termMonths;
            items.push({ id: "BOSS", name: `Executive Suite (BOSS) [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: total });
            grandTotal += total;
        }
        dueRealties.forEach(r => {
            const fee = branchRate * termMonths;
            items.push({ id: r.id, name: `Branch: ${r.name} [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: fee });
            grandTotal += fee;
        });
    } else if (scopes.includes("BOSS_ONLY") && scopes.length === 1) {
        const total = bossRate * termMonths;
        items.push({ id: "BOSS", name: `Executive Suite (BOSS) [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: total });
        grandTotal += total;
    } else {
        scopes.filter(v => v.startsWith("BRANCH_")).forEach(v => {
            const bId = v.replace("BRANCH_", "");
            const branch = db.realties.find(r => r.id === bId);
            if (branch) {
                const fee = branchRate * termMonths;
                items.push({ id: branch.id, name: `Branch: ${branch.name} [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: fee });
                grandTotal += fee;
            }
        });
    }

    summaryContainer.innerHTML = `
        <strong style="color:#0f172a;">Coverage Breakdown (${termMonths === 12 ? 'Annual Plan' : 'Monthly Plan'}):</strong>
        <ul style="margin:8px 0 8px 20px; color:#475569;">
            ${items.map(it => `<li>${esc(it.name)} (ID: <code>${it.id}</code>) â€” <strong>${money(it.amount)}</strong></li>`).join("")}
        </ul>
        <div style="border-top:1px solid #cbd5e1; padding-top:6px; display:flex; justify-content:space-between; align-items:center;">
            <span>Total Amount Due:</span>
            <strong style="font-size:16px; color:#16a34a;" id="bossCalculatedGrandTotal" data-total="${grandTotal}" data-term="${termMonths}">${money(grandTotal)}</strong>
        </div>
    `;
}

function submitBossMultiPayment() {
    const scopeSelect = document.getElementById("bossPayScope");
    const scopes = scopeSelect ? Array.from(scopeSelect.selectedOptions).map(o => o.value) : [];
    const amount = Number(totalElem?.getAttribute("data-total") || 0);
    const method = document.getElementById("bossPayChannel")?.value;
    const reference = document.getElementById("bossPayRef")?.value.trim();
    const proofInput = document.getElementById("bossPayProof");

    if (!reference || amount <= 0) {
        alert("Please provide the transaction reference number.");
        return;
    }

    if (!proofInput || !proofInput.files || !proofInput.files[0]) {
        alert("Please upload the payment receipt screenshot.");
        return;
    }

    const file = proofInput.files[0];
    if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
    }

    // Determine target rooms covered
    const bossSub = getSubscriptionState("BOSS");
    const isBossDue = bossSub.state === "EXPIRED" || bossSub.state === "NEAR_EXPIRY";
    const dueRealties = getActiveRealties().filter(r => {
        const sub = getSubscriptionState(r.id);
        return sub.state === "EXPIRED" || sub.state === "NEAR_EXPIRY";
    });

    let coveredRoomIds = [];
    let coverageDescription = "";

    if (scopes.includes("ALL_DUE")) {
        if (isBossDue) coveredRoomIds.push("BOSS");
        dueRealties.forEach(r => coveredRoomIds.push(r.id));
        coverageDescription = `Bulk Renewal: ${coveredRoomIds.join(", ")}`;
    } else if (scopes.includes("BOSS_ONLY") && scopes.length === 1) {
        coveredRoomIds = ["BOSS"];
        coverageDescription = "Boss Room Renewal";
    } else {
        const selectedBranchIds = scopes
            .filter(v => v.startsWith("BRANCH_"))
            .map(v => v.replace("BRANCH_", ""));
        coveredRoomIds = selectedBranchIds;
        const names = selectedBranchIds.map(id => {
            const b = db.realties.find(r => r.id === id);
            return b ? b.name : id;
        });
        coverageDescription = `Selected Realty Renewal: ${names.join(", ")}`;
    }

    const reader = new FileReader();
    reader.onload = function() {
        db.subscriptionPayments.unshift({
            id: uid("SUBPAY"),
            realtyId: coveredRoomIds[0] || "BOSS", // Primary Room ID
            coveredRooms: coveredRoomIds,          // Full bundle array
            realtyName: coverageDescription,
            submittedBy: currentUser.username,
            submittedByName: currentUser.name,
            method,
            reference,
            amount,
            paymentDate: new Date().toISOString().slice(0, 10),
            termMonths: Number(document.getElementById("bossPayTerm")?.value || 1),
            proofName: file.name,
            proofType: file.type || "application/octet-stream",
            proofData: reader.result,
            status: "PENDING",
            submittedAt: new Date().toISOString()
        });

        saveDB();
        closeModal();
        alert("Payment submitted successfully for verification! IT Platform Admin will verify.");
        renderBossDashboard();
    };

    reader.readAsDataURL(file);
}

// =
// 3. CREDENTIALS & PERSONAL SECURITY ENGINE
// =

function openBossPasswordModal() {
    showModal(`
        <div class="modal-header">
            <h3>🔒 CHANGE BOSS PERSONAL PASSWORD</h3>
            <button class="close" onclick="closeModal()">Ã—</button>
        </div>
        <div class="form-group">
            <label>Current Password:</label>
            <input id="bossOldPassword" type="password" placeholder="Enter current password">
        </div>
        <div class="form-group">
            <label>New Personal Password (min 6 characters):</label>
            <input id="bossNewPassword" type="password" minlength="6" placeholder="Enter new password">
        </div>
        <div class="form-group">
            <label>Confirm New Personal Password:</label>
            <input id="bossConfirmPassword" type="password" minlength="6" placeholder="Confirm new password">
        </div>
        <button class="btn btn-primary full" onclick="saveBossPersonalPassword()">UPDATE BOSS PASSWORD</button>
    `);
}

function saveBossPersonalPassword() {
    const current = document.getElementById("bossOldPassword")?.value;
    const newPwd = document.getElementById("bossNewPassword")?.value.trim();
    const confirm = document.getElementById("bossConfirmPassword")?.value.trim();
    const actualCurrent = db.settings.bossPassword || "boss123";

    if (current !== actualCurrent) {
        alert("Incorrect Current Password! Please try again.");
        return;
    }
    if (!newPwd || newPwd.length < 6) {
        alert("New password must be at least 6 characters long.");
        return;
    }
    if (newPwd !== confirm) {
        alert("New passwords do not match!");
        return;
    }

    db.settings.bossPassword = newPwd;
    saveDB();
    closeModal();
    alert("âœ… Boss Personal Password updated successfully!");
}

function openIssueRealtyTempPasswordModal(realtyId) {
    const branch = db.realties.find(r => r.id === realtyId);
    if (!branch) return;

    let adminStaff = db.staff.find(s => s.realtyId === branch.id && s.role === "ADMIN") 
                  || db.staff.find(s => s.realtyId === branch.id);

    if (!adminStaff) {
        const defaultUsername = branch.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || ("admin" + Math.floor(100 + Math.random() * 900));
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
            <h3>⏳‘ ISSUE TEMPORARY PASSWORD TO REALTY</h3>
            <button class="close" onclick="closeModal()">Ã—</button>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:14px; margin-bottom:16px;">
            <p style="font-size:14px; color:#1e40af; font-weight:bold; margin-bottom:4px;">(🏢). Branch: ${esc(branch.name)}</p>
            <p style="font-size:13px; color:#3b82f6;">Assigned Admin: <strong>${esc(adminStaff.name)}</strong></p>
            <p style="font-size:13px; color:#1e293b; margin-top:6px;">
                Permanent Room ID: <strong style="color:#2563eb;">${branch.id}</strong><br>
                Authorized Login Username: <code style="background:#fff; padding:2px 8px; border-radius:6px; border:1px solid #93c5fd; font-weight:bold;">${esc(adminStaff.username)}</code>
            </p>
        </div>
        <div class="form-group">
            <label>New Temporary Password para sa Realty:</label>
            <input id="realtyTempPwdInput" value="${suggestedTemp}" style="font-weight:bold; font-size:16px; color:#b91c1c;" required>
            <small style="color:#64748b;">Ibigay ito sa realty admin. Papapalitan ito ng personal password pagka-login nila.</small>
        </div>
        <button class="btn btn-primary full" style="padding:12px; font-size:14px;" onclick="saveRealtyTempPassword('${branch.id}', '${adminStaff.id}')">

           💾 SAVE &amp; ISSUE TEMPORARY PASSWORD

            ðŸ’¾ SAVE &amp; ISSUE TEMPORARY PASSWORD

        </button>
    `);
}

function saveRealtyTempPassword(realtyId, staffId) {
    const branch = db.realties.find(r => r.id === realtyId);
    let staff = db.staff.find(s => s.id === staffId);
    const newPwd = document.getElementById("realtyTempPwdInput")?.value.trim();

    if (!newPwd) {
        alert("Paki-lagay ang temporary password.");
        return;
    }

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
    alert(`âœ… Temporary Password naitala!\n\nBranch: ${branch ? branch.name : ''}\nRoom ID: ${realtyId}\nUsername: ${staff ? staff.username : ''}\nTemp Password: ${newPwd}`);

    if (currentPage === "dashboard") renderBossDashboard();
    else if (currentPage === "add-realty") renderAddRealty();
    else if (currentPage === "staff") renderStaff();
    else showPage(currentPage);
}

// =
// 4. BRANCH PROVISIONING (ADD NEW REALTY WITH PERMANENT ID)
// =

function renderAddRealty() {
    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div class="grid-2">
            <div class="panel">
                <div class="panel-header"><h3>(🏢). ADD NEW REALTY BRANCH</h3></div>
                <form onsubmit="addRealty(event)">
                    <div class="form-group"><label>Branch Name</label><input id="realtyName" required placeholder="e.g. TARLAC BRANCH"></div>
                    <div class="form-group"><label>Branch Manager / Admin Person</label><input id="realtyOwner" required placeholder="Manager Name"></div>
                    <div class="form-group"><label>Contact Number</label><input id="realtyContact" placeholder="09123456789"></div>
                    <div class="form-group"><label>Office Address</label><textarea id="realtyAddress" rows="2"></textarea></div>
                    <button class="btn btn-primary full" type="submit">+ SAVE BRANCH &amp; GENERATE ADMIN ACCOUNT</button>
                </form>
            </div>
            <div class="panel">
                <div class="panel-header"><h3>(🏢). ACTIVE BRANCHES</h3></div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr><th>Branch / Room ID</th><th>Manager</th><th>Login Username</th><th>Actions</th></tr>
                        </thead>
                        <tbody>${getActiveRealties().map(r => {
                            const admin = db.staff.find(s => s.realtyId === r.id && s.role === "ADMIN") || db.staff.find(s => s.realtyId === r.id);
                            return `
                                <tr>
                                    <td>
                                        <div style="display:flex; align-items:center; gap:8px;">
                                            <div style="width:28px; height:28px; border-radius:6px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid #cbd5e1;">
                                                ${renderLogoHTML(r.logo || '(🏢).')}
                                            </div>
                                            <div>
                                                <strong>${esc(r.name)}</strong>
                                                <br><small style="color:#64748b;">ID: <code>${r.id}</code></small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${esc(r.owner)}</td>
                                    <td><code style="background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:4px; font-weight:bold;">${esc(admin ? admin.username : 'admin')}</code></td>
                                    <td>
                                        <div style="display:flex; gap:4px;">
                                            <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openIssueRealtyTempPasswordModal('${r.id}')">🔑 Temp Pwd</button>
                                            <button class="btn btn-success" style="padding:4px 8px; font-size:11px;" onclick="universalSwitchBranch('${r.id}'); showPage('staff');">🚪ª Enter</button>
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

function addRealty(event) {
    event.preventDefault();
    const name = document.getElementById("realtyName").value.trim().toUpperCase();
    const owner = document.getElementById("realtyOwner").value.trim();
    const contact = document.getElementById("realtyContact").value.trim();
    const address = document.getElementById("realtyAddress").value.trim();

    const futureDue = new Date();
    futureDue.setDate(futureDue.getDate() + 30);

    const newRealtyId = uid("R"); // Permanent Unique Room ID (Checkpoint V2)

    const defaultUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15) || ("admin" + Math.floor(100 + Math.random() * 900));
    const initialTempPwd = generateTempPassword();
    db.realties.push({
        id: newRealtyId,
        name,
        owner,
        contact,
        address,
        status: "ACTIVE",
        dueDate: futureDue.toISOString().slice(0, 10),
        monthlyFee: db.settings.defaultMonthlyRate || 2500,
        isLocked: false,
        logo: "(🏢).",
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
    alert(`Realty Branch "${name}" successfully created!\n\nPermanent Room ID: ${newRealtyId}\nUsername: ${defaultUsername}\nTemp Password: ${initialTempPwd}`);

    universalSwitchBranch(newRealtyId);
    showPage("staff");
}


// =d

// =

// 5. APPROVALS HUB (EXECUTIVE CLEARANCE FOR REFUNDS)
// =

function renderApprovals() {
    const refunds = db.refunds || [];
    const pendingRefunds = refunds.filter(r => r.status === "PENDING");
    const resolvedRefunds = refunds.filter(r => r.status !== "PENDING");

    const content = document.getElementById("content");
    if (!content) return;

    content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
            <div>
                <h3 style="font-size:18px; font-weight:800; color:#0f172a; margin:0;">⚖️ Executive Approvals Hub</h3>
                <small style="color:#64748b;">Review and clear refund requests and financial adjustments across branches</small>
            </div>
            <span class="badge ${pendingRefunds.length > 0 ? 'badge-red' : 'badge-green'}" style="font-size:13px; padding:6px 12px;">
                ${pendingRefunds.length} Action(s) Required
            </span>
        </div>

        <div class="card-3d" style="margin-bottom:24px;">
            <div class="panel-header">
                <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">📅‹ Pending Refund Requests</h4>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Branch</th>
                            <th>Buyer Name</th>
                            <th>Reason / Category</th>
                            <th>Refund Amount</th>
                            <th>Submitted Date</th>
                            <th>Executive Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pendingRefunds.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding:18px; color:#888;">Walang nakabinbing refund request.</td></tr>` :
                            pendingRefunds.map(r => {
                                const branch = db.realties.find(b => b.id === r.realtyId);
                                return `
                                    <tr>
                                        <td><strong>(🏢). ${esc(branch ? branch.name : r.realtyId)}</strong></td>
                                        <td><strong>${esc(r.buyerName)}</strong></td>
                                        <td>${esc(r.reason || 'Client withdrawal')}</td>
                                        <td style="color:#dc2626; font-weight:bold;">${money(r.amount)}</td>
                                        <td>${r.date || 'N/A'}</td>
                                        <td>
                                            <div style="display:flex; gap:6px;">
                                                <button class="btn btn-success" style="padding:5px 10px; font-size:12px;" onclick="approveExecutiveRefund('${r.id}')">
                                                    âœ… Approve &amp; Release
                                                </button>
                                                <button class="btn btn-danger" style="padding:5px 10px; font-size:12px;" onclick="rejectExecutiveRefund('${r.id}')">
                                                    âŒ Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join("")
                        }
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card-3d">
            <div class="panel-header">
                <h4 style="margin:0; font-size:1rem; font-weight:800; color:#1e293b;">📅œ Clearance History</h4>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Branch</th>
                            <th>Buyer Name</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${resolvedRefunds.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:15px; color:#888;">Walang nakaraang clearance history.</td></tr>` :
                            resolvedRefunds.map(r => {
                                const branch = db.realties.find(b => b.id === r.realtyId);
                                return `
                                    <tr>
                                        <td>${esc(branch ? branch.name : r.realtyId)}</td>
                                        <td>${esc(r.buyerName)}</td>
                                        <td>${money(r.amount)}</td>
                                        <td>
                                            <span class="badge ${r.status === 'APPROVED' ? 'badge-green' : 'badge-red'}">
                                                ${r.status}
                                            </span>
                                        </td>
                                        <td>${r.clearedAt ? new Date(r.clearedAt).toLocaleDateString() : r.date}</td>
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

function approveExecutiveRefund(refundId) {
    const refund = (db.refunds || []).find(r => r.id === refundId);
    if (!refund) return;

    if (!confirm(`Are you sure you want to APPROVE and clear refund of ${money(refund.amount)} for ${refund.buyerName}?`)) {
        return;
    }

    refund.status = "APPROVED";
    refund.clearedAt = new Date().toISOString();
    refund.clearedBy = currentUser ? currentUser.name : "Boss Executive";

    // Auto-record to Money Out
    db.moneyOut.push({
        id: uid("MOUT"),
        realtyId: refund.realtyId,
        category: "REFUND",
        recipient: refund.buyerName,
        amount: Number(refund.amount || 0),
        date: new Date().toISOString().slice(0, 10),
        remarks: `Refund cleared by Boss: ${refund.reason || 'Client withdrawal'}`
    });

    saveDB();
    alert("âœ… Refund successfully approved and recorded in Money Out.");
    renderApprovals();
}

function rejectExecutiveRefund(refundId) {
    const refund = (db.refunds || []).find(r => r.id === refundId);
    if (!refund) return;

    const reason = prompt("Enter reason for rejection:", "Documentation incomplete");
    if (!reason) return;

    refund.status = "REJECTED";
    refund.rejectionReason = reason;
    refund.clearedAt = new Date().toISOString();
    refund.clearedBy = currentUser ? currentUser.name : "Boss Executive";

    saveDB();
    alert("âŒ Refund marked as REJECTED.");
    renderApprovals();
}



window.addEventListener('load', () => {
    const config = JSON.parse(localStorage.getItem("realty_system_config") || "{}");
    const btn = document.getElementById("renewalEngineBtn");
    if (btn) {
        if (config.hideRenewalEngine) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'inline-block';
        }
    }
});


