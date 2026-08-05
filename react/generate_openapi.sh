#!/bin/bash
# Regenerates the vendored Schematic API clients under lib/schematic/api/.
# Mirrors schematic-js/components/generate_openapi.sh, but runs the generator
# through Docker directly so no local Java runtime is required.

set -e

GENERATOR_VERSION="v7.10.0"
CONFIG="./lib/schematic/api/config_checkoutexternal.yml"
INPUT_SPEC=""

for arg in "$@"
do
    case $arg in
        --spec=*)
        INPUT_SPEC="${arg#*=}"
        shift
        ;;
        -c|--config)
        CONFIG="$2"
        shift
        shift
        ;;
        *)
        ;;
    esac
done

# Read inputSpec/outputDir from the config file (plain "key: value" lines).
CONFIG_SPEC=$(sed -n 's/^inputSpec: *//p' "$CONFIG")
OUTPUT_DIR=$(sed -n 's/^outputDir: *//p' "$CONFIG")
if [ -z "$OUTPUT_DIR" ]; then
    echo "outputDir not found in $CONFIG" >&2
    exit 1
fi
if [ -z "$INPUT_SPEC" ]; then
    INPUT_SPEC="$CONFIG_SPEC"
fi
OUTPUT_DIR="${OUTPUT_DIR%/}"
echo "Generating from $INPUT_SPEC into $OUTPUT_DIR"

rm -rf "$OUTPUT_DIR"

docker run --rm -v "$PWD:/local" "openapitools/openapi-generator-cli:$GENERATOR_VERSION" generate \
    -g typescript-fetch \
    --input-spec "$INPUT_SPEC" \
    -o "/local/${OUTPUT_DIR#./}"
