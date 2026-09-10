# Khmer Voice Generator

A complete, working web application that converts Khmer text into clear, natural-sounding Khmer speech using Google Cloud Text-to-Speech.

## Features
- **High-Quality Khmer Pronunciation**: Utilizes Google's standard Khmer voices (`km-KH-Standard`) to ensure clear and correct pronunciation, supporting Khmer Unicode perfectly.
- **Conversational Warm Style**: Features an energetic, conversational, and warm speech style by default, designed to prevent robotic reading and give a natural overlapping pacing suitable for podcasts and videos.
- **Long Text Support**: Automatically divides long scripts (greater than 1500 characters) into natural chunks (by sentences/paragraphs), processes them, and seamlessly merges them back into a single audio file.
- **Downloadable Audio**: Provides a direct download of the merged audio in MP3 format.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+ recommended)
- A Google Cloud Platform (GCP) Account with billing enabled.

### 2. Enable Google Cloud API & Get Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Search for **Cloud Text-to-Speech API** and click **Enable**.
4. Go to **APIs & Services > Credentials**.
5. Click **Create Credentials > Service Account**. Follow the prompts.
6. Once created, click on the service account, go to the **Keys** tab, and click **Add Key > Create new key > JSON**.
7. Download the JSON file to your computer. Keep it secure!

### 3. Install the Application
Clone this repository or navigate to its directory, then run:

```bash
npm install
```
*(During install, `ffmpeg-static` will automatically download a local FFmpeg binary needed to merge long audio segments).*

### 4. Configuration
1. Rename the `.env.example` file to `.env.local` (or create a new `.env.local` file).
2. Add your Google Cloud credentials path:
```env
# Absolute path to the JSON key you downloaded
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/google-cloud-key.json
```

### 5. Running the App Locally
Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Enter Text**: Paste your Khmer text into the main text area. The app correctly processes numbers, dates, times, and proper names via Google's TTS engine.
2. **Select Voice**: Choose between 4 official Khmer voices (2 Female, 2 Male).
3. **Speech Style**: 
   - **Conversational Warm (Default)**: Uses a finely tuned speaking rate (+5%) and pitch (+1 semitone) setting to achieve a connected, non-robotic flow without cutting off words. This approximates the instruction "Normal, slightly overlapping pacing. Tone is energetic, conversational, and warm."
4. **Generate**: Click **Generate Audio**. For very long texts, the backend will safely chunk the text by paragraphs and punctuation (`។`, `៕`), generate each segment, and stitch them perfectly together without large gaps.
5. **Listen & Download**: Play the preview directly. When satisfied, click **Download Audio (MP3)** to save it to your machine with a timestamped filename.

## Technical Details
- **Frontend**: Next.js (App Router), React, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes (`/api/tts`).
- **TTS Engine**: `@google-cloud/text-to-speech`. Standard voices are chosen because they offer the most robust and consistent Khmer pronunciation quality on the market today.
- **Audio Processing**: Long scripts are chunked into safe sizes to bypass API limits. `fluent-ffmpeg` (powered by `ffmpeg-static`) concatenates the audio segments into a single file on the backend before delivering it to the client.

## Deployment
If deploying to a platform like Vercel or Railway, ensure that the deployment environment supports executing `ffmpeg`. Standard Next.js serverless functions on Vercel have file system limits and might not support heavy ffmpeg usage. For production with long-script support, deploying on a VPS, Docker, Render, or Railway is recommended so the server can handle temp files and audio merging.
