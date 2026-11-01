#pragma once

#include <string>
#include <vector>

namespace article4 {

struct Annotation {
    double onset_s{};
    double duration_s{};
    std::string code;
};

struct EdfChannel {
    std::string label;
    std::string unit;
    double sample_rate_hz{};
    std::vector<double> samples;
};

struct EdfRecording {
    double duration_s{};
    std::vector<EdfChannel> channels;
    std::vector<Annotation> annotations;
};

EdfRecording read_edf(const std::string& filename);
const EdfChannel& channel_named(const EdfRecording& recording, const std::string& label);

} // namespace article4
