import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/** Default in-memory cache (no R2). Enable R2 incremental cache in wrangler when R2 is provisioned. */
export default defineCloudflareConfig({});
