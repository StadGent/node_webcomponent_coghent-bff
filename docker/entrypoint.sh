#!/bin/sh

set -e

echo "Starting graphql"
npm link ./inuits-apollo-server-auth &&
exec npm run dev