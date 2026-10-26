# Security policy

Version 0.1.0 is in release preparation. No published version or completed independent security audit is claimed.

## Report a vulnerability privately

Once the public GitHub repository exists, use **Security → Report a vulnerability** if private vulnerability reporting is enabled. Repository creation and that reporting channel have not been configured by this preparation task. If the option is unavailable, open a minimal issue asking the maintainer for a private reporting channel, without exploit details, personal data, credentials or private URLs.

Do not publish a working exploit or sensitive sample while a private report is being arranged. Include the affected package/version, a local reproduction, expected behavior and impact through the private channel.

Before public launch, the maintainer should enable private vulnerability reporting or supply a verified private contact. No email address or support-response deadline is invented here.

## Security boundaries

This toolkit coordinates client uploads. Client MIME/size checks are advisory and cannot guarantee server-side security. Consuming applications remain responsible for authorization, CSRF/CORS policy, byte/content validation, request limits, malware/content scanning where appropriate, storage, quotas, access control and image lifecycle.

The example API is a development-only fixture. Do not expose it as a production upload service. Browser cancellation does not guarantee that a server stopped storing the file. Old files are retained; consumers decide whether and when deletion is safe. Treat display URLs as trusted application data and apply the application's URL/CSP policy.
