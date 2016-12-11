all: game.js prns.exe word-lists/ludumdare.json analytics.exe

.PHONY: all

game.js: game.ts
	tsc --lib es6 game.ts

prns.exe: prns.cpp prns.h
	g++ -o $@ $<

word-lists/ludumdare.json: word-lists/ludumdare.txt
	lua lines-to-json.lua < $< > $@

analytics.exe: server.go
	go build -o $@ $<
