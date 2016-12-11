#!/bin/bash

rsync -e "ssh -p33" -ruv ~/projects/ld37-headsup/ user@reactorscram.com:/home/user/www/ld37/
