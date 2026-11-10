# Contributing to Drafter

Thank you for contributing to Drafter! This document outlines our repository workflow, branching strategy, commit standards, and synchronization procedures.

---

## 1. Branching Strategy

We follow a simplified **Trunk-Based / GitHub Flow** model:

- `main`: Production-ready, stable codebase. Direct pushes to `main` should be protected via branch protection rules in GitHub.
- `feature/<feature-name>`: New features (e.g., `feature/docx-table-exporter`, `feature/github-sync`).
- `fix/<bug-name>`: Bug fixes (e.g., `fix/tiptap-selection-sync`).
- `chore/<task-name>`: Tooling, dependency updates, configuration.

---

## 2. Conventional Commits Standard

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Allowed Types
- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation changes only.
- `style`: Changes that do not affect the meaning of the code (formatting, missing semi-colons).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `chore`: Changes to build process, auxiliary tools, or libraries.

### Example Commits
```bash
feat(editor): add speculative streaming indicator for section drafts
fix(backend): import Optional type in FastAPI main entrypoint
chore(git): configure monorepo GitHub Actions CI and pre-commit
```

---

## 3. Local Development & Sync Workflow

### Initial Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-org>/Drafter.git
   cd Drafter
   ```
2. Copy environment templates:
   ```bash
   cp .env.example .env
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```
4. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

### Daily Synchronization Script
We provide a safe, automated synchronization tool that validates code health, catches accidental binary/large-file additions, and pulls/rebases cleanly:

- **PowerShell (Windows):**
  ```powershell
  .\scripts\git-sync.ps1
  ```
- **Bash (macOS / Linux):**
  ```bash
  chmod +x scripts/git-sync.sh
  ./scripts/git-sync.sh
  ```

---

## 4. Pre-Commit Hooks

To ensure large files (>25MB) or private keys are never committed, enable pre-commit:

```bash
pip install pre-commit
pre-commit install
```

---

## 5. Pull Request Process

1. Create a feature branch: `git checkout -b feature/my-cool-feature`
2. Implement your changes following project style rules.
3. Verify tests and linting pass locally:
   - Frontend: `npm run lint` & `npx tsc --noEmit`
   - Backend: `python -m compileall backend/app` & `pytest tests`
4. Commit using conventional commit format.
5. Push to GitHub and open a Pull Request using the PR template.
6. Ensure all GitHub Actions CI checks turn green.
