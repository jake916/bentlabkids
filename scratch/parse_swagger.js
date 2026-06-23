const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('scratch/swagger.json', 'utf8'));

// Check paths
console.log('--- Paths in Swagger ---');
const paths = Object.keys(swagger.paths).filter(p => p.includes('prayers'));
console.log(paths);

paths.forEach(p => {
  console.log(`\nEndpoint: ${p}`);
  const methods = Object.keys(swagger.paths[p]);
  methods.forEach(m => {
    console.log(`Method: ${m.toUpperCase()}`);
    const op = swagger.paths[p][m];
    
    // Check requestBody
    if (op.requestBody) {
      const content = op.requestBody.content;
      if (content && content['application/json']) {
        const schema = content['application/json'].schema;
        console.log('Request body schema:');
        resolveAndPrintSchema(schema);
      }
    }
    
    // Check responses
    if (op.responses) {
      const successRes = op.responses['200'] || op.responses['201'];
      if (successRes && successRes.content && successRes.content['application/json']) {
        const schema = successRes.content['application/json'].schema;
        console.log('Success response schema:');
        resolveAndPrintSchema(schema);
      }
    }
  });
});

function resolveAndPrintSchema(schema) {
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop();
    const resolved = swagger.components.schemas[refName];
    console.log(`Resolved Ref: ${refName}`);
    printSchemaDetails(resolved);
  } else {
    printSchemaDetails(schema);
  }
}

function printSchemaDetails(schema) {
  if (!schema) return;
  if (schema.properties) {
    Object.keys(schema.properties).forEach(prop => {
      const details = schema.properties[prop];
      let typeStr = details.type;
      if (details.$ref) {
        typeStr = details.$ref.split('/').pop();
      } else if (details.type === 'array' && details.items) {
        typeStr = `array of ${details.items.$ref ? details.items.$ref.split('/').pop() : details.items.type}`;
      }
      console.log(`  - ${prop}: ${typeStr} (required: ${schema.required ? schema.required.includes(prop) : false})`);
    });
  } else {
    console.log(JSON.stringify(schema, null, 2));
  }
}
