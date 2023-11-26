# couchdb-public-server

A simple HTTP server to serve content in CouchDB databases publicly.

## Usage

0. `yarn install`.
1. `cp config.json.sample config.json` and edit `config.json`.
2. `node server.js`

## Endpoints

### `/<database_name>`

Test if the connection works. See the console output for error messages.

### `/<database_name>/images/<image_id>.<png|jpg>`

Returns the image with the given ID from the database.
