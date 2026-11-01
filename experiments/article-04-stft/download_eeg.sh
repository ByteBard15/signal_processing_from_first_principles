#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "$0")/../.." && pwd)
destination=${1:-"$project_root/tmp/eeg-source/S001R04.edf"}
url=https://physionet.org/files/eegmmidb/1.0.0/S001/S001R04.edf
expected_sha256=3d161f88e1c00632585287d2ce584c2bc0f08862438eb255ea8723e00fac693d

mkdir -p "$(dirname "$destination")"
curl --fail --location --retry 3 --output "$destination" "$url"
printf '%s  %s\n' "$expected_sha256" "$destination" | sha256sum --check --status
echo "Downloaded and verified $destination"
