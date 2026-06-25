const fs = require('fs');
const glob = require('glob');

// Use hardcoded files rather than glob for safety
const files = [
  'src/data/subreddits.ts',
  'src/lib/mockData.ts',
  'src/lib/calculations.ts',
  'src/functions/macro.ts',
  'src/functions/metrics.functions.ts',
  'src/routes/index.tsx',
  'src/components/dashboard/PortfolioMetricsSection.tsx',
  'src/scripts/sync-tracking-groups.ts',
  'src/scripts/transform-subs.ts',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Strip lines that purely define the arpu/monetization properties in objects
  content = content.replace(/^\s*(arpuExpectation|arpuMultiplier|monetizationWeight)\s*:\s*.*?,?\n/gm, '');
  
  // For subreddits.ts, also strip the imports of ArpuExpectation
  content = content.replace(/ArpuExpectation,\s*/g, '');
  
  // For mockData.ts
  content = content.replace(/monetizationWeight: group\.monetizationWeight \?\? 1\.0,?\n/g, '');
  
  // For PortfolioMetricsSection "ARPU Velocity Trend" -> "Velocity Trend"
  content = content.replace(/"ARPU Velocity Trend"/g, '"Velocity Trend"');

  // Strip from metric.functions.ts and sync-tracking-groups sql`EXCLUDED...`
  content = content.replace(/^\s*monetizationWeight:.*?,?\n/gm, '');
  content = content.replace(/^\s*arpuExpectation:.*?,?\n/gm, '');
  content = content.replace(/^\s*arpuMultiplier:.*?,?\n/gm, '');

  fs.writeFileSync(file, content);
  console.log('Stripped', file);
}
