# Test Files Migration to tests/ Directory
# PowerShell script to move all test-related files from root to tests/

Write-Host "🚀 Starting Test Files Migration to tests/ Directory" -ForegroundColor Green
Write-Host "=" * 60

# Ensure tests directory exists
if (-not (Test-Path "tests")) {
    New-Item -ItemType Directory -Path "tests" -Force
    Write-Host "✅ Created tests directory" -ForegroundColor Green
}

# Get all test files in root directory
$testFiles = @(
    "test-*.mjs",
    "test-*.js", 
    "setup-*.mjs",
    "debug-*.mjs",
    "*-test.mjs",
    "comprehensive-*.mjs",
    "database-diagnostic.mjs",
    "demo-*.mjs",
    "diagnose-*.mjs",
    "validate-*.mjs",
    "verify-*.mjs"
)

$movedCount = 0
$skippedCount = 0
$errorCount = 0

foreach ($pattern in $testFiles) {
    $files = Get-ChildItem -Path . -Filter $pattern -File | Where-Object { $_.DirectoryName -eq (Get-Location).Path }
    
    foreach ($file in $files) {
        $fileName = $file.Name
        $sourcePath = $file.FullName
        $targetPath = Join-Path "tests" $fileName
        
        try {
            # Check if file already exists in tests/
            if (Test-Path $targetPath) {
                Write-Host "⚠️  SKIP: $fileName (already exists in tests/)" -ForegroundColor Yellow
                $skippedCount++
            } else {
                # Move the file
                Move-Item -Path $sourcePath -Destination $targetPath -Force
                Write-Host "✅ MOVED: $fileName → tests/" -ForegroundColor Green
                $movedCount++
            }
        } catch {
            Write-Host "❌ ERROR moving $fileName : $($_.Exception.Message)" -ForegroundColor Red
            $errorCount++
        }
    }
}

# Summary
Write-Host ""
Write-Host "=" * 60
Write-Host "📊 Migration Summary:" -ForegroundColor Cyan
Write-Host "✅ Files moved: $movedCount" -ForegroundColor Green
Write-Host "⚠️  Files skipped: $skippedCount" -ForegroundColor Yellow
Write-Host "❌ Errors: $errorCount" -ForegroundColor Red

# List remaining test files in root (if any)
$remainingTests = Get-ChildItem -Path . -Filter "test-*" -File | Where-Object { $_.DirectoryName -eq (Get-Location).Path }
if ($remainingTests.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Remaining test files in root:" -ForegroundColor Yellow
    foreach ($file in $remainingTests) {
        Write-Host "  - $($file.Name)" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "🎉 All test files successfully moved to tests/ directory!" -ForegroundColor Green
}

# Show tests directory contents
Write-Host ""
Write-Host "📂 Current tests/ directory contents:" -ForegroundColor Cyan
Get-ChildItem -Path "tests" -File | Sort-Object Name | ForEach-Object {
    Write-Host "  ✓ $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🏁 Migration completed!" -ForegroundColor Green
