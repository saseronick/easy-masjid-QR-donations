import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EasyPaisaPaymentRequest {
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

    const body: EasyPaisaPaymentRequest = await req.json();
    const { donationId, organizationId, amount } = body;

    const { data: org, error: orgError } = await supabaseClient
      .from("organizations")
      .select("easypaisa_store_id, easypaisa_merchant_hash")
      .eq("id", organizationId)
      .single();

    if (orgError || !org || !org.easypaisa_store_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "EasyPaisa not configured for this organization",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const storeId = org.easypaisa_store_id;
    const hashKey = org.easypaisa_merchant_hash;
    const transactionId = `EP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const postBackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/easypaisa-callback`;
    
    const paymentData = {
      storeId: storeId,
      amount: amount.toFixed(2),
      postBackURL: postBackUrl,
      orderRefNum: transactionId,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0].replace(/-/g, ""),
      merchantHashedReq: "",
      autoRedirect: "1",
      paymentMethod: "MA_PAYMENT_METHOD",
    };

    const hashString = `${paymentData.amount}${paymentData.autoRedirect}${paymentData.expiryDate}${paymentData.orderRefNum}${paymentData.paymentMethod}${paymentData.postBackURL}${paymentData.storeId}`;
    
    const merchantHash = createHmac("sha256", hashKey)
      .update(hashString)
      .digest("hex");
    
    paymentData.merchantHashedReq = merchantHash;

    await supabaseClient
      .from("donations")
      .update({
        transaction_id: transactionId,
        status: "pending",
      })
      .eq("id", donationId);

    const paymentUrl = `https://easypaisa.com.pk/easypay/Index.jsf`;
    
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
      storeId,
      amount: amount,
      transactionId,
      type: "easypaisa",
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
    console.error("EasyPaisa payment error:", error);
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
