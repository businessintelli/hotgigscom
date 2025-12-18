/**
 * Initialize Default Budgets Script
 * 
 * Sets $500/month budget limits for all companies that don't have budgets configured
 */

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function initializeBudgets() {
  console.log('[Budget Init] Starting budget initialization...');
  
  try {
    const response = await fetch(`${API_URL}/api/trpc/budgetManagement.initializeDefaultBudgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log('[Budget Init] Success:', result);
    console.log(`[Budget Init] Initialized ${result.result.data.initialized} company budgets`);
    
  } catch (error) {
    console.error('[Budget Init] Error:', error.message);
    process.exit(1);
  }
}

initializeBudgets();
