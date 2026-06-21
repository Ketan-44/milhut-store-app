const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(dir, { recursive: true });

// Minimal valid PNG placeholder — replace with newlogo from milhut-store-admin.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAAAAAEtNmblAAAAVElEQVR42u3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwZ8NAAAF0D5T5AAAAAElFTkSuQmCC',
  'base64',
);

fs.writeFileSync(path.join(dir, 'newlogo.png'), png);
console.log('Created assets/icons/newlogo.png');
