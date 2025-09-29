#!/usr/bin/env node

/**
 * Trigger Catalog Update Script
 * 
 * This script triggers a GitHub repository dispatch event to update the catalog feed.
 * You can run this manually when you need immediate catalog updates.
 */

import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Kiran-Lokesh';
const REPO_NAME = 'satvik-site-builder';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.error('💡 Create a Personal Access Token with repo permissions and add it to .env.local');
  process.exit(1);
}

async function triggerCatalogUpdate() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`;
  
  const payload = {
    event_type: 'update-catalog',
    client_payload: {
      trigger: 'manual',
      timestamp: new Date().toISOString(),
      reason: 'Manual catalog update requested'
    }
  };

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'satvik-catalog-updater'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Catalog update triggered successfully!');
          console.log('🔄 GitHub Action is now running to update the catalog');
          console.log('⏱️  This usually takes 2-3 minutes to complete');
          resolve(data);
        } else {
          console.error(`❌ Failed to trigger catalog update: ${res.statusCode}`);
          console.error(`Response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error triggering catalog update:', error.message);
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Run the script
console.log('🚀 Triggering catalog update...');
console.log(`📦 Repository: ${REPO_OWNER}/${REPO_NAME}`);
console.log('');

triggerCatalogUpdate()
  .then(() => {
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Check the Actions tab in your GitHub repository');
    console.log('2. Wait for the "Webhook Update Catalog" workflow to complete');
    console.log('3. Your catalog will be updated at: https://satvikfoods.ca/catalog-feed.csv');
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Failed to trigger catalog update');
    process.exit(1);
  });
