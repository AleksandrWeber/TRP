# Secret Vault Overview

**Document:** Version 3 Secret Vault Overview
**Date:** 2026-08-17
**Status:** Product-facing record of V3-S03 Implementation Package — **Approved**. Planning **COMPLETE**.
**Product:** Secret Vault
**Nature:** Customer description. Not an RC. Not an ADR. Not implementation. Not a Master Plan revision.

This is what an ordinary operator experiences. It is not an internal design note.

---

## Purpose

Secret Vault is the place in the product where an operator keeps credentials for exchanges, AI, and notifications — instead of putting them in a server file.

- The operator can: open Vault, add Binance credentials (and other supported types), see that they were accepted and stored, revoke them, and delete them. The operator cannot read the secret back after it is stored. The operator cannot export it.
- The operator cannot (yet): connect Binance, send Telegram, send email, chat with AI using that key, rotate keys as a connection product, or start live trading.
- Why it exists, in business language: the customer should own their keys in the product. Editing a host file is not a product. The vault exists to support later connections. It is not those connections. It keeps secrets only. It does not own trading, AI, or notifications.
- If Vault is unavailable: sign-in, paper trading, and research still work. Integrations that need a stored key are unavailable. The rest of the product does not go down with Vault.

---

## Customer Journey

```text
Sign in
  ↓
Open Vault
  ↓
Add Binance credentials
  ↓
Validation
  ↓
Stored
  ↓
Visible as Connected
  ↓
Can revoke
  ↓
Can delete
```

### Sign in

The operator signs in as usual. Vault is for a Trader or an Administrator in the workspace they already use. A Reader or Researcher who opens Vault is told it is unavailable — not shown an empty list that looks like “nothing is stored yet.”

### Open Vault

Under Administration, open **Vault**. The page lists credential types the product can hold, and whether each is not stored, stored, revoked, or gone.

### Add Binance credentials

The operator chooses Binance and enters the API key and secret. The form does not keep showing those values after a successful save. The operator does not edit a server file and does not restart the product for this save.

### Validation

The product checks that the required fields are present and usable as a stored secret. This is **not** a test against Binance. If the fields are empty or incomplete, the product refuses and does not show success.

### Stored

On success, the vault holds the credential. The key and secret are not shown again. They are not copied to a download. They are not listed in words the operator can copy back.

### Visible as Connected

The Binance row on **Vault** shows as connected in the vault sense: the product holds a stored credential. Connected means the vault accepted and stored the secret. It does **not** mean Binance works. The page must not say that Binance trading is connected, that live trading is on, or that orders can be sent. Stored is not a live venue.

### Can revoke

The operator can revoke. The row remains visible as revoked if the product still shows the type. The stored secret can no longer be used. This is not a Binance disconnect product.

### Can delete

The operator can delete. The credential is gone from the product. The type returns to not stored. The operator cannot get the old secret back from TRP.

---

## Customer Experience

- Happy path (plain language): open Vault, add Binance credentials, see them stored, confirm they cannot be read back, revoke if needed, delete if needed.
- If something fails, what they see (honest; no fake success): unavailable if they are not allowed to use Vault; a short error if the fields are incomplete; a short error if that workspace has no right to another workspace’s vault; a short unavailable if Vault itself cannot store right now. Sign-in and paper still work in that last case. Never “Binance connected” after a refused save. Never a fake sent email or fake Telegram.
- What they never have to do (SSH, config files, pasting secrets into notes): they do not edit `.env`, restart the server to save the key, or ask an engineer to paste the secret into a host file.
- Paper remains the default, or **NOT APPLICABLE** with reason: Paper remains the default. Vault does not start trading. Paper does not need Vault.

---

## Customer Never Sees

What this product must not be mistaken for. Name the later product or Master Plan deferral.

- Not shown in the UI: Connection Management home, Connect-and-test against Binance, Telegram delivery, email send, AI chat that uses the new key, live trading, billing, API keys as a developer product, invite teammate.
- Not offered as a button, page, or implied “connected / live / recovered” state: **Binance trading connected**, live trading, Telegram delivering, email sent, AI online from this key. Vault “Connected” is only “this secret is stored.”
- Owner later (product name, not a file path): Connection Management; Exchange Connectivity; Notification Platform; AI Platform; live trading; a searchable security history of vault changes. Vault does not own those products. Vault owns credentials only.

Do not list internal types, routes, or table names here. List things an operator might look for and not find.

---

## Security Guarantees

What the operator can trust, stated as outcomes they can understand.

- What stays private (passwords, keys, messages — in product words): exchange keys, bot tokens, SMTP passwords, and AI keys are not shown after save, not printed in messages, and not offered as an export.
- What stops working when it should (ended sign-in, disconnected venue, revoked access): a revoked or deleted secret cannot be used. A signed-out person cannot open Vault. A Reader or Researcher cannot manage Vault. One workspace cannot open another workspace’s Vault.
- What the product will not pretend (no fake live, no fake sent email, no fake connected): storing a Binance key is not Binance connected. Connected on Vault means the vault holds the secret — not that Binance, Telegram, email, or AI worked.
- What this overview does **not** claim (later security products): a searchable audit history, extra sign-in factors, connection health, or live trading.
- What still works if Vault cannot store: sign-in, paper trading, and research. Integrations that need a stored key wait.

No control catalogs. No STRIDE tables. Those live in Security Review.

---

## Secret Classification (what the operator can trust)

The operator’s exchange keys, bot tokens, mail passwords, and AI keys: the operator owns them in Vault, may replace them, cannot read them back after save, and cannot export them.

Host signing secrets, database URLs, and mail used to recover a login are not in Vault. The operator does not manage those here.

---

## Secret states (what Connected means)

```text
Created
  ↓
Validated
  ↓
Connected
  ↓
Revoked
  ↓
Deleted
```

**Connected** on Vault means the product stored the credential. It does **not** mean Binance, Telegram, email, or AI works.

---

## If Vault is unavailable

```text
Vault unavailable
  ↓
Paper Trading continues
  ↓
Authentication continues
  ↓
Research continues
  ↓
Integrations unavailable
```

The vault must not take down the rest of the product. Integrations that need a stored key wait. Sign-in and paper do not.

---

## What Vault owns

Vault keeps credentials. It does not own connections, trading, AI, notifications, or exchanges. Those remain later products that may use a stored secret. Using a secret is not owning the product.

---

## What's Next

What this overview does not unlock. One later customer capability, in plain language.

- Next thing the operator will be able to do: not yet connect Binance from a Connections place. After this package, remaining Wave 1 security work still comes first. Connecting from the product is a later connections product that **uses** this vault.
- Still not offered: Telegram delivery, email sending, AI chat with the stored key, live trading, billing.
- Live trading, vault, billing, or other later products named only if the operator might assume they are included: live trading, billing, and connection setup are not included. This overview **is** the vault. It is not those later products.

---

**STOP.** Planning is **COMPLETE**. Product Owner **Approved**. This overview is still not implementation.

**End of Version 3 Secret Vault Overview.**
