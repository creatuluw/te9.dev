@echo off
REM te9 - Windows CMD Wrapper for te9.dev
REM Works on Windows 10/11 with Command Prompt
REM Usage: te9 install / te9 update / te9 status

setlocal enabledelayedexpansion

REM Configuration
set REPO=creatuluw/te9.dev
set BRANCH=main
set RAW_URL=https://raw.githubusercontent.com/%REPO%/%BRANCH%
set SCRIPT_URL=https://raw.githubusercontent.com/%REPO%/%BRANCH%/te9/te9
set TEMP_TE9=%TEMP%\te9-%RANDOM%.sh

REM Color codes for CMD
for /F "tokens=1,2 delims=#" %%a in ('echo prompt #$E#$E# ^| cmd') do set "ESC=%%b"
set GREEN=[92m
set RED=[91m
set YELLOW=[93m
set BLUE=[94m
set RESET=[0m

REM Helper functions
:log_info
echo %BLUE%ℹ%RESET% %~1
goto :eof

:log_success
echo %GREEN%✅%RESET% %~1
goto :eof

:log_warn
echo %YELLOW%⚠%%RESET% %~1
goto :eof

:log_error
echo %RED%❌%RESET% %~1
goto :eof

REM Detect Git Bash
:detect_gitbash
if exist "C:\Program Files\Git\bin\bash.exe" (
    set BASH_EXE="C:\Program Files\Git\bin\bash.exe"
    set GIT_BASH_FOUND=1
    goto :found_gitbash
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    set BASH_EXE="C:\Program Files (x86)\Git\bin\bash.exe"
    set GIT_BASH_FOUND=1
    goto :found_gitbash
)
where bash.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set BASH_EXE=bash.exe
    set GIT_BASH_FOUND=1
    goto :found_gitbash
)
set GIT_BASH_FOUND=0

:found_gitbash

REM Show help
:show_help
echo.
echo te9 - te9.dev Management Script ^(Windows CMD Wrapper^)
echo.
echo Usage:
echo   te9 [command]
echo.
echo Commands:
echo   install    - Install te9.dev in current directory
echo   update     - Update te9.dev to latest version
echo   status     - Check installation status
echo   version    - Show version information
echo   help       - Show this help message
echo.
echo Examples:
echo   te9 install
echo   te9 update
echo   te9 status
echo.
echo More Info:
echo   https://github.com/%REPO%
echo.
goto :eof

REM Show version
:show_version
echo te9.dev v1.0.0
echo Platform: Windows ^(CMD Wrapper^)
echo Repository: https://github.com/%REPO%
goto :eof

REM Download te9 script
:download_script
call :log_info "Downloading te9 script from GitHub..."
call :log_info "Source: %SCRIPT_URL%"

REM Use curl if available, otherwise use PowerShell
where curl >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    curl -fsSL %SCRIPT_URL% -o "%TEMP_TE9%"
    if %ERRORLEVEL% NEQ 0 (
        call :log_error "Failed to download te9 script using curl"
        goto :download_failed
    )
) else (
    call :log_info "curl not found, using PowerShell..."
    powershell -Command "& {Invoke-WebRequest -Uri '%SCRIPT_URL%' -OutFile '%TEMP_TE9%'}"
    if %ERRORLEVEL% NEQ 0 (
        call :log_error "Failed to download te9 script using PowerShell"
        goto :download_failed
    )
)

call :log_success "Downloaded: %TEMP_TE9%"
goto :eof

:download_failed
echo.
echo Error: Could not download te9 script
echo.
echo Please check your internet connection and try again.
echo.
echo Alternatively, you can download manually:
echo   %SCRIPT_URL%
echo.
exit /b 1

REM Run bash script with command
:run_bash_script
if not exist "%TEMP_TE9%" (
    call :log_error "te9 script not found. Downloading..."
    call :download_script
)

REM Check if Git Bash is available
if "%GIT_BASH_FOUND%"=="0" (
    call :log_warn "Git Bash not found on your system"
    echo.
    echo Please install Git for Windows to use te9:
    echo.
    echo 1. Download from: https://git-scm.com/download/win
    echo 2. Install with default options
    echo 3. Restart Command Prompt
    echo 4. Run: te9 install
    echo.
    echo Alternatively, you can use WSL ^(Windows Subsystem for Linux^):
    echo.
    echo 1. Enable WSL: wsl --install
    echo 2. Restart your computer
    echo 3. Run: wsl bash -c "cd %CD% ^&^& curl -fsSL %SCRIPT_URL% ^| bash %~1"
    echo.
    exit /b 1
)

REM Convert Windows path to Git Bash format
set "GIT_CD=%CD:\=/%"
set "GIT_CD=%GIT_CD:\= %"

REM Execute bash script
call :log_info "Executing te9 command: %~1"
%BASH_EXE% -c "cd '%GIT_CD%' ^&^& bash %TEMP_TE9% %~1"

REM Clean up
if exist "%TEMP_TE9%" (
    del "%TEMP_TE9%"
)
goto :eof

REM Install command
:cmd_install
call :log_info "Installing te9.dev..."
echo.
call :run_bash_script "install"
goto :eof

REM Update command
:cmd_update
call :log_info "Updating te9.dev..."
echo.
call :run_bash_script "update"
goto :eof

REM Status command
:cmd_status
call :run_bash_script "status"
goto :eof

REM Version command
:cmd_version
call :show_version
goto :eof

REM Main entry point
:main
set COMMAND=%~1

if "%COMMAND%"=="" (
    call :show_help
    goto :eof
)

REM Convert command to lowercase
for /f "usebackq" %%i in (`powershell -Command "'%COMMAND%'.ToLower()"`) do set "COMMAND_LOWER=%%i"

REM Route to appropriate command
if "%COMMAND_LOWER%"=="install" (
    call :cmd_install
) else if "%COMMAND_LOWER%"=="update" (
    call :cmd_update
) else if "%COMMAND_LOWER%"=="status" (
    call :cmd_status
) else if "%COMMAND_LOWER%"=="version" (
    call :cmd_version
) else if "%COMMAND_LOWER%"=="help" (
    call :show_help
) else (
    call :log_error "Unknown command: %COMMAND%"
    echo.
    call :show_help
    exit /b 1
)

REM Run main
call :main %*
