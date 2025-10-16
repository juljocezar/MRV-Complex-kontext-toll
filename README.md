<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MRV-Assistent: AI-Powered Human Rights Documentation Tool

The **MRV-Assistent** (Menschenrechtsverletzungen-Assistent) is a powerful, AI-driven web application designed to assist human rights defenders, lawyers, and researchers in systematically documenting and analyzing human rights violations. It provides a comprehensive suite of tools to manage case files, extract structured information, identify connections, and generate reports, all while leveraging the power of modern AI models.

## Core Methodology: The HURIDOCS "Events" Standard

This application is built upon the robust and widely-respected **HURIDOCS "Events" methodology** for documenting human rights violations. This standard provides a structured way to record complex situations by breaking them down into their fundamental components:

-   **Events:** An incident with a beginning and an end (e.g., a protest, an arrest campaign).
-   **Acts:** Specific actions that occur within an event (e.g., an arbitrary detention, an act of torture).
-   **Participants:** The individuals or groups involved, categorized by their roles (Victim, Perpetrator, Source, etc.).

By adhering to this methodology, the MRV-Assistent ensures that data is recorded in a consistent, structured, and analyzable format, which is crucial for advocacy, legal proceedings, and reporting.

## Key Features

-   **Document Management:** Upload and manage case documents (PDFs, text files, etc.).
-   **AI-Powered Analysis:** Automatically run a deep analysis on each document to extract summaries, classify document types, and suggest relevant tags.
-   **Structured Data Extraction:** Implements the HURIDOCS standard by automatically identifying and structuring **Events**, **Acts**, and **Participants** from document text.
-   **Entity Management:** Maintain a central database of all case entities (people, organizations, locations) and use AI to analyze their relationships.
-   **Interactive Knowledge Graph:** Visualize the complex network of relationships between entities in your case.
-   **Chronology View:** Automatically build and view a timeline of all documented events.
-   **Contradiction Detection:** Let the AI scan all documents to find and flag contradictory statements.
-   **Strategic Insights:** Generate high-level insights, risk assessments, and strategic recommendations based on the complete case file.
-   **Document Generation:** Create new documents (e.g., case summaries, formal letters, UN submissions) using predefined and customizable templates, powered by AI.
-   **HRD Support Tools:** Specialized tools for Human Rights Defenders, including risk analysis and secure communication planning.
-   **Full Case Export/Import:** Easily back up and share your entire case file as a single JSON file.

## Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing.

### Prerequisites

You must have [Node.js](https://nodejs.org/) installed on your system (which includes npm).

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/mrv-kontext-tool.git
    cd mrv-kontext-tool
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    -   Copy the example environment file:
        ```sh
        cp .env.example .env
        ```
    -   Open the newly created `.env` file and add your Google Gemini API key. You can obtain a key from [Google AI Studio](https://ai.studio.google.com/).
        ```
        API_KEY="YOUR_GEMINI_API_KEY"
        ```

### Running the Application

Once the setup is complete, you can run the application in development mode:

```sh
npm run dev
```

This will start the Vite development server, and you can view the application by navigating to the URL provided in your terminal (usually `http://localhost:5173`).

## Project Structure

-   `public/`: Contains static assets like `index.html`.
-   `src/`: The main source code directory.
    -   `components/`: Contains all React components, organized by function:
        -   `modals/`: Modal dialog components.
        -   `tabs/`: Components for each of the main application tabs.
        -   `ui/`: General-purpose, reusable UI components (buttons, charts, etc.).
    -   `constants/`: Application-wide constants, such as agent profiles.
    -   `hooks/`: Custom React hooks.
    -   `services/`: Contains the application's business logic, especially for interacting with the AI and the local database.
    -   `types/`: Home to all TypeScript type and interface definitions.
    -   `utils/`: Helper functions used across the application.
-   `App.tsx`: The root component of the application.
-   `index.tsx`: The main entry point that renders the React app.

## Developer Experience (VS Code)

This repository includes a `.vscode` directory to enhance the development experience in Visual Studio Code.

-   **Recommended Extensions (`.vscode/extensions.json`):** This file suggests a list of VS Code extensions that are highly recommended for working on this project. When you open the project in VS Code, you will be prompted to install these extensions if you don't already have them. This helps ensure a consistent development environment with proper linting, formatting, and language support.

-   **Launch & Debug Configuration (`.vscode/launch.json`):** This file provides a pre-configured launch profile for debugging the application. To use it:
    1.  Go to the "Run and Debug" panel in VS Code (Ctrl+Shift+D).
    2.  Select "Launch Chrome and Debug" from the dropdown menu.
    3.  Press the green play button (F5).

    This will automatically start the development server (`npm run dev`) and launch a new Chrome instance connected to the VS Code debugger, allowing you to set breakpoints, inspect variables, and step through the code in the browser.