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
| `logo.svg`, `favicon.svg` | Brand mark |

Pitch analysis uses a YIN difference estimator on 4096-sample frames, at roughly 12.5 updates per second. Quiet-signal and confidence gates reject uncertain input; a three-frame median smooths the display. The estimation range is 65–650 Hz. Silence and uncertain sound leave chart gaps.

The tracker measures fundamental frequency, not resonance, gender, or how a voice will be perceived. Noise, vocal fry, breathiness, and strong harmonics can cause gaps or octave errors.

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
