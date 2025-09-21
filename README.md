<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI-Powered Context Analysis Tool

This repository contains the source code for an advanced AI-powered web application designed to assist in the analysis of complex case files, particularly in the legal and human rights domains. The tool provides a suite of features to help users manage documents, extract key information, identify connections and contradictions, and build a comprehensive understanding of their case data.

## 🌟 Features

- **📄 Document Management**: Upload, view, and manage case-related documents.
- **🤖 AI-Powered Analysis**: Leverage the Gemini API for various analytical tasks, including semantic analysis, contradiction detection, and entity extraction.
- **🧠 Knowledge Graph**: Visualize relationships between entities, documents, and events in an interactive graph.
- **📈 KPI Tracking**: Monitor key performance indicators relevant to the case.
- **⚖️ Legal & Ethical Analysis**: Specialized tools for analyzing legal bases, ethical considerations, and compliance with UN procedures.
- **✍️ Content Generation**: Assists in drafting reports and other documents.
- **🗺️ Strategy Support**: Provides tools to help formulate case strategies.
- ** chronology & Timelines**: Analyze the temporal sequence of events.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **AI**: Google Gemini
- **UI Components**: Custom-built components
- **Styling**: (Not specified, likely CSS/SCSS or a framework)

## 🚀 Getting Started

This guide will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- A [Google Gemini API Key](https://ai.google.dev/)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**

    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application should now be running on `http://localhost:5173` (or another port if 5173 is in use).

## 📁 Project Structure

The repository is organized as follows:

```
/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable React components (UI, modals, tabs)
│   ├── constants/        # Application-wide constants
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Core application logic and AI service integrations
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── App.tsx           # Main application component
│   ├── index.tsx         # Entry point of the application
│   └── ...
├── .gitignore
├── package.json
├── README.md
└── vite.config.ts
```

## 🤝 Contributing

(Optional: Add guidelines for contributing to the project here.)

## 📄 License

(Optional: Add license information here.)
