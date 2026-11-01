#include "edf.hpp"

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <fstream>
#include <iterator>
#include <stdexcept>

namespace article4 {
namespace {

std::string trim(std::string value) {
    while (!value.empty() && std::isspace(static_cast<unsigned char>(value.back()))) value.pop_back();
    std::size_t first = 0;
    while (first < value.size() && std::isspace(static_cast<unsigned char>(value[first]))) ++first;
    return value.substr(first);
}

std::int16_t little_i16(const unsigned char* bytes) {
    const auto raw = static_cast<std::uint16_t>(bytes[0]) |
                     (static_cast<std::uint16_t>(bytes[1]) << 8U);
    return static_cast<std::int16_t>(raw);
}

} // namespace

EdfRecording read_edf(const std::string& filename) {
    std::ifstream stream(filename, std::ios::binary);
    if (!stream) throw std::runtime_error("Cannot open EDF file: " + filename);
    const std::vector<unsigned char> bytes(std::istreambuf_iterator<char>(stream), {});
    if (bytes.size() < 256) throw std::runtime_error("EDF header is truncated");

    const auto text = [&](const std::size_t at, const std::size_t width) {
        return trim(std::string(reinterpret_cast<const char*>(bytes.data() + at), width));
    };
    const std::size_t header_bytes = std::stoul(text(184, 8));
    const std::size_t records = std::stoul(text(236, 8));
    const double record_duration = std::stod(text(244, 8));
    const std::size_t signal_count = std::stoul(text(252, 4));
    if (header_bytes > bytes.size() || signal_count == 0 || !(record_duration > 0.0)) {
        throw std::runtime_error("Invalid EDF dimensions");
    }

    std::size_t cursor = 256;
    const auto strings = [&](const std::size_t width) {
        std::vector<std::string> values(signal_count);
        for (std::size_t i = 0; i < signal_count; ++i) values[i] = text(cursor + i * width, width);
        cursor += width * signal_count;
        return values;
    };
    const auto numbers = [&](const std::size_t width) {
        const auto values = strings(width);
        std::vector<double> converted;
        converted.reserve(values.size());
        for (const auto& value : values) converted.push_back(std::stod(value));
        return converted;
    };

    const auto labels = strings(16);
    strings(80); // transducer
    const auto units = strings(8);
    const auto physical_min = numbers(8);
    const auto physical_max = numbers(8);
    const auto digital_min = numbers(8);
    const auto digital_max = numbers(8);
    strings(80); // prefilter
    const auto samples_per_record_double = numbers(8);
    strings(32); // reserved
    if (cursor != header_bytes) throw std::runtime_error("EDF header-length mismatch");

    std::vector<std::size_t> samples_per_record(signal_count);
    EdfRecording recording;
    recording.duration_s = static_cast<double>(records) * record_duration;
    recording.channels.resize(signal_count);
    for (std::size_t i = 0; i < signal_count; ++i) {
        samples_per_record[i] = static_cast<std::size_t>(samples_per_record_double[i]);
        recording.channels[i].label = labels[i];
        recording.channels[i].unit = units[i];
        recording.channels[i].sample_rate_hz = samples_per_record_double[i] / record_duration;
        if (labels[i] != "EDF Annotations") {
            recording.channels[i].samples.reserve(records * samples_per_record[i]);
        }
    }

    cursor = header_bytes;
    for (std::size_t record = 0; record < records; ++record) {
        for (std::size_t channel = 0; channel < signal_count; ++channel) {
            const std::size_t byte_count = samples_per_record[channel] * 2;
            if (cursor + byte_count > bytes.size()) throw std::runtime_error("EDF data is truncated");
            if (labels[channel] == "EDF Annotations") {
                std::string tal(reinterpret_cast<const char*>(bytes.data() + cursor), byte_count);
                tal.erase(std::remove(tal.begin(), tal.end(), '\0'), tal.end());
                std::size_t position = 0;
                while ((position = tal.find('+', position)) != std::string::npos) {
                    const auto annotation = tal.find('\x14', position);
                    if (annotation == std::string::npos) break;
                    const auto end = tal.find('\x14', annotation + 1);
                    std::string timing = tal.substr(position + 1, annotation - position - 1);
                    std::string code = tal.substr(annotation + 1, end - annotation - 1);
                    const auto duration_separator = timing.find('\x15');
                    double duration = 0.0;
                    if (duration_separator != std::string::npos) {
                        duration = std::stod(timing.substr(duration_separator + 1));
                        timing.resize(duration_separator);
                    }
                    if (code == "T0" || code == "T1" || code == "T2") {
                        recording.annotations.push_back({std::stod(timing), duration, code});
                    }
                    position = annotation + 1;
                }
            } else {
                const double scale = (physical_max[channel] - physical_min[channel]) /
                                     (digital_max[channel] - digital_min[channel]);
                const double base = physical_min[channel] - digital_min[channel] * scale;
                auto& samples = recording.channels[channel].samples;
                for (std::size_t i = 0; i < samples_per_record[channel]; ++i) {
                    samples.push_back(base + static_cast<double>(little_i16(bytes.data() + cursor + 2 * i)) * scale);
                }
            }
            cursor += byte_count;
        }
    }
    return recording;
}

const EdfChannel& channel_named(const EdfRecording& recording, const std::string& label) {
    const auto found = std::find_if(recording.channels.begin(), recording.channels.end(),
        [&](const EdfChannel& channel) {
            std::string clean = channel.label;
            clean.erase(std::remove(clean.begin(), clean.end(), '.'), clean.end());
            return clean == label;
        });
    if (found == recording.channels.end()) throw std::runtime_error("EDF channel not found: " + label);
    return *found;
}

} // namespace article4
