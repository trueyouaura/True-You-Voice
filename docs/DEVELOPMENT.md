# Working on True You Voice

The app uses plain HTML, CSS, and JavaScript. There is no build step or backend, and no runtime dependencies.

## Local setup

Use Node.js 22 or newer, then run:

```sh
npm start
npm test
```

The preview server runs at `http://127.0.0.1:4173`. It sets local development headers and exposes the browser test pages below. It is not used in production.

## Browser checks

| Page | Checks |
| --- | --- |
| `/__test` | Synthetic 180 Hz input, worker analysis, recording/playback, storage, timers, safe note rendering, permission denial, and cancellation |
| `/__accounts` | Profile isolation, pronouns, taglines, appearances, pitch presets, recordings, guest history, and deletion |
| `/__launch` | Welcome focus and navigation, local backup/export scopes, restore preview and selection, profile preservation, synthetic recording decoding, invalid files, cancellation, and active-session guards |
| `/__appearance` | Rendered palette contrast under sampled color-vision transformations |

Open each page and use its check button. Audio tests supply synthetic sound and do not request a physical microphone. Test pages are excluded from deployment. Use a separate browser profile for testing: the fixtures create temporary practice data and restore saved settings afterward.

Automated tests cover pitch estimation at 44.1 and 48 kHz, signal rejection, summaries, stored-data validation, personal wording, and guided-session timing. Physical microphones and Safari, Firefox, and mobile devices still need their own checks; synthetic Chromium tests do not certify every device.

## Project structure

| Files | Responsibility |
| --- | --- |
| `index.html`, `styles.css` | Pages and layout |
| `themes.js`, `themes.css`, `settings.js` | Appearance choices and palette previews |
| `app.js` | Microphone controls, chart, recordings, sessions, and navigation |
| `pitch.js`, `pitch-worker.js` | Pitch estimation and voiced-sample summaries |
| `pitch-presets.js`, `routines.js` | Optional pitch guides and practice prompts |
| `profiles.js`, `profiles-store.js`, `personalization.js` | Local profiles, validation, pronouns, and wording |
| `storage.js` | Session settings and recording storage |
| `backup-data.js`, `launch.js` | Validated portable backups, additive restore, and welcome guide |
| `logo.svg`, `favicon.svg` | Brand mark |

Pitch analysis uses a YIN difference estimator on 4096-sample frames, at roughly 12.5 updates per second. Quiet-signal and confidence gates reject uncertain input; a three-frame median smooths the display. The estimation range is 65–650 Hz. Silence and uncertain sound leave chart gaps.

The tracker measures fundamental frequency, not resonance, gender, or how a voice will be perceived. Noise, vocal fry, breathiness, and strong harmonics can cause gaps or octave errors.

`voice-feedback.js` provides local, deterministic coaching for optional guided speaking recordings. Each take freezes its pitch goal and collects worker estimates only while MediaRecorder is recording. At least 12 voiced frames and 20% tracked coverage are required for range coaching; silence is excluded from the range fraction. Reported strain overrides goal coaching. The practice timer pauses during recording and remains paused for listening. Feedback stays in memory for the last take and clears on profile changes or data deletion; saved audio uses the existing recording store and backup path. This does not infer resonance, gender, or vocal health from F0.

Microphone capture requests noise suppression, echo cancellation, and automatic input level when the browser supports them. Analysis runs through continuous 60 Hz high-pass and 1600 Hz low-pass filters; MediaRecorder still uses the capture stream. Desk mode accepts YIN differences below 0.25, Very quiet below 0.30, and Nearby below 0.15. The 1024-sample comparison window follows changes within speech while retaining enough lag for the 65–650 Hz range. These settings may trade some precision for coverage; they cannot identify a particular speaker or exclude periodic music. Browser tests include a changing quiet oscillator with equally loud seeded broadband noise and noise-only rejection. Real speech and physical microphones still need user testing.

Recordings use MediaRecorder and the format supported by the browser. Saved clips live in IndexedDB; settings and up to 500 practice summaries use localStorage. Downloads keep the actual recording file extension.

## Data compatibility

Keep the existing `voice-studio-*` storage names and IndexedDB database name. Changing them would separate users from their saved practice. Browser storage belongs to the site's origin, so renaming the repository path under `https://trueyouaura.github.io` preserves access to saved data in the same browser. Moving to a different domain or account would use separate storage.

Guest data and named profiles have separate owners. Profile switching waits until active practice, reflection, and temporary recordings are finished. Cached profiles from earlier versions can be recovered locally, and obsolete sign-in tokens are removed without contacting an account service.

Saved pitch-guide selections are derived from numeric limits. Presets fill the fields; saving applies them. Pronouns and appearance never choose a pitch target. Mixed pronoun selections use the first listed form in sentences; unselected fields use second-person wording.

## Privacy and accessibility

The HTML Content Security Policy blocks network connections. There are no audio uploads, external fonts, analytics, or third-party runtime scripts. Browser storage is not encrypted or an access-control boundary. Clearing browser data can remove saved practice; downloaded files are separate.

Microphone capture requires an explicit action and browser permission. Cancelling a pending request stops any stream granted afterward. Disconnecting, hiding the tab, page exit, and playback stop capture. Backgrounding pauses guided sessions.

Use native controls, readable labels, keyboard focus, and reduced-motion support. Keep numeric chart summaries and the solid pitch line/dashed range boundaries, so meaning does not depend on hue.

The 28 palettes passed 3,584 sampled contrast comparisons. Protan/deutan transformations use severity 0.5 and 1.0, alongside approximate tritan transformations and grayscale. These checks are not a complete accessibility audit or clinical certification; grayscale does not simulate reduced acuity or light sensitivity.

Retain the color-model attribution in the test fixture. References: [Colour’s Machado implementation and limitations](https://colour.readthedocs.io/en/master/_modules/colour/blindness/machado2009.html), [source matrices](https://github.com/colour-science/colour/blob/develop/colour/blindness/datasets/machado2010.py), and [NEI’s color-vision overview](https://www.nei.nih.gov/eye-health-information/eye-conditions-and-diseases/color-blindness/types-color-vision-deficiency).

## Deployment

In GitHub **Settings → Pages**, choose **GitHub Actions** as the source. Push to `main`, or run **Verify and deploy True You Voice** manually. The workflow runs tests, stages the public assets, and publishes to [True You Voice](https://trueyouaura.github.io/True-You-Voice/).

The same static assets can run on another HTTPS host. Use the file list in `.github/workflows/pages.yml`; it is the authoritative deployment list. Serve JavaScript as `text/javascript` and disable directory listing. Suggested response headers are `Permissions-Policy: microphone=(self), camera=()` and `X-Content-Type-Options: nosniff`. A hosting CSP header can add `frame-ancestors 'none'`.

Keep documentation and browser fixtures out of the staged site. Microphone access needs HTTPS or localhost. See [GitHub’s Pages source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) for hosting setup.

## Backup format and restoration

Full backups are local JSON files with `format: "true-you-voice-backup"`, `version: 1`, and profile entries containing metadata, normalized practice state, and optional base64 audio. File selection never uploads data. Progress-only exports use a different format and are rejected by restore. Preparing a backup also exposes a persistent Save backup file link with keyboard focus; it supports a direct user action if automatic downloading is blocked. Its object URL is released on the next backup or page exit.

Restore validates the entire archive before showing a preview. It bounds metadata, history, profile counts, audio types, and sizes, generates fresh owner and recording IDs, writes recordings in a single IndexedDB transaction, and rolls back new records if profile storage fails. Existing profile data is not overwritten. A single profile can be selected from an archive; adding copies remains subject to the 50-profile device limit. Files are limited to 200 MB, audio to 125 MB, and clips to 2,000 per backup. Browser memory or storage constraints can still be lower. Back up fewer profiles or omit recordings when necessary.

The first-visit guide uses `true-you-voice-welcome-v1` to remember dismissal. Its dialog can be reopened using Getting started. Feedback links open the public responder form in a new tab with noopener/noreferrer. The form editor and responses remain private. The site explains that Google receives submitted feedback and does not attach local practice data. Keep View results summary disabled, contact information optional, and sign-in requirements off.

## Real-device release checks

Before a broad launch, run this checklist on iPhone/Safari, Android/Chrome, desktop Firefox, and desktop Safari. The available automated and synthetic Chromium checks do not certify those devices.

- Open the HTTPS site; use the welcome guide with keyboard or screen reader where available.
- Create a disposable profile. Check narrow-screen layout, theme selection, pronouns, and pitch preferences.
- Allow the physical microphone, speak comfortably, and confirm live pitch responds. Test denial and reconnection.
- Record a short clip, save it, play it, and download it. Verify microphone capture stops when hidden or disconnected.
- Save a brief guided session and reload to confirm persistence.
- Download a full backup, restore it as a separate profile, and confirm wording, history, preferences, and audio playback.
- Test a backup on a second device; browser audio-format support can differ. An unsupported format may still be downloadable even when playback is unavailable.
- Check that dialog controls remain reachable, text does not overflow, and focus stays visible in light/dark and high-contrast themes.

## Reading and cognitive accessibility

`reading-prefs.js` validates per-profile display preferences. `accessibility.js` applies them and `accessibility.css` supplies rem-based reading text, wrapping, 48px controls, optional spacing, reduced motion, and focus view. Guest preferences use `voice-studio-guest-reading`; named profiles store reading metadata in the existing registry. Old profiles and backups receive safe defaults. Full backup version 1 remains compatible.

The pitch worker still analyzes every sample; visual values update at most four times per second. Live chart updates can be manual or hidden. Screen reader pitch announcements are off by default and occur at most once per eight seconds when enabled. Timer ticks are not live regions. Step changes and pause/resume are announced. No-countdown practice advances manually, disables Next while paused, and stops after one hour; silent breaks remain in its plan.

Local preview `/__accessibility` checks profile preferences, manual session controls, announcement stability, and all six views at 320px with extra-large text. Automated checks are useful evidence, not WCAG certification or a disability friendliness score. Test VoiceOver, NVDA, TalkBack, keyboard-only use, browser zoom, and people with cognitive, sensory, and motor access needs before making broad claims.
