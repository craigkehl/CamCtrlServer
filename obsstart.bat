if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit
@echo off
title obs

start "C:\Program Files\obs-studio\bin\64bit\obs64.exe"