set -e

SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR/packages/epc-utils" && yarn install
cd "$PROJECT_DIR/packages/snipe-it-integration" && yarn install
cd "$PROJECT_DIR/Data" && yarn install
cd "$PROJECT_DIR/App" && yarn install
