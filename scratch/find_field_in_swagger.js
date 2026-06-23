const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('scratch/swagger.json', 'utf8'));

console.log('Searching schemas for "occasion"...');
let foundOccasion = false;
for (const [schemaName, schema] of Object.entries(swagger.components.schemas)) {
  const schemaStr = JSON.stringify(schema);
  if (schemaStr.toLowerCase().includes('occasion')) {
    console.log(`Found "occasion" in schema: ${schemaName}`);
    console.log(JSON.stringify(schema, null, 2));
    foundOccasion = true;
  }
}

if (!foundOccasion) {
  console.log('No mention of "occasion" found in any Swagger schemas.');
}
