// =========================================================
// REALTY PRIVATE CHAT MODULE
// BOSS <-> REALTY ACCOUNTS ONLY
// IT IS COMPLETELY EXCLUDED
// =========================================================

function getPrivateChatIdentity() {
    if (!currentUser) return null;

    // IT has NO Private Chat access
    if (currentUser.role === "IT") {
        return null;
    }

    // BOSS identity
    if (currentUser.role === "BOSS") {
        return {
            type: "BOSS",
            id: "BOSS",
            name: "Boss Executive"
        };
    }

    // REALTY ACCOUNT identity
    if (
        currentUser.role === "ADMIN" ||
        currentUser.role === "ACCOUNTANT" ||
        currentUser.role === "STAFF"
    ) {
        const branchId = currentUser.realtyId;

        if (!branchId) return null;

        const branch = (db.realties || []).find(
            r => r.id === branchId
        );

        if (!branch) return null;

        return {
            type: "REALTY",
            id: branch.id,
            name: branch.name || "Realty Branch"
        };
    }

    return null;
}


// =========================================================
// GET CHAT RECIPIENTS
// BOSS -> ALL REALTY BRANCHES
// REALTY -> BOSS ONLY
// IT -> NONE
// =========================================================

function getPrivateChatRecipients(identity) {
    if (!identity) return [];

    // BOSS -> ALL REALTY BRANCHES
    if (identity.type === "BOSS") {
        return (db.realties || [])
            .filter(branch => branch && branch.id)
            .map(branch => ({
                type: "REALTY",
                id: branch.id,
                name: branch.name || "Realty Branch"
            }));
    }

    // REALTY -> BOSS ONLY
    if (identity.type === "REALTY") {
        return [{
            type: "BOSS",
            id: db.boss?.id || "boss",
            name: db.boss?.name || "Boss"
        }];
    }

    // IT -> NONE
    if (identity.type === "IT") {
        return [];
    }

    return [];
}


// =========================================================
// CHAT STORAGE KEY
// Stable IDs are used instead of display names.
// =========================================================

function getLocalChatKey(identityA, identityB) {
    if (!identityA || !identityB) return null;

    const ids = [
        String(identityA.id),
        String(identityB.id)
    ].sort();

    return "realty_system_private_chat_" + ids.join("_");
}


// =========================================================
// RENDER PRIVATE CHAT UI
// =========================================================

function renderPrivateChatUI() {

    // HARD SECURITY CHECK
    if (!currentUser || currentUser.role === "IT") {
        alert("Private Chat is not available for IT accounts.");
        return;
    }

    const identity = getPrivateChatIdentity();

    if (!identity) {
        alert("Private Chat identity could not be verified.");
        return;
    }

    const recipients = getPrivateChatRecipients(identity);

    if (!recipients.length) {
        alert("Walang available na authorized chat account.");
        return;
    }

    const content = document.getElementById("content");

    if (!content) return;

    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    if (pageTitle) {
        pageTitle.innerText = "Private Realty Chat";
    }

    if (pageSubtitle) {
        pageSubtitle.innerText =
            "Pribadong komunikasyon sa pagitan ng Boss at Realty Accounts";
    }

    const recipientOptions = recipients.map((recipient, index) => `
        <option value="${escapeChatAttribute(recipient.id)}" ${index === 0 ? "selected" : ""}>
            ${escapeChatHTML(recipient.name)}
        </option>
    `).join("");

    content.innerHTML = `
        <div style="
            display:flex;
            flex-direction:column;
            height:calc(100vh - 160px);
            background:#ffffff;
            border-radius:12px;
            border:1px solid #cbd5e1;
            box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);
            overflow:hidden;
        ">

            <!-- CHAT HEADER -->
            <div style="
                padding:15px;
                background:#f8fafc;
                border-bottom:1px solid #cbd5e1;
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:10px;
                flex-wrap:wrap;
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">
                    <span style="
                        font-weight:bold;
                        color:#1e293b;
                        font-size:14px;
                    ">
                        👤 Ikaw ay si:
                        <span
                            id="chatActiveUser"
                            style="color:#2563eb;"
                        >
                            ${escapeChatHTML(identity.name)}
                        </span>
                    </span>
                </div>

                <div style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                ">
                    <label style="
                        font-size:13px;
                        font-weight:bold;
                        color:#475569;
                    ">
                        Piliin ang Ka-chat:
                    </label>

                    <select
                        id="realtyTargetSelect"
                        style="
                            padding:6px 12px;
                            border-radius:6px;
                            border:1px solid #cbd5e1;
                            font-weight:bold;
                            color:#1e293b;
                            outline:none;
                        "
                        onchange="loadLocalPrivateMessages()"
                    >
                        ${recipientOptions}
                    </select>
                </div>
            </div>


            <!-- MESSAGE AREA -->
            <div
                id="localChatBox"
                style="
                    flex:1;
                    padding:20px;
                    overflow-y:auto;
                    background:#f1f5f9;
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                "
            ></div>


            <!-- INPUT -->
            <div style="
                padding:15px;
                background:#ffffff;
                border-top:1px solid #cbd5e1;
                display:flex;
                gap:10px;
            ">

                <input
                    type="text"
                    id="localChatInput"
                    placeholder="Mag-type ng pribadong mensahe rito..."
                    style="
                        flex:1;
                        padding:10px 14px;
                        border:1px solid #cbd5e1;
                        border-radius:8px;
                        outline:none;
                        font-size:14px;
                    "
                    onkeydown="
                        if(event.key==='Enter'){
                            event.preventDefault();
                            sendLocalPrivateMsg();
                        }
                    "
                >

                <button
                    onclick="sendLocalPrivateMsg()"
                    style="
                        padding:10px 20px;
                        background:#2563eb;
                        color:white;
                        border:none;
                        border-radius:8px;
                        font-weight:bold;
                        cursor:pointer;
                        font-size:14px;
                    "
                >
                    Ipadala
                </button>

            </div>
        </div>
    `;

    loadLocalPrivateMessages();
}


// =========================================================
// LOAD MESSAGES
// =========================================================

function loadLocalPrivateMessages() {

    const identity = getPrivateChatIdentity();

    // IT or invalid identity = no chat
    if (!identity) {
        const chatBox = document.getElementById("localChatBox");

        if (chatBox) {
            chatBox.innerHTML = `
                <div style="
                    text-align:center;
                    color:#dc2626;
                    margin-top:20px;
                    font-weight:bold;
                ">
                    Private Chat is not available for this account.
                </div>
            `;
        }

        return;
    }

    const targetSelect =
        document.getElementById("realtyTargetSelect");

    const chatBox =
        document.getElementById("localChatBox");

    if (!targetSelect || !chatBox) return;

    const targetId = targetSelect.value;

    const recipients =
        getPrivateChatRecipients(identity);

    const target =
        recipients.find(r => String(r.id) === String(targetId));

    // Recipient authorization check
    if (!target) {
        chatBox.innerHTML = `
            <div style="
                text-align:center;
                color:#dc2626;
                margin-top:20px;
                font-weight:bold;
            ">
                Unauthorized chat recipient.
            </div>
        `;
        return;
    }

    const targetIdentity = {
        type: target.type,
        id: target.id,
        name: target.name
    };

    const key =
        getLocalChatKey(identity, targetIdentity);

    if (!key) return;

    let messages = [];

    try {
        messages =
            JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
        messages = [];
    }

    chatBox.innerHTML = "";

    if (!messages.length) {
        const empty = document.createElement("div");

        empty.style.cssText = `
            text-align:center;
            color:#64748b;
            margin-top:20px;
        `;

        empty.textContent =
            `Wala pang usapan sa pagitan mo at ni ${target.name}. Magsimula nang mag-chat!`;

        chatBox.appendChild(empty);

        return;
    }

    messages.forEach(message => {

        const isMe =
            message.senderId === identity.id;

        const bubble =
            document.createElement("div");

        bubble.style.cssText = `
            max-width:60%;
            padding:10px 14px;
            border-radius:10px;
            font-size:13px;
            box-shadow:0 1px 2px rgba(0,0,0,0.05);
            align-self:${isMe ? "flex-end" : "flex-start"};
            background:${isMe ? "#2563eb" : "#e2e8f0"};
            color:${isMe ? "white" : "#1e293b"};
        `;

        const header =
            document.createElement("div");

        header.style.cssText = `
            font-size:10px;
            opacity:0.8;
            margin-bottom:2px;
            font-weight:bold;
        `;

        header.textContent =
            `${isMe ? "Ikaw" : (message.senderName || "User")} • ${message.time || ""}`;

        const body =
            document.createElement("div");

        body.textContent =
            String(message.text || "");

        bubble.appendChild(header);
        bubble.appendChild(body);

        chatBox.appendChild(bubble);
    });

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// =========================================================
// SEND MESSAGE
// =========================================================

function sendLocalPrivateMsg() {

    const identity =
        getPrivateChatIdentity();

    if (!identity) {
        alert("Private Chat is not available for this account.");
        return;
    }

    const targetSelect =
        document.getElementById("realtyTargetSelect");

    const input =
        document.getElementById("localChatInput");

    if (!targetSelect || !input) return;

    const targetId =
        targetSelect.value;

    const recipients =
        getPrivateChatRecipients(identity);

    const target =
        recipients.find(
            r => String(r.id) === String(targetId)
        );

    if (!target) {
        alert("Unauthorized chat recipient.");
        return;
    }

    const text =
        input.value.trim();

    if (!text) return;

    const targetIdentity = {
        type: target.type,
        id: target.id,
        name: target.name
    };

    const key =
        getLocalChatKey(identity, targetIdentity);

    if (!key) return;

    let messages = [];

    try {
        messages =
            JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
        messages = [];
    }

    messages.push({
        senderId: identity.id,
        senderType: identity.type,
        senderName: identity.name,
        receiverId: targetIdentity.id,
        receiverType: targetIdentity.type,
        receiverName: targetIdentity.name,
        text: text,
        time: new Date().toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        ),
        timestamp: Date.now()
    });

    localStorage.setItem(
        key,
        JSON.stringify(messages)
    );

    input.value = "";

    loadLocalPrivateMessages();
}


// =========================================================
// SIMPLE HTML ESCAPERS
// =========================================================

function escapeChatHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeChatAttribute(value) {
    return escapeChatHTML(value);
}


// =========================================================
// AUTO REFRESH
// =========================================================

setInterval(() => {

    const chatBox =
        document.getElementById("localChatBox");

    if (chatBox) {
        loadLocalPrivateMessages();
    }

}, 2000);