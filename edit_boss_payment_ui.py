from pathlib import Path

p = Path("boss.js")
lines = p.read_text(encoding="utf-8").splitlines()

start = next(i for i, line in enumerate(lines) if "SCAN TO PAY QR DISPLAY FOR BOSS" in line) - 1
end = next(i for i, line in enumerate(lines[start:], start) if 'id="bossPayRef"' in line)

new_block = [
'        <div id="bossPaymentQR" style="display:none; background:#ffffff; border:2px solid #2563eb; border-radius:10px; padding:14px; text-align:center; margin-bottom:16px;">',
'            <span style="font-size:12px; font-weight:800; color:#0f172a; display:block; margin-bottom:6px;">',
'                💳 SCAN TO PAY',
'            </span>',
'            <img id="bossPaymentQRImage" src="" alt="Payment QR" style="max-height:180px; width:auto; max-width:100%; object-fit:contain; border-radius:6px; display:block; margin:0 auto;">',
'            <small id="bossPaymentQRNote" style="color:#64748b; font-size:11px; display:block; margin-top:6px; font-weight:600;"></small>',
'        </div>',
'',
'        <div class="form-group">',
'            <label>Payment Method</label>',
'            <select id="bossPayChannel" onchange="updateBossPaymentMethod()">',
'                <option value="">-- Select Payment Method --</option>',
'                <option value="MAYA">Maya</option>',
'                <option value="GOTYME">GoTyme</option>',
'                <option value="BANK_TRANSFER">Bank Transfer</option>',
'                <option value="CASH">Cash</option>',
'            </select>',
'        </div>',
'',
'        <div id="bossPaymentMethodNote" style="display:none; margin:-6px 0 14px; font-size:12px; color:#64748b;"></div>',
'',
'        <div class="form-group">',
'            <label>Transaction Reference Number</label>',
'            <input id="bossPayRef" placeholder="Enter Transaction Reference Number" required>',
'        </div>'
]

lines[start:end] = new_block

# Add payment-method handler before calculateBossRenewalTotal()
insert_at = next(i for i, line in enumerate(lines) if line.startswith("function calculateBossRenewalTotal()"))

handler = [
'function updateBossPaymentMethod() {',
'    const method = document.getElementById("bossPayChannel")?.value || "";',
'    const qrBox = document.getElementById("bossPaymentQR");',
'    const qrImage = document.getElementById("bossPaymentQRImage");',
'    const qrNote = document.getElementById("bossPaymentQRNote");',
'    const note = document.getElementById("bossPaymentMethodNote");',
'',
'    if (!qrBox || !qrImage || !qrNote) return;',
'',
'    qrBox.style.display = "none";',
'    qrImage.removeAttribute("src");',
'    qrNote.textContent = "";',
'    if (note) {',
'        note.style.display = "none";',
'        note.textContent = "";',
'    }',
'',
'    if (method === "MAYA") {',
'        const url = db.settings?.mayaPaymentUrl || "";',
'        if (url) {',
'            qrImage.src = url;',
'            qrNote.textContent = "Maya payment";',
'            qrBox.style.display = "block";',
'        } else if (note) {',
'            note.textContent = "Maya payment link/QR is not configured by IT.";',
'            note.style.display = "block";',
'        }',
'    } else if (method === "GOTYME") {',
'        const url = db.settings?.gotymePaymentUrl || "QRCODE.png";',
'        if (url) {',
'            qrImage.src = url;',
'            qrNote.textContent = "GoTyme payment";',
'            qrBox.style.display = "block";',
'        }',
'    } else if (method === "BANK_TRANSFER" && note) {',
'        note.textContent = "Use the bank transfer details provided by IT.";',
'        note.style.display = "block";',
'    } else if (method === "CASH" && note) {',
'        note.textContent = "Cash payment requires confirmation by IT.";',
'        note.style.display = "block";',
'    }',
'}',
'',
''
]

lines[insert_at:insert_at] = handler

p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("BOSS PAYMENT METHOD UI EDIT APPLIED")
