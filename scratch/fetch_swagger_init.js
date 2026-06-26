const fs = require('fs');

async function main() {
  try {
    const res = await fetch('https://bentlabkids-api-bxzh.onrender.com/api-docs/swagger-ui-init.js');
    if (res.ok) {
      const js = await res.text();
      fs.writeFileSync('scratch/swagger-ui-init.js', js);
      console.log('Saved swagger-ui-init.js successfully');
      
      // Try to extract JSON spec from javascript code
      // Look for: let options = { ... } or swaggerDoc: { ... }
      const match = js.match(/\"swaggerDoc\"\s*:\s*(\{[\s\S]*?\})\s*,\s*\"customOptions\"/);
      if (match) {
        fs.writeFileSync('scratch/swagger.json', match[1]);
        console.log('Extracted and saved swagger.json successfully');
      } else {
        console.log('Could not parse JSON spec from script. Searching for swaggerDoc in string...');
        const docStartIndex = js.indexOf('"swaggerDoc":');
        if (docStartIndex !== -1) {
          const sub = js.slice(docStartIndex);
          fs.writeFileSync('scratch/swaggerDoc_extract.txt', sub.slice(0, 5000));
          console.log('Saved snippet to scratch/swaggerDoc_extract.txt');
        }
      }
    } else {
      console.log('Failed to fetch swagger-ui-init.js:', res.status);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

main();
