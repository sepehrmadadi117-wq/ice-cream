#!/bin/sh
cd "$(dirname "$0")" && node ../tools/build.js --check && for t in geometry candy coverage pour smarties combined reset model; do echo "== $t"; node $t.test.js | tail -4; done
