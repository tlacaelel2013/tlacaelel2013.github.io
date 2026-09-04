# AI-mericans GitHub 1.3 — Controlled Turns + Current Civics

An upload-ready, self-contained GitHub Pages classroom with bundled Wllama 3.4.0. The learner chooses a GGUF stored on their own device; no GGUF model is included or uploaded.

Preserved stations: browser-local Chat Room, Civics & ESL, Listen, Read Along, Pronunciation Bridge, and local text-document retrieval.

Included from 1.2:

- Student-controlled continuous dictation with Start/Stop and eight recognition languages.
- Naturalization interview rehearsal: check-in, N-400 review, English, and civics stages.
- English, bilingual-coaching, and translated-practice modes. This is an educational simulation, not USCIS or legal advice.
- DuckDuckGo Instant Answers with a full-search fallback.
- Optional OpenAI-compatible API connection using the student's own key. The key is kept only in the open browser tab and is not included in this site.

New in 1.3:

- A controlled Civics Quiz state machine: AI-mericans asks one question, waits, and reveals the accepted answer only after the student submits.
- Separate **Listen to Question**, **Start/Stop Dictation**, **Submit My Answer**, and **Next Question** actions prevent the model from speaking over the learner.
- Time-sensitive President and Vice President questions are intercepted outside the GGUF and use a dated September 2, 2026 fact card checked against the USCIS Test Updates page.
- Ordinary chat still uses the local model, but its system prompt warns that other changing officeholder answers require verification.

Local GGUF chat, the controlled civics questions, and the built-in interview can work without internet. Browser speech recognition, DuckDuckGo, and API providers may require internet depending on the browser and platform.

## Test on a Mac

Double-click `START-AI-MERICANS.command`. If macOS blocks it, right-click it and choose Open. In the page, choose `qwen2-0.5b-instruct-q4_k_m.gguf`, press **LOAD LOCAL GGUF**, and ask a question.

## Publish on GitHub Pages

Upload the *contents* of this directory to the `AI-mericans` directory of the website repository. Keep the directory names exactly as supplied. Do not upload a GGUF model.
