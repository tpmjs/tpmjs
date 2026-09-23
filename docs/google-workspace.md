# Google Workspace connection

TPMJS owns each user's Google credential. Bode and other MCP clients receive a TPMJS OAuth grant for selected collections and tools; they never receive the Google refresh token. `google_connections` stores the refresh token encrypted with `API_KEY_ENCRYPTION_SECRET`. Deleting an account connection immediately removes access to its tools.

## Google Cloud setup

1. Choose a Google Cloud project owned by TPMJS. In Google Auth Platform, configure the consent screen, support email, privacy policy, and authorized domain `tpmjs.com`. Enable the Google Drive API and Gmail API.
2. Create a **Web application** OAuth client with the exact redirect URI `https://tpmjs.com/api/google/callback`.
3. Set `GOOGLE_WORKSPACE_CLIENT_ID` and `GOOGLE_WORKSPACE_CLIENT_SECRET` in `/etc/donto/tpmjs-web.env` (root-owned, never in Git), then restart `tpmjs-web`.
4. While the OAuth app is in Testing mode, add each intended Google account as a test user. Testing-mode refresh tokens may expire after seven days. Before offering this connection to the public, complete Google's verification for the requested sensitive/restricted scopes and any required security assessment.

The app requests `drive.readonly` for search/read, `gmail.readonly` for search/read, and `gmail.send` only when the user checks **gmail send**. The last tool is excluded from a collection's default app grant; the user must opt into it by name. The account must separately select the Google collection and its tools on each TPMJS app consent screen. A Bode session may further disable individual tools, and Bode checks the underlying tool even when the agent uses TPMJS `execute_tool`.

After Google authorization, reconnect or change permissions for the Bode TPMJS connection, then use **Refresh tools** in Bode MCP settings. This updates Bode's account and session tool catalog. Search and read use bounded pages/output; Gmail send is a live external action.

Google references: [OAuth web server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes), [Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [Google API user-data policy](https://developers.google.com/workspace/workspace-api-user-data-developer-policy).
