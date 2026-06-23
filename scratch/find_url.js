const fs = require('fs');
const html = fs.readFileSync('scratch/swagger.html', 'utf8');

// Find all script tags or URLs
const regex = /https?:\/\/[^\s\"']+/g;
let match;
const urls = [];
while ((match = regex.exec(html)) !== null) {
  if (match[0].includes('json') || match[0].includes('yaml') || match[0].includes('api-docs')) {
    urls.push(match[0]);
  }
}
console.log('URLs in HTML matching filters:', urls);

// Print all scripts contents
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let scriptMatch;
while ((scriptMatch = scriptRegex.exec(html)) !== null) {
  const code = scriptMatch[1];
  if (code.includes('SwaggerUI') || code.includes('spec') || code.includes('url')) {
    console.log('--- FOUND SCRIPT ---');
    console.log(code.trim().slice(0, 1000));
  }
}
