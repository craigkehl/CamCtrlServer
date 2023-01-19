if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit
@echo off
title CAMAPI
call C:\Repo\church-2023\CamCtrlServer\dist\app.js