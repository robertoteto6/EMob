#!/bin/bash

# Script to fix npm cache permissions issue
echo "Fixing npm cache permissions..."

# Remove the problematic cache files
rm -rf ~/.npm/_cacache/content-v2/sha512/a7/a9

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

echo "NPM cache fixed. Try running your commands again."
