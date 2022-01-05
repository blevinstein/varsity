#!/usr/bin/env bash

if [ -z "$1" ]; then
REGIONS="ap-south-1 eu-central-1 eu-west-2 eu-west-3 me-south-1 sa-east-1"
else
REGIONS="$@"
fi

for region in $REGIONS; do

echo "Enabling rule skytrain-runner-$region"
aws events enable-rule \
    --region "$region" \
    --name skytrain-runner-$region

done
