#!/usr/bin/env bash

aws lambda update-function-code --function-name skytrain-runner --zip-file fileb://deploy.zip
