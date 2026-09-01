export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Phone number and amount are required"
      });
    }

    // We will add the M-Pesa authentication and STK Push
    // request here in the next step.

    return res.status(200).json({
      success: true,
      message: "STK Push request received",
      phone,
      amount
    });

  } catch (error) {
    console.error("STK Push error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}
