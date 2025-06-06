import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { AnalysisResponse, SegmentInfo } from '../types';
import { getColorForCoverage, COLOR_LEGENDS } from '../utils/colors';

interface MapScreenProps {
  analysisData?: AnalysisResponse;
}

const MapScreen: React.FC<MapScreenProps> = ({ analysisData }) => {
  const initialRegion = {
    latitude: analysisData?.segments[0]?.coordinates.start.latitude || 55.996508,
    longitude: analysisData?.segments[0]?.coordinates.start.longitude || 92.792385,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const renderSegments = () => {
    if (!analysisData?.segments) return null;

    return analysisData.segments.map((segment: SegmentInfo, index: number) => {
      const color = getColorForCoverage(segment.coverage_percentage);
      
      return (
        <React.Fragment key={segment.segment_id}>
          <Polyline
            coordinates={[
              {
                latitude: segment.coordinates.start.latitude,
                longitude: segment.coordinates.start.longitude,
              },
              {
                latitude: segment.coordinates.end.latitude,
                longitude: segment.coordinates.end.longitude,
              },
            ]}
            strokeColor={color}
            strokeWidth={5}
          />
          <Marker
            coordinate={{
              latitude: segment.coordinates.start.latitude,
              longitude: segment.coordinates.start.longitude,
            }}
            title={`Сегмент ${segment.segment_id}`}
            description={`Покрытие: ${segment.coverage_percentage}%`}
          />
        </React.Fragment>
      );
    });
  };

  const renderLegend = () => {
    return (
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Покрытие разметки:</Text>
        <ScrollView style={styles.legendScroll}>
          {COLOR_LEGENDS.map((legend, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.colorBox, { backgroundColor: legend.color }]} />
              <Text style={styles.legendText}>
                {legend.minPercentage}-{legend.maxPercentage}%
              </Text>
            </View>
          ))}
        </ScrollView>
        {analysisData && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Статистика:</Text>
            <Text style={styles.statsText}>
              Всего сегментов: {analysisData.overall_stats.total_segments}
            </Text>
            <Text style={styles.statsText}>
              Среднее покрытие: {analysisData.overall_stats.average_coverage.toFixed(1)}%
            </Text>
            <Text style={styles.statsText}>
              Общая дистанция: {(analysisData.overall_stats.total_distance_meters / 1000).toFixed(2)} км
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {renderSegments()}
      </MapView>
      {renderLegend()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    minWidth: 200,
    maxHeight: 300,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  legendScroll: {
    maxHeight: 120,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  colorBox: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  statsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  statsText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
});

export default MapScreen; 