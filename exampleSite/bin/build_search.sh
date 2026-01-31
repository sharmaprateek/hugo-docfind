#!/bin/bash
set -e

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
STATIC_DIR="$ROOT_DIR/static/docfind"
JSON_PATH="$ROOT_DIR/temp_search.json"

mkdir -p "$STATIC_DIR"

# 1. Check/Install Binary
DOCFIND_BIN=""

# Check default install location
if [ -f "$HOME/.local/bin/docfind" ]; then
    DOCFIND_BIN="$HOME/.local/bin/docfind"
    echo "Using DocFind from: $DOCFIND_BIN"
# Check PATH
elif command -v docfind &> /dev/null; then
    DOCFIND_BIN="docfind"
    echo "Using DocFind from PATH"
else
    echo "DocFind binary not found. Installing via official script..."
    # Official install command
    curl -fsSL https://microsoft.github.io/docfind/install.sh | sh
    
    if [ -f "$HOME/.local/bin/docfind" ]; then
        DOCFIND_BIN="$HOME/.local/bin/docfind"
        echo "Installation complete. Using: $DOCFIND_BIN"
    else
        echo "Installation check failed. Please install manually from https://github.com/microsoft/docfind"
        exit 1
    fi
fi

# 2. Get JSON Content
echo "Checking for running Hugo server..."
# Try to fetch from localhost
if curl -s "http://localhost:1313/search.json" -o "$JSON_PATH" && [ -s "$JSON_PATH" ]; then
    echo "Successfully fetched search.json from Dev Server."
else
    echo "Hugo server not detected or search.json unavailable. Building static site..."
    cd "$ROOT_DIR"
    
    # Run Hugo
    hugo --minify
    
    if [ -f "public/search.json" ]; then
        cp "public/search.json" "$JSON_PATH"
        echo "Static build complete."
    else
        echo "Error: search.json not found in public/ directory after build."
        exit 1
    fi
fi

# 3. Run DocFind
echo "Generating Search Index..."
"$DOCFIND_BIN" "$JSON_PATH" "$STATIC_DIR"
echo "Search assets generated in $STATIC_DIR"

# Cleanup
rm -f "$JSON_PATH"
