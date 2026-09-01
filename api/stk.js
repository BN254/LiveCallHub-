export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({
        error: "Phone number and amount are required"
      });
    }

    // Convert 07XXXXXXXX / 01XXXXXXXX to 2547XXXXXXXX / 2541XXXXXXXX
    let phoneNumber = String(phone).replace(/\s+/g, "");

    if (phoneNumber.startsWith("0")) {
      phoneNumber = "254" + phoneNumber.substring(1);
    }

    if (!/^254[17]\d{8}$/.test(phoneNumber)) {
      return res.status(400).json({
        error: "Invalid Kenyan M-PESA phone number"
      });
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const passkey = process.env.MPESA_PASSKEY;
    const shortcode = process.env.MPESA_SHORTCODE;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (
      !consumerKey ||
      !consumerSecret ||
      !passkey ||
      !shortcode ||
      !callbackUrl
    ) {
      return res.status(500).json({
        error: "M-PESA environment variables are not configured"
      });
    }

    // Get OAuth access token
    const credentials = Buffer.from(
      `${consumerKey}:${consumerSecret}`
    ).toString("base64");

    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`
        }
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(500).json({
        error: "Could not obtain M-PESA access token",
        details: tokenData
      });
    }

    const accessToken = tokenData.access_token;

    // Generate timestamp
    const date = new Date();
    const timestamp =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") +
      String(date.getSeconds()).padStart(2, "0");

    // Generate password
    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    // Send STK Push
    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(Number(amount)),
          PartyA: phoneNumber,
          PartyB: shortcode,
          PhoneNumber: phoneNumber,
          CallBackURL: callbackUrl,
          AccountReference: "LiveCallHub",
          TransactionDesc: "LiveCallHub payment"
        })
      }
    );

    const stkData = await stkResponse.json();

    return res.status(stkResponse.ok ? 200 : 400).json(stkData);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "STK Push request failed"
    });
  }
}
