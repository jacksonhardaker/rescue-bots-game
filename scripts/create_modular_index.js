import fs from 'fs';

const html = fs.readFileSync('index.monolithic.html', 'utf8');
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>') + 9;

const htmlBefore = html.substring(0, scriptStart);
const htmlAfter = html.substring(scriptEnd);

const newHtml = `${htmlBefore}<script type="module" src="/src/main.js"></script>${htmlAfter}`;

fs.writeFileSync('index.html', newHtml, 'utf8');
console.log(`Updated index.html: reduced from ${html.length} bytes to ${newHtml.length} bytes!`);
