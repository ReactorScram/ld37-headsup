// Print out the first 10 or so PRNS numbers
// to verify my TS impl

#include <iostream>

using namespace std;

#include "prns.h"

int main () {
	const int n = 10;
	
	for (uint64_t i = 0; i < n; i++) {
		//cout << i << " -> " << (unsigned long)(PRNS_WEYL * i) << endl;
		cout << i << " -> " << prns_at (i) << endl;
		//cout << i << " -> " << ((i ^ (i >> 31)) * 0x7fb5d329728ea185u) << endl;
	}
}
