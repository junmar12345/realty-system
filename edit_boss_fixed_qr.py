from pathlib import Path

p = Path("boss.js")
lines = p.read_text(encoding="utf-8").splitlines()

start = next(i for i, line in enumerate(lines) if 'id="bossPaymentQR"' in line)

# Find the end of the payment-method section before the transaction reference field.
end = next(i for i, line in enumerate(lines[start:], start) if 'id="bossPayRef"' in line)

new_block = [
'        <div id="bossPaymentQR" style="background:#ffffff; border:2px solid #2563eb; border-radius:10px; padding:14px; text-align:center; margin-bottom:16px;">',
'            <span style="font-size:12px; font-weight:800; color:#0f172a; display:block; margin-bottom:6px;">',
'                💳 SUBSCRIPTION &amp; CLOUD SERVICES PAYMENT',
'            </span>',
'            <img src="QRCODE.png" alt="Subscription Payment QR" style="max-height:180px; width:auto; max-width:100%; object-fit:contain; border-radius:6px; display:block; margin:0 auto;">',
'            <small style="color:#64748b; font-size:11px; display:block; margin-top:6px; font-weight:600;">',
'                SCAN TO PAY',
'            </small>',
'        </div>',
'',
'        <div class="form-group">',
'            <label>Payment Method Used</label>',
'            <select id="bossPayChannel">',
'                <option value="">-- Select Payment Method --</option>',
'                <option value="GCASH">GCash</option>',
'                <option value="MAYA">Maya / PayMaya</option>',
'                <option value="GOTYME">GoTyme</option>',
'                <option value="PALAWAN">Palawan</option>',
'                <option value="BANK_TRANSFER">Bank Transfer</option>',
'                <option value="OTHER">Other</option>',
'            </select>',
'        </div>',
'',
'        <div class="form-group">',
'            <label>Transaction Reference Number</label>'
]

lines[start:end] = new_block

# Remove the old dynamic payment-method handler because the QR is now fixed.
try:
    handler_start = next(i for i, line in enumerate(lines) if line.startswith("function updateBossPaymentMethod()"))
    handler_end = next(i for i in range(handler_start + 1, len(lines)) if lines[i].startswith("function calculateBossRenewalTotal()"))
    del lines[handler_start:handler_end]
except StopIteration:
    pass

p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("FIXED QR + PAYMENT SOURCE UI APPLIED")
