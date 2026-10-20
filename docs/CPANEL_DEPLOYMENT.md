# cPanel Shared Hosting CI/CD Deployment Guide

This repository includes automated CI/CD for deploying to any shared hosting running cPanel (e.g. Namecheap, Hostinger, Bluehost, cPanel on Linux VPS).

---

## Method 1: Automated GitHub Actions to cPanel (Recommended)

Every push to the `main` branch automatically:
1. Runs `npm ci` and builds the production bundle with Vite.
2. Injects your Supabase and Cloudflare R2 environment variables.
3. Ensures `public/.htaccess` is deployed to `public_html/` for proper React Router SPA URL rewriting.
4. Securely uploads the built files to your cPanel hosting via FTPS.

### Required GitHub Secrets
Go to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Value Example | Description |
|---|---|---|
| `CPANEL_FTP_SERVER` | `ftp.yourdomain.com` or server IP | Your cPanel FTP host |
| `CPANEL_FTP_USERNAME` | `deployer@yourdomain.com` | Dedicated cPanel FTP account username |
| `CPANEL_FTP_PASSWORD` | `YourSecurePassword123` | FTP account password |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase public anonymous key |
| `VITE_CLOUDFLARE_R2_CDN` | `https://cdn.wrishu.com` | Cloudflare custom domain or worker CDN |
| `VITE_WORKER_UPLOAD_URL` | `https://upload-signer...` | Cloudflare R2 upload worker URL |

---

## Method 2: cPanel Git Version Control (`.cpanel.yml`)

If your cPanel hosting supports SSH/Node:
1. In cPanel, navigate to **Git™ Version Control**.
2. Click **Create**, paste your repository clone URL: `https://github.com/rahatcodes/photography-wrishu.git`.
3. Set the repository path and branch to `main`.
4. The included `.cpanel.yml` will automatically copy `dist/*` and `.htaccess` to `public_html/`.
