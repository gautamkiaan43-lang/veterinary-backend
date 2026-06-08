async function testBillingAPI() {
    try {
        console.log("Authenticating as Receptionist (receptionist@vetcarepro.com)...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'receptionist@vetcarepro.com', password: 'password123' })
        });
        const loginData = await loginRes.json();
        
        if (loginData.status !== 'success') {
            console.error("Login failed:", loginData);
            return;
        }

        const token = loginData.data.token;
        console.log("Authenticated. Token acquired.");

        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch unbilled queue
        console.log("Fetching unbilled queue...");
        const unbilledRes = await fetch('http://localhost:5000/api/v1/invoices/unbilled', { headers });
        const unbilledData = await unbilledRes.json();
        console.log("Unbilled Queue Response Status:", unbilledRes.status);
        console.log("Unbilled Queue Data:", JSON.stringify(unbilledData, null, 2));

        // 2. Fetch invoices
        console.log("Fetching invoices...");
        const invoicesRes = await fetch('http://localhost:5000/api/v1/invoices', { headers });
        const invoicesData = await invoicesRes.json();
        console.log("Invoices Response Status:", invoicesRes.status);
        console.log("Invoices Data:", JSON.stringify(invoicesData, null, 2));

    } catch (err) {
        console.error("Error:", err);
    }
}

testBillingAPI();
