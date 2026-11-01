#pragma once

#include "stft.hpp"

#include <string>
#include <utility>
#include <vector>

namespace article4 {

void write_spectrogram_svg(
    const std::string& filename,
    const std::string& title,
    const StftResult& result,
    double maximum_frequency_hz,
    double floor_db,
    double ceiling_db,
    const std::vector<double>& event_times = {});

void write_line_plot_svg(
    const std::string& filename,
    const std::string& title,
    const std::string& x_label,
    const std::string& y_label,
    const std::vector<std::pair<std::string, std::vector<std::pair<double, double>>>>& series);

} // namespace article4
