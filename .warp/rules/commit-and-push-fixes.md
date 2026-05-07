# Commit and Push Fixes

## Rule
When I make code fixes, configuration changes, or migration edits in a repository under version control, I must always **commit** them. However, I must **ask the user** before pushing, to check if they have additional edits to make. I must NOT:

- Tell the user to "restart their dev server" without first committing the fix
- Run local dev servers or tell the user to run `npm run dev` as a substitute for deploying the fix
- Leave fixes uncommitted in the working tree
- Assume the user will manually apply changes later
- Push automatically without asking

## Procedure
1. Make the fix
2. `git add -A`
3. `git commit -m "..."` (include `Co-Authored-By: Oz <oz-agent@warp.dev>`)
4. Ask the user: "Should I push now, or do you have more edits to make?"
5. Only push if the user says yes
6. Only then tell the user to refresh the live site

## Rationale
Live webapps are served from deployed builds (e.g., GitHub Pages, Vercel, Netlify). Local dev servers do not affect the live site. Uncommitted fixes are invisible to the user. However, pushing automatically without asking can be inefficient if the user has multiple related changes to make. Committing ensures work is saved; asking before pushing respects the user's workflow.

## Exception
If the user explicitly asks me NOT to commit or push, or if there is no remote configured, skip the step and explain why.
