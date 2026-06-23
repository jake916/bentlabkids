const fs = require('fs');

async function main() {
  try {
    const res = await fetch('https://bentlabkids-api.onrender.com/api-docs');
    const html = await res.text();
    fs.writeFileSync('scratch/swagger.html', html);
    console.log('Saved swagger HTML to scratch/swagger.html');
    
    // Check if there is an api-docs-json or similar path in html
    const jsonPathMatch = html.match(/\"url\"\s*:\s*\"([^\"]+)\"/i) || html.match(/url\s*:\s*['\"]([^'\"]+)['\"]/i);
    if (jsonPathMatch) {
      console.log('Found swagger JSON URL:', jsonPathMatch[1]);
      const jsonRes = await fetch('https://bentlabkids-api.onrender.com' + jsonPathMatch[1]);
      const json = await jsonRes.json();
      fs.writeFileSync('scratch/swagger.json', JSON.stringify(json, null, 2));
      console.log('Saved swagger JSON to scratch/swagger.json');
    } else {
      console.log('No JSON URL found in HTML. Checking if /api-docs-json exists directly...');
      const fallbackRes = await fetch('https://bentlabkids-api.onrender.com/api-docs-json');
      if (fallbackRes.ok) {
        const json = await fallbackRes.json();
        fs.writeFileSync('scratch/swagger.json', JSON.stringify(json, null, 2));
        console.log('Saved fallback swagger JSON to scratch/swagger.json');
      } else {
        console.log('Fallback failed with status:', fallbackRes.status);
      }
    }
  } catch (e) {
    console.error('Error fetching swagger:', e);
  }
}

main();
