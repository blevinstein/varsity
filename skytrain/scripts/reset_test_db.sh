#!/usr/bin/env bash

source runner/configs/test.sh || exit 1

psql -w -f sql/drop_db.sql || exit 1
psql -w -f sql/create_db.sql || exit 1

