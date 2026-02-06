import json
import os
import re

locales_dir = 'src/locales'
en_file = os.path.join(locales_dir, 'en.json')

if not os.path.exists(en_file):
    print(f"Error: {en_file} not found")
    exit(1)

with open(en_file, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

def get_keys(data, prefix=''):
    keys = {}
    for k, v in data.items():
        new_prefix = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            keys.update(get_keys(v, new_prefix))
        else:
            keys[new_prefix] = v
    return keys

def extract_placeholders(text):
    if not isinstance(text, str):
        return set()
    return set(re.findall(r'\{[^{}]+\}', text))

en_keys_dict = get_keys(en_data)
en_keys = set(en_keys_dict.keys())

results = []

for filename in sorted(os.listdir(locales_dir)):
    if filename.endswith('.json') and filename != 'en.json':
        with open(os.path.join(locales_dir, filename), 'r', encoding='utf-8') as f:
            data = json.load(f)
            keys_dict = get_keys(data)
            keys = set(keys_dict.keys())
            
            missing = en_keys - keys
            extra = keys - en_keys
            
            same_as_en = []
            interpolation_mismatches = []
            
            for k in en_keys & keys:
                # Check for untranslated strings
                if en_keys_dict[k] == keys_dict[k] and en_keys_dict[k] != "" and not k.startswith("app.") and not k.startswith("languages."):
                    same_as_en.append(k)
                
                # Check for interpolation mismatches
                en_placeholders = extract_placeholders(en_keys_dict[k])
                loc_placeholders = extract_placeholders(keys_dict[k])
                if en_placeholders != loc_placeholders:
                    interpolation_mismatches.append((k, en_placeholders, loc_placeholders))

            res = f"--- {filename} ---\n"
            if missing:
                res += f"Missing keys ({len(missing)}): {sorted(list(missing))[:20]}\n"
            else:
                res += "No missing keys.\n"
            
            if same_as_en:
                res += f"Untranslated keys (same as EN, {len(same_as_en)}): {sorted(same_as_en)[:20]}\n"
            
            if interpolation_mismatches:
                res += f"Interpolation mismatches ({len(interpolation_mismatches)}):\n"
                for k, en_p, loc_p in interpolation_mismatches[:10]:
                    res += f"  {k}: EN {en_p} VS LOC {loc_p}\n"
            
            if extra:
                res += f"Extra keys ({len(extra)}): {sorted(list(extra))[:20]}\n"
            results.append(res)

with open('locale_audit.txt', 'w', encoding='utf-8') as f:
    f.write("\n".join(results))
