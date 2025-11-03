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

## ⚠️ Important Notes

- Make sure to keep your API key private - never commit `.env.local` to version control
- This app requires microphone permissions to function
- Works best in modern browsers (Chrome, Firefox, Edge)

## 🙏 Acknowledgments

- Built with [Google Gemini AI](https://ai.google.dev/)
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
