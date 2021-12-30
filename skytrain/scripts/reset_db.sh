#!/usr/bin/env bash

psql -f sql/drop_db.sql || exit 1
psql -f sql/create_db.sql || exit 1

