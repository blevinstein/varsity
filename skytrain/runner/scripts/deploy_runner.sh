#!/usr/bin/env bash

set -e # Fail fast

if [ -z "$1" ]; then
REGIONS="ap-south-1 eu-central-1 eu-west-2 eu-west-3 me-south-1 sa-east-1"
else
REGIONS="$@"
fi

for region in $REGIONS; do

echo "deploy to skytrain-runner-$region"
aws s3 cp --region "$region" deploy.zip s3://skytrain-runner-code-$region/deploy.zip

done
