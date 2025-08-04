export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Only POST allowed" });
    }
  
    const payload = req.body;
  
    // Mandatory fields (flexible casing)
    const email = payload.email;
    const campaignId = payload.campaignId || payload.campaign_id;
  
    if (!email || !campaignId) {
      return res.status(400).json({ message: "Missing email or campaign ID" });
    }
  
    // Flexible access for optional fields
    const firstName = payload.first_name || payload.firstName || "";
    const lastName = payload.last_name || payload.lastName || "";
    const totalSpend = parseFloat(payload.total_spend || payload.totalSpend || "0");
    const orders = payload.orders || 1; // default to 1 if not provided
    const aov = totalSpend / orders;
  
    const customFields: Record<string, any> = {
      total_spend: totalSpend,
      orders,
      aov: parseFloat(aov.toFixed(2)),
      first_order_date: payload.first_order_date || payload.firstOrderDate,
      last_order_date: payload.last_order_date || payload.lastOrderDate,
    };
  
    // Include any other additional fields automatically
    const knownKeys = [
      "email", "first_name", "firstName", "last_name", "lastName",
      "total_spend", "totalSpend", "orders", "aov", "first_order_date",
      "firstOrderDate", "last_order_date", "lastOrderDate", "campaign_id", "campaignId"
    ];
  
    for (const key in payload) {
      if (!knownKeys.includes(key)) {
        customFields[key] = payload[key]; // dynamically include
      }
    }
  
    const instantlyPayload = {
      email,
      campaignId,
      first_name: firstName,
      last_name: lastName,
      custom_fields: customFields,
    };
  
    console.log("📦 Instantly-ready Payload:");
    console.log(JSON.stringify(instantlyPayload, null, 2));
  
    return res.status(200).json({
      message: "Transformed successfully",
      instantlyPayload,
    });
  }