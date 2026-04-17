---
name: recipe-keeper-playwright-login
description: Logs into the local Recipe Keeper app with Playwright CLI and saves authenticated browser state for reuse on Windows, macOS, and Linux.
---

# Recipe Keeper Playwright Login

Use this skill when you need an authenticated Playwright CLI session for local work in this repository.

## Defaults

- Base URL: `http://localhost:4200`
- Login route: `/login`
- Username: `marxlukas@gmail.com`
- Password: `12345678`
- Saved auth state: `.playwright-cli/auth-state.json`

## Preferred workflow

Run the cross-platform helper from the repository root:

```bash
node ./scripts/playwright-cli-login.js
```

The helper will:

1. Close any previous Playwright CLI browser session.
2. Open the login page.
3. Fill in the email and password fields.
4. Click `Sign in`.
5. Wait until navigation reaches `/recipes`.
6. Confirm that `localStorage.access_token` exists.
7. Save the authenticated browser state to `.playwright-cli/auth-state.json`.

## Environment overrides

Override defaults with environment variables when needed:

```bash
RECIPE_KEEPER_BASE_URL=http://localhost:4200 \
RECIPE_KEEPER_LOGIN_EMAIL=marxlukas@gmail.com \
RECIPE_KEEPER_LOGIN_PASSWORD=12345678 \
RECIPE_KEEPER_STATE_FILE=.playwright-cli/auth-state.json \
node ./scripts/playwright-cli-login.js
```

## Reusing the saved state

Load the saved session before further browser automation:

```bash
playwright-cli open http://localhost:4200
playwright-cli state-load .playwright-cli/auth-state.json
```

## Implementation files

- `scripts/playwright-cli-login.js`

## Notes

- `.playwright-cli` is already ignored by git in this repository.
- If the local dev server is not running, start it before using this helper.
- The login flow relies on the Angular login form selectors `formcontrolname="email"` and `formcontrolname="password"`.