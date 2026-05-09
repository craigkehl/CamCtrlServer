@echo off
taskkill /IM "Zoom.exe" /F
cscript C:\Repo\church-2023\CamCtrlServer\sendkeys.vbs
timeout /T 3 /NOBREAK
taskkill /IM "obs64.exe" /F
timeout /T 3 /NOBREAK
start "" "C:\Repo\church-2023\startmeeting.bat"
