# PowerShell script to move remaining test files
Write-Host "🔄 Moving remaining test files to tests directory..."

$rootPath = "c:\Users\Development\Desktop\TouchAfrica"
$testsPath = "c:\Users\Development\Desktop\TouchAfrica\tests"

# Get all test files still in root
$testFiles = Get-ChildItem -Path $rootPath -Filter "test-*" -File

Write-Host "Found $($testFiles.Count) test files to move:"

$moved = 0
$skipped = 0
$errors = 0

foreach ($file in $testFiles) {
    $sourcePath = $file.FullName
    $targetPath = Join-Path $testsPath $file.Name
    
    try {
        if (Test-Path $targetPath) {
            Write-Host "⏭️  Already exists: $($file.Name)"
            $skipped++
        }
        else {
            Move-Item -Path $sourcePath -Destination $targetPath -Force
            Write-Host "✅ Moved: $($file.Name)"
            $moved++
        }
    }
    catch {
        Write-Host "❌ Error moving $($file.Name): $($_.Exception.Message)"
        $errors++
    }
}

# Move other test-related files
$otherPatterns = @(
    "simple-*.js",
    "debug-*.js",
    "create-test*.mjs",
    "create-valid-test*.mjs",
    "verify-*.mjs",
    "diagnose-*.mjs",
    "dashboard-inspection*.mjs",
    "debug-admin*.mjs",
    "sample-*.mjs",
    "setup-*.mjs",
    "fix-*.mjs",
    "replace-*.mjs",
    "update-*.mjs"
)

foreach ($pattern in $otherPatterns) {
    $files = Get-ChildItem -Path $rootPath -Filter $pattern -File
    foreach ($file in $files) {
        $sourcePath = $file.FullName
        $targetPath = Join-Path $testsPath $file.Name
        
        try {
            if (Test-Path $targetPath) {
                Write-Host "⏭️  Already exists: $($file.Name)"
                $skipped++
            }
            else {
                Move-Item -Path $sourcePath -Destination $targetPath -Force
                Write-Host "✅ Moved: $($file.Name)"
                $moved++
            }
        }
        catch {
            Write-Host "❌ Error moving $($file.Name): $($_.Exception.Message)"
            $errors++
        }
    }
}

Write-Host ""
Write-Host "📊 MOVE SUMMARY:"
Write-Host "================"
Write-Host "✅ Moved: $moved files"
Write-Host "⏭️  Skipped: $skipped files"
Write-Host "❌ Errors: $errors files"

# Final verification
$remainingTests = (Get-ChildItem -Path $rootPath -Filter "test-*" -File).Count
$testsInDir = (Get-ChildItem -Path $testsPath -Filter "*.mjs" -File).Count

Write-Host ""
Write-Host "📋 FINAL STATUS:"
Write-Host "================"
Write-Host "📄 Test files remaining in root: $remainingTests"
Write-Host "📁 Total .mjs files in tests/: $testsInDir"

if ($remainingTests -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! All test files moved to tests/ directory!"
}
else {
    Write-Host ""
    Write-Host "⚠️  Some test files may still be in root directory"
}
