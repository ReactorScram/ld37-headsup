local source = {}

local count = 10

for i = 1, count do
	table.insert (source, i)
end

local strike = {}

local output = {}

for i = 1, count do
	local n = math.random (count - #strike)
	
	for _, str in ipairs (strike) do
		if n >= str then
			n = n + 1
		else
			break
		end
	end
	
	table.insert (output, n)
	
	-- Pretend this is a nice efficient insertion sort
	table.insert (strike, n)
	table.sort (strike)
	
	print (n)
end
