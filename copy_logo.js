const fs = require('fs');
const src = 'C:\\Users\\ashri\\.gemini\\antigravity\\brain\\d2786cef-6f50-4afd-b76e-b0325fbdc5bc\\blue_phoenix_logo_1772377391643.png';
const publicDest = 'd:\\s\\public\\logo.png';
const assertDest = 'd:\\s\\src\\assets\\logoBase64.ts';

const buffer = fs.readFileSync(src);
fs.writeFileSync(publicDest, buffer);

if (!fs.existsSync('d:\\s\\src\\assets')) {
    fs.mkdirSync('d:\\s\\src\\assets');
}

const base64 = buffer.toString('base64');
const tsContent = `export const LOGO_BASE64 = 'data:image/png;base64,${base64}';\n`;
fs.writeFileSync(assertDest, tsContent);
console.log("Logo copied and base64 exported!");
