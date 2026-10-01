from pathlib import Path

p = Path("boss.js")
lines = p.read_text(encoding="utf-8").splitlines()

lines[344] = '    const scopeSelect = document.getElementById("bossPayScope");'
lines[345] = '    const scopes = scopeSelect ? Array.from(scopeSelect.selectedOptions).map(o => o.value) : [];'

new_block = [
'    if (scopes.includes("ALL_DUE")) {',
'        if (isBossDue) coveredRoomIds.push("BOSS");',
'        dueRealties.forEach(r => coveredRoomIds.push(r.id));',
'        coverageDescription = `Bulk Renewal: ${coveredRoomIds.join(", ")}`;',
'    } else if (scopes.includes("BOSS_ONLY") && scopes.length === 1) {',
'        coveredRoomIds = ["BOSS"];',
'        coverageDescription = "Boss Room Renewal";',
'    } else {',
'        const selectedBranchIds = scopes',
'            .filter(v => v.startsWith("BRANCH_"))',
'            .map(v => v.replace("BRANCH_", ""));',
'        coveredRoomIds = selectedBranchIds;',
'        const names = selectedBranchIds.map(id => {',
'            const b = db.realties.find(r => r.id === id);',
'            return b ? b.name : id;',
'        });',
'        coverageDescription = `Selected Realty Renewal: ${names.join(", ")}`;',
'    }'
]

lines[378:391] = new_block

p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("SUBMIT MULTI-SELECT EDIT APPLIED")
