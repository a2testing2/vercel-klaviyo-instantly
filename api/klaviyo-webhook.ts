export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Only POST allowed" });
    }
  
    const { email, ltv, orders, aov, campaignId } = req.body;
  
    if (!email || !campaignId) {
      return res.status(400).json({ message: "Missing required fields: email or campaignId" });
    }
  
    const instantlyPayload = {
      email,
      campaignId,
      custom_fields: {
        ltv,
        orders,
        aov,
      },
    };
  
    console.log("📦 Transformed Instantly Payload:");
    console.log(JSON.stringify(instantlyPayload, null, 2));
  
    return res.status(200).json({
      message: "Received and transformed successfully",
      instantlyPayload,
    });
  }