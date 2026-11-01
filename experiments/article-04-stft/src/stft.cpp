#include "stft.hpp"

#include <fftw3.h>

#include <cmath>
#include <stdexcept>

namespace article4 {

std::vector<double> symmetric_hann(const std::size_t length) {
    if (length < 2) throw std::invalid_argument("Hann length must be at least two");
    const double pi = std::acos(-1.0);
    std::vector<double> window(length);
    for (std::size_t n = 0; n < length; ++n) {
        window[n] = 0.5 * (1.0 - std::cos(2.0 * pi * static_cast<double>(n) /
                                        static_cast<double>(length - 1)));
    }
    return window;
}

StftResult stft(const std::vector<double>& signal, const StftConfig& config) {
    if (!(config.sample_rate_hz > 0.0) || config.window_length < 2 ||
        config.hop_size == 0 || config.fft_size < config.window_length) {
        throw std::invalid_argument("Invalid STFT configuration");
    }

    const auto window = symmetric_hann(config.window_length);
    double window_energy = 0.0;
    for (const double value : window) window_energy += value * value;

    const std::size_t bin_count = config.fft_size / 2 + 1;
    auto* input = fftw_alloc_real(config.fft_size);
    auto* output = fftw_alloc_complex(bin_count);
    if (input == nullptr || output == nullptr) {
        if (input != nullptr) fftw_free(input);
        if (output != nullptr) fftw_free(output);
        throw std::bad_alloc{};
    }
    const fftw_plan plan = fftw_plan_dft_r2c_1d(
        static_cast<int>(config.fft_size), input, output, FFTW_ESTIMATE);
    if (plan == nullptr) {
        fftw_free(output);
        fftw_free(input);
        throw std::runtime_error("FFTW could not create a plan");
    }

    StftResult result;
    result.config = config;
    result.frequencies_hz.resize(bin_count);
    for (std::size_t k = 0; k < bin_count; ++k) {
        result.frequencies_hz[k] = static_cast<double>(k) * config.sample_rate_hz /
                                   static_cast<double>(config.fft_size);
    }

    for (std::size_t start = 0; start + config.window_length <= signal.size();
         start += config.hop_size) {
        for (std::size_t n = 0; n < config.window_length; ++n) {
            input[n] = signal[start + n] * window[n];
        }
        for (std::size_t n = config.window_length; n < config.fft_size; ++n) input[n] = 0.0;
        fftw_execute(plan);

        Frame frame;
        frame.centre_time_s =
            (static_cast<double>(start) + (static_cast<double>(config.window_length) - 1.0) / 2.0) /
            config.sample_rate_hz;
        frame.coefficients.resize(bin_count);
        frame.psd.resize(bin_count);
        for (std::size_t k = 0; k < bin_count; ++k) {
            const std::complex<double> coefficient{output[k][0], output[k][1]};
            frame.coefficients[k] = coefficient;
            const bool dc = k == 0;
            const bool nyquist = config.fft_size % 2 == 0 && k == config.fft_size / 2;
            const double one_sided = (dc || nyquist) ? 1.0 : 2.0;
            frame.psd[k] = one_sided * std::norm(coefficient) /
                           (config.sample_rate_hz * window_energy);
        }
        result.frames.push_back(std::move(frame));
    }

    fftw_destroy_plan(plan);
    fftw_free(output);
    fftw_free(input);
    return result;
}

double integrate_band(const StftResult& result, const std::size_t frame,
                      const double low_hz, const double high_hz) {
    if (frame >= result.frames.size() || !(high_hz > low_hz)) {
        throw std::invalid_argument("Invalid band integration request");
    }
    const double df = result.config.sample_rate_hz / static_cast<double>(result.config.fft_size);
    double power = 0.0;
    for (std::size_t k = 0; k < result.frequencies_hz.size(); ++k) {
        if (result.frequencies_hz[k] >= low_hz && result.frequencies_hz[k] <= high_hz) {
            power += result.frames[frame].psd[k] * df;
        }
    }
    return power;
}

} // namespace article4
