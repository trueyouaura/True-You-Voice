# Voice Studio

A private, accessible static web app for gender-affirming voice practice. Open to everyone. Microphone analysis and recordings stay in the browser. Device-local profiles separate preferences, practice history, and recordings. No sign-in or email service is required. No analytics, third-party scripts, AI services, or runtime packages.

## Appearance

Choose **Appearance** in the header: Trans fem, Nonbinary, or Trans masc, each in Light and Dark. The flag-inspired colors change the interface and pitch chart; your training settings remain your own. The selected look is saved locally (`voice-studio-theme`) and kept separately for each profile.

## Use

1. Open the HTTPS site directly in a current Chrome, Edge, Firefox, or Safari browser.
2. In Studio, choose **Connect microphone** and allow microphone access. Speak naturally in a quiet room.
3. Explore live F0 feedback and its 30-second chart. Set an optional comfortable range; the initial 160–220 Hz band is an editable example, not a clinical prescription or femininity threshold.
4. Choose an original 3-, 4-, or 5-minute routine, or a 10-, 15-, 20-, 30-, 45-, or 60-minute block. Extended blocks include more than half their time in silent listening and rest; they are not continuous voice practice. Microphone use is optional. Pause or finish early at any time, then save a comfort reflection.
5. Record up to two minutes, listen, and explicitly save the clip on your device or download it. Only one temporary clip is held at a time.
6. Export progress and download clips for backups. Guest practice and all recordings stay local. Profiles, preferences, and session summaries remain in this browser. Guest history can be copied into a profile; recordings stay with their original owner.

## Deploy with GitHub Pages

The repository includes `.github/workflows/pages.yml`, which tests and deploys only the static app assets.

1. In **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
2. In **Actions → Verify and deploy Voice Studio**, run the workflow on `main` (or push a commit).
3. Wait for the deployment to succeed. Open the URL displayed by the deployment job, normally `https://trueyouaura.github.io/voice-studio/`.
4. Future pushes to `main` test and deploy automatically. No secrets or package installation are needed for Pages. Profiles need no backend setup.

[GitHub’s publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

If your connector cannot write workflow files, the app also supports **Deploy from a branch → main → /(root)**. `.nojekyll` disables Jekyll. This fallback serves the repository files publicly and bypasses the test gate; the Actions artifact is preferable because it includes only public runtime assets.

Any HTTPS static host can serve these files together: `profiles.js`, `profiles-store.js`, `index.html`, `styles.css`, `themes.css`, `themes.js`, `app.js`, `pitch.js`, `pitch-worker.js`, `routines.js`, `storage.js`, `favicon.svg`. All asset URLs are relative, so project subpaths work. Configure JavaScript as `text/javascript`, disable directory listing, and optionally add response headers `Permissions-Policy: microphone=(self), camera=()` and `X-Content-Type-Options: nosniff`. CSP is supplied in the HTML; a hosting header can additionally enforce `frame-ancestors 'none'`.

## Local preview and tests

Requires Node.js 22 or newer; there are no packages to install.

```sh
npm start
# http://127.0.0.1:4173
npm test
```

For browser integration checks, open `http://127.0.0.1:4173/__test` and click **Run integration checks**. The development fixture supplies a synthetic 180 Hz audio stream, not a physical microphone. It checks the worker, actual MediaRecorder encoding, IndexedDB, session timing, note escaping, denied permission, and cancellation. It restores session/settings storage afterward. Test fixture files are excluded from the Pages artifact.

Open `http://127.0.0.1:4173/__accounts` and click **Run profile checks** for local-profile checks. These verify creation, edits, theme and history separation, guest isolation, reload persistence, recording ownership, and deletion. No network or physical microphone is used.

## Architecture and limits

- Web Audio Analyser reads 4096-sample frames; a module worker runs a YIN difference estimator at about 12.5 updates/second. Confidence gating and a quiet-signal gate reject uncertain input. Three-frame median smoothing stabilizes the display. Detection range: 65–650 Hz. Chart gaps mean silence or uncertain input; summaries use voiced samples, not silence.
- The tracker estimates fundamental frequency only. Breathiness, fry, noise, strong harmonics, or multiple voices can cause gaps or octave errors. It is not clinical instrumentation. The app does not estimate formants, resonance, gender, or passing.
- MediaRecorder chooses a supported WebM/Opus, MP4, or Ogg format, with the browser default as a fallback. Native audio controls handle playback. Recordings are capped at two minutes; downloads preserve the actual container extension.
- Settings and up to 500 session summaries use `localStorage` (`voice-studio-v1`). Explicitly saved clip blobs use IndexedDB (`voice-studio-clips`). Storage-full/blocked errors provide recovery guidance; temporary clips can still be downloaded. Profiles are keyed by random IDs, recordings are filtered by their owner, and guest-history copying requires confirmation. No data syncs. Storage is not encrypted and remains accessible to someone with access to this browser profile.
- Microphone capture requires a user action, HTTPS or localhost, and browser permission. Cancelling pending permission stops any subsequently granted stream. Disconnect, tab hiding, page exit, and playback stop capture. Backgrounding pauses guided practice; reconnecting is explicit.
- Semantic navigation, headings, labels, native controls, keyboard focus, a skip link, reduced-motion support, visible status/error feedback, text chart summaries, and responsive layouts support accessibility. Pitch numbers are not announced on every frame. No third-party fonts or scripts.
- Audio stays local. The hosting provider sees ordinary page requests. Guest notes and clips are available to other users of the same browser profile. Profiles are not password-protected. Anyone with access to this browser user can select any saved profile. Clearing browser data/private browsing can erase them. Downloads are separate files and are not deleted by the app’s local-data deletion control.

## Vocal care

Practice with easy volume, normal breathing, and rests between brief repetitions. Never force pitch, squeeze the throat, or manually force larynx position. Stop for pain, tightness, fatigue, or worsening hoarseness. Avoid practice while hoarse or ill. Seek a voice-specialized speech-language pathologist/clinician for persistent symptoms or individualized guidance. Breathing difficulty requires urgent medical attention.

The guidance reflects the broad principles in [ASHA’s gender-affirming voice resource](https://www.asha.org/practice-portal/professional-issues/gender-affirming-voice-and-communication/) and [NIDCD’s vocal-care guidance](https://www.nidcd.nih.gov/health/taking-care-your-voice). The exercises are gentle educational prompts, not prescribed treatment or a promise of passing.

## Verification scope

Deterministic tests cover sine and harmonic-rich tones at 44.1/48 kHz, silence/DC/low input/noise rejection, median summaries, routine durations, and stored-state validation. Browser checks use synthetic audio in Chromium. Responsive and keyboard flows are inspected separately. Actual microphone hardware and iOS/Safari/Firefox devices require a user device smoke test; support is based on standard browser APIs rather than claimed physical-device certification.


## Device-local profiles

Open **Profile** to create, select, rename, or delete a profile. Each profile has its own goal, theme, pitch range, sessions, and recordings. Guest practice remains separate. Changing profiles is blocked until an active session, review, or temporary recording is finished. The last selected profile is restored on reload. Deleting a profile removes its practice and recordings; deleting practice data keeps the profile name and goal. Other profiles are unaffected.

Nothing contacts Supabase or an email provider. The CSP blocks network connections. Existing guest data and previously cached account practice stay on the device; cached account profiles are recovered as local profiles when available. Browser sign-in tokens from the previous version are removed locally. No remote data is fetched or erased. Export progress and download clips for backups. Browser data deletion can erase profiles permanently. Profiles are an organizational feature, not encryption or access control for a shared browser.
