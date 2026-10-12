import os
import re
import glob

def apply_editorial_theme(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Backgrounds
    content = re.sub(r'\bbg-slate-(?:900|950|800|700|600)(?:/\d+)?\b', 'bg-white', content)
    content = re.sub(r'\bbg-teal-(?:900|950|800|700|600)(?:/\d+)?\b', 'bg-[var(--color-paper)]', content)
    content = re.sub(r'\bbg-indigo-(?:900|950|800|700|600)(?:/\d+)?\b', 'bg-[var(--color-paper)]', content)
    
    # Text colors
    content = re.sub(r'\btext-white\b', 'text-[var(--color-ink)]', content)
    content = re.sub(r'\btext-slate-(?:100|200|300)\b', 'text-[var(--color-ink)]', content)
    content = re.sub(r'\btext-slate-(?:400|500)\b', 'text-[var(--color-industrial-grey)]', content)
    content = re.sub(r'\btext-teal-(?:200|300|400|500)\b', 'text-[var(--color-ink)]', content)
    content = re.sub(r'\btext-indigo-(?:200|300|400|500)\b', 'text-[var(--color-ink)]', content)
    
    # Borders
    content = re.sub(r'\bborder-slate-(?:700|800|600|500)(?:/\d+)?\b', 'editorial-border', content)
    content = re.sub(r'\bborder-teal-(?:700|800|600|500)(?:/\d+)?\b', 'editorial-border', content)
    content = re.sub(r'\bborder-indigo-(?:700|800|600|500)(?:/\d+)?\b', 'editorial-border', content)
    
    # Remove rounded corners
    content = re.sub(r'\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b', '', content)
    
    # Shadows
    content = re.sub(r'\bshadow-(?:sm|md|lg|xl|2xl|inner)\b', '', content)
    content = re.sub(r'shadow-\[.*?\]', '', content)
    
    # Gradients
    content = re.sub(r'\bbg-gradient-to-[a-z]+\b', '', content)
    content = re.sub(r'\bfrom-[a-z]+-\d+(?:/\d+)?\b', '', content)
    content = re.sub(r'\bvia-[a-z]+-\d+(?:/\d+)?\b', '', content)
    content = re.sub(r'\bto-[a-z]+-\d+(?:/\d+)?\b', '', content)
    
    # Replace some fonts to uppercase monospace tracking widest
    # Note: this is a heuristic to make standard small text editorial
    content = re.sub(r'\btext-xs font-medium\b', 'text-[10px] font-bold font-mono uppercase tracking-widest', content)
    content = re.sub(r'\btext-sm font-medium\b', 'text-xs font-bold font-mono uppercase tracking-widest', content)
    
    # Clean up double spaces in classNames
    content = re.sub(r' +', ' ', content)
    content = re.sub(r'className=" ', 'className="', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

directory = r"C:\Users\bhrit\.gemini\antigravity-ide\scratch\Textile_Manufacturing_System\frontend\src\components\yarniq"
for filename in os.listdir(directory):
    if filename.endswith(".tsx"):
        apply_editorial_theme(os.path.join(directory, filename))

print("Applied quick theme to yarniq components.")
