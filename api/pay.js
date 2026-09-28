module.exports = async (req, res) => {
  // إعدادات السماح بالاتصال (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "الطريقة غير مسموحة" });
  }

  try {
    const { productName, amount, customer, orderId } = req.body;

    // المفتاح السري لـ Chargily Pay
    const SECRET_KEY = process.env.CHARGILY_SECRET_KEY || "test_sk_nwkZv7nlEE7ZylglhEOciAWJpbm5tvOhHdZPEruj";

    // الاتصال الآمن مع سيرفرات Chargily Pay الرسمية
    const response = await fetch("https://pay.chargily.net/test/api/v2/checkouts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency: "dzd",
        success_url: `https://${req.headers.host}/?payment=success&orderId=${orderId}`,
        failure_url: `https://${req.headers.host}/?payment=failed`,
        metadata: [
          { name: "order_id", value: String(orderId) },
          { name: "product_name", value: String(productName || "منتج طبيعي") },
          { name: "customer_name", value: String(customer?.name || "زبون") },
          { name: "customer_phone", value: String(customer?.phone || "") }
        ]
      })
    });

    const data = await response.json();

    // إرجاع رابط الدفع للموقع
    if (data.checkout_url) {
      return res.status(200).json({ checkoutUrl: data.checkout_url });
    } else {
      console.error("Chargily Error:", data);
      return res.status(400).json({ error: "فشل إنشاء رابط الدفع", details: data });
    }

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "خطأ داخلي في السيرفر", message: err.message });
  }
};
