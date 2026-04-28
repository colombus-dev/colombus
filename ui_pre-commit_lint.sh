#!/bin/bash

# We cannot directly use the biome executable like ./ui/node_modules/.bin/biome ... as
# biome detects a shadow configuration file and fails
#
# > "Found a nested root configuration, but there's already a root configuration.""

cd ui/

FILES=$@
# We simply remove the ui/ prefix as we have already moved to this directory
RELATIVE_FILES=$(echo " $FILES" | sed 's/ ui\// /g')

./node_modules/.bin/biome check --write $RELATIVE_FILES
