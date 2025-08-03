export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Only POST allowed" });
    }
  
    const body = req.body;
    console.log("Webhook received:", body);
  
    return res.status(200).json({ received: body });
  }