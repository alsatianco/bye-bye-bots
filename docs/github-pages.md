# Hosting the Privacy Policy (GitHub Pages)

If your code is on GitHub, you can host the privacy policy for free using GitHub Pages.

## Option A (quickest): Pages from `docs/`

1. Push this repo to GitHub.
2. In GitHub: **Settings → Pages**
3. Set **Source** to: `Deploy from a branch`
4. Choose:
   - Branch: `main`
   - Folder: `/docs`
5. Save. GitHub will give you a URL like:
   - `https://<user>.github.io/<repo>/privacy-policy.html` (if you publish HTML)
   - or `https://<user>.github.io/<repo>/privacy-policy` (depending on setup)

## Notes
- GitHub Pages will render Markdown, but Chrome Web Store expects a stable public URL. If you want the cleanest result, you can also add an HTML file and link that.
- Update the contact section in `docs/privacy-policy.md` before publishing.
