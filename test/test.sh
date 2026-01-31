#!/bin/bash
# DocFind Hugo Module - Unix Test Runner
# Usage: ./test/test.sh

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

echo "Running DocFind Tests..."
node "$SCRIPT_DIR/run-tests.js" "$@"
