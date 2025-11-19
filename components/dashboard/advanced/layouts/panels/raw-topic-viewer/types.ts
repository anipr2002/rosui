export interface RawTopicViewerConfig {
  topic?: string;
  maxMessageLength?: number; // Default: 10000
  prettyPrint?: boolean; // Default: true
  showTimestamp?: boolean; // Default: true
}
