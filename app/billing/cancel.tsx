/**
 * billing/cancel.tsx
 *
 * Deep-link target for Stripe checkout cancellation:
 *   virelle://billing/cancel?subscription=canceled
 *
 * Delegates to billing/callback which handles both success and cancel states.
 */
export { default } from "./callback";
