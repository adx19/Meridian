import logging
from app.services.ai_providers.gemini_provider import (generate_with_gemini)
import json
AI_PROVIDER = "gemini"
# Truncation limits for chat prompt context. Keep reasonably large to allow README context.
README_TRUNCATE_LIMIT = 7000  # previously 7000 characters
logger = logging.getLogger(__name__)


def test_gemini():
    return generate_with_gemini(
        "Hello from Meridian"
    )


def generate_repository_chat_response(repository, commits, question, intelligence=None):
    """
    Generate a chat response using repository metadata, a small set of recent commits, and cached intelligence when available.
    - `commits` should be the latest commits intended for the chat (we expect up to 5 here).
    - `intelligence` if provided should be a RepositoryIntelligence instance (from the DB); do not regenerate in this function.
    """
    if AI_PROVIDER != "gemini":
        raise RuntimeError(f"Unsupported AI provider: {AI_PROVIDER}")

    logger.info("[AI] Using Gemini provider for repository chat")
    context = build_repository_chat_context(repository, commits, intelligence)
    prompt = build_repository_chat_prompt(repository, context, question)

    logger.info("[AI] Prompt sent to Gemini for repository '%s'", repository.name)
    logger.info("[AI] Prompt content:\n%s", prompt)

    response = generate_with_gemini(prompt)
    return response.strip()


def build_repository_chat_prompt(repository, context, question):
    return f"""
You are Meridian's Repository Conversation Assistant.

Use only the repository information provided in the context below.
Do not invent facts, do not hallucinate, and do not guess.
If the answer is not contained in the provided repository context, respond:
"I don't have enough information to answer that from the repository data."

Answer the user's question directly in plain text, without markdown code fences.

Repository Context:
{context}

User question:
{question}
"""


def build_repository_chat_context(repository, commits, intelligence=None):
    """Build a compact repository context for the chat prompt.

    Includes:
    - repository metadata (name, description, primary language, stars)
    - truncated README (if present)
    - cached intelligence fields (summary, development_update, current_focus, completed_milestones, potential_risks, main_technologies)
    - up to the provided commits (expected 5): each with sha, message, diff preview

    Keep each section concise to avoid large prompts.
    """
    # Repository metadata
    repo_meta = f"Repository Name: {repository.name}\nRepository Description: {repository.description or 'No description available'}\nPrimary Language: {repository.language or 'Unknown'}\nStars: {getattr(repository, 'stars', 'N/A')}\n"

    # Truncate README to a safe length (respecting existing behavior if any). Use 3000 chars here as a reasonable cap.
    readme = (repository.readme or "No README available")
    readme_trunc = readme if len(readme) <= README_TRUNCATE_LIMIT else readme[:README_TRUNCATE_LIMIT] + "... [truncated]"

    # Intelligence (if available)
    intel_section = ""
    if intelligence:
        # Some fields may be JSON/list types; convert to newline bullets where appropriate
        completed = getattr(intelligence, 'completed_milestones', []) or []
        risks = getattr(intelligence, 'potential_risks', []) or []
        techs = getattr(intelligence, 'main_technologies', []) or []

        intel_section = (
            f"Repository Intelligence:\n"
            f"Summary: {getattr(intelligence, 'summary', '') or 'N/A'}\n"
            f"Development Update: {getattr(intelligence, 'development_update', '') or 'N/A'}\n"
            f"Current Focus: {getattr(intelligence, 'current_focus', '') or 'N/A'}\n"
            f"Completed Milestones:\n{chr(10).join(f'- {m}' for m in completed) if completed else 'None'}\n"
            f"Potential Risks:\n{chr(10).join(f'- {r}' for r in risks) if risks else 'None'}\n"
            f"Technologies: {', '.join(techs) if techs else 'None'}\n"
        )

    # Commits: include sha, message and a short diff preview per commit
    commit_lines = []
    for c in (commits or [])[:5]:
        sha = getattr(c, 'sha', '')[:7]
        msg = getattr(c, 'message', '').replace('\n', ' ').strip()
        diff = getattr(c, 'diff', '') or ''
        # keep a small preview of diff to avoid huge prompts
        diff_preview = diff if len(diff) <= 800 else diff[:800] + '\n... [truncated]'
        commit_lines.append(f"- {sha}: {msg}\n  Diff preview:\n{diff_preview}")

    commits_section = "Recent Commits (latest 5):\n" + (chr(10).join(commit_lines) if commit_lines else "None")

    context = "\n\n".join([repo_meta, f"README:\n{readme_trunc}", intel_section, commits_section])
    return context

def generate_repository_intelligence(repository, commits):
  if AI_PROVIDER != "gemini":
    raise RuntimeError(f"Unsupported AI provider: {AI_PROVIDER}")


  logger.info("[AI] Using Gemini provider")
  prompt = build_intelligence_prompt(repository, commits)
  logger.info("[AI] Prompt sent to Gemini for repository '%s'", repository.name)
  logger.info("[AI] Prompt content:\n%s", prompt)
  response = generate_with_gemini(prompt)
  response = response.replace("```json", "")
  response = response.replace("```" ,"")
  response = response.strip()

  data = json.loads(response)

  return data;

def build_repository_context(repository, commits):
    latest_commits = [commit.message for commit in commits[:10] if commit.message]

    context = f"""
Repository Name:
{repository.name}

Repository Description:
{repository.description or "No description available"}

Primary Language:
{repository.language or "Unknown"}

README:
{repository.readme or "No README available"}

Recent Commit Messages:
{chr(10).join(f"- {commit}" for commit in latest_commits)}
"""

    return context

def build_intelligence_prompt(repository, commits):
    context = build_repository_context(repository, commits)

    prompt = f"""
You are Meridian's Repository Intelligence Engine.

Analyze the repository using ONLY the information provided.

Never invent information.
If something cannot be determined, explicitly state that instead of guessing.

Return ONLY valid JSON.
Do not wrap the JSON in markdown code blocks.
Do not include explanations, notes, or any text outside the JSON object.
Ensure every field from the required JSON schema is present.

{{
  "summary": "...",

  "development_update": "...",

  "project_insights": {{
    "current_focus": "...",
    "completed_milestones": [
      "...",
      "..."
    ],
    "potential_risks": [
      "...",
      "..."
    ]
  }},

  "next_priorities": [
    "...",
    "...",
    "..."
  ],

  "main_technologies": [
    "...",
    "..."
  ]
}}

Summary Requirements:
- Maximum 3 sentences.
- Maximum 90 words.
- Begin with "<Repository Name> is..."
- Explain:
  1. What the repository is.
  2. What it does.
  3. What this repository contains or its role.
- Write like the opening paragraph of a professional README.
- Do not mention technologies.
- Do not mention recent development.
- Do not use:
  - "This project"
  - "The project"
  - "appears"
  - "likely"
  - "seems"
- If the repository's purpose cannot be determined, explicitly state that.

Development Update Requirements:
- Maximum 120 words.
- Base the response ONLY on the provided README and recent commit messages.
- Summarize the major areas of development during the recent development cycle.
- Highlight completed work only if it is clearly supported by the provided information.
- Mention the current development focus if it can be inferred.
- Do not invent features, milestones, or future plans.
- If there is insufficient information, return:
  "There is insufficient information to determine the recent development progress."

Project Insights Requirements:
- Return a JSON object containing:
    - current_focus
    - completed_milestones
    - potential_risks
- current_focus should describe the primary area of development in one concise sentence.
- completed_milestones should include only work that is explicitly supported by the README or recent commit messages.
- potential_risks should identify possible gaps such as missing documentation, testing, deployment configuration, or unfinished areas ONLY if they can reasonably be inferred from the provided information.
- Never invent milestones or risks.
- If something cannot be determined, return:
    - current_focus: "Cannot determine current focus."
    - completed_milestones: []
    - potential_risks: []

Next Priorities Requirements:
- Return between 3 and 5 recommendations.
- Recommendations must logically follow from the current repository state.
- Prioritize unfinished or actively developed areas.
- Each recommendation must be one concise sentence.
- Do not recommend work that has already been completed.
- If there is insufficient information, return an empty array.

Technology Requirements:
- Return only technologies that are explicitly identifiable from the README, repository description, or primary language.
- Return them as a JSON array.
- Do not infer technologies that are not explicitly mentioned.

Use the README as the primary source of truth for understanding the repository.
Use the repository description and recent commit messages to supplement the README.
Never contradict or invent information that is not supported by the provided repository context.

Repository Information:

{context}
"""
    return prompt