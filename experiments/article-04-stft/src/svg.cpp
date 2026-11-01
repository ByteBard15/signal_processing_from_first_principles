#include "svg.hpp"

#include <algorithm>
#include <cmath>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <limits>
#include <sstream>
#include <stdexcept>

namespace article4 {
namespace {

std::string escape_xml(std::string text) {
    const std::pair<std::string, std::string> replacements[] = {
        {"&", "&amp;"}, {"<", "&lt;"}, {">", "&gt;"}, {"\"", "&quot;"}};
    for (const auto& [from, to] : replacements) {
        std::size_t at = 0;
        while ((at = text.find(from, at)) != std::string::npos) {
            text.replace(at, from.size(), to);
            at += to.size();
        }
    }
    return text;
}

std::string colour(const double normalized) {
    const double t = std::clamp(normalized, 0.0, 1.0);
    const int r = static_cast<int>(255.0 * std::clamp(1.7 * t - 0.45, 0.0, 1.0));
    const int g = static_cast<int>(255.0 * std::clamp(1.8 - 3.0 * std::abs(t - 0.62), 0.0, 1.0));
    const int b = static_cast<int>(255.0 * std::clamp(1.15 - 1.45 * t, 0.0, 1.0));
    std::ostringstream value;
    value << "rgb(" << r << ',' << g << ',' << b << ')';
    return value.str();
}

void begin_svg(std::ofstream& output, const std::string& title) {
    output << "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1100\" height=\"620\" viewBox=\"0 0 1100 620\">\n"
           << "<rect width=\"1100\" height=\"620\" fill=\"white\"/>\n"
           << "<style>text{font-family:system-ui,sans-serif;fill:#172033}.axis{stroke:#172033;stroke-width:1.4}.grid{stroke:#ccd3df;stroke-width:1}.label{font-size:15px}.title{font-size:22px;font-weight:650}</style>\n"
           << "<text class=\"title\" x=\"550\" y=\"34\" text-anchor=\"middle\">"
           << escape_xml(title) << "</text>\n";
}

} // namespace

void write_spectrogram_svg(const std::string& filename, const std::string& title,
                           const StftResult& result, const double maximum_frequency_hz,
                           const double floor_db, const double ceiling_db,
                           const std::vector<double>& event_times) {
    if (result.frames.empty()) throw std::invalid_argument("Cannot plot an empty STFT");
    std::filesystem::create_directories(std::filesystem::path(filename).parent_path());
    std::ofstream output(filename);
    if (!output) throw std::runtime_error("Cannot write " + filename);
    begin_svg(output, title);
    constexpr double left = 82, top = 62, width = 900, height = 480;
    const double first_time = result.frames.front().centre_time_s;
    const double last_time = result.frames.back().centre_time_s;
    const double frame_width = width / static_cast<double>(result.frames.size());
    std::size_t frequency_count = 0;
    while (frequency_count < result.frequencies_hz.size() &&
           result.frequencies_hz[frequency_count] <= maximum_frequency_hz) ++frequency_count;
    const double bin_height = height / static_cast<double>(frequency_count);

    for (std::size_t m = 0; m < result.frames.size(); ++m) {
        for (std::size_t k = 0; k < frequency_count; ++k) {
            const double db = 10.0 * std::log10(std::max(result.frames[m].psd[k], 1e-15));
            const double normalized = (db - floor_db) / (ceiling_db - floor_db);
            output << "<rect x=\"" << left + m * frame_width << "\" y=\""
                   << top + height - (k + 1) * bin_height << "\" width=\""
                   << frame_width + 0.3 << "\" height=\"" << bin_height + 0.3
                   << "\" fill=\"" << colour(normalized) << "\"/>\n";
        }
    }
    for (const double event : event_times) {
        if (event < first_time || event > last_time) continue;
        const double x = left + (event - first_time) / (last_time - first_time) * width;
        output << "<line x1=\"" << x << "\" y1=\"" << top << "\" x2=\"" << x
               << "\" y2=\"" << top + height << "\" stroke=\"white\" stroke-width=\"1.5\" stroke-dasharray=\"6 4\"/>\n";
    }
    output << "<line class=\"axis\" x1=\"" << left << "\" y1=\"" << top + height
           << "\" x2=\"" << left + width << "\" y2=\"" << top + height << "\"/>\n"
           << "<line class=\"axis\" x1=\"" << left << "\" y1=\"" << top
           << "\" x2=\"" << left << "\" y2=\"" << top + height << "\"/>\n";
    for (int tick = 0; tick <= 5; ++tick) {
        const double fraction = tick / 5.0;
        output << "<text class=\"label\" x=\"" << left + fraction * width << "\" y=\"570\" text-anchor=\"middle\">"
               << std::fixed << std::setprecision(1) << first_time + fraction * (last_time - first_time) << "</text>\n"
               << "<text class=\"label\" x=\"68\" y=\"" << top + height - fraction * height + 5
               << "\" text-anchor=\"end\">" << std::setprecision(0) << fraction * maximum_frequency_hz << "</text>\n";
    }
    output << "<text class=\"label\" x=\"532\" y=\"606\" text-anchor=\"middle\">Time (s)</text>\n"
           << "<text class=\"label\" transform=\"translate(20 302) rotate(-90)\" text-anchor=\"middle\">Frequency (Hz)</text>\n"
           << "<text class=\"label\" x=\"1080\" y=\"86\" text-anchor=\"end\">" << floor_db << " to " << ceiling_db << " dB PSD</text>\n</svg>\n";
}

void write_line_plot_svg(const std::string& filename, const std::string& title,
                         const std::string& x_label, const std::string& y_label,
                         const std::vector<std::pair<std::string, std::vector<std::pair<double, double>>>>& series) {
    if (series.empty()) throw std::invalid_argument("Cannot plot empty series");
    std::filesystem::create_directories(std::filesystem::path(filename).parent_path());
    std::ofstream output(filename);
    if (!output) throw std::runtime_error("Cannot write " + filename);
    begin_svg(output, title);
    constexpr double left = 90, top = 62, width = 900, height = 470;
    double xmin = std::numeric_limits<double>::infinity(), xmax = -xmin;
    double ymin = std::numeric_limits<double>::infinity(), ymax = -ymin;
    for (const auto& [name, points] : series) {
        (void)name;
        for (const auto& [x, y] : points) {
            xmin = std::min(xmin, x); xmax = std::max(xmax, x);
            ymin = std::min(ymin, y); ymax = std::max(ymax, y);
        }
    }
    if (ymin == ymax) { ymin -= 1.0; ymax += 1.0; }
    const char* colours[] = {"#1261a0", "#d1495b", "#16876b", "#7c4dba"};
    for (int tick = 0; tick <= 5; ++tick) {
        const double fraction = tick / 5.0;
        const double y = top + height - fraction * height;
        output << "<line class=\"grid\" x1=\"" << left << "\" y1=\"" << y << "\" x2=\"" << left + width << "\" y2=\"" << y << "\"/>\n"
               << "<text class=\"label\" x=\"78\" y=\"" << y + 5 << "\" text-anchor=\"end\">" << std::setprecision(3) << ymin + fraction * (ymax - ymin) << "</text>\n"
               << "<text class=\"label\" x=\"" << left + fraction * width << "\" y=\"560\" text-anchor=\"middle\">" << xmin + fraction * (xmax - xmin) << "</text>\n";
    }
    for (std::size_t s = 0; s < series.size(); ++s) {
        output << "<polyline fill=\"none\" stroke=\"" << colours[s % 4] << "\" stroke-width=\"3\" points=\"";
        for (const auto& [x, y] : series[s].second) {
            output << left + (x - xmin) / (xmax - xmin) * width << ','
                   << top + height - (y - ymin) / (ymax - ymin) * height << ' ';
        }
        output << "\"/>\n<text class=\"label\" x=\"1080\" y=\"" << 90 + s * 24
               << "\" text-anchor=\"end\" fill=\"" << colours[s % 4] << "\">" << escape_xml(series[s].first) << "</text>\n";
    }
    output << "<line class=\"axis\" x1=\"" << left << "\" y1=\"" << top + height << "\" x2=\"" << left + width << "\" y2=\"" << top + height << "\"/>\n"
           << "<line class=\"axis\" x1=\"" << left << "\" y1=\"" << top << "\" x2=\"" << left << "\" y2=\"" << top + height << "\"/>\n"
           << "<text class=\"label\" x=\"540\" y=\"604\" text-anchor=\"middle\">" << escape_xml(x_label) << "</text>\n"
           << "<text class=\"label\" transform=\"translate(20 298) rotate(-90)\" text-anchor=\"middle\">" << escape_xml(y_label) << "</text>\n</svg>\n";
}

} // namespace article4
