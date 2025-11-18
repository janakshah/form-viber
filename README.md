# Form Viber - Agentic Form Generator

An intelligent form generation system powered by AI agents, using Gemini 2.5 Flash, Daytona sandboxes, and Galileo observability.

## Features

- **AI-Powered Form Generation**: Describe your form in natural language, and AI generates the complete form structure
- **Dynamic Form Rendering**: Automatically renders forms with TextInput, DatePicker, Dropdown, Checkbox, and DynamicForm components
- **Firestore Integration**: Stores form definitions and submissions in Firebase Firestore
- **Agentic Architecture**: Uses Agent Builder pattern with Daytona sandboxes and Galileo observability
- **Three Main Screens**:
  1. **Form Generator** (`/`): Create forms from text descriptions
  2. **Form Renderer** (`/form/[formId]`): Fill out generated forms
  3. **Results Viewer** (`/[formId]/results`): View form submissions in JSON format

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore enabled
- API keys for:
  - Gemini (Google AI Studio)
  - Daytona (for sandbox functionality)
  - Galileo (optional, for observability)

## Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your API keys:
   - `GEMINI_API_KEY` (required)
   - `DAYTONA_API_KEY` (required for sandbox functionality)
   - `GALILEO_API_KEY` (optional, for observability)

3. **Configure Firebase**:
   - The Firebase configuration is already set in `src/lib/firebase.ts`
   - Ensure Firestore is enabled in your Firebase project
   - The app uses two collections:
     - `forms`: Stores form definitions
     - `formResults`: Stores form submissions

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Create a Form**: 
   - Go to the home page (`/`)
   - Enter a description like: "I need a form for collecting birthdate, name, email, and family members"
   - Click "Generate Form"
   - The AI agent will create a form structure and save it to Firestore

2. **Fill Out a Form**:
   - Click on any form in the sidebar or navigate to `/form/[formId]`
   - Fill out the form fields
   - Click "Submit Form"

3. **View Results**:
   - Navigate to `/[formId]/results` to see all submissions for a form
   - Results are displayed in JSON format

## Architecture

### Agent System
- **Agent 1 (Form Generator)**: Takes free text and generates form data models
  - Uses Gemini 2.5 Flash model
  - Runs in Daytona sandbox
  - Logs to Galileo for observability

### Components
- `src/lib/agentBuilder.ts`: Core agent orchestration
- `src/lib/geminiExecutor.ts`: Gemini API integration
- `src/lib/daytonaManager.ts`: Daytona sandbox management
- `src/lib/galileoClient.ts`: Galileo observability client
- `src/lib/firestore.ts`: Firestore operations
- `src/lib/agents/formGeneratorAgent.ts`: Agent 1 definition

### API Routes
- `POST /api/forms/create`: Create a new form using Agent 1
- `GET /api/forms`: List all forms
- `GET /api/forms/[formId]`: Get form definition
- `POST /api/forms/[formId]/submit`: Submit form data
- `GET /api/forms/[formId]/results`: Get form results

## Environment Variables

See `.env.example` for all available environment variables.

**Required**:
- `GEMINI_API_KEY`: Google Gemini API key
- `DAYTONA_API_KEY`: Daytona API key for sandbox functionality

**Optional**:
- `GALILEO_API_KEY`: Galileo API key for observability
- `GALILEO_PROJECT`: Galileo project name (default: "form-viber")
- `GALILEO_LOG_STREAM`: Galileo log stream name (default: "agent-calls")
- `DAYTONA_API_URL`: Daytona API URL (default: "https://api.daytona.io")

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **AI Model**: Google Gemini 2.5 Flash
- **Sandbox**: Daytona
- **Observability**: Galileo
- **Styling**: Tailwind CSS

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Google Gemini API](https://ai.google.dev/)
- [Daytona](https://daytona.io)
- [Galileo AI](https://www.galileo.ai)
