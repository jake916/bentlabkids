const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('scratch/swagger.json', 'utf8'));

console.log('--- CreateContentInput Schema ---');
console.log(JSON.stringify(swagger.components.schemas['CreateContentInput'], null, 2));

console.log('\n--- UpdateContentInput Schema ---');
console.log(JSON.stringify(swagger.components.schemas['UpdateContentInput'], null, 2));
