@echo off
rem Serve the isolated "tbtest" Web profile of the local DeepSeek Harness on
rem port 3099, for checking this plugin without touching the Desktop profile.
rem The profile links this folder (dsh plugin --profile tbtest add <this dir>),
rem so edits here show up on the next page load (host-half edits need a restart).
setlocal
set "DSH_ROOT=D:\tools\deepseek-harness"
set "DSH_HOME=%DSH_ROOT%\data"
set "PATH=%DSH_ROOT%\.node\node-v24.19.0-win-x64;%DSH_ROOT%\runtime\node_modules\.bin;%PATH%"
set "TEMP=%LOCALAPPDATA%\Temp"
set "TMP=%LOCALAPPDATA%\Temp"
cd /d "%DSH_ROOT%\runtime"
node node_modules\@deepseek-ai\dsh\lib\bin.js --profile tbtest --port 3099 --no-open
