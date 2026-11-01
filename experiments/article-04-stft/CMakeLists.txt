cmake_minimum_required(VERSION 3.20)
project(article_04_stft_experiments LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(PkgConfig REQUIRED)
pkg_check_modules(FFTW3 REQUIRED IMPORTED_TARGET fftw3)

add_executable(stft_experiments
    src/main.cpp
    src/stft.cpp
    src/edf.cpp
    src/svg.cpp)
target_include_directories(stft_experiments PRIVATE include)
target_link_libraries(stft_experiments PRIVATE PkgConfig::FFTW3)
target_compile_options(stft_experiments PRIVATE -Wall -Wextra -Wpedantic)
