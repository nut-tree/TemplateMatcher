#!/usr/bin/env bash
set -e

echo $PWD

npm install --global npm@8.3.1
npm ci
npm run compile
npm --prefix tests/e2e/tests ci
npm test
