@echo off
REM DocFind Hugo Module - Windows Test Runner
REM Usage: test\test.bat

echo Running DocFind Tests...
node "%~dp0run-tests.js" %*
