#include "edf.hpp"
#include "stft.hpp"
#include "svg.hpp"

#include <algorithm>
#include <cmath>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <random>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {
using article4::StftConfig;
using article4::StftResult;

constexpr double synthetic_sample_rate = 256.0;
constexpr double duration_s = 8.0;
constexpr std::size_t trials = 200;
constexpr double snr_db = 0.0;
const std::vector<std::size_t> synthetic_lengths{32, 64, 128, 256, 512};

struct Summary {
    double bias{};
    double mae{};
    double rmse{};
    double standard_deviation{};
};

struct TrialMetrics {
    double frequency_error{};
    double interpolated_frequency_error{};
    bool two_tone_resolved{};
    bool onset_found{};
    double onset_error{};
    double offset_error{};
    double duration_error{};
};

std::vector<double> signal_from(const auto& function) {
    const std::size_t count = static_cast<std::size_t>(duration_s * synthetic_sample_rate);
    std::vector<double> values(count);
    for (std::size_t n = 0; n < count; ++n) values[n] = function(n / synthetic_sample_rate);
    return values;
}

double mean_square(const std::vector<double>& values) {
    return std::inner_product(values.begin(), values.end(), values.begin(), 0.0) /
           static_cast<double>(values.size());
}

std::vector<double> noisy(const std::vector<double>& clean, std::mt19937_64& generator) {
    const double noise_power = mean_square(clean) / std::pow(10.0, snr_db / 10.0);
    std::normal_distribution<double> distribution(0.0, std::sqrt(noise_power));
    std::vector<double> result(clean.size());
    for (std::size_t n = 0; n < clean.size(); ++n) result[n] = clean[n] + distribution(generator);
    return result;
}

StftConfig config(const double sample_rate, const std::size_t length) {
    return {sample_rate, length, length / 4, length};
}

std::size_t peak_bin(const std::vector<double>& frequencies, const std::vector<double>& psd,
                     const double low_hz, const double high_hz) {
    std::size_t best = 0;
    double best_power = -1.0;
    for (std::size_t k = 0; k < frequencies.size(); ++k) {
        if (frequencies[k] >= low_hz && frequencies[k] <= high_hz && psd[k] > best_power) {
            best = k;
            best_power = psd[k];
        }
    }
    return best;
}

std::vector<double> average_psd(const StftResult& result) {
    std::vector<double> average(result.frequencies_hz.size(), 0.0);
    for (const auto& frame : result.frames) {
        for (std::size_t k = 0; k < average.size(); ++k) average[k] += frame.psd[k];
    }
    for (double& value : average) value /= static_cast<double>(result.frames.size());
    return average;
}

double quadratic_peak_hz(const StftResult& result, const std::vector<double>& psd, const std::size_t k) {
    if (k == 0 || k + 1 >= psd.size()) return result.frequencies_hz[k];
    const double left = std::log(std::max(psd[k - 1], 1e-30));
    const double centre = std::log(std::max(psd[k], 1e-30));
    const double right = std::log(std::max(psd[k + 1], 1e-30));
    const double denominator = left - 2.0 * centre + right;
    const double offset = std::abs(denominator) < 1e-15 ? 0.0 : 0.5 * (left - right) / denominator;
    const double df = result.config.sample_rate_hz / static_cast<double>(result.config.fft_size);
    return result.frequencies_hz[k] + std::clamp(offset, -0.5, 0.5) * df;
}

bool resolves_two_tones(const StftResult& result) {
    const auto psd = average_psd(result);
    std::vector<std::size_t> peaks;
    for (std::size_t k = 1; k + 1 < psd.size(); ++k) {
        if (result.frequencies_hz[k] >= 26.0 && result.frequencies_hz[k] <= 38.0 &&
            psd[k] > psd[k - 1] && psd[k] >= psd[k + 1]) peaks.push_back(k);
    }
    for (const auto a : peaks) for (const auto b : peaks) {
        if (b <= a) continue;
        const double fa = result.frequencies_hz[a], fb = result.frequencies_hz[b];
        if (std::abs(fa - 30.0) > 2.0 || std::abs(fb - 34.0) > 2.0) continue;
        const double valley = *std::min_element(psd.begin() + static_cast<long>(a),
                                                psd.begin() + static_cast<long>(b + 1));
        const double smaller_peak = std::min(psd[a], psd[b]);
        if (10.0 * std::log10(smaller_peak / std::max(valley, 1e-30)) >= 3.0) return true;
    }
    return false;
}

double burst_threshold(const std::size_t length, const double noise_sigma) {
    std::mt19937_64 generator(0x43414c4942524154ULL + length);
    std::normal_distribution<double> distribution(0.0, noise_sigma);
    // The detector requires two consecutive frames. Calibrate the maximum of
    // their smaller band powers, so the false-alarm unit is a complete record
    // rather than one of the many correlated spectrogram cells.
    std::vector<double> record_maxima;
    record_maxima.reserve(1000);
    for (std::size_t trial = 0; trial < 1000; ++trial) {
        std::vector<double> calibration(static_cast<std::size_t>(duration_s * synthetic_sample_rate));
        for (double& value : calibration) value = distribution(generator);
        const auto transformed = article4::stft(calibration, config(synthetic_sample_rate, length));
        double maximum_pair = 0.0;
        for (std::size_t m = 0; m + 1 < transformed.frames.size(); ++m) {
            const double first = article4::integrate_band(transformed, m, 36.0, 44.0);
            const double second = article4::integrate_band(transformed, m + 1, 36.0, 44.0);
            maximum_pair = std::max(maximum_pair, std::min(first, second));
        }
        record_maxima.push_back(maximum_pair);
    }
    std::sort(record_maxima.begin(), record_maxima.end());
    return record_maxima[989]; // empirical 99th percentile, fixed before test trials
}

TrialMetrics evaluate(const std::vector<double>& tone, const std::vector<double>& two_tone,
                      const std::vector<double>& burst, const std::size_t length,
                      const double threshold) {
    TrialMetrics metrics;
    const auto tone_stft = article4::stft(tone, config(synthetic_sample_rate, length));
    const auto tone_psd = average_psd(tone_stft);
    const auto k = peak_bin(tone_stft.frequencies_hz, tone_psd, 20.0, 45.0);
    metrics.frequency_error = std::abs(tone_stft.frequencies_hz[k] - 30.0);
    metrics.interpolated_frequency_error = std::abs(quadratic_peak_hz(tone_stft, tone_psd, k) - 30.0);
    metrics.two_tone_resolved = resolves_two_tones(article4::stft(two_tone, config(synthetic_sample_rate, length)));

    const auto burst_stft = article4::stft(burst, config(synthetic_sample_rate, length));
    std::vector<bool> active(burst_stft.frames.size(), false);
    for (std::size_t m = 0; m < active.size(); ++m) {
        active[m] = article4::integrate_band(burst_stft, m, 36.0, 44.0) > threshold;
    }
    std::size_t first = active.size(), last = active.size();
    for (std::size_t m = 0; m + 1 < active.size(); ++m) {
        if (active[m] && active[m + 1]) { first = m; break; }
    }
    if (first != active.size()) {
        last = first + 1;
        while (last + 1 < active.size() && (active[last] || active[last + 1])) ++last;
        const double onset = burst_stft.frames[first].centre_time_s;
        const double offset = burst_stft.frames[last].centre_time_s;
        metrics.onset_found = true;
        metrics.onset_error = onset - 3.0;
        metrics.offset_error = offset - 3.5;
        metrics.duration_error = (offset - onset) - 0.5;
    }
    return metrics;
}

Summary summarize(const std::vector<double>& signed_errors) {
    if (signed_errors.empty()) return {};
    const double count = static_cast<double>(signed_errors.size());
    const double bias = std::accumulate(signed_errors.begin(), signed_errors.end(), 0.0) / count;
    double absolute = 0.0, squares = 0.0, variance = 0.0;
    for (const double value : signed_errors) {
        absolute += std::abs(value); squares += value * value;
        variance += (value - bias) * (value - bias);
    }
    return {bias, absolute / count, std::sqrt(squares / count),
            std::sqrt(variance / static_cast<double>(signed_errors.size() - 1))};
}

void write_stft_csv(const std::filesystem::path& filename, const StftResult& result) {
    std::ofstream output(filename);
    output << "time_s,frequency_hz,psd\n" << std::setprecision(12);
    for (const auto& frame : result.frames) {
        for (std::size_t k = 0; k < result.frequencies_hz.size(); ++k) {
            output << frame.centre_time_s << ',' << result.frequencies_hz[k] << ',' << frame.psd[k] << '\n';
        }
    }
}

std::vector<double> switch_signal() {
    return signal_from([](const double t) {
        return std::sin(2.0 * std::acos(-1.0) * (t < 4.0 ? 20.0 : 60.0) * t);
    });
}

void run_synthetic(const std::filesystem::path& output_directory) {
    const double pi = std::acos(-1.0);
    const auto clean_tone = signal_from([&](const double t) { return std::sin(2.0 * pi * 30.0 * t); });
    const auto clean_two = signal_from([&](const double t) {
        return std::sin(2.0 * pi * 30.0 * t) + 0.8 * std::sin(2.0 * pi * 34.0 * t);
    });
    const auto clean_burst = signal_from([&](const double t) {
        return t >= 3.0 && t < 3.5 ? std::sin(2.0 * pi * 40.0 * t) : 0.0;
    });
    const double burst_sigma = std::sqrt(mean_square(clean_burst) / std::pow(10.0, snr_db / 10.0));

    std::ofstream summary(output_directory / "synthetic_summary.csv");
    summary << "window_samples,window_ms,bin_spacing_hz,trials,frequency_mae_hz,interpolated_frequency_mae_hz,"
               "two_tone_resolution_percent,burst_detection_percent,onset_bias_s,onset_mae_s,onset_rmse_s,onset_sd_s,"
               "offset_bias_s,offset_mae_s,offset_rmse_s,offset_sd_s,duration_bias_s,duration_mae_s,duration_rmse_s,duration_sd_s\n";
    std::vector<std::pair<double, double>> frequency_curve, onset_curve, resolution_curve;
    for (const auto length : synthetic_lengths) {
        const double threshold = burst_threshold(length, burst_sigma);
        std::vector<double> frequency_errors, interpolated_errors, onset, offset, duration;
        std::size_t resolved = 0, detected = 0;
        for (std::size_t trial = 0; trial < trials; ++trial) {
            std::mt19937_64 generator(0x5eed0000ULL + trial);
            const auto tone = noisy(clean_tone, generator);
            const auto two = noisy(clean_two, generator);
            const auto burst = noisy(clean_burst, generator);
            const auto metrics = evaluate(tone, two, burst, length, threshold);
            frequency_errors.push_back(metrics.frequency_error);
            interpolated_errors.push_back(metrics.interpolated_frequency_error);
            resolved += metrics.two_tone_resolved;
            if (metrics.onset_found) {
                ++detected;
                onset.push_back(metrics.onset_error);
                offset.push_back(metrics.offset_error);
                duration.push_back(metrics.duration_error);
            }
        }
        const auto onset_summary = summarize(onset), offset_summary = summarize(offset), duration_summary = summarize(duration);
        const double frequency_mae = summarize(frequency_errors).mae;
        const double interpolated_mae = summarize(interpolated_errors).mae;
        const double resolution_percent = 100.0 * resolved / trials;
        const double window_ms = 1000.0 * length / synthetic_sample_rate;
        summary << length << ',' << window_ms << ',' << synthetic_sample_rate / length << ',' << trials << ','
                << frequency_mae << ',' << interpolated_mae << ',' << resolution_percent << ','
                << 100.0 * detected / trials << ','
                << onset_summary.bias << ',' << onset_summary.mae << ',' << onset_summary.rmse << ',' << onset_summary.standard_deviation << ','
                << offset_summary.bias << ',' << offset_summary.mae << ',' << offset_summary.rmse << ',' << offset_summary.standard_deviation << ','
                << duration_summary.bias << ',' << duration_summary.mae << ',' << duration_summary.rmse << ',' << duration_summary.standard_deviation << '\n';
        frequency_curve.emplace_back(window_ms, frequency_mae);
        onset_curve.emplace_back(window_ms, onset_summary.mae);
        resolution_curve.emplace_back(window_ms, resolution_percent);

        const auto visual = article4::stft(switch_signal(), config(synthetic_sample_rate, length));
        const auto stem = "synthetic_spectrogram_" + std::to_string(static_cast<int>(window_ms)) + "ms";
        write_stft_csv(output_directory / (stem + ".csv"), visual);
        article4::write_spectrogram_svg((output_directory / (stem + ".svg")).string(),
            "20 Hz to 60 Hz switch — " + std::to_string(static_cast<int>(window_ms)) + " ms Hann window",
            visual, 80.0, -80.0, -5.0, {4.0});
    }
    article4::write_line_plot_svg((output_directory / "frequency_error.svg").string(),
        "Stationary-tone frequency error at 0 dB SNR", "Window duration (ms)", "Mean absolute error (Hz)",
        {{"raw peak bin", frequency_curve}});
    article4::write_line_plot_svg((output_directory / "onset_error.svg").string(),
        "Burst-onset localization error at 0 dB SNR", "Window duration (ms)", "Mean absolute error (s)",
        {{"threshold estimator", onset_curve}});
    article4::write_line_plot_svg((output_directory / "two_tone_resolution.svg").string(),
        "Resolution of 30 Hz and 34 Hz tones at 0 dB SNR", "Window duration (ms)", "Resolved trials (%)",
        {{"predeclared rule", resolution_curve}});
}

void run_eeg(const std::filesystem::path& edf_path, const std::filesystem::path& output_directory) {
    const auto recording = article4::read_edf(edf_path.string());
    const std::string c3_label = "C3";
    const auto& c3 = article4::channel_named(recording, c3_label);
    if (std::abs(c3.sample_rate_hz - 160.0) > 1e-9) throw std::runtime_error("Expected native EEG rate of 160 Hz");
    const std::size_t sample_count = static_cast<std::size_t>(30.0 * c3.sample_rate_hz);
    std::vector<double> interval(c3.samples.begin(), c3.samples.begin() + static_cast<long>(sample_count));
    const double mean = std::accumulate(interval.begin(), interval.end(), 0.0) / interval.size();
    for (double& value : interval) value -= mean;
    std::vector<double> events;
    for (const auto& annotation : recording.annotations) {
        if (annotation.onset_s <= 30.0) events.push_back(annotation.onset_s);
    }
    const std::vector<std::size_t> lengths{20, 40, 80, 160, 320};
    std::ofstream metadata(output_directory / "eeg_metadata.csv");
    metadata << "source_file,channel,units,sample_rate_hz,interval_start_s,interval_end_s,preprocessing,window_samples,window_ms,hop_samples,bin_spacing_hz,frames\n";
    for (const auto length : lengths) {
        const auto transformed = article4::stft(interval, config(c3.sample_rate_hz, length));
        const int milliseconds = static_cast<int>(1000.0 * length / c3.sample_rate_hz);
        const auto stem = "eeg_c3_s001r04_" + std::to_string(milliseconds) + "ms";
        write_stft_csv(output_directory / (stem + ".csv"), transformed);
        article4::write_spectrogram_svg((output_directory / (stem + ".svg")).string(),
            "EEGMMIDB S001 Run 04 C3 — " + std::to_string(milliseconds) + " ms Hann window",
            transformed, 70.0, -25.0, 35.0, events);
        metadata << edf_path.filename().string() << ",C3," << c3.unit << ',' << c3.sample_rate_hz
                 << ",0,30,mean removal only," << length << ',' << milliseconds << ',' << length / 4 << ','
                 << c3.sample_rate_hz / length << ',' << transformed.frames.size() << '\n';
    }
}

} // namespace

int main(int argc, char** argv) try {
    if (argc != 3) {
        std::cerr << "Usage: stft_experiments <S001R04.edf> <output-directory>\n";
        return 2;
    }
    const std::filesystem::path output_directory = argv[2];
    std::filesystem::create_directories(output_directory);
    run_synthetic(output_directory);
    run_eeg(argv[1], output_directory);
    std::cout << "Wrote Article 4 results to " << output_directory << '\n';
    return 0;
} catch (const std::exception& error) {
    std::cerr << "Experiment failed: " << error.what() << '\n';
    return 1;
}
