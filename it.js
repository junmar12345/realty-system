/* =========================================================
   IT.JS - MASTER TECHNICAL CONTROL & PLATFORM BILLING
========================================================= */

function calculateBranchStatus(branch){
    if(branch.isLocked){
        return {
            label:"Locked Out",
            badge:"badge-red",
            code:"LOCKED"
        };
    }

    if(!branch.dueDate){
        return {
            label:"Active",
            badge:"badge-green",
            code:"ACTIVE"
        };
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const due = new Date(branch.dueDate);
    const diffDays = Math.ceil(
        (due.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if(diffDays < 0){
        return {
            label:"Expired",
            badge:"badge-red",
            code:"EXPIRED"
        };
    }

    if(diffDays <= 25){
        return {
            label:"Due Soon",
            badge:"badge-yellow",
            code:"DUE_SOON"
        };
    }

    return {
        label:"Active",
        badge:"badge-green",
        code:"ACTIVE"
    };
}

function formatDisplayDate(dateStr){
    if(!dateStr) return "N/A";

    const d = new Date(
        dateStr + (dateStr.length === 10 ? "T00:00:00" : "")
    );

    if(isNaN(d.getTime())) return dateStr;

    return d.toLocaleDateString("en-US",{
        month:"short",
        day:"numeric",
        year:"numeric"
    });
}

/* =========================================================
   GITHUB STORAGE MONITOR - IT ROOM
========================================================= */

async function checkStorageSize(){
    const storageEl = document.getElementById("git-storage");
    const batteryEl = document.getElementById("git-battery-level");
    const batteryText = document.getElementById("git-battery-text");

    if(!storageEl) return;

    try{
        const response = await fetch(
            "https://api.github.com/repos/junmar12345/realty-system"
        );

        if(!response.ok){
            throw new Error("API Limit reached or Repo is Private");
        }

        const data = await response.json();

        const sizeInKB = data.size || 0;
        const sizeInMB = (sizeInKB / 1024).toFixed(2);

        storageEl.innerText = `${sizeInMB} MB`;

        const maxLimitMB = 100;
        const percentUsed = Math.min(
            100,
            Math.round((sizeInMB / maxLimitMB) * 100)
        );

        const percentLeft = 100 - percentUsed;

        if(batteryEl && batteryText){
            batteryEl.style.width = `${percentLeft}%`;

            batteryEl.classList.remove(
                "good",
                "warning",
                "critical"
            );

            if(percentLeft > 50){
                batteryEl.classList.add("good");

                batteryText.innerText =
                    `${percentLeft}% STORAGE REMAINING`;

                batteryText.style.color = "#48bb78";
                batteryText.style.animation = "none";

            }else if(percentLeft > 10){
                batteryEl.classList.add("warning");

                batteryText.innerText =
                    `${percentLeft}% NALANG - NEED UPGRADE`;

                batteryText.style.color = "#ed8936";
                batteryText.style.animation = "blink 2s infinite";

            }else{
                batteryEl.classList.add("critical");

                batteryText.innerText =
                    `CRITICAL: ${percentLeft}% LEFT - UPGRADE NOW`;

                batteryText.style.color = "#e53e3e";
                batteryText.style.animation = "blink 1s infinite";
            }
        }

    }catch(error){
        console.log("Hindi ma-check ang storage:",error);

        storageEl.innerText = "N/A";

        if(batteryText){
            batteryText.innerText = "STORAGE CHECK OFFLINE";
        }
    }
}

/* =========================================================
   GITHUB STORAGE MONITOR - INFRASTRUCTURE PAGE
========================================================= */

async function checkInfrastructureMetrics(){
    const gitStorageEl = document.getElementById("infra-git-size");
    const gitBatteryEl = document.getElementById("git-battery-fill");
    const gitPercentEl = document.getElementById("git-percent-text");

    if(!gitStorageEl) return;

    try{
        const response = await fetch(
            "https://api.github.com/repos/junmar12345/realty-system"
        );

        if(!response.ok){
            throw new Error("API Error");
        }

        const data = await response.json();

        const sizeInKB = data.size || 0;
        const sizeInMB = (sizeInKB / 1024).toFixed(2);

        const maxLimitMB = 1024;

        const percentUsed = Math.min(
            100,
            Math.round((sizeInMB / maxLimitMB) * 100)
        );

        gitStorageEl.innerText =
            `${sizeInMB} MB / 1024 MB`;

        if(gitPercentEl){
            gitPercentEl.innerText =
                `${percentUsed}% Used`;
        }

        if(gitBatteryEl){
            gitBatteryEl.style.width =
                `${percentUsed}%`;

            gitBatteryEl.style.background =
                percentUsed > 80
                    ? "#ef4444"
                    : percentUsed > 50
                        ? "#f59e0b"
                        : "#10b981";
        }

    }catch(error){
        gitStorageEl.innerText = "N/A";

        if(gitPercentEl){
            gitPercentEl.innerText = "Offline";
        }
    }
}

/* =========================================================
   IT ROOM
========================================================= */

function renderITRoom(){
    if(!isIT()){
document.getElementById("content").innerHTML = `
    <div class="panel" style="background:#fef2f2; border:1px solid #fecaca; text-align:center; padding:35px;">
        <h3 style="color:#b91c1c;font-size:22px;margin-bottom:8px;">
            &#128680; ACCESS RESTRICTED: IT MASTER VENDOR ONLY
        </h3>
        <p style="color:#7f1d1d; font-size:14px;">
            The IT Room is strictly reserved for the Platform Technical Vendor.
        </p>
    </div>
`;
return;
    }

    const realties = db.realties || [];

    let monthlyITRev = 0;
    let activeBranches = 0;
    let expiringSoon = 0;
    let lockedOut = 0;

    realties.forEach(r => {
        const st = calculateBranchStatus(r);

        monthlyITRev += Number(
            r.monthlyFee ||
            db.settings.defaultMonthlyRate ||
            2500
        );

        if(st.code === "LOCKED"){
            lockedOut++;
        }else if(st.code === "DUE_SOON"){
            expiringSoon++;
        }else if(st.code === "ACTIVE"){
            activeBranches++;
        }
    });

    document.getElementById("content").innerHTML = `
        <div style="background:linear-gradient(135deg,#090d16 0%,#171b30 50%,#22123b 100%);color:#fff;border-radius:18px;padding:24px;margin-bottom:24px;box-shadow:0 15px 35px rgba(9,13,22,0.3);border:1px solid rgba(255,255,255,0.08);position:relative;overflow:hidden;">
            <div style="position:absolute;right:-40px;top:-40px;width:220px;height:220px;background:radial-gradient(circle,rgba(124,58,237,0.25),transparent 70%);border-radius:50%;pointer-events:none;"></div>

            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;position:relative;z-index:2;">
                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span class="pulse-dot"></span>
                        <span style="font-size:11px;font-weight:900;color:#38bdf8;letter-spacing:1.5px;text-transform:uppercase;">
                            NOC &bull; SYSTEM ENGINE ONLINE
                        </span>
                    </div>

                    <h2 style="font-size:24px;font-weight:900;color:#f8fafc;letter-spacing:0.5px;margin:0 0 4px 0;">
                        IT Room &gt; Master Technical Control &amp; Platform Billing
                    </h2>

                    <p style="color:#94a3b8;font-size:13px;margin:0;">
                        Real-time tenant licensing, automated database backup dispatch, and system health telemetry.
        </p>[]
                </div>

                <div style="display:flex;gap:10px;align-items:center;">
                    <button class="btn btn-success"
                        style="box-shadow:0 8px 20px rgba(22,163,74,0.35);font-size:13px;padding:10px 18px;display:flex;align-items:center;gap:6px;"
                        onclick="itExportDatabase()">
                     **&#128190; Backup JSON**
                    </button>

                <button class="btn btn-secondary"
    style="background:#334155;color:#fff;font-size:13px;padding:10px 18px;"
    onclick="openITConfigModal()">
    &#9881;&#65039; Config
</button>
</div>
</div>
        </div>

        <div class="grid-4" style="margin-bottom:24px;">

            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">
                        Monthly IT Rev
                    </span>
                    <span style="font-size:22px;">📆</span>
                </div>

                <h3 style="font-size:28px;font-weight:900;margin:10px 0 2px 0;">
                    ${money(monthlyITRev)}
                </h3>

                <small style="opacity:0.85;font-size:12px;">
                    Active Tenant Subscriptions
                </small>
            </div>

            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">
                        Active Realty
                    </span>
                   <span style="font-size:22px;">🏢</span>
                </div>

                <h3 style="font-size:28px;font-weight:900;margin:10px 0 2px 0;">
                    ${activeBranches}
                    <span style="font-size:14px;font-weight:normal;">Branches</span>
                </h3>

                <small style="opacity:0.85;font-size:12px;">
                    100% Operational &amp; Licensed
                </small>
            </div>

            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#d97706 0%,#f59e0b 100%);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">
                        Expiring Soon
                    </span>
                    <span style="font-size:22px;">⏳</span>
                </div>

                <h3 style="font-size:28px;font-weight:900;margin:10px 0 2px 0;">
                    ${expiringSoon}
                    <span style="font-size:14px;font-weight:normal;">Branch</span>
                </h3>

                <small style="opacity:0.85;font-size:12px;">
                    Renewals Due Within 25 Days
                </small>
            </div>

            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#b91c1c 0%,#ef4444 100%);">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">
            Locked Out
        </span>
        <span style="font-size:22px;">&#128274;</span>
    </div>

                <h3 style="font-size:28px;font-weight:900;margin:10px 0 2px 0;">
                    ${lockedOut}
                    <span style="font-size:14px;font-weight:normal;">Branches</span>
                </h3>

                <small style="opacity:0.85;font-size:12px;">
                    Login Blocked / Delinquent
                </small>
            </div>

        </div>
<!-- SYSTEM HEALTH MONITORING -->
<div class="panel"
    style="background:#0f172a;border:1px solid #1e293b;border-radius:18px;padding:22px;margin-bottom:24px;color:#f8fafc;">

    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #334155;padding-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:20px;">&#127759;</span>
            <strong style="font-size:15px;color:#f8fafc;">
                CLOUD & SERVER STATUS (LIVE MONITORING)
            </strong>
        </div>

                <span class="badge badge-green"
                    style="background:#059669;color:#fff;">
                    System Online
                </span>
            </div>

            <div class="grid-2" style="gap:20px;">

                <div style="background:#1e293b;padding:15px;border-radius:10px;border:1px solid #334155;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;align-items:center;">
                        <span style="color:#94a3b8;font-size:13px;font-weight:bold;">
                            Cloudflare Hosting:
    </span>
<span style="color:#22c55e;font-weight:bold;font-size:13px;">
    &#128994; Active &amp; Live
</span>
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="color:#94a3b8;font-size:13px;font-weight:bold;">
                            GitHub Repository:
                        </span>
                        <span style="color:#e2e8f0;font-size:13px;">
                            main branch (Up to date)
                        </span>
                    </div>
                </div>

                <div style="background:#1e293b;padding:15px;border-radius:10px;border:1px solid #334155;">

                    <div style="display:flex;justify-content:space-between;margin-bottom:12px;align-items:center;">
                        <span style="color:#94a3b8;font-size:13px;font-weight:bold;">
                            Cloudflare Build Minutes:
                        </span>
                        <span style="color:#e2e8f0;font-size:13px;">
                            0 / 500 (Free Tier)
                        </span>
                    </div>

                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <span style="color:#94a3b8;font-size:13px;font-weight:bold;">
                            Project File Size (GitHub):
                        </span>
                        <span id="git-storage"
                            style="color:#38bdf8;font-weight:bold;font-size:13px;">
                            Checking...
                        </span>
                    </div>

                    <div class="storage-battery-tracker">
                        <span class="battery-label">Storage:</span>

                        <div class="battery-body">
                            <div id="git-battery-level"
                                class="battery-level good"
                                style="width:100%;">
                            </div>
                        </div>

                        <span id="git-battery-text"
                            class="battery-status-text"
                            style="color:#48bb78;animation:none;">
                            CHECKING...
                        </span>
                    </div>

                </div>

            </div>
        </div>

        <!-- GLOBAL BRANDING -->
        <div class="panel"
            style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:22px;margin-bottom:24px;">

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid #f1f5f9;padding-bottom:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:20px;"&#127912;¨</span>
                    <strong style="font-size:15px;color:#1e293b;">
                        GLOBAL SYSTEM LOGO &amp; PLATFORM NAME CHANGER
                    </strong>
                </div>

                <span class="badge badge-purple">
                    Vendor Root Control
                </span>
            </div>

            <div class="grid-2" style="gap:20px;">

                <div>
                    <div class="form-group">
                        <label>Change System Name:</label>
                        <input id="itSystemNameInput"
                            value="${esc(db.settings.systemName || "REALTY SYSTEM")}">
                    </div>

                    <div class="form-group">
                        <label>Upload New System Logo (Image File):</label>
                        <input type="file"
                            accept="image/*"
                            onchange="processLogoUpload(this,'itSystemLogoInput','itSystemLogoPreview')">
                    </div>

                    <div class="form-group">
                        <label>Or Paste Logo Image URL / Emoji:</label>
                        <input id="itSystemLogoInput"
                            value="${esc(db.settings.systemLogo || "Ã°Å¸ÂÂ¢")}"
                            oninput="document.getElementById('itSystemLogoPreview').innerHTML = renderLogoHTML(this.value)">
                    </div>

                    <button class="btn btn-primary full"
                        onclick="saveITSystemBranding()">
                        SAVE SYSTEM LOGO &amp; NAME
                    </button>
                </div>

                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:14px;padding:20px;">

                    <span style="font-size:12px;font-weight:bold;color:#64748b;margin-bottom:10px;">
                        CURRENT SYSTEM LOGO PREVIEW
                    </span>

                    <div id="itSystemLogoPreview"
                        style="width:85px;height:85px;border-radius:18px;background:#991b1b;display:flex;align-items:center;justify-content:center;font-size:42px;overflow:hidden;border:2px solid #e2e8f0;box-shadow:0 8px 20px rgba(0,0,0,0.1);">
                        ${renderLogoHTML(db.settings.systemLogo)}
                    </div>

                    <small style="color:#94a3b8;margin-top:10px;text-align:center;">
                        Lalabas ang logo na ito sa Login Portal at Sidebar Brand.
                    </small>
                </div>

            </div>
        </div>

        <!-- BRANCH SUBSCRIPTION -->
        <div class="card-3d">

            <div class="panel-header" style="margin-bottom:14px;">
 <div>
    <h4 style="margin:0;font-size:1.1rem;font-weight:900;color:#1e293b;">
        &#127970; REALTY BRANCHES SUBSCRIPTION &amp; LOCKOUT CONTROL TABLE
    </h4>

                    <small style="color:#64748b;">
                        One-click renewal, manual date adjustment, and emergency lockouts.
                    </small>
                </div>

                <button class="btn btn-primary"
                    onclick="showPage('add-realty')">
                    + New Branch Profile
                </button>
            </div>

            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Branch Name &amp; Logo</th>
                            <th>Admin Contact</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${
                            realties.length === 0
                            ?
                            `<tr>
                                <td colspan="5"
                                    style="text-align:center;padding:18px;color:#888;">
                                    No branches configured.
                                </td>
                            </tr>`
                            :
                            realties.map(r => {
                                const st = calculateBranchStatus(r);

                                return `
                                    <tr style="${r.isLocked ? "background:#fef2f2;" : ""}">

                                        <td>
                                            <div style="display:flex;align-items:center;gap:10px;">

                                                <div style="width:38px;height:38px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:20px;border:1px solid #e2e8f0;overflow:hidden;">
                                                    ${renderLogoHTML(r.logo || "Ã°Å¸ÂÂ¢")}
                                                </div>

                                                <div>
                                                    <strong style="font-size:14px;color:#0f172a;">
                                                        ${esc(r.name)}
                                                    </strong>

                                                    <br>

                                                    <small style="color:#64748b;">
                                                        Fee: ${money(r.monthlyFee || 2500)} / mo
                                                    </small>
                                                </div>

                                            </div>
                                        </td>

                                        <td>
                                            <strong>
                                                ${esc(r.owner || "Branch Admin")}
                                            </strong>

                                            <br>

                                            <small style="color:#64748b;">
                                                ${esc(r.contact || "Ã¢â‚¬â€")}
                                            </small>
                                        </td>

                                        <td>
                                            <strong
                                                style="color:${st.code === "EXPIRED" ? "#dc2626" : "#1e293b"};font-size:14px;">
                                                ${formatDisplayDate(r.dueDate)}
                                            </strong>
                                        </td>

                                        <td>
                                            <span class="badge ${st.badge}">
                                                ${st.label}
                                            </span>
                                        </td>

                                        <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">

    <button class="btn btn-purple"
        style="padding:6px 11px;font-size:12px;"
        onclick="openEditBranchSubscriptionModal('${r.id}')">
        &#127912; Logo &amp; Name
    </button>

    <button class="btn btn-success"
        style="padding:6px 11px;font-size:12px;"
        onclick="itRenewBranch('${r.id}',30)">
        Renew +30d
    </button>

    <button class="btn ${r.isLocked ? "btn-primary" : "btn-danger"}"
        style="padding:6px 11px;font-size:12px;"
        onclick="itToggleFreezeBranch('${r.id}')">
        ${r.isLocked ? "&#128275; Unfreeze" : "Freeze/Lockout"}
    </button>
                     <button class="btn btn-warning"
                                                    style="padding:6px 11px;font-size:12px;"
                                                    onclick="itVerifyPayment('${r.id}')">
                                                    Verify Payment
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

    setTimeout(checkStorageSize,500);
}

/* =========================================================
   CLOUD SUBSCRIPTION CONTROL (EDITABLE PRICING & MASTER EXPIRATION)
========================================================= */

function renderCloudSubscription(){
    if(!isIT()){
        document.getElementById("content").innerHTML = `
            <div class="panel" style="background:#fef2f2;border:1px solid #fecaca;text-align:center;padding:35px;">
                <h3 style="color:#b91c1c;font-size:22px;margin-bottom:8px;">
                    ACCESS RESTRICTED
                </h3>
                <p style="color:#7f1d1d;font-size:14px;">
                    Cloud Subscription Control is available only to the System Administrator.
                </p>
            </div>
        `;
        return;
    }

    const realtyCount = Array.isArray(db.realties) ? db.realties.length : 0;
    
    // DYNAMIC PRICING VARIABLES (Kinukuha na sa Database)
    db.settings = db.settings || {};
    const includedRealty = db.settings.includedRealty !== undefined ? db.settings.includedRealty : 2;
    const baseHosting = db.settings.baseHosting !== undefined ? db.settings.baseHosting : 2500;
    const additionalRate = db.settings.additionalRate !== undefined ? db.settings.additionalRate : 1200;
    const annualStorage = db.settings.annualStorage !== undefined ? db.settings.annualStorage : 10000;
    const deploymentFee = db.settings.deploymentFee !== undefined ? db.settings.deploymentFee : 2500;
    
    // MASTER SYSTEM EXPIRATION (Para sa Boss Room / System Lockout)
    const systemDueDate = db.settings.systemDueDate || "";

    const additionalRealty = Math.max(0, realtyCount - includedRealty);
    const monthlyHosting = baseHosting + (additionalRealty * additionalRate);

    document.getElementById("content").innerHTML = `
        <div style="background:linear-gradient(135deg,#07111f 0%,#0f2742 50%,#172554 100%);color:#fff;border-radius:18px;padding:26px;margin-bottom:24px;box-shadow:0 15px 35px rgba(15,23,42,.28);">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
                <div>
                   <div style="font-size:11px;font-weight:900;letter-spacing:1.5px;color:#38bdf8;text-transform:uppercase;margin-bottom:6px;">
    SYSTEM CONTROL &bull; CLOUD SERVICES
</div>

                    <h2 style="font-size:26px;font-weight:900;margin:0 0 6px;">
                        Cloud Subscription
                    </h2>

                    <p style="margin:0;color:#cbd5e1;font-size:13px;">
                        Hosting, cloud storage, billing and service activation control.
                    </p>
                </div>
<div style="display:flex;gap:10px;align-items:center;">
    <!-- BAGONG BUTTON PARA MA-EDIT ANG PRESYO AT EXPIRATION -->
    <button class="btn btn-primary"
        style="background:#2563eb;color:#fff;font-size:13px;padding:10px 18px;border-radius:10px;border:none;cursor:pointer;font-weight:bold;box-shadow:0 8px 20px rgba(37,99,235,0.35);"
        onclick="openCloudSettingsModal()">
        &#9881;&#65039; Edit Pricing &amp; Expiration
    </button>

                    <div style="padding:10px 16px;border-radius:10px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.35);color:#86efac;font-size:12px;font-weight:800;">
                        SYSTEM ADMINISTRATOR ONLY
                    </div>
                </div>
            </div>
        </div>

        <div class="grid-4" style="margin-bottom:24px;">
            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);">
                <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">
                    Active Realty Accounts
                </span>
                <h3 style="font-size:30px;font-weight:900;margin:10px 0 2px;">
                    ${realtyCount}
                </h3>
                <small style="opacity:.85;">Current tenant count</small>
            </div>

            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);">
                <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">
                    Monthly Hosting
                </span>
                <h3 style="font-size:30px;font-weight:900;margin:10px 0 2px;">
                    ${money(monthlyHosting)}
                </h3>
                <small style="opacity:.85;">Up to ${includedRealty} Realty included</small>
            </div>

            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);">
                <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">
                    Cloud Storage
                </span>
                <h3 style="font-size:30px;font-weight:900;margin:10px 0 2px;">
                    ${money(annualStorage)}
                </h3>
                <small style="opacity:.85;">Annual cloud storage service</small>
            </div>

            <div class="it-vibrant-card" style="background:linear-gradient(135deg,#d97706 0%,#f59e0b 100%);">
                <span style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">
                    Deployment / Setup
                </span>
                <h3 style="font-size:30px;font-weight:900;margin:10px 0 2px;">
                    ${money(deploymentFee)}
                </h3>
                <small style="opacity:.85;">One-time initial deployment</small>
            </div>
        </div>

        <div class="panel" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:24px;margin-bottom:24px;">
            <h3 style="margin:0 0 18px;color:#0f172a;">HOSTING PRICING MODEL</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;">
                <div style="padding:18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                    <strong style="display:block;color:#0f172a;margin-bottom:7px;">First ${includedRealty} Realty Accounts</strong>
                    <span style="font-size:22px;font-weight:900;color:#2563eb;">${money(baseHosting)} / month</span>
                    <small style="display:block;color:#64748b;margin-top:6px;">Hosting platform fee</small>
                </div>
                <div style="padding:18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                    <strong style="display:block;color:#0f172a;margin-bottom:7px;">Additional Realty</strong>
                    <span style="font-size:22px;font-weight:900;color:#7c3aed;">+${money(additionalRate)} / month</span>
                    <small style="display:block;color:#64748b;margin-top:6px;">Each account beyond the first ${includedRealty}</small>
                </div>
                <div style="padding:18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                    <strong style="display:block;color:#0f172a;margin-bottom:7px;">Cloud Storage</strong>
                    <span style="font-size:22px;font-weight:900;color:#059669;">${money(annualStorage)} / year</span>
                    <small style="display:block;color:#64748b;margin-top:6px;">Cloud storage service</small>
                </div>
            </div>
        </div>

        <div class="panel" style="background:#0f172a;border:1px solid #1e293b;border-radius:18px;padding:24px;color:#f8fafc;margin-bottom:24px;">
            <h3 style="margin:0 0 18px;">CURRENT BILLING SUMMARY</h3>
            <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid #334155;padding-bottom:12px;margin-bottom:12px;">
                <span style="color:#cbd5e1;">Active Realty Accounts</span>
                <strong>${realtyCount}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid #334155;padding-bottom:12px;margin-bottom:12px;">
                <span style="color:#cbd5e1;">Monthly Hosting</span>
                <strong>${money(monthlyHosting)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;border-bottom:1px solid #334155;padding-bottom:12px;margin-bottom:12px;">
                <span style="color:#cbd5e1;">Annual Cloud Storage</span>
                <strong>${money(annualStorage)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
                <span style="color:#cbd5e1;">Initial Deployment / Setup</span>
                <strong>${money(deploymentFee)}</strong>
            </div>
        </div>

        <!-- NEW: MASTER SYSTEM EXPIRATION PANEL -->
        <div class="panel" style="background:#fffbeb;border:1px solid #fde68a;border-radius:18px;padding:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px;">
                <div>
                    <strong style="display:block;color:#92400e;margin-bottom:6px;font-size:16px;">
    &#9888; MASTER SYSTEM / BOSS EXPIRATION
</strong>
                    <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">
                        Date kung kailan mag-eexpire ang buong system o ang Boss Account. <br>
                        Current Expiration: 
                        <strong style="font-size:15px;color:#b91c1c;background:#fef3c7;padding:2px 6px;border-radius:4px;">
                            ${systemDueDate ? formatDisplayDate(systemDueDate) : 'Walang Expiration Set (Unlimited)'}
                        </strong>
                    </p>
                </div>
                <button class="btn btn-warning" style="font-weight:bold;box-shadow:0 4px 10px rgba(245,158,11,0.3);" onclick="openCloudSettingsModal()">
                    Set System Expiration
                </button>
            </div>
        </div>
    `;
}

function openCloudSettingsModal(){
    db.settings = db.settings || {};
    const includedRealty = db.settings.includedRealty !== undefined ? db.settings.includedRealty : 2;
    const baseHosting = db.settings.baseHosting !== undefined ? db.settings.baseHosting : 2500;
    const additionalRate = db.settings.additionalRate !== undefined ? db.settings.additionalRate : 1200;
    const annualStorage = db.settings.annualStorage !== undefined ? db.settings.annualStorage : 10000;
    const deploymentFee = db.settings.deploymentFee !== undefined ? db.settings.deploymentFee : 2500;
    const systemDueDate = db.settings.systemDueDate || "";

    showModal(`
        <div class="modal-header">
            <h3>&#9881;&#65039; EDIT CLOUD PRICING &amp; SYSTEM EXPIRATION</h3>
            <button class="close" onclick="closeModal()">&times;”</button>
        </div>

        <div class="grid-2" style="gap:15px;margin-bottom:15px;">
            <div class="form-group">
                <label>Base Hosting Fee (PHP):</label>
                <input type="number" id="csBaseHosting" value="${baseHosting}">
            </div>
            <div class="form-group">
                <label>Included Realty Accounts:</label>
                <input type="number" id="csIncludedRealty" value="${includedRealty}">
            </div>
        </div>

        <div class="grid-2" style="gap:15px;margin-bottom:15px;">
            <div class="form-group">
                <label>Additional Rate Per Extra Realty (PHP):</label>
                <input type="number" id="csAdditionalRate" value="${additionalRate}">
            </div>
            <div class="form-group">
                <label>Annual Cloud Storage Fee (PHP):</label>
                <input type="number" id="csAnnualStorage" value="${annualStorage}">
            </div>
        </div>

        <div class="form-group" style="margin-bottom:20px;">
            <label>Deployment / Setup Fee (PHP):</label>
            <input type="number" id="csDeploymentFee" value="${deploymentFee}">
        </div>

        <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;">

        <div class="form-group" style="background:#fef2f2;padding:15px;border-radius:8px;border:1px dashed #f87171;">
            <label style="color:#b91c1c;font-weight:bold;font-size:14px;">&#128680; Master System / Boss Room Expiration Date:</label>
            <input type="date" id="csSystemDueDate" value="${systemDueDate}" style="margin-top:8px;border:1px solid #fca5a5;">
            <small style="color:#7f1d1d;margin-top:5px;display:block;">
                Pag na-reach ang date na ito, magagamit ang "db.settings.systemDueDate" para i-block ang Boss Account. I-leave na blank kung gusto mong walang expiration.
            </small>
        </div>

        <button class="btn btn-primary full" onclick="saveCloudSettings()" style="font-size:15px;padding:12px;">
           **&#128190; SAVE CLOUD SETTINGS**
        </button>
    `);
}

function saveCloudSettings(){
    db.settings.baseHosting = Number(document.getElementById("csBaseHosting").value);
    db.settings.includedRealty = Number(document.getElementById("csIncludedRealty").value);
    db.settings.additionalRate = Number(document.getElementById("csAdditionalRate").value);
    db.settings.annualStorage = Number(document.getElementById("csAnnualStorage").value);
    db.settings.deploymentFee = Number(document.getElementById("csDeploymentFee").value);
    
    // Master Expiration Save
    db.settings.systemDueDate = document.getElementById("csSystemDueDate").value;

    saveDB();
    closeModal();
    alert("Ã¢Å“â€¦ Tagumpay! Nai-save at na-update na ang mga Pricing at System Expiration Date.");
    
    // Auto-refresh the page
    if(typeof renderCloudSubscription === "function"){
        renderCloudSubscription();
    }
}

/* =========================================================
   IT INFRASTRUCTURE
========================================================= */

function renderITInfrastructure(){
   if(!isIT()){
    document.getElementById("content").innerHTML = `
        <div class="panel"
            style="background:#fef2f2;border:1px solid #fecaca;text-align:center;padding:35px;">

            <h3 style="color:#b91c1c;font-size:22px;margin-bottom:8px;">
                &#128680; ACCESS RESTRICTED: IT MASTER VENDOR ONLY
            </h3>

            <p style="color:#7f1d1d;font-size:14px;">
                Exclusive infrastructure page for the IT Master.
            </p>
        </div>
    `;

    return;
    }

    document.getElementById("content").innerHTML = `
        <div style="background:linear-gradient(135deg,#090d16 0%,#1e1b4b 50%,#311042 100%);color:#fff;border-radius:18px;padding:24px;margin-bottom:24px;box-shadow:0 15px 35px rgba(9,13,22,0.3);border:1px solid rgba(255,255,255,0.08);">

            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">

                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                        <span class="pulse-dot"></span>

                        <span style="font-size:11px;font-weight:900;color:#38bdf8;letter-spacing:1.5px;text-transform:uppercase;">
                            EXCLUSIVE IT &bull; CLOUD &amp; HOSTING BILLING
                        </span>
                    </div>

                    <h2 style="font-size:24px;font-weight:900;color:#f8fafc;margin:0 0 4px 0;">
                        Cloud &amp; Hosting Health Monitoring
                    </h2>

                    <p style="color:#94a3b8;font-size:13px;margin:0;">
                        Subaybayan ang Cloudflare, GitHub, Vercel, Railway, at AI APIs para malaman kung kailangan na ang upgrade.
                    </p>
                </div>

              <button class="btn btn-success"
    onclick="checkInfrastructureMetrics()">
    &#128260; Refresh Telemetry
</button>

</div>
</div>

<div class="grid-2"
    style="margin-bottom:24px;gap:20px;">

    <!-- CLOUDFLARE -->
    <div class="panel"
        style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:22px;color:#fff;">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <strong style="font-size:16px;color:#f97316;">
                &#9889;&#65039; Cloudflare Pages &amp; Workers
            </strong>
                    <span class="badge badge-green"
                        style="background:#059669;color:#fff;">
                        Online / Free Tier
                    </span>
                </div>

                <p style="font-size:13px;color:#94a3b8;margin-bottom:16px;">
                    Global Static Hosting, SSL, at Edge Server Status.
                </p>

                <div style="margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                        <span>Build Minutes Usage:</span>
                        <strong style="color:#38bdf8;">
                            0 / 500 Min (0%)
                        </strong>
                    </div>

                    <div style="background:#1e293b;height:14px;border-radius:7px;overflow:hidden;border:1px solid #475569;padding:2px;">
                        <div style="background:#10b981;width:5%;height:100%;border-radius:4px;"></div>
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                        <span>Bandwidth / Requests:</span>
                        <strong style="color:#22c55e;">
                            Unlimited / Safe
                        </strong>
                    </div>

                    <div style="background:#1e293b;height:14px;border-radius:7px;overflow:hidden;border:1px solid #475569;padding:2px;">
                        <div style="background:#10b981;width:12%;height:100%;border-radius:4px;"></div>
                    </div>
                </div>
<button class="btn btn-secondary full"
    style="background:#334155;font-size:12px;"
    onclick="window.open('https://dash.cloudflare.com','_blank')">
    Open Cloudflare Dashboard &mdash;
</button>
            </div>

            <!-- GITHUB -->
            <div class="panel"
                style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:22px;color:#fff;">

                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <strong style="font-size:16px;color:#e2e8f0;">
                        Ã°Å¸Ââ„¢ GitHub Repository Storage
                    </strong>

                    <span id="git-percent-text"
                        class="badge badge-blue"
                        style="background:#2563eb;color:#fff;">
                        Calculating...
                    </span>
                </div>

                <p style="font-size:13px;color:#94a3b8;margin-bottom:16px;">
                    Source code storage (junmar12345/realty-system).
                </p>

                <div style="margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                        <span>Repository Size Limit:</span>

                        <strong id="infra-git-size"
                            style="color:#38bdf8;">
                            Checking...
                        </strong>
                    </div>

                    <div style="background:#1e293b;height:14px;border-radius:7px;overflow:hidden;border:1px solid #475569;padding:2px;">
                        <div id="git-battery-fill"
                            style="background:#10b981;width:10%;height:100%;border-radius:4px;transition:width 0.5s;">
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
                        <span>Branch Status:</span>

                        <strong style="color:#22c55e;">
                            main (Synced)
                        </strong>
                    </div>

                    <div style="background:#1e293b;height:14px;border-radius:7px;overflow:hidden;border:1px solid #475569;padding:2px;">
                        <div style="background:#3b82f6;width:100%;height:100%;border-radius:4px;"></div>
                    </div>
                </div>

                <button class="btn btn-secondary full"
                    style="background:#334155;font-size:12px;"
                    onclick="window.open('https://github.com/junmar12345/realty-system','_blank')">
                    Open GitHub Repository Ã¢â€ â€”
                </button>

            </div>
        </div>

        <!-- EXTERNAL SERVICES -->
        <div class="panel"
            style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:22px;color:#fff;margin-bottom:24px;">

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <strong style="font-size:16px;color:#a855f7;">
                    &#9889;&#65039; External Cloud, Vercel, Railway &amp; AI APIs
                </strong>

                <span class="badge badge-purple"
                    style="background:#7c3aed;color:#fff;">
                    Connected / Standby
                </span>
            </div>

            <p style="font-size:13px;color:#94a3b8;margin-bottom:16px;">
                Pamamahala sa mga backend services, ElevenLabs voice synthesis, at OpenAI integration.
            </p>

            <div class="grid-3" style="gap:15px;">

                <div style="background:#1e293b;padding:15px;border-radius:10px;border:1px solid #334155;">
                    <strong style="font-size:13px;color:#facc15;">
                        ElevenLabs AI
                    </strong>

                    <p style="font-size:12px;color:#94a3b8;margin:5px 0 10px 0;">
                        Voice Synthesis &amp; Audio Generation.
                    </p>

                    <span class="badge badge-green"
                        style="background:#059669;font-size:11px;">
                        Active Plan
                    </span>
                </div>

                <div style="background:#1e293b;padding:15px;border-radius:10px;border:1px solid #334155;">
                    <strong style="font-size:13px;color:#38bdf8;">
                        OpenAI ChatGPT API
                    </strong>

                    <p style="font-size:12px;color:#94a3b8;margin:5px 0 10px 0;">
                        Computing Tasks &amp; Intelligence.
                    </p>

                    <span class="badge badge-blue"
                        style="background:#2563eb;font-size:11px;">
                        Connected
                    </span>
                </div>

                <div style="background:#1e293b;padding:15px;border-radius:10px;border:1px solid #334155;">
                    <strong style="font-size:13px;color:#f97316;">
                        Vercel / Railway
                    </strong>

                    <p style="font-size:12px;color:#94a3b8;margin:5px 0 10px 0;">
                        Alternative Hosting &amp; Server Nodes.
                    </p>

                    <span class="badge badge-purple"
                        style="background:#7c3aed;font-size:11px;">
                        Standby
                    </span>
                </div>

            </div>
        </div>
    `;

    setTimeout(checkInfrastructureMetrics,500);
}

/* =========================================================
   SYSTEM BRANDING
========================================================= */

function saveITSystemBranding(){
    const name =
        document.getElementById("itSystemNameInput")?.value.trim();

    const logo =
        document.getElementById("itSystemLogoInput")?.value.trim();

    if(!name){
        alert("Please provide a valid system name.");
        return;
    }

    db.settings.systemName = name;
    db.systemLogo = logo || "Ã°Å¸ÂÂ¢";

    saveDB();

   alert(
    "&#9989; System Name and Logo successfully updated across the platform!"
);
    renderITRoom();
}

/* =========================================================
   DATABASE BACKUP
========================================================= */

function itExportDatabase(){
    const currentDateFormatted =
        new Date().toLocaleDateString("en-US",{
            month:"short",
            day:"numeric",
            year:"numeric"
        });

    db.settings.lastBackupDate = currentDateFormatted;
    saveDB();

    const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(db,null,2));

    const dlAnchor = document.createElement("a");

    dlAnchor.setAttribute("href",dataStr);

    dlAnchor.setAttribute(
        "download",
        "REALTY_DB_BACKUP_" +
        new Date().toISOString().slice(0,10) +
        ".json"
    );

    dlAnchor.click();
    dlAnchor.remove();

    if(currentPage === "it-room"){
        renderITRoom();
    }
}

/* =========================================================
   BRANCH RENEWAL
========================================================= */

function itRenewBranch(realtyId,days=30){
    const branch = db.realties.find(
        r => r.id === realtyId
    );

    if(!branch) return;

    let baseDate = new Date();

    if(branch.dueDate){
        const currentDue = new Date(branch.dueDate);

        if(currentDue > baseDate){
            baseDate = currentDue;
        }
    }

    baseDate.setDate(
        baseDate.getDate() + days
    );

    branch.dueDate =
        baseDate.toISOString().slice(0,10);

    branch.isLocked = false;

    saveDB();

    alert(
        `\u2705 Subscription Renewed!\n` +
        `Branch: ${branch.name}\n` +
        `New Due Date: ${formatDisplayDate(branch.dueDate)} (+${days} days)`
    );

    renderITRoom();
}

/* =========================================================
   BRANCH LOCK / UNLOCK
========================================================= */

function itToggleFreezeBranch(realtyId){
    const branch = db.realties.find(
        r => r.id === realtyId
    );

    if(!branch) return;

    branch.isLocked = !branch.isLocked;

    saveDB();

  if(branch.isLocked){
alert(
`🔒 ${branch.name} is now LOCKED OUT!\n` +
`Staff of this branch will be blocked from logging in.`
);
}else{
alert(
`🔓 ${branch.name} has been UNLOCKED.`
);
}
renderITRoom();
}


/* =========================================================
   PAYMENT VERIFICATION
========================================================= */

function itVerifyPayment(realtyId){
    const branch = db.realties.find(
        r => r.id === realtyId
    );

    if(!branch) return;

    const pendingPayment = Array.isArray(db.subscriptionPayments)
        ? db.subscriptionPayments.find(p =>
            p.realtyId === branch.id &&
            p.status === "PENDING"
        )
        : null;

    showModal(`
        <div class="modal-header">
            <h3>&#128179; &#128179; VERIFY PLATFORM SUBSCRIPTION PAYMENT
</h3>
            <button class="close" onclick="closeModal()">&times;</button>
        </div>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px;color:#166534;">
            Verifying payment for:
            <strong>${esc(branch.name)}</strong>
        </div>

        <div class="form-group">
            <label>Payment Amount Received (PHP):</label>
            <input id="verifyPaidAmount"
                type="number"
                value="${pendingPayment?.amount || branch.monthlyFee || 2500}">
        </div>

        <div class="form-group">
            <label>Days to Add upon Verification:</label>

            <select id="verifyDaysToAdd">
                <option value="30">30 Days (1 Month)</option>
                <option value="60">60 Days (2 Months)</option>
                <option value="90">90 Days (Quarterly)</option>
                <option value="365">365 Days (1 Year)</option>
            </select>
        </div>

        <button class="btn btn-success full"
            onclick="confirmVerifyPayment('${branch.id}')">
            CONFIRM &amp; EXTEND LICENSE
        </button>
    `);
}

function confirmVerifyPayment(realtyId){
    const branch = db.realties.find(
        r => r.id === realtyId
    );

    if(!branch) return;

    const pendingPayment = Array.isArray(db.subscriptionPayments)
        ? db.subscriptionPayments.find(p =>
            p.realtyId === branch.id &&
            p.status === "PENDING"
        )
        : null;

    if(!pendingPayment){
        alert("No pending subscription payment found for this branch.");
        return;
    }

    const verifiedAmount = Number(
        document.getElementById("verifyPaidAmount")?.value || pendingPayment.amount || 0
    );

    const days = Number(
        document.getElementById("verifyDaysToAdd")?.value || 30
    );

    if(!Number.isFinite(verifiedAmount) || verifiedAmount < 0){
        alert("Please enter a valid verified payment amount.");
        return;
    }

    pendingPayment.status = "VERIFIED";
    pendingPayment.verifiedAmount = verifiedAmount;
    pendingPayment.verifiedDays = days;
    pendingPayment.verifiedAt = new Date().toISOString();
    pendingPayment.verifiedBy = currentUser?.username || "IT";
    pendingPayment.verifiedByName = currentUser?.name || "IT Administrator";

    let baseDate = new Date();

    if(branch.dueDate){
        const currentDue = new Date(branch.dueDate);

        if(currentDue > baseDate){
            baseDate = currentDue;
        }
    }

    baseDate.setDate(
        baseDate.getDate() + days
    );

    branch.dueDate =
        baseDate.toISOString().slice(0,10);

    branch.isLocked = false;

    saveDB();
    closeModal();

    alert(
        "Payment verified! New Due Date: " + formatDisplayDate(branch.dueDate)
    );

    renderITRoom();
}
/* =========================================================
   EDIT BRANCH SUBSCRIPTION
========================================================= */

function openEditBranchSubscriptionModal(realtyId){
    const branch = db.realties.find(
        r => r.id === realtyId
    );

    if(!branch) return;

 showModal(`
    <div class="modal-header">
        <h3>
            &#9999;&#65039; EDIT REALTY NAME &amp; UPLOAD LOGO:
            ${esc(branch.name)}
        </h3>

        <button class="close"
            onclick="closeModal()">
            &times;
        </button>
    </div>

        <div class="form-group">
            <label>Branch Name:</label>

            <input id="editBranchName"
                value="${esc(branch.name)}">
        </div>

        <div class="form-group">
            <label>Upload Branch Logo (Image File):</label>

            <input type="file"
                accept="image/*"
                onchange="processLogoUpload(this,'editBranchLogo','modalBranchLogoPreview')">
        </div>

        <div class="form-group">
            <label>Or Paste Logo URL / Emoji:</label>

            <input id="editBranchLogo"
                value="${esc(branch.logo || "Ã°Å¸ÂÂ¢")}"
                oninput="document.getElementById('modalBranchLogoPreview').innerHTML = renderLogoHTML(this.value)">
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:15px;">

            <span style="font-size:12px;font-weight:bold;color:#64748b;">
                Logo Preview:
            </span>

            <div id="modalBranchLogoPreview"
                style="width:48px;height:48px;border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:24px;overflow:hidden;border:1px solid #cbd5e1;">
                ${renderLogoHTML(branch.logo || "Ã°Å¸ÂÂ¢")}
            </div>

        </div>

        <div class="grid-2" style="gap:10px;">

            <div class="form-group">
                <label>Due Date (YYYY-MM-DD):</label>

                <input id="editBranchDueDate"
                    type="date"
                    value="${branch.dueDate || ""}">
            </div>

            <div class="form-group">
                <label>Monthly Fee (PHP):</label>

                <input id="editBranchFee"
                    type="number"
                    value="${branch.monthlyFee || 2500}">
            </div>

        </div>

        <button class="btn btn-primary full"
            onclick="saveBranchSubscriptionEdit('${branch.id}')">
            SAVE REALTY BRANDING &amp; SETTINGS
        </button>
    `);
}

function saveBranchSubscriptionEdit(realtyId){
    const branch = db.realties.find(
        r => r.id === realtyId
    );

    if(!branch) return;

    const name =
        document.getElementById("editBranchName")?.value.trim();

    const logo =
        document.getElementById("editBranchLogo")?.value.trim();

    const dueDate =
        document.getElementById("editBranchDueDate")?.value;

    const fee =
        Number(
            document.getElementById("editBranchFee")?.value || 2500
        );

    if(!name || !dueDate){
        alert("Please complete the required fields.");
        return;
    }
branch.name = name;
branch.logo = logo || "&#127970;";
branch.dueDate = dueDate;
branch.monthlyFee = fee;

saveDB();
    closeModal();

    alert(
        `Realty "${name}" updated successfully!`
    );

    if(currentPage === "it-room"){
        renderITRoom();
    }

    if(currentPage === "control"){
        renderControl();
    }
}

/* =========================================================
   IT CONFIGURATION
========================================================= */

function openITConfigModal(){
    showModal(`
       <div class="modal-header">
    <h3>&#9881;&#65039; IT PLATFORM TECHNICAL CONFIG</h3>

    <button class="close"
        onclick="closeModal()">
        &times;
    </button>
</div>

        <div class="form-group">
            <label>New IT Root Password:</label>

            <input id="newITPassword"
                type="password"
                placeholder="Enter new password">
        </div>

        <div class="form-group">
            <label>Default Monthly Rate (PHP):</label>

            <input id="newDefaultRate"
                type="number"
                value="${db.settings.defaultMonthlyRate || 2500}">
        </div>

        <button class="btn btn-primary full"
            onclick="saveITConfig()">
            SAVE CONFIG
        </button>
    `);
}

function saveITConfig(){
    const pwd =
        document.getElementById("newITPassword")?.value.trim();

    const rate =
        Number(
            document.getElementById("newDefaultRate")?.value || 2500
        );

    if(pwd && pwd.length >= 4){
        db.settings.itPassword = pwd;
    }

    db.settings.defaultMonthlyRate = rate;

    saveDB();
    closeModal();

    alert("Configuration saved!");

    renderITRoom();
}

/* =========================================================
   ACKNOWLEDGMENT RECEIPT VAULT
========================================================= */

function renderResiboReport(){

    if(!isIT() &&
       (typeof isBoss !== "undefined" && !isBoss())){

        document.getElementById("content").innerHTML = `
            <div class="panel"
                style="background:#fef2f2;border:1px solid #fecaca;text-align:center;padding:35px;">

                <h3 style="color:#b91c1c;font-size:22px;margin-bottom:8px;">
    &#128680; ACCESS RESTRICTED
</h3>
                <p style="color:#7f1d1d;font-size:14px;">
                    Ang pahinang ito ay para lamang sa Boss at IT.
                </p>
            </div>
        `;

        return;
    }

    if(!db.receipt_logs){
        db.receipt_logs = [];
    }

    const logs = db.receipt_logs;

    let html = `
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff;border-radius:18px;padding:24px;margin-bottom:24px;box-shadow:0 15px 35px rgba(15,23,42,0.3);border:1px solid rgba(255,255,255,0.08);">

            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <span style="font-size:11px;font-weight:900;color:#f59e0b;letter-spacing:1.5px;text-transform:uppercase;">
                    SECURE VAULT
                </span>
            </div>

           <h2 style="font-size:24px;font-weight:900;color:#f8fafc;margin:0 0 4px 0;">
    &#129534; Acknowledgment Receipt Audit
</h2>

            <p style="color:#94a3b8;font-size:13px;margin:0;">
                Exclusive for BOSS & IT Root. Tingnan ang lahat ng na-print na Acknowledgment Receipt. Naka-save ito bilang PNG para iwas dayaan at hindi na mae-edit.
            </p>

        </div>

        <div class="card-3d">

            <div class="panel-header"
                style="margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;">

            <div>
    <h4 style="margin:0;font-size:1.1rem;font-weight:900;color:#1e293b;">
        &#128221; ACKNOWLEDGMENT RECEIPT SERIES
    </h4>

    <small style="color:#64748b;">
        I-click ang Series / AR No. button para makita ang uneditable image preview ng resibo.
    </small>
</div>
            </div>

            <div class="table-wrap">
                <table>

                    <thead>
                        <tr>
                            <th>Series / AR No.</th>
                            <th>Date Printed</th>
                            <th>Printed By</th>
                            <th>Amount</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
    `;

    if(logs.length === 0){

        html += `
            <tr>
                <td colspan="5"
                    style="text-align:center;padding:18px;color:#888;">
                    Walang pang na-print na Acknowledgment Receipt.
                </td>
            </tr>
        `;

    }else{

        const reversedLogs = [...logs].reverse();

        reversedLogs.forEach((log,reversedIndex) => {

            const originalIndex =
                logs.length - 1 - reversedIndex;

            let displaySeries =
                log.seriesNumber || "";

            if(
                displaySeries
                    .toString()
                    .startsWith("OR-")
            ){
                displaySeries =
                    displaySeries.replace("OR-","AR-");

            }else if(
                !displaySeries
                    .toString()
                    .startsWith("AR-") &&
                displaySeries !== ""
            ){
                displaySeries =
                    "AR-" + displaySeries;
            }

            html += `
                <tr>

                   <td>
    <button
        style="background:#e2e8f0;color:#2563eb;font-weight:bold;padding:6px 14px;border-radius:6px;border:1px solid #cbd5e1;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all 0.2s;"
        onmouseover="this.style.background='#cbd5e1'"
        onmouseout="this.style.background='#e2e8f0'"
        onclick="viewResiboPreview(${originalIndex})">

        &#128269; ${esc(displaySeries)}

    </button>
</td>

                    <td>
                        ${formatDisplayDate(log.date)}
                    </td>

                    <td>
                        <span class="badge badge-blue">
                            ${esc(log.printedBy)}
                        </span>
                    </td>

                    <td>
                        <strong style="color:#059669;">
                            ${money(log.amount)}
                        </strong>
                    </td>

                    <td>
                        <div style="display:flex;gap:6px;">

                            <button
                                class="btn btn-danger"
                                style="padding:6px 11px;font-size:12px;"
                                onclick="deleteResiboLog(${originalIndex})">

                                Ã°Å¸â€”â€˜Ã¯Â¸Â Delete

                            </button>

                        </div>
                    </td>

                </tr>
            `;
        });
    }

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById("content").innerHTML = html;
}

/* =========================================================
   RECEIPT PREVIEW
========================================================= */

function viewResiboPreview(index){
    const log = db.receipt_logs[index];

    if(!log) return;

    let displaySeries =
        log.seriesNumber || "";

    if(
        displaySeries
            .toString()
            .startsWith("OR-")
    ){
        displaySeries =
            displaySeries.replace("OR-","AR-");

    }else if(
        !displaySeries
            .toString()
            .startsWith("AR-") &&
        displaySeries !== ""
    ){
        displaySeries =
            "AR-" + displaySeries;
    }

    showModal(`
        <div class="modal-header">

            <h3>
                Ã°Å¸â€Â PREVIEW: ${esc(displaySeries)}
            </h3>

            <button class="close"
                onclick="closeModal()">
                Ãƒâ€”
            </button>

        </div>

        <div style="text-align:center;background:#f8fafc;padding:15px;border-radius:12px;border:1px dashed #cbd5e1;">

           <p style="margin-bottom:12px;color:#dc2626;font-size:12px;font-weight:bold;">
    &#128274; UNEDITABLE PNG CAPTURE (ACKNOWLEDGMENT RECEIPT)
</p>

            <div style="background:#fff;padding:10px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.05);display:inline-block;">

                <img
                    src="${log.imageData}"
                    alt="Acknowledgment Receipt Image"
                    style="max-width:100%;pointer-events:none;user-select:none;-webkit-user-drag:none;">

            </div>
        </div>
    `);
}

/* =========================================================
   DELETE RECEIPT
========================================================= */

function deleteResiboLog(index){
    const log = db.receipt_logs[index];

    if(!log) return;

    if(confirm(
        `Sigurado ka bang gusto mong permanenteng burahin ang Acknowledgment Receipt na ito?\n\n` +
        `Ang aksyong ito ay hindi na maibabalik.`
    )){
        db.receipt_logs.splice(index,1);

        saveDB();

        alert(
            "Ã¢Å“â€¦ Acknowledgment Receipt deleted successfully."
        );

        renderResiboReport();
    }
}
