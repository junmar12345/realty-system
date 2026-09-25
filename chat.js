// REALTY PRIVATE CHAT MODULE (Hiwalay sa AI)

function renderPrivateChatUI() {
    const content = document.getElementById('content');
    document.getElementById('pageTitle').innerText = "Private Realty Chat";
    document.getElementById('pageSubtitle').innerText = "Direktang usapan sa pagitan ng Boss, IT, at mga Realty Branches";

    // Kunin ang kasalukuyang nakatingin o nakalogin na user mula sa session/core
    const currentUser = (typeof currentRole !== 'undefined' && currentRole) ? currentRole : "IT-Support";

    content.innerHTML = `
        <div style="display: flex; flex-direction: column; height: calc(100vh - 160px); background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden;">
            
            <!-- Top Bar Selection para sa Ka-chat -->
            <div style="padding: 15px; background: #f8fafc; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-weight: bold; color: #1e293b; font-size: 14px;">👤 Ikaw ay si: <span id="chatActiveUser" style="color: #2563eb;">${currentUser}</span></span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <label style="font-size: 13px; font-weight: bold; color: #475569;">Piliin ang Ka-chat:</label>
                    <select id=" realtyTargetSelect" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b; outline: none;" onchange="loadLocalPrivateMessages()">
                        <option value="Boss">Boss (Executive)</option>
                        <option value="IT-Support">IT Support</option>
                        <option value="Realty-1">Realty 1 (Main Branch)</option>
                        <option value="Realty-2">Realty 2 (Branch)</option>
                    </select>
                </div>
            </div>

            <!-- Messages Display Area -->
            <div id="localChatBox" style="flex: 1; padding: 20px; overflow-y: auto; background: #f1f5f9; display: flex; flex-direction: column; gap: 10px;">
                <!-- Dito papasok ang mga mensahe -->
            </div>

            <!-- Input Area -->
            <div style="padding: 15px; background: #ffffff; border-top: 1px solid #cbd5e1; display: flex; gap: 10px;">
                <input type="text" id="localChatInput" placeholder="Mag-type ng pribadong mensahe rito..." style="flex: 1; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; font-size: 14px;" onkeydown="if(event.key==='Enter') sendLocalPrivateMsg()">
                <button onclick="sendLocalPrivateMsg()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">Ipadala</button>
            </div>
        </div>
    `;

    loadLocalPrivateMessages();
}

function getLocalChatKey(u1, u2) {
    return 'realty_system_private_chat_' + [u1, u2].sort().join('_');
}

function loadLocalPrivateMessages() {
    const currentUser = (typeof currentRole !== 'undefined' && currentRole) ? currentRole : "IT-Support";
    const targetSelect = document.getElementById('realtyTargetSelect');
    if (!targetSelect) return;
    const targetUser = targetSelect.value;
    const chatBox = document.getElementById('localChatBox');

    if (currentUser === targetUser) {
        chatBox.innerHTML = `<div style="text-align: center; color: #64748b; margin-top: 20px; font-weight: bold;">Hindi mo pwedeng kausapin ang sarili mo.</div>`;
        return;
    }

    const key = getLocalChatKey(currentUser, targetUser);
    const messages = JSON.parse(localStorage.getItem(key) || '[]');

    chatBox.innerHTML = '';
    if (messages.length === 0) {
        chatBox.innerHTML = `<div style="text-align: center; color: #64748b; margin-top: 20px;">Wala pang usapan sa pagitan mo at ni ${targetUser}. Magsimula nang mag-chat!</div>`;
        return;
    }

    messages.forEach(m => {
        const isMe = m.sender === currentUser;
        const align = isMe ? 'align-self: flex-end; background: #2563eb; color: white;' : 'align-self: flex-start; background: #e2e8f0; color: #1e293b;';
        const senderName = isMe ? 'Ikaw' : m.sender;

        const bubble = document.createElement('div');
        bubble.style.cssText = `max-width: 60%; padding: 10px 14px; border-radius: 10px; font-size: 13px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); ${align}`;
        bubble.innerHTML = `<div style="font-size: 10px; opacity: 0.8; margin-bottom: 2px; font-weight: bold;">${senderName} • ${m.time}</div><div>${m.text}</div>`;
        chatBox.appendChild(bubble);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendLocalPrivateMsg() {
    const currentUser = (typeof currentRole !== 'undefined' && currentRole) ? currentRole : "IT-Support";
    const targetSelect = document.getElementById('realtyTargetSelect');
    const input = document.getElementById('localChatInput');
    if (!targetSelect || !input) return;

    const targetUser = targetSelect.value;
    const text = input.value.trim();
    if (!text || currentUser === targetUser) return;

    const key = getLocalChatKey(currentUser, targetUser);
    const messages = JSON.parse(localStorage.getItem(key) || '[]');

    messages.push({
        sender: currentUser,
        text: text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    localStorage.setItem(key, JSON.stringify(messages));
    input.value = '';
    loadLocalPrivateMessages();
}

// Auto-refresh ng chat bawat 2 segundo para real-time ang pasok ng mensahe
setInterval(() => {
    const chatBox = document.getElementById('localChatBox');
    if (chatBox) {
        loadLocalPrivateMessages();
    }
}, 2000);