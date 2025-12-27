# Git Branch Analyzer with Ollama

A powerful local tool for analyzing git branch differences with AI-powered insights using Ollama. Runs completely on your machine with no cloud dependencies.

## Features

- Compare any two git branches locally
- View detailed statistics (files changed, insertions, deletions)
- Get AI-powered code analysis using local Ollama models
- Detect potential errors and warnings
- Beautiful, responsive UI
- No cloud dependencies - runs entirely on your OS

## Prerequisites

1. **Node.js and npm**
   - Download from [nodejs.org](https://nodejs.org)
   - Version 16 or higher

2. **Ollama Installation**
   - Download and install from [ollama.ai](https://ollama.ai)
   - Install a model: `ollama pull llama2` (or any other model)
   - Ensure Ollama is running: `ollama serve`

3. **Git**
   - Install git from [git-scm.com](https://git-scm.com)
   - Already installed on most systems

## Installation

1. Download/clone this project
2. Navigate to the project directory:
   ```bash
   cd git-branch-analyzer
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

There are two ways to run this:

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev
```
This starts both the React frontend (port 5173) and the Node.js backend (port 3001) simultaneously.

### Option 2: Run Separately
In terminal 1 (frontend):
```bash
npm run client
```

In terminal 2 (backend):
```bash
npm run server
```

### Important: Start Ollama First
Before using the analyzer, make sure Ollama is running:
```bash
ollama serve
```

## How to Use

1. **Enter Project Path**: Provide the full path to your git repository (e.g., `/Users/yourname/projects/my-app`)
2. **Specify Branches**:
   - Main Branch: Your stable branch (e.g., "main" or "master")
   - Feature Branch: The branch you want to compare (e.g., "feature/new-feature")
3. **Configure Ollama** (optional):
   - Ollama API URL: Default is `http://localhost:11434`
   - Model Name: Choose any installed model (default: "llama2")
4. **Click "Analyze Branches"**: The tool will:
   - Compare the branches using git diff
   - Show file-by-file changes
   - Provide AI analysis of the code changes
   - Highlight potential errors and warnings

## What You'll See

- **Statistics Dashboard**: Files changed, insertions, and deletions
- **Issues Panel**: Detected errors and warnings from AI analysis
- **File Changes**: Detailed breakdown of which files were modified
- **AI Analysis**: Comprehensive review of code changes including:
  - Summary of changes
  - Potential bugs or issues
  - Code quality concerns
  - Security considerations
  - Improvement suggestions

## Ollama Models

You can use any Ollama model installed on your system:
- `llama2` - General purpose, good for most tasks
- `codellama` - Optimized specifically for code analysis
- `mistral` - Faster, lightweight model
- `deepseek-coder` - Specialized for code review
- `neural-chat` - Good balance of speed and quality

To install a new model:
```bash
ollama pull <model-name>
```

To see all installed models:
```bash
ollama list
```

## Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── AnalysisForm.tsx      # Input form component
│   │   └── AnalysisResults.tsx   # Results display component
│   ├── App.tsx                    # Main app component
│   └── main.tsx                   # Entry point
├── server.js                      # Express backend (git & Ollama operations)
├── package.json                   # Dependencies
└── README.md                      # This file
```

## Troubleshooting

### "Ollama connection failed"
- Make sure Ollama is running: `ollama serve`
- Verify the Ollama API URL is correct (default: `http://localhost:11434`)
- Check that you have an Ollama model installed: `ollama list`

### "Git diff failed"
- Verify the project path is correct and points to a valid git repository
- Ensure both branches exist: `git branch -a`
- Check that you have read permissions for the repository

### "Cannot connect to server"
- Make sure the backend is running: `npm run server`
- Check that port 3001 is available
- Look at the terminal output for error messages

### "Port 3001 already in use"
- Another application is using port 3001
- Kill the process using the port, or modify the port in `server.js`

### Ollama model is slow
- This is normal for the first run - models are being loaded into memory
- Consider using a smaller model like `mistral` for faster analysis
- Larger models like `llama2` provide better analysis but are slower

## Building for Production

To create an optimized production build:
```bash
npm run build
```

This generates optimized files in the `dist/` directory.

## Technology Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js + Express.js
- **Version Control**: Git
- **AI**: Ollama (local models)
- **UI Components**: Lucide React icons

## Notes

- This application runs entirely on your machine - no data is sent to external servers
- Git operations are performed locally using the git command-line tool
- AI analysis is done locally using your Ollama installation
- All processing happens in real-time on your OS

## License

MIT
