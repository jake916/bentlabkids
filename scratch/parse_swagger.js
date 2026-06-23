const fs = require("fs");
const path = require("path");

const docPath = "C:\\Users\\jakea\\.gemini\\antigravity\\brain\\e0cfdd35-b9f8-4ab2-8ae2-a6b5b09b587f\\.system_generated\\steps\\306\\content.md";
const content = fs.readFileSync(docPath, "utf8");

const startMarker = '"swaggerDoc":';
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) {
  process.exit(1);
}

let openBraces = 0;
let jsonStr = "";
let foundStart = false;

for (let i = startIndex + startMarker.length; i < content.length; i++) {
  const char = content[i];
  if (char === "{") {
    openBraces++;
    foundStart = true;
  } else if (char === "}") {
    openBraces--;
  }
  if (foundStart) {
    jsonStr += char;
  }
  if (foundStart && openBraces === 0) {
    break;
  }
}

const doc = JSON.parse(jsonStr);
console.log("Searching Swagger definition for webhook or bunny...");
Object.keys(doc.paths).forEach(p => {
  const pathObj = doc.paths[p];
  Object.keys(pathObj).forEach(method => {
    const operation = pathObj[method];
    const opText = JSON.stringify(operation).toLowerCase();
    if (opText.includes("webhook") || opText.includes("bunny")) {
      console.log(`Match: ${method.toUpperCase()} ${p}`);
      console.log(`Summary: ${operation.summary}`);
      console.log("-------------------");
    }
  });
});
