#!/bin/bash

trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM

python3 -m http.server --bind 127.0.0.1 --directory www/ &
npx tailwindcss -i ./src/css/input.css -o ./www/css/output.css --watch

wait
