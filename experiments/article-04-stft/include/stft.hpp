#pragma once

#include <complex>
#include <cstddef>
#include <vector>

namespace article4 {

struct StftConfig {
    double sample_rate_hz{};
    std::size_t window_length{};
    std::size_t hop_size{};
    std::size_t fft_size{};
};

struct Frame {
    double centre_time_s{};
    std::vector<std::complex<double>> coefficients;
    std::vector<double> psd;
};

struct StftResult {
    StftConfig config;
    std::vector<double> frequencies_hz;
    std::vector<Frame> frames;
};

std::vector<double> symmetric_hann(std::size_t length);
StftResult stft(const std::vector<double>& signal, const StftConfig& config);
double integrate_band(const StftResult& result, std::size_t frame, double low_hz, double high_hz);

} // namespace article4
