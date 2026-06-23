const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('scratch/swagger.json', 'utf8'));

const contentSchema = swagger.components.schemas['Content'];
console.log('--- Content Schema ---');
if (contentSchema) {
  console.log(JSON.stringify(contentSchema, null, 2));
} else {
  console.log('Content schema not found');
}
