/**
 * billing/success.tsx
 *
 * Deep-link target for Stripe checkout success:
 *   virelle://billing/success?subscription=success&tier=indie
 *
 * This is an alias of billing/callback — it simply re-exports the same
 * component so that both deep-link paths work:
 *   virelle://billing/success  (used by BillingSuccess.tsx on the web)
 *   virelle://billing/callback (legacy path)
 */
export { default } from "./callback";
