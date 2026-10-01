from pathlib import Path

p = Path("boss.js")
s = p.read_text(encoding="utf-8")

old = '''        <div class="form-group">
            <label>Select Renewal Scope</label>
            <select id="bossPayScope" onchange="calculateBossRenewalTotal()">
                <option value="BOSS_ONLY">1. Boss Executive Suite Only</option>
                ${dueRealties.length > 0 ? `<option value="ALL_DUE" selected>2. All Expired/Due Accounts (${isBossDue ? 'Boss + ' : ''}${dueRealties.length} Branches)</option>` : ''}
                ${dueRealties.map(r => `
                    <option value="BRANCH_${r.id}">3. Branch: ${esc(r.name)}</option>
                `).join("")}
            </select>
        </div>'''

new = '''        <div class="form-group">
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
        </div>'''

if old not in s:
    raise SystemExit("TARGET NOT FOUND - NO CHANGES MADE")

p.write_text(s.replace(old, new, 1), encoding="utf-8")
print("MULTI-SELECT UI EDIT APPLIED")
