@echo off
echo 🔧 Tasks.json Fix Script
echo ========================
echo.
echo Step 1: Backing up current tasks.json...
copy .vscode\tasks.json .vscode\tasks.json.backup
echo ✅ Backup created

echo.
echo Step 2: Replacing with clean version...
del .vscode\tasks.json
copy docs\clean-tasks-final.json .vscode\tasks.json
echo ✅ Clean version copied

echo.
echo Step 3: Verifying file...
powershell -Command "$json = Get-Content '.vscode\tasks.json' | ConvertFrom-Json; Write-Host 'Tasks found:' $json.tasks.Count"

echo.
echo 🎉 Tasks.json has been fixed!
echo.
echo 💡 If VS Code still shows errors:
echo 1. Close VS Code completely
echo 2. Reopen VS Code
echo 3. The JSON validation should be clean
echo.
pause
