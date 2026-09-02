#!/bin/zsh
cd "$(dirname "$0")"
echo "Serving MathHike GitHub 1.5 at http://127.0.0.1:8095"
echo "The page header must say: 1.5.0 Lab Fix"
python3 -m http.server 8095
