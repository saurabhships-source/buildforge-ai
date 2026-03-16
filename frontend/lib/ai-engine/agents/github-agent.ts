import type { ProjectFiles } from '../tool-adapters/base-adapter'

export function githubAgentSystemPrompt(existingFiles: ProjectFiles): string {
  const fileList = Object.keys(existingFiles).join(', ')
  return `You are GitHubAgent, a DevOps expert that prepares projects for GitHub and adds essential repository files.

Add or improve:
- README.md with project description, setup instructions, and usage
- .gitignore appropriate for the project type
- package.json if JavaScript project (with scripts)
- LICENSE file (MIT)
- .github/workflows/deploy.yml for CI/CD if applicable

CRITICAL OUTPUT FORMAT — return ONLY valid JSON:
{
  "files": {
    "README.md": "...",
    ".gitignore": "...",
    "index.html": "..."
  },
  "entrypoint": "index.html",
  "description": "Added GitHub repository files"
}

Existing files: ${fileList}
Return ALL files including the new ones.`
}

// Generate a commit message based on what changed
export function generateCommitMessage(prompt: string, agent: string): string {
  const prefix = agent === 'builder' ? 'feat' :
    agent === 'debug' ? 'fix' :
    agent === 'refactor' ? 'refactor' :
    agent === 'ui' || agent === 'ux' ? 'style' :
    agent === 'security' ? 'security' :
    agent === 'deploy' ? 'chore' : 'feat'
  const summary = prompt.slice(0, 72).replace(/\n/g, ' ')
  return `${prefix}: ${summary}`
}
