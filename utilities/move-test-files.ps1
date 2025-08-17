# PowerShell script to move test files to tests directory

Write-Host "Moving test files to tests directory..."

$sourceDir = "c:\Users\Development\Desktop\TouchAfrica"
$targetDir = "c:\Users\Development\Desktop\TouchAfrica\tests"

# Get all test files in the root directory
$testFiles = Get-ChildItem -Path $sourceDir -Filter "test-*.*" -File

Write-Host "Found $($testFiles.Count) test files to move"

foreach ($file in $testFiles) {
    try {
        $sourcePath = $file.FullName
        $targetPath = Join-Path $targetDir $file.Name
        
        Write-Host "Moving: $($file.Name)"
        Move-Item -Path $sourcePath -Destination $targetPath -Force
        Write-Host "✅ Moved: $($file.Name)"
    }
    catch {
        Write-Host "❌ Failed to move: $($file.Name) - $($_.Exception.Message)"
    }
}

# Move other test-related files
$otherTestFiles = @(
    "simple-console-test.js",
    "simple-tenant-test.js",
    "debug-tenant-user-modal.js",
    "debug-tenant-user-modal-elements.js",
    "create-test-credentials.mjs",
    "create-valid-test-credentials.mjs",
    "verify-interface-cleanup.mjs",
    "verify-light-mode.mjs",
    "verify-tenant-user-cleanup.mjs",
    "verify-tenant-user-structure.mjs",
    "diagnose-news-endpoint.mjs",
    "dashboard-inspection-summary.mjs",
    "debug-admin-creation.mjs"
)

foreach ($fileName in $otherTestFiles) {
    $filePath = Join-Path $sourceDir $fileName
    if (Test-Path $filePath) {
        try {
            $targetPath = Join-Path $targetDir $fileName
            Write-Host "Moving: $fileName"
            Move-Item -Path $filePath -Destination $targetPath -Force
            Write-Host "✅ Moved: $fileName"
        }
        catch {
            Write-Host "❌ Failed to move: $fileName - $($_.Exception.Message)"
        }
    }
    else {
        Write-Host "⚠️ File not found: $fileName"
    }
}

Write-Host "✅ Move operation completed!"
