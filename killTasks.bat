@echo off
:: replace <ProcessName> with the name of your process
taskkill /IM "node.exe" /F
taskkill /IM "Zoom.exe" /F
cscript sendkeys.vbs
timeout /T 3 /NOBREAK
taskkill /IM "obs64.exe" /F

:: Start the processes again
timeout /T 3 /NOBREAK
start "" "C:\Repo\church-2023\startmeeting.bat"
