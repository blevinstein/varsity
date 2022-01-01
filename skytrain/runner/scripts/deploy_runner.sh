#!/usr/bin/env bash
for region in dev; do
echo "deploy to skytrain-runner-$region"
aws lambda update-function-code --function-name "skytrain-runner-$region" --zip-file fileb://deploy.zip
done
