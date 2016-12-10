all: analytics.js prns.exe word-lists/ludumdare.json

.PHONY: all

analytics.js: analytics.ts
	tsc $<

prns.exe: prns.cpp prns.h
	g++ -o $@ $<

word-lists/ludumdare.json: word-lists/ludumdare.txt
	lua lines-to-json.lua < $< > $@
