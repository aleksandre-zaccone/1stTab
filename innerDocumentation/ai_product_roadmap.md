# AI Feature Roadmap for 1stTab

As a Product Owner, I've analyzed the current market landscape for AI Chrome extensions (like Monica, Sider, Harpa, and Merlin) alongside what is technically possible using modern Chrome Extension APIs and multi-modal LLMs.

Here is my recommended feature roadmap for 1stTab, organized by user impact and engineering effort.

## Phase 1: High-Impact, Low-Effort (Quick Wins)

These features leverage our existing side panel and basic Chrome APIs (`chrome.scripting`, `chrome.contextMenus`, `chrome.tts`).

### 1. Context-Aware Page Summarization (The "TL;DR" Button)
- **Feature:** A button in the chat panel: *"Summarize Current Page"*.
- **How it works:** Use `chrome.scripting.executeScript` to extract the `document.body.innerText` (or use Mozilla's `Readability.js` to strip out ads/nav). Inject this text into the chat as context.
- **User Value:** Instantly digest long articles, Reddit threads, or documentation.

### 2. Right-Click Context Menu Actions
- **Feature:** Highlight any text on any webpage, right-click, and see AI actions: *"Explain this"*, *"Summarize"*, *"Translate"*, or *"Add to 1stTab Notes"*.
- **How it works:** Use the `chrome.contextMenus` API. When clicked, it opens our Side Panel and immediately prompts the AI with the highlighted text.
- **User Value:** Frictionless interaction. The user doesn't even need to open the panel first to get answers.

### 3. Native Text-to-Speech (Read Aloud)
- **Feature:** A "Play" icon next to AI responses to read the answer aloud.
- **How it works:** Use the native `chrome.tts` (Text-to-Speech) API. It's 100% free, requires no external API keys, and supports multiple languages natively through the OS.
- **User Value:** Accessibility and multitasking. Users can listen to summaries while browsing other tabs.

## Phase 2: Medium-Effort (The "Wow" Factor)

These features require slightly more complex data handling or multi-modal capabilities.

### 4. YouTube Video Summarization
- **Feature:** When the user is on a YouTube tab, the chat panel recognizes it and offers a *"Summarize Video"* button.
- **How it works:** Fetch the YouTube transcript (either via an undocumented YouTube endpoint or parsing the DOM). Send the raw transcript to the AI.
- **User Value:** Extremely popular feature on competing extensions. Saves hours of watching tutorial videos.

### 5. "Chat with Screenshot" (Vision API)
- **Feature:** A "Screenshot" button in the chat input.
- **How it works:** Use `chrome.tabs.captureVisibleTab` to take a screenshot of the user's current viewport. Send the base64 image to GPT-4o, Claude 3.5, or Gemini Flash.
- **User Value:** Users can ask *"Why is this CSS broken?"* or *"Translate the text in this image"*. 

### 6. "Save to Markdown" / Export Feature
- **Feature:** Export the current AI conversation, or a summarized web page, directly to a `.md` file downloaded to the user's machine.
- **How it works:** Generate a Blob and use the `chrome.downloads` API.
- **User Value:** Great for researchers, developers, and students taking notes.

## Phase 3: High-Effort (Deep Integration)

### 7. In-Page Writing Assistant (Grammarly Alternative)
- **Feature:** Inject a floating 1stTab icon next to text areas (Gmail, Twitter, LinkedIn).
- **How it works:** Content scripts inject a Shadow DOM UI into the webpage. When the user clicks "Improve Writing" or "Reply", the AI streams the response directly into the webpage's `<textarea>`.
- **User Value:** Keeps the user in their flow without opening the side panel.

### 8. Local AI Privacy Mode (WebGPU / WebLLM)
- **Feature:** Run a small AI model entirely inside the browser.
- **How it works:** Use WebGPU and libraries like WebLLM to download a small quantized model (e.g., Llama-3 8B or Gemma 2B) to the browser cache. 
- **User Value:** Zero API costs, infinite usage, 100% privacy for sensitive web pages (no data sent to Anthropic/OpenAI).

---

### 💡 Product Recommendation for Next Steps
If you agree with this roadmap, I recommend we start by building **Phase 1: Context-Aware Page Summarization**. It provides the most immediate value, teaches our extension how to read the active tab securely, and sets the foundation for almost everything else!
