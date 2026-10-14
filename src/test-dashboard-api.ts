async function testDashboardApi() {
  try {
    // 1. Fetch businesses list from backend or test latest created business
    const res = await fetch("http://localhost:3000/api/health");
    const health = await res.json();
    console.log("Server Status:", health);

    // 2. Create a test business directly via API
    const createRes = await fetch("http://localhost:3000/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Truth Supermarket - Dashboard Test",
        industry: "Retail",
      }),
    });
    const business = await createRes.json();
    console.log("\nBusiness Created via API:", business.name, `(ID: ${business.id})`);

    // 3. Add Income via API
    await fetch("http://localhost:3000/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        amount: 350000,
        type: "INCOME",
        source: "POS",
        reference: "POS-889",
        transactionDate: "2026-10-07T15:00:00Z",
      }),
    });

    // 4. Add Expense Spike via API
    await fetch("http://localhost:3000/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        amount: 95000,
        type: "EXPENSE",
        source: "MANUAL",
        reference: "REPAIRS-01",
        transactionDate: "2026-10-07T15:10:00Z",
      }),
    });

    // 5. Trigger Audit Engine via API
    await fetch(`http://localhost:3000/api/businesses/${business.id}/audit`, {
      method: "POST",
    });

    // 6. Fetch Dashboard via API
    const dashRes = await fetch(`http://localhost:3000/api/businesses/${business.id}/dashboard`);
    const dashboard = await dashRes.json();

    console.log("\n--- LIVE AUDIT DASHBOARD API RESPONSE ---");
    console.log(JSON.stringify(dashboard, null, 2));

  } catch (err) {
    console.error("Dashboard API test error:", err);
  }
}

testDashboardApi();