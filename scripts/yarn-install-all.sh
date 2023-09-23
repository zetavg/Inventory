set -e

SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR/Data" && yarn install
cd "$PROJECT_DIR/packages/epc-utils" && yarn install
cd "$PROJECT_DIR/packages/data-storage-couchdb" && yarn install
cd "$PROJECT_DIR/packages/integration-snipe-it" && yarn install
cd "$PROJECT_DIR/App" && yarn install
