async function benchmark() {
  const url = "http://localhost:3001/api/analytics/leaderboard?limit=50";
  console.log(`Benchmarking ${url}...`);

  try {
    const start = performance.now();
    const response = await fetch(url);
    const end = performance.now();

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log(`Success! Fetched ${Array.isArray(data) ? data.length : 0} items.`);
    console.log(`Time taken: ${(end - start).toFixed(2)}ms`);

    if (Array.isArray(data) && data.length > 0) {
      console.log("Sample item keys:", Object.keys(data[0]).join(", "));
    }
  } catch (error) {
    console.error("Benchmark failed:", error);
  }
}

benchmark();
