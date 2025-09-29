# 🤖 Automatic Catalog Update Setup

This document explains how to set up automatic catalog updates so your WhatsApp catalog stays in sync with Sanity CMS changes.

## 🚀 What's Been Set Up

### 1. **Scheduled Updates (Every 6 Hours)**
- GitHub Action runs automatically every 6 hours
- Fetches latest data from Sanity and updates the catalog
- No manual intervention required

### 2. **Manual Trigger Options**
- **Web Interface**: Visit `https://satvikfoods.ca/trigger-catalog-update.html`
- **API Endpoint**: `https://satvikfoods.ca/api/trigger-update.html`
- **Command Line**: Run `npm run trigger-catalog-update`
- Useful when you make changes and want instant updates

### 3. **Webhook Support**
- Ready for Sanity webhook integration (future enhancement)
- Can be triggered by external services

## 📋 Setup Instructions

### Step 1: Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `VITE_SANITY_PROJECT_ID`: `eaaly2y1`
- `VITE_SANITY_DATASET`: `products` 
- `VITE_SANITY_TOKEN`: Your Sanity token

### Step 2: Enable GitHub Actions
1. Go to Actions tab in your repository
2. Enable workflows if prompted
3. The scheduled workflow will start running automatically

### Step 3: Manual Updates (Optional)
Create `.env.local` file with:
```bash
# For manual catalog updates
GITHUB_TOKEN=your_github_personal_access_token
```

To create a GitHub token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Add to `.env.local`

## 🔄 How It Works

### Automatic Updates
1. **Every 6 hours**: GitHub Action runs
2. **Fetches data**: Gets latest products from Sanity
3. **Generates CSV**: Creates updated catalog feed
4. **Commits changes**: Pushes to repository
5. **Updates website**: New catalog available at `https://satvikfoods.ca/catalog-feed.csv`

### Manual Updates
```bash
# Command line trigger
npm run trigger-catalog-update

# Or use the web interface
# Visit: https://satvikfoods.ca/trigger-catalog-update.html

# Or use the API endpoint
# GET: https://satvikfoods.ca/api/trigger-update.html
```

## 📱 WhatsApp Integration

1. **In Meta Commerce Manager**:
   - Use this URL: `https://satvikfoods.ca/catalog-feed.csv`
   - Set sync frequency to "Every 6 hours" or "Daily"

2. **The catalog will automatically update**:
   - ✅ New products added to Sanity
   - ✅ Product images changed in Sanity
   - ✅ Product prices updated in Sanity
   - ✅ Product descriptions modified in Sanity
   - ✅ Updates appear in WhatsApp within 6 hours

## 🎯 Benefits

- **No more manual updates**: Catalog stays fresh automatically
- **Regular sync**: Changes appear in WhatsApp within 6 hours
- **Reliable**: GitHub Actions are highly reliable
- **Traceable**: Full history of all catalog updates
- **Scalable**: Handles any number of product changes

## 🔧 Troubleshooting

### Catalog Not Updating?
1. Check GitHub Actions tab for failed runs
2. Verify Sanity secrets are correct
3. Run manual update: `npm run trigger-catalog-update`

### Images Not Showing?
1. Ensure images are properly uploaded in Sanity
2. Check that image URLs are accessible
3. Run catalog generation locally: `npm run generate-catalog`

### Need Immediate Updates?
Use the manual trigger:
```bash
npm run trigger-catalog-update
```

## 📊 Monitoring

- **GitHub Actions**: Check the Actions tab for workflow status
- **Catalog URL**: Visit `https://satvikfoods.ca/catalog-feed.csv` to see current catalog
- **Commit History**: See all automatic updates in git history

---

**🎉 That's it!** Your catalog will now automatically stay in sync with Sanity CMS changes. No more manual CSV updates needed!
