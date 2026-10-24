declare module 'react-native-razorpay' {
  export type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };
  // Rejection payload. `code` 0 / 2 mean the customer closed the sheet or
  // the network dropped; `description` is Razorpay's JSON or text reason.
  export type RazorpayError = { code: number; description: string };
  const RazorpayCheckout: {
    open(options: {
      key: string;
      order_id: string;
      amount: number;
      currency?: string;
      name?: string;
      description?: string;
      prefill?: { name?: string; email?: string; contact?: string };
      theme?: { color?: string };
    }): Promise<RazorpaySuccess>;
  };
  export default RazorpayCheckout;
}
