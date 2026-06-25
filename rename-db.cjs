const fs = require('fs');
const files = [
  'src/components/dashboard/PlatformMetricsChart.tsx',
  'src/components/dashboard/PortfolioMetricsSection.tsx',
  'src/db/schema.ts',
  'src/functions/macro.ts',
  'src/lib/mockData.ts',
  'src/routes/index.tsx',
  'tests/backend/macro.test.ts',
  'tests/ui/PortfolioMetricsSection.test.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/velocityIndexScore/g, 'averageCommunityGrowth');
  content = content.replace(/velocity_index_score/g, 'average_community_growth');
  content = content.replace(/weightedVelocity/g, 'averageCommunityGrowth');
  fs.writeFileSync(file, content);
}
