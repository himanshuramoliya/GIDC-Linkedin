# Environment Variables Setup

This project uses environment variables for secure configuration, particularly for JWT secrets.

## Quick Setup

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Generate secure secrets:**
   
   You can generate secure random secrets using Node.js:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   
   Run this command twice to get two different secrets (one for JWT_SECRET, one for JWT_REFRESH_SECRET).

3. **Edit `.env` file:**
   
   Open `backend/.env` and replace the placeholder values:
   ```
   JWT_SECRET=your-generated-secret-here
   JWT_REFRESH_SECRET=your-generated-refresh-secret-here
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

## Environment Variables

- `JWT_SECRET`: Secret key for signing access tokens (minimum 32 characters, 64+ recommended)
- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens (minimum 32 characters, 64+ recommended)
- `PORT`: Server port (default: 5000)

## Security Notes

- ⚠️ **Never commit `.env` file to git** - it's already in `.gitignore`
- ⚠️ **Use different secrets for production** - never use the example values
- ⚠️ **Keep secrets secure** - don't share them or expose them in logs
- ✅ The `.env.example` file is safe to commit as a template

## Troubleshooting

If you see warnings about JWT secrets not being set:
- Make sure `.env` file exists in the `backend/` directory
- Check that the variable names match exactly (case-sensitive)
- Restart your server after creating/updating `.env`

