import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Final Test File Migration');
console.log('=' .repeat(50));

const testPatterns = [
    /^test-.*\.(mjs|js)$/,
    /^setup-.*\.mjs$/,
    /^debug-.*\.mjs$/,
    /^verify-.*\.mjs$/,
    /^diagnose-.*\.mjs$/,
    /^dashboard-.*\.mjs$/,
    /^sample-.*data.*\.mjs$/,
    /^create-.*(test|credential).*\.mjs$/,
    /.*migration.*\.mjs$/,
    /^move-.*\.(ps1|mjs)$/,
    /^complete-test.*\.mjs$/,
    /^migrate-.*\.ps1$/
];

// Ensure tests directory exists
if (!fs.existsSync('tests')) {
    fs.mkdirSync('tests');
    console.log('✅ Created tests directory');
}

// Get all files in current directory
const files = fs.readdirSync('.').filter(file => {
    const stat = fs.statSync(file);
    return stat.isFile();
});

let moved = 0;
let skipped = 0;
let errors = 0;

console.log(`\n📂 Found ${files.length} total files in root directory`);
console.log('🔍 Checking for test-related files...\n');

files.forEach(file => {
    const isTestFile = testPatterns.some(pattern => pattern.test(file));
    
    if (isTestFile) {
        const sourcePath = path.join('.', file);
        const targetPath = path.join('tests', file);
        
        try {
            // Check if target already exists
            if (fs.existsSync(targetPath)) {
                console.log(`⚠️  SKIP: ${file} (already exists in tests/)`);
                skipped++;
            } else {
                // Move the file
                fs.renameSync(sourcePath, targetPath);
                console.log(`✅ MOVED: ${file}`);
                moved++;
            }
        } catch (error) {
            console.log(`❌ ERROR: Failed to move ${file} - ${error.message}`);
            errors++;
        }
    }
});

console.log('\n' + '=' .repeat(50));
console.log('📊 Migration Summary:');
console.log(`✅ Files moved: ${moved}`);
console.log(`⚠️  Files skipped: ${skipped}`);
console.log(`❌ Errors: ${errors}`);

// List remaining test-like files in root
const remainingTestFiles = fs.readdirSync('.').filter(file => {
    const stat = fs.statSync(file);
    return stat.isFile() && testPatterns.some(pattern => pattern.test(file));
});

if (remainingTestFiles.length > 0) {
    console.log('\n⚠️  Remaining test files in root:');
    remainingTestFiles.forEach(file => console.log(`  - ${file}`));
} else {
    console.log('\n🎉 All test files successfully moved to tests/ directory!');
}

// Show final tests directory count
const testsFiles = fs.readdirSync('tests').filter(file => {
    const stat = fs.statSync(path.join('tests', file));
    return stat.isFile();
});

console.log(`\n📂 tests/ directory now contains ${testsFiles.length} files`);
console.log('🏁 Migration completed!');
