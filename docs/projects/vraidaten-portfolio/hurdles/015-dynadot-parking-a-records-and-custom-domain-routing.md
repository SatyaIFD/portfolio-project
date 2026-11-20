# Hurdle 015: Registrar Parking A Records, Local DNS Cache & Custom Domain Token Scopes

- **Symptoms:**
  1. Onboarding `vraidaten.com` to Cloudflare auto-imported three `A` records (`*.vraidaten.com`, `vraidaten.com`, `www.vraidaten.com`) pointing to `185.53.179.149`.
  2. Even after Cloudflare marked the `vraidaten.com` zone as `active`, `resolvectl query -t NS vraidaten.com` on Ubuntu still returned `ns1.dyna-ns.net` and `ns2.dyna-ns.net` (`Data from: cache`).
  3. Querying `/zones/{zone_id}/dns_records` and calling `.get("result", [])` in Python raised `TypeError: object of type 'NoneType' has no len()`.
- **Root Causes:**
  1. Cloudflare's initial DNS scan imports existing registrar parking `A` records (`185.53.179.149`), which conflict with Cloudflare Workers Custom Domain synthesis (`custom_domain: true`).
  2. Ubuntu's `systemd-resolved` caches prior `NS` lookups until the TTL expires or the cache is explicitly flushed.
  3. When an API token lacks `Zone - DNS - Edit` scope, Cloudflare returns `{"result": null, "success": false}`; in Python, `dict.get("result", [])` returns `None` when the key exists with value `null`.
- **Resolutions:**
  1. Added `Zone - DNS - Edit` and `Zone - Workers Routes - Edit` permissions to the scoped Cloudflare API token, deleted the `185.53.179.149` parking `A` records, and attached `vraidaten.com` and `www.vraidaten.com` via `routes` (`custom_domain: true`) in `site/wrangler.jsonc`.
  2. Flushed local DNS caches via `sudo resolvectl flush-caches` after delegating nameservers in Dynadot to `edward.ns.cloudflare.com` and `reza.ns.cloudflare.com`.
  3. Used `data.get("result") or []` when parsing nullable Cloudflare API response arrays.
