if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit
@echo off
title CAMAPI
call C:\Repo\churchBeta\Node\CamCtrlServer\dist\app.js