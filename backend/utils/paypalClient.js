const paypal = require('@paypal/checkout-server-sdk');

/**
 * Returns configured PayPal SDK Environment
 */
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'mock_client_id';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'mock_client_secret';

  if (process.env.PAYPAL_MODE === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  
  // Default to SandboxEnvironment
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

/**
 * Returns configured PayPal HTTP Client
 */
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = {
  client,
  paypal
};
