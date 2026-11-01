#!/usr/bin/env bash
set -euo pipefail

experiment_dir=$(cd "$(dirname "$0")" && pwd)
repository_root=$(cd "$experiment_dir/../.." && pwd)
edf_file=${1:-"$repository_root/tmp/eeg-source/S001R04.edf"}
output_dir=${2:-"$experiment_dir/results"}
build_dir="$repository_root/tmp/article-04-stft-build"

if [[ ! -f "$edf_file" ]]; then
  "$experiment_dir/download_eeg.sh" "$edf_file"
fi

mkdir -p "$build_dir" "$output_dir"
g++ -std=c++20 -O2 -Wall -Wextra -Wpedantic \
  -I"$experiment_dir/include" \
  "$experiment_dir/src/main.cpp" \
  "$experiment_dir/src/stft.cpp" \
  "$experiment_dir/src/edf.cpp" \
  "$experiment_dir/src/svg.cpp" \
  $(pkg-config --cflags --libs fftw3) \
  -o "$build_dir/stft_experiments"

"$build_dir/stft_experiments" "$edf_file" "$output_dir"
