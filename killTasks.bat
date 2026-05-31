@echo off
taskkill /IM "Zoom.exe" /F
cscript C:\repos\stake\CamCtrlServer\sendkeys.vbs
timeout /T 3 /NOBREAK
taskkill /IM "obs64.exe" /F
timeout /T 3 /NOBREAK
start "" "C:\repos\stake\startmeeting.bat"
