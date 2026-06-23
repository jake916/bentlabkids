async function test() {
  try {
    const url = "https://vz-71415.b-cdn.net/e9cd081a-bdde-4e23-aa05-10527d956be0/thumbnail.jpg";
    console.log("Fetching thumbnail from CDN URL:", url);
    const res = await fetch(url, { method: "HEAD" });
    console.log("Status:", res.status);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
