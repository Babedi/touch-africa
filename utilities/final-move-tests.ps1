# Move all test files from root to tests directory
$testFiles = Get-ChildItem -Path . -File | Where-Object { 
    $_.Name -like "test-*" -or 
    $_.Name -like "setup-*" -or 
    $_.Name -like "debug-*" -or 
    $_.Name -like "verify-*" -or 
    $_.Name -like "diagnose-*" -or 
    $_.Name -like "dashboard-*" -or 
    $_.Name -like "sample-*data*" -or 
    $_.Name -like "create-*test*" -or
    $_.Name -like "create-*credentials*" -or
    $_.Name -like "*migration*.mjs" -or
    $_.Name -like "move-*.ps1"
}

Write-Host "Found $($testFiles.Count) test-related files to move:"
$moved = 0
$skipped = 0

foreach ($file in $testFiles) {
    $targetPath = Join-Path "tests" $file.Name
    
    if (Test-Path $targetPath) {
        Write-Host "SKIP: $($file.Name) (already exists)" -ForegroundColor Yellow
        $skipped++
    } else {
        try {
            Move-Item $file.FullName $targetPath -Force
            Write-Host "MOVE: $($file.Name)" -ForegroundColor Green
            $moved++
        } catch {
            Write-Host "ERROR: Failed to move $($file.Name) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`nSummary: Moved $moved files, Skipped $skipped files" -ForegroundColor Cyan
