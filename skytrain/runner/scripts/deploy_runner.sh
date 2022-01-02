#!/usr/bin/env bash

set -e # Fail fast

for region in us-west-1 us-east-2 ap-south-1 eu-central-1 eu-west-2 eu-west-3 me-south-1 sa-east-1; do
echo "deploy to skytrain-runner-$region"
aws s3 cp deploy.zip s3://skytrain-runner-code-$region/deploy.zip
done
