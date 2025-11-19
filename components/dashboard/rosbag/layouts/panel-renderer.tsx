import React from "react";
import {
  PlotPanel,
  GaugePanel,
  IndicatorPanel,
  RawTopicViewerPanel,
  DiagnosticsPanel,
} from "@/components/dashboard/rosbag/panels";
import type { PanelConfig } from "@/store/panels-store";

interface PanelRendererProps {
  panel: PanelConfig;
}

export const PanelRenderer: React.FC<PanelRendererProps> = React.memo(({ panel }) => {
  switch (panel.type) {
    case "plot":
      return <PlotPanel panelConfig={panel} />;
    case "gauge":
      return <GaugePanel panelConfig={panel} />;
    case "indicator":
      return <IndicatorPanel panelConfig={panel} />;
    case "raw-topic-viewer":
      return <RawTopicViewerPanel panelConfig={panel} />;
    case "diagnostics":
      return <DiagnosticsPanel panelConfig={panel} />;
    default:
      return <div>Unknown panel type</div>;
  }
});

PanelRenderer.displayName = "PanelRenderer";
