# Panels

### Audio Panel

Display and play audio waveforms from incoming RawAudio message topics.

| Field       | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| Topic       | Topic containing RawAudio messages                               |
| Color       | Color of the audio waveform visualization                        |
| Volume      | Audio playback volume (0.0 to 1.0)                               |
| Mute        | Mute audio playback                                              |
| Window size | Time range in seconds for the sliding window (live sources only) |

Supported schemas
The Audio panel supports the following message schemas:

foxglove_msgs/RawAudio
foxglove_msgs/msg/RawAudio
foxglove.RawAudio
foxglove::RawAudio

### Gauge panel

Display numeric values from an incoming topic message path on a customized gauge display.

| Field             | Description                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Message path      | Message path containing a numeric value (or string that can be coerced to a numeric value) |
| Min               | Minimum value for the gauge                                                                |
| Max               | Maximum value for the gauge                                                                |
| Color mode        | Type of gradient to use for the gauge                                                      |
| Color map         | Preset gradients for the gauge: "Red to green", "Rainbow", or "Turbo"                      |
| Gradient          | Starting and ending color stops for custom gradient                                        |
| Reverse Colors    | Reverse the colors of the gauge                                                            |
| Reverse Direction | Reverse the direction of the gauge, with min on right and max on left                      |

### Image panel

Display raw and compressed images, as well as compressed videos, with 2D annotations like text labels, circles, and points. Superimpose 3D markers for additional context.

| Raw images          | Compressed images | Compressed videos |
| ------------------- | ----------------- | ----------------- |
| 8UC1                | webp              | h264              |
| 8UC3                | jpeg              | h265 (HEVC)       |
| 16UC1               | jpg               | vp9               |
| 32FC1               | png               | av1               |
| bayer_bggr8         | avif              |                   |
| bayer_gbrg8         |                   |                   |
| bayer_grbg8         |                   |                   |
| bayer_rggb8         |                   |                   |
| bgr8                |                   |                   |
| bgra8               |                   |                   |
| mono8               |                   |                   |
| mono16              |                   |                   |
| rgb8                |                   |                   |
| rgba8               |                   |                   |
| uyvy or yuv422      |                   |                   |
| yuyv or yuv422_yuy2 |                   |                   |

### Indicator panel

Display a color-coded label to indicate threshold values in your data.

### General

| Field | Description                                 |
| ----- | ------------------------------------------- |
| Data  | Message path to the data                    |
| Style | Style of indicator ("Bulb" or "Background") |

### Rules (first matching rule wins)

Add, edit, and reorder the rules for when the indicator should display different colors or labels.

| Field        | Description                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Comparison   | How to evaluate incoming data against the 'Compare with' value ("Equal to", "Less than", "Less than or equal to", "Greater than", or "Greater than or equal to") |
| Compare with | Threshold or reference value to compare against (string, number, or boolean)                                                                                     |
| Color        | Color to display when this rule matches                                                                                                                          |
| Label        | Text label to display when this rule matches                                                                                                                     |

[1](https://docs.foxglove.dev/docs/visualization/message-path-syntax)

### Map panel

Display GPS and GeoJSON data on a world map.

### Markdown panel

Displays Github flavored Markdown within a layout. For a more complete reference of supported markdown features and nuance, see remark-gfm.

### Parameters panel

### Plot panel

### General

| Field                 | Description                                                                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X-axis value type     | Type and source of data for values plotted on the x-axis:<br>**Timestamp:** x-values for time series data<br>**Message path:** numeric message fields for XY plots<br>**Array index:** integer indices of an array in the latest message                                                                   |
| Sync with other plots | For Timestamp plots: Sync timeline to other Plot and State Transitions panels                                                                                                                                                                                                                              |
| Time range            | For Message path plots:<br>**All** shows data from the full time range<br>**Latest** shows data from the most recent message                                                                                                                                                                               |
| Axis scales           | For Message path plots:<br>**Independent** (the default) lets you configure min and max values for the scales independently<br>**1:1** is useful for when axes have the same units, and will keep the scales locked together. It hides the min/max axis settings and always zooms both axes simultaneously |

### Legend

| Field       | Description                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Position    | Position of the legend in relation to the chart (Floating, Left, Top)                                                              |
| Show legend | Display the legend                                                                                                                 |
| Show values | Show the corresponding y value next to each series in the legend (either at the current playback time or at a point on user hover) |

### X-axis

| Field               | Description                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default values path | For path-based values: the message path containing default x-axis values for the series. You can also set these individually for each series                                                                                                                  |
| Axis label          | Label displayed for the x-axis                                                                                                                                                                                                                                |
| Show tick labels    | Whether or not to display numeric values for x-axis tick marks                                                                                                                                                                                                |
| Time window         | For Timestamp plots:<br>**Automatic** Last 30 seconds for live data, or the full time range for recorded data<br>**Sliding** Specify a sliding time window that follows the current playback time<br>**Fixed** Set fixed min and max values for the time axis |
| Window size         | For Sliding time window: range of time in seconds                                                                                                                                                                                                             |
| Playhead position   | For Sliding time window: either at the center or the right edge                                                                                                                                                                                               |
| Min                 | For Fixed time window: min value in seconds                                                                                                                                                                                                                   |
| Max                 | For Fixed time window: max value in seconds                                                                                                                                                                                                                   |

### Y-axis

| Field            | Description                                                    |
| ---------------- | -------------------------------------------------------------- |
| Axis label       | Label displayed for the y-axis                                 |
| Show tick labels | Whether or not to display numeric values for y-axis tick marks |
| Min              | Fixed minimum value for y-axis                                 |
| Max              | Fixed maximum value for y-axis                                 |

### Series

| Field        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Label        | Label displayed for the series in the legend                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| X-value path | For Message path plots: message path containing x-axis values for the series. Overrides default x-axis values if set                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Y-value path | Message path containing y-axis values for the series                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Color        | Color used to plot the series                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Line size    | Width of line connecting data points                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Show line    | Show line connecting data points. (Not applicable to reference lines.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Timestamp    | For Timestamp plots, set which source of time information is used for message ordering:<br>**Log time** is the standard timestamp used for playback message ordering across the app. For live connections, this is when the message was received; for recorded files, this is when the message was originally recorded<br>**Custom field** is a message path which can point to any field within the message data containing sec and nsec integers<br>**Header stamp** is a header.stamp ROS 1 or ROS 2 field containing sec and nsec integers (and special case of 'custom field', above). This typically represents when sensor data was captured<br>**Publish time** is an optional MCAP-specific field representing when the event occured |

[1](https://docs.foxglove.dev/docs/visualization/panels/plot)
[2](https://docs.ros.org/en/foxy/How-To-Guides/Visualizing-ROS-2-Data-With-Foxglove-Studio.html)
[3](https://github.com/orgs/foxglove/discussions/176)
[4](https://docs.foxglove.dev/docs/visualization/variables)
[5](https://foxglove.dev/blog/refining-the-plot-panel-upgrades-to-a-core-tool)
[6](https://foxglove.github.io/foxglove-sdk/python/examples.html)
[7](https://www.reduct.store/blog/comparison-rviz-foxglove-rerun)
[8](https://www.waveshare.com/wiki/RoArm-M2-S_6._Using_Foxglove_for_Web-Based_Control)
[9](https://ros2docs.robook.org/rolling/Related-Projects/Visualizing-ROS-2-Data-With-Foxglove.html)
[10](https://rt-labs.com/fieldbus_in_software/real-time-visualization-with-foxglove-and-rt-kernel/)

### Publish panel

### Raw Messages panel

### Service Call panel

### State Transitions panel

### Table panel

### Teleop panel

### Transform Tree panel

### Variable Slider panel
