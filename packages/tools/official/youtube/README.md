# @tpmjs/tools-youtube

Upload and manage videos on your own YouTube channel: resumable uploads straight from a URL (continued across calls for long files), processing status, metadata updates, thumbnails, playlists, categories — plus the two one-time tools that mint the credential.

Part of the **ajax weapons** set: task-level tools an agent can pick up without learning a vendor API. Credentials come from the environment; on tpmjs add them as collection env vars (the collection owner's calls get them injected, everyone else supplies their own).

## Installation

```bash
npm install @tpmjs/tools-youtube
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `YOUTUBE_CLIENT_ID` | yes | Google OAuth client id — a **Desktop app** client with the YouTube Data API v3 enabled |
| `YOUTUBE_CLIENT_SECRET` | yes | Google OAuth client secret |
| `YOUTUBE_REFRESH_TOKEN` | yes | Refresh token for the channel owner, minted once (see below) |
| `YOUTUBE_ACCESS_TOKEN` | no | A short-lived access token, if you manage tokens yourself (skips the refresh flow) |

`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are accepted as aliases.

### One-time setup (about five minutes)

1. In [console.cloud.google.com](https://console.cloud.google.com) create (or pick) a project, enable **YouTube Data API v3**, configure the OAuth consent screen (External is fine — add yourself as a test user, and **publish** the app so the refresh token does not expire after 7 days), then create an OAuth client of type **Desktop app**. Note the client id and secret.
2. With `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` set, call **`youtubeAuthUrl`**, open the URL as the Google account that owns the channel and approve. The browser lands on `http://localhost:8765/callback?code=…` (the page may say it cannot be reached — that is fine). Copy the `code` parameter.
3. Call **`youtubeExchangeCode`** with that code; store the returned `refreshToken` as `YOUTUBE_REFRESH_TOKEN`. Treat it like a password — it grants full control of the channel.

## Tools

| Export | What it does |
| --- | --- |
| `youtubeAuthUrl` | Setup step 1: build the Google consent URL for this OAuth client. |
| `youtubeExchangeCode` | Setup step 2: exchange the consent code for the long-lived refresh token. |
| `myChannel` | The channel these credentials control: id, title, handle, subscriber/video/view counts, uploads playlist. |
| `uploadVideo` | Upload a video from a direct URL in resumable 8 MiB chunks; optional playlist + thumbnail; continues across calls. |
| `videoStatus` | Upload/processing status, privacy, schedule, failure reasons and stats for one video. |
| `myVideos` | Recent uploads, newest first, with privacy, processing state and counts. |
| `updateVideo` | Change title, description, tags, category, privacy, schedule or made-for-kids; untouched fields are preserved. |
| `setThumbnail` | Set a custom thumbnail from an image URL (JPEG/PNG ≤ 2 MB; phone-verified channel required). |
| `myPlaylists` | Your playlists with ids, privacy and item counts. |
| `addToPlaylist` | Add a video to a playlist. |
| `deleteVideo` | Permanently delete a video (irreversible). |
| `videoCategories` | Assignable category ids for a region. |

## Usage

```typescript
import { uploadVideo, videoStatus, myVideos } from '@tpmjs/tools-youtube';

const ctx = { toolCallId: 'c1', messages: [] };

let result = await uploadVideo.execute(
  {
    videoUrl: 'https://files.example.com/talk.mp4',
    title: 'Building a paraconsistent substrate',
    description: 'Recorded 2026-08-22.',
    tags: ['donto', 'knowledge graphs'],
    privacy: 'unlisted',
    playlistId: 'PL…',
  },
  ctx
);
// Long file? Keep calling with the returned session until it says "uploaded".
while (result.status === 'in_progress') {
  result = await uploadVideo.execute({ videoUrl: 'https://files.example.com/talk.mp4', sessionUri: result.sessionUri }, ctx);
}
await videoStatus.execute({ videoId: result.videoId }, ctx); // poll until processingStatus === 'succeeded'
```

### Long uploads

`uploadVideo` streams the file from `videoUrl` and sends it to YouTube in 8 MiB resumable chunks. Each call works within a time budget (`maxSeconds`, default 75 s — under Cloudflare's 100 s limit for MCP calls, at most 280 s). When the budget runs out it returns `status: "in_progress"` with the upload `sessionUri` and how many bytes are done; call again with the same `videoUrl` and that `sessionUri` and it resumes exactly where it stopped (the session stays valid for about a day). Transient 5xx errors on a chunk are retried from the offset YouTube confirms it kept.

## Things YouTube enforces (not this package)

- **Un-audited API projects upload as private.** Until your Google Cloud project passes the [YouTube API Services compliance audit](https://support.google.com/youtube/contact/yt_api_form), any video uploaded through the API is locked to *private* regardless of the privacy you asked for. The result's `notes` says so when it happens; flip the video in YouTube Studio or complete the audit.
- **Quota:** the Data API gives 10,000 units/day by default; an upload costs 1,600, so roughly six uploads a day plus a few hundred reads. Errors carry the `quotaExceeded` reason.
- **Consent screen in "Testing"** → refresh tokens expire after 7 days. Publish the app.
- **Custom thumbnails** need a phone-verified channel.

Every tool throws a readable error on failures (HTTP status, Google's reason code, the message, and a hint), so agents can react instead of guessing.

## License

MIT
