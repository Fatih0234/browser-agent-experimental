#!/usr/bin/env node
/**
 * Benchmark Environment Reset Script
 * 
 * Automates the cleanup of Portal Gym before benchmark runs.
 * Ensures clean state for consistent benchmark results.
 */

const { chromium } = require('playwright');

const CONFIG = {
  baseUrl: 'http://localhost:3001',
  credentials: {
    email: 'test123@gmail.com',
    password: 'testpassword123'
  },
  orgSlug: 'demo-org',
  timeout: 30000
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resetBenchmarkEnvironment() {
  console.log('🔧 Portal Gym Benchmark Environment Reset\n');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Step 1: Sign In
    console.log('\n📍 Step 1: Sign In as Test User');
    await page.goto(`${CONFIG.baseUrl}/sign-in`);
    await page.fill('input[type="email"]', CONFIG.credentials.email);
    await page.fill('input[type="password"]', CONFIG.credentials.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|demo-org)$//, { timeout: CONFIG.timeout });
    console.log('   ✅ Signed in successfully');
    
    // Step 2: Reset Scenario Runs
    console.log('\n📍 Step 2: Reset Scenario Data');
    await page.goto(`${CONFIG.baseUrl}/${CONFIG.orgSlug}/admin/seed`);
    await delay(2000);
    
    // Find and reset any completed scenario runs
    const resetButtons = await page.locator('button:has-text("Reset")').all();
    console.log(`   Found ${resetButtons.length} scenario run(s) to reset`);
    
    for (let i = 0; i < resetButtons.length; i++) {
      try {
        await resetButtons[i].click();
        await delay(500);
        
        // Confirm in AlertDialog
        await page.click('button:has-text("Reset Data")');
        await delay(2000);
        console.log(`   ✅ Reset scenario run ${i + 1}`);
      } catch (e) {
        console.log(`   ⚠️ Could not reset run ${i + 1}: ${e.message}`);
      }
    }
    
    if (resetButtons.length === 0) {
      console.log('   ✅ No scenario runs to reset');
    }
    
    // Step 3: Clean Up Test Documents
    console.log('\n📍 Step 3: Clean Up Test Documents');
    await page.goto(`${CONFIG.baseUrl}/${CONFIG.orgSlug}/documents`);
    await delay(2000);
    
    // Find and delete test documents (those with 'test-' prefix or 'Benchmark' in name)
    const deleteButtons = await page.locator('button:has([class*="trash"]), button:has(.lucide-trash)').all();
    let deletedCount = 0;
    
    for (const btn of deleteButtons.slice(0, 20)) { // Limit to prevent accidents
      try {
        await btn.click();
        await delay(500);
        
        // Confirm deletion if prompted
        const confirmBtn = page.locator('button:has-text("Delete")');
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
          await delay(1000);
          deletedCount++;
        }
      } catch (e) {
        // Continue on error
      }
    }
    
    console.log(`   ✅ Deleted ${deletedCount} document(s)`);
    
    // Step 4: Verify Clean State
    console.log('\n📍 Step 4: Verify Clean State');
    
    // Check cases
    await page.goto(`${CONFIG.baseUrl}/${CONFIG.orgSlug}/cases`);
    await delay(2000);
    const caseCount = await page.locator('table tbody tr').count();
    console.log(`   Cases in system: ${caseCount} (persistent cases OK)`);
    
    // Check documents
    await page.goto(`${CONFIG.baseUrl}/${CONFIG.orgSlug}/documents`);
    await delay(2000);
    const docCount = await page.locator('table tbody tr').count();
    console.log(`   Documents in system: ${docCount}`);
    
    // Check admin seed page
    await page.goto(`${CONFIG.baseUrl}/${CONFIG.orgSlug}/admin/seed`);
    await delay(2000);
    const resetBtnCount = await page.locator('button:has-text("Reset")').count();
    console.log(`   Active scenario runs: ${resetBtnCount}`);
    
    // Step 5: Sign Out
    console.log('\n📍 Step 5: Sign Out');
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL(/\/sign-in/, { timeout: CONFIG.timeout });
    console.log('   ✅ Signed out successfully');
    
    // Final verification
    console.log('\n📍 Final Verification');
    await page.goto(`${CONFIG.baseUrl}/${CONFIG.orgSlug}/cases`);
    await delay(1000);
    const currentUrl = page.url();
    
    if (currentUrl.includes('/sign-in')) {
      console.log('   ✅ Protected route redirects to sign-in');
    } else {
      console.log('   ⚠️ Session may still be active');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Benchmark Environment Reset Complete!');
    console.log('='.repeat(50));
    console.log('\nEnvironment is ready for benchmark run.');
    console.log('Next steps:');
    console.log('  1. Start your benchmark agent');
    console.log('  2. Run benchmark tasks 1-10');
    console.log('  3. Record results in docs/benchmark-run-template.md');
    
  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure dev server is running on port 3001');
    console.error('  2. Check Supabase is connected');
    console.error('  3. Verify test user credentials');
    console.error('  4. Try manual reset via docs/benchmark-reset-checklist.md');
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  resetBenchmarkEnvironment();
}

module.exports = { resetBenchmarkEnvironment };
