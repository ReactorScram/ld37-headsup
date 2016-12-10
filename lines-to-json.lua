#!/usr/bin/env lua

-- Converts plaintext into a JSON array of lines

print ("[")
for line in io.lines () do
	print (string.format ('"%s",', line))
end
print ("]")
