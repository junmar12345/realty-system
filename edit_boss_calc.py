from pathlib import Path

p = Path("boss.js")
lines = p.read_text(encoding="utf-8").splitlines()

# Replace the scope reader.
lines[286] = '    const scopeSelect = document.getElementById("bossPayScope");'
lines[287] = '    const scopes = scopeSelect ? Array.from(scopeSelect.selectedOptions).map(o => o.value) : [];'

# Replace calculation logic, original lines 305-328 => Python indexes 304-327.
new_block = [
'    if (scopes.includes("ALL_DUE")) {',
'        if (isBossDue) {',
'            const total = bossRate * termMonths;',
'            items.push({ id: "BOSS", name: `Executive Suite (BOSS) [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: total });',
'            grandTotal += total;',
'        }',
'        dueRealties.forEach(r => {',
'            const fee = branchRate * termMonths;',
'            items.push({ id: r.id, name: `Branch: ${r.name} [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: fee });',
'            grandTotal += fee;',
'        });',
'    } else if (scopes.includes("BOSS_ONLY") && scopes.length === 1) {',
'        const total = bossRate * termMonths;',
'        items.push({ id: "BOSS", name: `Executive Suite (BOSS) [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: total });',
'        grandTotal += total;',
'    } else {',
'        scopes.filter(v => v.startsWith("BRANCH_")).forEach(v => {',
'            const bId = v.replace("BRANCH_", "");',
'            const branch = db.realties.find(r => r.id === bId);',
'            if (branch) {',
'                const fee = branchRate * termMonths;',
'                items.push({ id: branch.id, name: `Branch: ${branch.name} [${termMonths === 12 ? "1 Year" : "1 Month"}]`, amount: fee });',
'                grandTotal += fee;',
'            }',
'        });',
'    }'
]

lines[304:328] = new_block

p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("CALCULATION MULTI-SELECT EDIT APPLIED")
