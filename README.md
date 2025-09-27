<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This repository contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1ZyTGO917OocFkHsbn9BhaK47QO_9PJjT

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or later is recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Getting Started

Follow these steps to get your development environment set up:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    *   Create a new file named `.env.local` by copying the example file:
        ```bash
        cp .env.example .env.local
        ```
    *   Open `.env.local` and add your Gemini API key.

4.  **How to get a Gemini API key:**
    *   Go to [Google AI Studio](https://aistudio.google.com/).
    *   Click on **"Get API key"** in the top left corner.
    *   Create a new API key in a new or existing Google Cloud project.
    *   Copy the key and paste it into `.env.local`.

5.  **Run the application:**
    ```bash
    npm run dev
    ```
    Your application should now be running on `http://localhost:5173`.

## Project Structure

Here is an overview of the key directories in this project:

*   `src/components/`: Contains reusable React components.
*   `src/constants/`: Holds constant values used throughout the application.
*   `src/hooks/`: Custom React hooks for managing state and side effects.
*   `src/services/`: Modules for interacting with external APIs (like the Gemini API).
*   `src/types/`: TypeScript type definitions.
*   `src/utils/`: Utility functions that can be shared across the app.
*   `src/tests/`: Contains all the tests for the project.

## Available Scripts

In the project directory, you can run the following commands:

*   `npm run dev`: Runs the app in development mode.
*   `npm run build`: Builds the app for production to the `dist` folder.
*   `npm run preview`: Serves the production build locally for previewing.
*   `npm test`: Runs the test suite (to be added).

## Visual Studio Code Recommendations

If you are using Visual Studio Code, here are some recommended extensions for a better development experience:

*   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
*   [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
*   [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) (if you decide to use Tailwind)
*   [GitLens — Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens)