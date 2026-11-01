cmake_minimum_required(VERSION 3.20)

project(signal_processing_from_first_principles LANGUAGES CXX)

# Native experiment projects live alongside the Jekyll publication. Keeping
# the executable definition in its own directory lets it build independently
# while this root entry point gives CLion one project to index.
add_subdirectory(experiments/article-04-stft)
