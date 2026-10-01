from pathlib import Path

p = Path("boss.js")
lines = p.read_text(encoding="utf-8").splitlines()

# Remove duplicate Transaction Reference input/closing div.
if (
    len(lines) > 273
    and 'input id="bossPayRef"' in lines[272]
    and lines[273].strip() == '</div>'
):
    del lines[272:274]
else:
    raise SystemExit("DUPLICATE BLOCK NOT FOUND — NO CHANGES MADE")

p.write_text("\n".join(lines) + "\n", encoding="utf-8")
print("PAYMENT DUPLICATE REMOVED")
