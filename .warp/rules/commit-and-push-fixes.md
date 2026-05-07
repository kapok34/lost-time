# Commit and Push Fixes Immediately

## Rule
When I make any code fix, configuration change, or migration edit in a repository under version control, I must **commit and push** those changes immediately. I must NOT:

- Tell the user to "restart their dev server" without first pushing the fix
- Run local dev servers or tell the user to run `npm run dev` as a substitute for deploying the fix
- Leave fixes uncommitted in the working tree
- Assume the user will manually apply changes later

## Procedure
1. Make the fix
2. `git add -A`
3. `git commit -m "..."` (include `Co-Authored-By: Oz <oz-agent@warp.dev>`)
4. `git push`
5. Only then tell the user to refresh the live site

## Rationale
Live webapps are served from deployed builds (e.g., GitHub Pages, Vercel, Netlify). Local dev servers do not affect the live site. Uncommitted fixes are invisible to the user. Wasting time on SQL debugging or local testing when the real issue is an uncommitted code change wastes user credits and causes frustration.

## Exception
If the user explicitly asks me NOT to commit or push, or if there is no remote configured, skip the push step and explain why.
