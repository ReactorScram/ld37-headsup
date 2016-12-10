all: analytics.js prns.exe

.PHONY: all

analytics.js: analytics.ts
	tsc $<

prns.exe: prns.cpp prns.h
	g++ -o $@ $<
