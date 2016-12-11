#!/bin/bash

rsync $* -e "ssh -p33" -ruv --include="*/" --include="*.js" --include="analytics.exe" --include="*.html" --include="images/*" --include="screenshots/*" --include="sounds/*" --include="*.css" --include="word-lists/*" --include="releases/*" --exclude="*" ~/projects/ld37-headsup/ user@reactorscram.com:/home/user/www/ld37/
