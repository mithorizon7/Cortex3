#!/bin/bash
# Download Roboto fonts which are widely available as TTF
curl -L "https://github.com/google/roboto/releases/download/v2.138/roboto-unhinted.zip" -o roboto.zip
if command -v unzip &> /dev/null; then
  unzip -j roboto.zip "*/Roboto-Regular.ttf" "*/Roboto-Bold.ttf" -d .
  mv Roboto-Regular.ttf Inter-Regular.ttf
  mv Roboto-Bold.ttf Inter-Bold.ttf
  rm roboto.zip
  echo "Fonts extracted successfully"
else
  echo "unzip not available, trying alternative..."
  rm roboto.zip
  # Use wget to download pre-extracted files
  curl -L "https://github.com/google/roboto/raw/main/src/hinted/Roboto-Regular.ttf" -o Inter-Regular.ttf
  curl -L "https://github.com/google/roboto/raw/main/src/hinted/Roboto-Bold.ttf" -o Inter-Bold.ttf
fi
ls -lh *.ttf
