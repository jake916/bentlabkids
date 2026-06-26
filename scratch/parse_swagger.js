const fs = require('fs');

async function main() {
  const res = await fetch('https://bentlabkids-api-bxzh.onrender.com/api-docs/swagger-ui-init.js');
  const text = await res.text();
  
  // Let's find "var options = {" and the corresponding matching closing brace.
  const startKeyword = "var options = ";
  const startIndex = text.indexOf(startKeyword);
  if (startIndex === -1) {
    console.error("Could not find var options");
    return;
  }
  
  const contentStart = startIndex + startKeyword.length;
  // Let's find the end. The swagger-ui-init.js ends with options initialization and ui initialization.
  // We can just find the last "};" in the file before the "swaggerUi" setup.
  const setupIndex = text.indexOf("swaggerDoc");
  if (setupIndex === -1) {
    console.error("Could not find swaggerDoc");
    return;
  }
  
  // Let's just find the closing brace by matching brackets.
  let braceCount = 0;
  let started = false;
  let endIndex = -1;
  for (let i = contentStart; i < text.length; i++) {
    const char = text[i];
    if (char === '{') {
      braceCount++;
      started = true;
    } else if (char === '}') {
      braceCount--;
    }
    if (started && braceCount === 0) {
      endIndex = i + 1;
      break;
    }
  }
  
  if (endIndex === -1) {
    console.error("Could not find matching closing brace");
    return;
  }
  
  const optionsStr = text.substring(contentStart, endIndex);
  try {
    const optionsObj = JSON.parse(optionsStr);
    const swaggerDoc = optionsObj.swaggerDoc;
    
    console.log("ALL PATHS:");
    const paths = Object.keys(swaggerDoc.paths);
    console.log(paths);
    
    console.log("\nADMIN PATHS:");
    const adminPaths = paths.filter(p => p.includes('/admin'));
    console.log(adminPaths);
    
    fs.writeFileSync('scratch/swaggerDoc.json', JSON.stringify(swaggerDoc, null, 2));
    console.log("\nWrote full swaggerDoc to scratch/swaggerDoc.json");
  } catch (err) {
    console.error("JSON parse error:", err);
    // If not strict JSON, try eval
    try {
      const optionsObj = eval('(' + optionsStr + ')');
      const swaggerDoc = optionsObj.swaggerDoc;
      console.log("Evaluated admin paths:", Object.keys(swaggerDoc.paths).filter(p => p.includes('/admin')));
      fs.writeFileSync('scratch/swaggerDoc.json', JSON.stringify(swaggerDoc, null, 2));
    } catch (evalErr) {
      console.error("Eval error:", evalErr);
    }
  }
}

main();
