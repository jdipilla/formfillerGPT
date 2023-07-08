#!/bin/bash

# Check if the file 'my.js' exists.
if [ -f "payload.js" ]; then
  # Minify the JavaScript file.
  curl -X POST -s --data-urlencode 'input@payload.js' https://www.toptal.com/developers/javascript-minifier/api/raw > fg.min.js
  echo "Minification successful. 'fg.min.js' created."
else
  echo "Error: 'payload.js' does not exist."
fi
