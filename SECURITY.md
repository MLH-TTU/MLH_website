# Security Guidelines

## 🔒 Critical: Never Commit These Files

The following files contain sensitive information and should **NEVER** be committed to version control:

### Environment Variables
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`

### Firebase Credentials
- `firebase-admin-config.json`
- `*-firebase-adminsdk-*.json`
- `serviceAccountKey.json`

### API Keys and Certificates
- `*.key`
- `*.pem`
- `*.p12`
- `*.pfx`
- `secrets.json`
- `credentials.json`

### Database Files
- `*.db`
- `*.sqlite`
- `*.sqlite3`

## ✅ Safe to Commit

These files are safe to commit as they contain no sensitive data:

- `.env.example` - Template for environment variables (no actual values)
- `firebase.json` - Firebase configuration (no secrets)
- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules

## 🛡️ Best Practices

### 1. Use Environment Variables
Always store sensitive data in environment variables:

```bash
# ✅ Good
DATABASE_URL=your_database_url
API_KEY=your_api_key

# ❌ Bad - Never hardcode in source files
const apiKey = "sk_live_abc123xyz";
```

### 2. Create .env.example Files
Provide template files for other developers:

```bash
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
FIREBASE_PROJECT_ID=your-project-id
RESEND_API_KEY=your-resend-api-key
```

### 3. Check Before Committing
Always review your changes before committing:

```bash
git status
git diff
```

### 4. Use Git Hooks (Optional)
Consider using pre-commit hooks to prevent accidental commits:

```bash
# Install pre-commit hook
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run lint"
```

### 5. Rotate Compromised Credentials
If you accidentally commit sensitive data:

1. **Immediately** rotate all exposed credentials
2. Remove the sensitive data from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/sensitive/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push to remote (⚠️ coordinate with team first)
4. Update all deployment environments with new credentials

## 📋 Security Checklist

Before deploying or sharing your code:

- [ ] All `.env` files are in `.gitignore`
- [ ] No API keys or secrets in source code
- [ ] Firebase admin credentials are not committed
- [ ] Database credentials are in environment variables
- [ ] `.env.example` is up to date
- [ ] All team members have their own `.env.local` files
- [ ] Production secrets are stored in deployment platform (Vercel, etc.)

## 🚨 If You Accidentally Commit Secrets

1. **Stop immediately** - Don't push if you haven't already
2. **Remove the commit**:
   ```bash
   git reset HEAD~1
   ```
3. **If already pushed**:
   - Rotate ALL exposed credentials immediately
   - Contact your team
   - Follow the credential rotation process above

## 📞 Questions?

If you're unsure whether something should be committed, ask yourself:
- Would this information allow someone to access our systems?
- Does this contain passwords, API keys, or tokens?
- Is this specific to my local development environment?

If the answer to any of these is "yes", **don't commit it**.

## 🔗 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Firebase: Best practices for security](https://firebase.google.com/docs/rules/best-practices)
