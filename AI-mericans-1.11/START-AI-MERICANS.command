#!/bin/bash
cd "$(dirname "$0")" || exit 1
python3 -m http.server 8765 >/tmp/ai-mericans-server.log 2>&1 &
sleep 1
open "http://localhost:8765/"
