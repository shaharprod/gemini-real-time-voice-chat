# 🎤 Gemini Real-Time Voice Chat

A real-time voice chat application powered by Google Gemini AI. Speak naturally and have conversations with Gemini AI through voice input and audio output.

## ✨ Features

- 🎙️ **Real-time voice input** - Speak directly to the AI
- 🔊 **Audio output** - Listen to AI responses
- 💬 **Live transcription** - See your conversation as it happens
- ⚡ **Fast & responsive** - Built with React and Vite
- 🎨 **Modern UI** - Clean and intuitive interface

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gemini-real-time-voice-chat.git
   cd gemini-real-time-voice-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env.local` file in the root directory:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
   You can get your API key from: https://makersuite.google.com/app/apikey

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

6. **Allow microphone permissions**
   When prompted, allow your browser to access your microphone.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🛠️ Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **@google/genai** - Gemini AI SDK
- **Tailwind CSS** - Styling

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variable:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
4. Click Deploy

### Deploy to Netlify

1. Push your code to GitHub
2. Import your repository in [Netlify](https://netlify.com)
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
5. Click Deploy site

### Deploy to GitHub Pages

#### Option 1: Automatic Deployment with GitHub Actions (Recommended)

1. Go to your repository settings on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add a new secret:
   - Name: `GEMINI_API_KEY`
   - Value: Your Gemini API key
4. Push code to `main` branch - deployment happens automatically!
5. Go to **Settings** → **Pages**
6. Set source to: **GitHub Actions**
7. Your site will be available at: `https://yourusername.github.io/gemini-real-time-voice-chat`

#### Option 2: Manual Deployment

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build and deploy:
   ```bash
   npm run deploy
   ```
3. Configure GitHub Pages in repository settings:
   - Go to **Settings** → **Pages**
   - Source: `gh-pages` branch
   - Folder: `/ (root)`
4. Your site will be available at: `https://yourusername.github.io/gemini-real-time-voice-chat`

## ⚠️ Important Notes

### Security Warning ⚠️

**This is a client-side application** - the API key will be visible in the browser's JavaScript code when deployed. 

**Recommended security measures:**
- Use API key restrictions (IP/Domain limits) in Google Cloud Console
- Create a separate API key with low quotas for public demos
- For production apps, use a backend proxy instead (see [SECURITY_WARNING.md](SECURITY_WARNING.md))

### Other Notes

- Make sure to keep your API key private - never commit `.env.local` to version control
- When deploying, add `GEMINI_API_KEY` as an environment variable in your hosting platform
- This app requires microphone permissions to function
- Works best in modern browsers (Chrome, Firefox, Edge)
- HTTPS is required for microphone access in production

## 🙏 Acknowledgments

- Built with [Google Gemini AI](https://ai.google.dev/)
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
