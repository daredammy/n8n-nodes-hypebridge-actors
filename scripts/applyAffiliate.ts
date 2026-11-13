import fs from 'fs';
import path from 'path';

const code = process.argv[2]?.trim();
if (!code || !/^[a-zA-Z0-9_-]+$/.test(code)) {
	console.error('Usage: npm run affiliate:apply -- <firstpromoter-fpr-code>');
	process.exit(1);
}

const readmePath = path.resolve(__dirname, '..', 'README.md');
const original = fs.readFileSync(readmePath, 'utf-8');

let updatedCount = 0;
const updated = original.replace(/https:\/\/apify\.com(?:\/[^\s)"'>]*)?/g, (rawUrl) => {
	const parsed = new URL(rawUrl);
	parsed.searchParams.set('fpr', code);
	updatedCount++;
	return parsed.toString().replace(/\/(?=\?fpr=)/, parsed.pathname === '/' ? '' : '/');
});

fs.writeFileSync(readmePath, updated, 'utf-8');
console.log(`Updated ${updatedCount} apify.com links in README.md with ?fpr=${code}`);
