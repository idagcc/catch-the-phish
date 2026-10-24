@echo off
setlocal
cd /d "%~dp0"
if exist "%~dp0Catch the Phish.exe" (
  start "" "%~dp0Catch the Phish.exe"
  exit /b 0
)
if exist "%~dp0win-unpacked\Catch the Phish.exe" (
  start "" "%~dp0win-unpacked\Catch the Phish.exe"
  exit /b 0
)
for %%F in ("%~dp0Catch-the-Phish-*-Windows-x64.exe") do (
  if exist "%%~fF" (
    start "" "%%~fF"
    exit /b 0
  )
)
echo The game could not be found.
echo Extract the complete Windows ZIP, then run Launch.cmd from that folder.
pause
exit /b 1
