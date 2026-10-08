# Selected bookmark link-health exploration

This is a design deliverable, not a shipped crawler. It remains outside both current manifests.

Proposed flow: user selects up to 20 bookmarks, sees the requested destination origins and privacy notice, grants optional origin access, and starts checks. Destination sites observe requests, including IP and URLs; never test internal/private URLs automatically. Do not include cookies or authentication credentials. A failed unauthenticated check may still be a valid logged-in bookmark.

Use per-origin optional permission requests, 8-second timeout, a concurrency limit of 3, and HEAD first. Servers may reject HEAD or block automation; return “inconclusive” rather than “broken”. Do not fall back to a full GET without a further user choice. Redirects require additional permission and disclose new origins. Clear permission and result state on disable. Never delete bookmarks automatically or infer link failure from network errors alone.

Decision gate: confirm narrow per-origin permission UX and destination disclosure, test redirects/401/403/405/timeouts and offline states, then evaluate whether this feature belongs in a separate cleanup release. No broad all-sites access is justified by this exploration.
