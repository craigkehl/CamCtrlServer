if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit
@echo off
setlocal

title CAMAPI
set "PORT=4000"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
	echo Port %PORT% is already in use by PID %%P. API is likely already running.
	goto :eof
)

node C:\Repo\church-2023\CamCtrlServer\dist\app.js