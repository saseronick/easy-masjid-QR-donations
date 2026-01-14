import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JazzCashPaymentRequest {
  donationId: string;
  organizationId: string;
  amount: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body: JazzCashPaymentRequest = await req.json();
    const { donationId, organizationId, amount } = body;

    const { data: org, error: orgError } = await supabaseClient
      .from("organizations")
      .select("jazzcash_merchant_id, jazzcash_merchant_password")
      .eq("id", organizationId)
      .single();

    if (orgError || !org || !org.jazzcash_merchant_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "JazzCash not configured for this organization",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const merchantId = org.jazzcash_merchant_id;
    const password = org.jazzcash_merchant_password;
    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const returnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/jazzcash-callback`;
    
    const paymentData = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_TxnRefNo: transactionId,
      pp_Amount: (amount * 100).toString(),
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: new Date().toISOString().replace(/[-:]/g, "").split(".")[0],
      pp_BillReference: donationId,
      pp_Description: "Mosque Donation",
      pp_TxnExpiryDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0],
      pp_ReturnURL: returnUrl,
      pp_SecureHash: "",
    };

    const sortedKeys = Object.keys(paymentData).sort();
    const hashString = sortedKeys
      .filter((key) => key !== "pp_SecureHash")
      .map((key) => paymentData[key as keyof typeof paymentData])
      .join("&");
    
    const secureHash = createHmac("sha256", password)
      .update(hashString)
      .digest("hex");
    
    paymentData.pp_SecureHash = secureHash;

    await supabaseClient
      .from("donations")
      .update({
        transaction_id: transactionId,
        status: "pending",
      })
      .eq("id", donationId);

    const paymentUrl = `https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/`;
    
    const formHtml = `
      <html>
        <body>
          <form id="paymentForm" method="POST" action="${paymentUrl}">
            ${Object.entries(paymentData).map(([key, value]) => 
              `<input type="hidden" name="${key}" value="${value}" />`
            ).join("")}
          </form>
          <script>document.getElementById('paymentForm').submit();</script>
        </body>
      </html>
    `;

    const qrData = JSON.stringify({
      merchantId,
      amount: amount,
      transactionId,
      type: "jazzcash",
    });

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        paymentUrl,
        paymentForm: formHtml,
        qrCode: qrData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("JazzCash payment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Payment initialization failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
