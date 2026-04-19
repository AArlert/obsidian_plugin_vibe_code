const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const p = path.join(repoRoot, 'mermaid-themes', 'main.js');
const bak = p + '.bak3';
try {
  fs.copyFileSync(p, bak);
} catch (e) {
  console.error('Backup failed, aborting', e);
  process.exit(1);
}
let s = fs.readFileSync(p, 'utf8');

const markerRegex = /mermaid\.initialize\(\{\s*startOnLoad:\s*true\s*\}\);/;
if (!markerRegex.test(s)) {
  console.log('marker not found');
  process.exit(0);
}

const disableCode = `\n    // Attempt to disable Obsidian internal mermaid plugin so this plugin handles 'mermaid' blocks\n    try {\n      const ip = this.app && this.app.internalPlugins;\n      if (ip) {\n        if (typeof ip.disablePlugin === 'function') {\n          ip.disablePlugin('mermaid');\n        } else if (typeof ip.getPlugin === 'function') {\n          const p = ip.getPlugin('mermaid');\n          if (p && typeof p.disable === 'function') p.disable();\n        } else if (ip.plugins && ip.plugins.mermaid && typeof ip.plugins.mermaid.disable === 'function') {\n          ip.plugins.mermaid.disable();\n        }\n      }\n    } catch (e) {\n      console.warn('mermaid-themes: could not disable internal mermaid plugin', e);\n    }\n`;

s = s.replace(markerRegex, (m) => m + disableCode);

const enableCode = `\n  onunload() {\n    try {\n      const ip = this.app && this.app.internalPlugins;\n      if (ip) {\n        if (typeof ip.enablePlugin === 'function') {\n          ip.enablePlugin('mermaid');\n        } else if (typeof ip.getPlugin === 'function') {\n          const p = ip.getPlugin('mermaid');\n          if (p && typeof p.enable === 'function') p.enable();\n        } else if (ip.plugins && ip.plugins.mermaid && typeof ip.plugins.mermaid.enable === 'function') {\n          ip.plugins.mermaid.enable();\n        }\n      }\n    } catch (e) {\n      console.warn('mermaid-themes: could not re-enable internal mermaid plugin', e);\n    }\n  }\n`;

// Replace existing empty onunload() { } or replace first occurrence of onunload block
const onunloadRegex = /\n\s*onunload\(\)\s*\{[\s\S]*?\n\s*\}\n/;
if (onunloadRegex.test(s)) {
  s = s.replace(onunloadRegex, '\n' + enableCode);
} else {
  console.log('onunload block not found; skipping onunload replacement');
}

fs.writeFileSync(p, s, 'utf8');
console.log('patched main.js (backup at ' + bak + ')');
