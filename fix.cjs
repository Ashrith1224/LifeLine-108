const fs = require('fs');
const b64 = fs.readFileSync('d:/s/public/logo.png', 'base64');
fs.writeFileSync('d:/s/src/assets/logoBase64.ts', 'export const LOGO_BASE64 = `data:image/png;base64,' + b64 + '`;\n');
