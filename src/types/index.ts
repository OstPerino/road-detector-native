export interface Coordinates {
  lat: number;
  lon: number;
}

export interface SegmentInfo {
  segment_id: number;
  frames_count: number;
  coverage_percentage: number;
  has_data: boolean;
  start_coordinate: Coordinates;
  end_coordinate: Coordinates;
}

export interface OverallStats {
  total_frames: number;
  total_distance_meters: number;
  segment_length_meters: number;
  total_segments: number;
  segments_with_data: number;
  average_coverage: number;
}

export interface AnalysisResponse {
  status: string;
  message: string;
  overall_stats: OverallStats;
  segments: SegmentInfo[];
}

export interface FormData {
  startPoint?: Coordinates;
  endPoint?: Coordinates;
  segmentLength: number;
  videoFile?: any;
}

export interface ColorLegend {
  color: string;
  minPercentage: number;
  maxPercentage: number;
  label: string;
} 