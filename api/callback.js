export default async function handler(req, res) {
  try {
    console.log("M-Pesa Callback Received:");
    console.log(JSON.stringify(req.body, null, 2));

    // Safaricom sends the callback data here
    const callbackData =
      req.body?.Body?.stkCallback;

    if (!callbackData) {
      return res.status(400).json({
        success: false,
        message: "Invalid callback data"
      });
    }

    const resultCode = callbackData.ResultCode;
    const resultDescription = callbackData.ResultDesc;

    console.log("Result Code:", resultCode);
    console.log("Result Description:", resultDescription);

    if (resultCode === 0) {
      console.log("STK Push payment successful");

      const items =
        callbackData.CallbackMetadata?.Item || [];

      console.log("Payment Details:", items);
    } else {
      console.log("STK Push payment failed or cancelled");
    }

    // Tell Safaricom that the callback was received
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback received successfully"
    });

  } catch (error) {
    console.error("Callback error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
      }
