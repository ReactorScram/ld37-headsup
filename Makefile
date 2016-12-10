all: analytics.js prns.exe word-lists/ludumdare.json

.PHONY: all

analytics.js: analytics.ts
	tsc --lib es6 analytics.ts

prns.exe: prns.cpp prns.h
	g++ -o $@ $<

word-lists/ludumdare.json: word-lists/ludumdare.txt
	lua lines-to-json.lua < $< > $@
