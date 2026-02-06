import os
import re

EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build']
# Simplified patterns to find potential hardcoded strings
# 1. Text between tags: >Some Text<
JSX_TEXT_PATTERN = re.compile(r'>\s*([A-Z][^<>{}]*)\s*<')
# 2. String props: label="Some Text" or placeholder="Some Text"
JSX_PROP_PATTERN = re.compile(r'\s+(?:label|placeholder|title|description|message|alt|header)="([^"]*[A-Z][^"]*)"')

results = []

for root, dirs, files in os.walk('src'):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                matches = []
                # Find text between tags
                for match in JSX_TEXT_PATTERN.finditer(content):
                    text = match.group(1).strip()
                    if len(text) > 1 and not text.isnumeric():
                        matches.append(f"  Tag text: '{text}'")
                
                # Find string props
                for match in JSX_PROP_PATTERN.finditer(content):
                    text = match.group(1).strip()
                    if len(text) > 1 and not text.isnumeric():
                        matches.append(f"  Prop text: '{text}'")
                
                if matches:
                    results.append(f"--- {path} ---")
                    results.extend(matches)

with open('hardcoded_audit.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(results))

print(f"Audit complete. Found suspected strings in {len(results)} locations. See hardcoded_audit.txt")
