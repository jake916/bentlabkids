const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('scratch/swagger.json', 'utf8'));

console.log('Schemas in Swagger components:');
console.log(Object.keys(swagger.components.schemas));
