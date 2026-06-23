const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('scratch/swagger.json', 'utf8'));

console.log('--- CreateContentForm Schema ---');
if (swagger.components.schemas['CreateContentForm']) {
  console.log(JSON.stringify(swagger.components.schemas['CreateContentForm'], null, 2));
} else {
  console.log('CreateContentForm not found');
}

console.log('\n--- UpdateContentForm Schema ---');
if (swagger.components.schemas['UpdateContentForm']) {
  console.log(JSON.stringify(swagger.components.schemas['UpdateContentForm'], null, 2));
} else {
  console.log('UpdateContentForm not found');
}
