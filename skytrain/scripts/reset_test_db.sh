#!/usr/bin/env bash

source configs/test.sh || exit 1

psql -w -f sql/drop_db.sql || exit 1
psql -w -f sql/create_db.sql || exit 1

