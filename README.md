<p align="center">
  <img src="logo.svg" width="80" height="80" alt="True You Voice heart and waveform logo">
</p>

# True You Voice

A True You Aura project. A place to explore your voice, build confidence, and practice at your own pace.

**[Open True You Voice](https://trueyouaura.github.io/True-You-Voice/)**

## What you can do

- See your pitch live, with a chart of the last 30 seconds.
- Try warmups and resonance exercises, or choose guided sessions up to an hour with plenty of rest.
- Record short clips, listen back, and download the ones you want to keep.
- Create a local profile for your goals, pronouns, settings, and practice history.
- Make the space your own with 28 appearances, including monochrome and high-contrast options.
- Choose a labeled pitch guide or set your own comfortable range.
- Back up and restore profiles, history, preferences, and optional recordings between devices.

Pitch is one part of voice. The guides are starting examples, not scores or rules about gender.

## Getting started

Open the site, go to **Studio**, and choose **Connect microphone**. Allow microphone access, then speak naturally. You can also use guided practice without a microphone.

First-time visitors start in Transgender Dark. Saved appearance choices are kept.

In **Settings**, create a profile, choose your appearance, and adjust your tagline, pronouns, and pitch guide. Use **Save pitch range** to apply a guide or your own limits.

## Your practice stays yours

Audio is processed in your browser. Recordings, profiles, and notes stay on that device; there are no accounts, uploads, or analytics. The host still receives ordinary page requests.

Profiles do not automatically sync and are not password-protected. Other people using the same browser can switch between them. Download a full backup before clearing browser data or changing devices.

## Take care of your voice

Keep practice comfortable, take breaks, and stop if you feel pain, strain, or growing hoarseness. This is a practice tool, not medical care. The app’s **Voice care & privacy** page has more guidance and links to [ASHA](https://www.asha.org/practice-portal/professional-issues/gender-affirming-voice-and-communication/) and [NIDCD](https://www.nidcd.nih.gov/health/taking-care-your-voice).

## Run it locally

With Node.js 22 or newer:

```sh
npm start
```

Open [localhost:4173](http://127.0.0.1:4173). No package installation is needed.

```sh
npm test
```

See the [development guide](docs/DEVELOPMENT.md) for browser checks, project structure, and deployment.

## Feedback

[Send private feedback](https://docs.google.com/forms/d/e/1FAIpQLSfRU3ACTbaqj066-76gbAG_begX28x3xOAefmXgA1a9CtZsuQ/viewform?usp=header) through Google Forms. Contact information is optional. The website does not attach practice data, notes, or recordings. Responses are not published to GitHub.

Maintained by [True You Aura](https://github.com/trueyouaura).

## Backups and moving devices

Use Settings → Download full backup to save profiles, preferences, wording, history, and optional recordings. Choose a backup to restore on the other device. Restored profiles are separate copies; existing profiles are kept. Keep backup files private: they are unencrypted and can contain personal notes and audio. Temporary clips and unsaved form edits are excluded. Progress-only exports cannot be restored as full backups.

## Reading and comfort

Settings offers larger text, extra spacing, reduced movement, a manual or hidden pitch chart, and optional screen reader pitch summaries. Focus view hides extra practice panels while retaining controls and safety guidance. These choices belong to each local profile and travel in full backups. Reduced movement and comfortable spacing are the defaults.

Guided practice includes No countdown: use Next step when ready, pause at any point, and finish early. The session still ends after one hour. Instructions and progress work without sound or a microphone. Voice care includes a plain-language glossary.

Microphone sensitivity defaults to Desk distance for quieter speech. Nearby and Very quiet modes adjust the input floor and speech confidence cutoff. The input meter uses a logarithmic scale. Around 2 ft / 60 cm can work with a clear microphone signal; distance depends on the microphone, room noise, and system input level.

Speech capture requests browser noise suppression, echo cancellation, and automatic input level when supported. Analysis-only high-pass (60 Hz) and low-pass (1600 Hz) filters reduce rumble and hiss; recordings use the browser capture stream rather than the filtered analysis signal. YIN uses a shorter comparison window to follow changing speech. Desk and Very quiet modes tolerate more variation than Nearby mode, while rejecting unvoiced noise. Browser processing and physical microphone behavior vary by device.

Guided practice includes optional 20-second prompted recordings, playback, local save/download/discard, and pitch feedback relative to the user's chosen guide. The session pauses while recording. Feedback describes the last take's median, typical range, and fraction of tracked voiced frames within the snapshotted goal. Insufficient tracking produces input guidance; reported strain overrides range coaching. Feedback is temporary; saved clips remain available in Recordings. This is pitch feedback, not a judgment of resonance, gender, or vocal health.
