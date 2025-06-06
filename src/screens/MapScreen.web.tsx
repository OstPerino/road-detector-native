import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { AnalysisResponse, SegmentInfo } from '../types';
import { getColorForCoverage, COLOR_LEGENDS } from '../utils/colors';
import 'leaflet/dist/leaflet.css';

// Исправляем иконки маркеров для Leaflet
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapScreenProps {
  analysisData?: AnalysisResponse;
}

const MapScreen: React.FC<MapScreenProps> = ({ analysisData }) => {
  // Отладочная информация
  useEffect(() => {
    console.log('MapScreen rendered with data:', analysisData);
    if (analysisData) {
      console.log('Analysis data structure:', JSON.stringify(analysisData, null, 2));
      console.log('Segments:', analysisData.segments);
      if (analysisData.segments && analysisData.segments.length > 0) {
        console.log('First segment:', analysisData.segments[0]);
        console.log('First segment start_coordinate:', analysisData.segments[0].start_coordinate);
        console.log('First segment end_coordinate:', analysisData.segments[0].end_coordinate);
        
        // Дополнительная проверка координат
        const firstSegment = analysisData.segments[0];
        if (firstSegment.start_coordinate) {
          console.log('Start lat:', firstSegment.start_coordinate.lat, typeof firstSegment.start_coordinate.lat);
          console.log('Start lon:', firstSegment.start_coordinate.lon, typeof firstSegment.start_coordinate.lon);
        }
        if (firstSegment.end_coordinate) {
          console.log('End lat:', firstSegment.end_coordinate.lat, typeof firstSegment.end_coordinate.lat);
          console.log('End lon:', firstSegment.end_coordinate.lon, typeof firstSegment.end_coordinate.lon);
        }
      }
    }
  }, [analysisData]);

  // Более безопасное определение центра карты
  const getMapCenter = (): [number, number] => {
    if (analysisData?.segments && 
        analysisData.segments.length > 0 && 
        analysisData.segments[0].start_coordinate &&
        typeof analysisData.segments[0].start_coordinate.lat === 'number' &&
        typeof analysisData.segments[0].start_coordinate.lon === 'number') {
      return [
        analysisData.segments[0].start_coordinate.lat,
        analysisData.segments[0].start_coordinate.lon
      ];
    }
    // Красноярск по умолчанию
    return [55.996508, 92.792385];
  };

  const center = getMapCenter();

  const renderSegments = () => {
    if (!analysisData?.segments || !Array.isArray(analysisData.segments) || analysisData.segments.length === 0) {
      return (
        <div style={webStyles.noDataMessage}>
          <h3>📊 Данные анализа отсутствуют</h3>
          <p>Перейдите на вкладку "Анализ" для загрузки видео и получения результатов</p>
          {analysisData && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              <p>Отладочная информация:</p>
              <pre>{JSON.stringify(analysisData, null, 2)}</pre>
            </div>
          )}
        </div>
      );
    }

    return analysisData.segments.map((segment: SegmentInfo) => {
      // Строгая проверка структуры сегмента с новой структурой координат
      if (!segment.start_coordinate || 
          !segment.end_coordinate ||
          typeof segment.start_coordinate.lat !== 'number' ||
          typeof segment.start_coordinate.lon !== 'number' ||
          typeof segment.end_coordinate.lat !== 'number' ||
          typeof segment.end_coordinate.lon !== 'number') {
        console.warn('Invalid segment coordinates:', segment);
        return null;
      }

      const color = getColorForCoverage(segment.coverage_percentage);
      
      const positions: [number, number][] = [
        [segment.start_coordinate.lat, segment.start_coordinate.lon],
        [segment.end_coordinate.lat, segment.end_coordinate.lon],
      ];

      console.log(`Rendering segment ${segment.segment_id} with positions:`, positions, 'color:', color);

      return (
        <React.Fragment key={segment.segment_id}>
          <Polyline
            positions={positions}
            pathOptions={{ color, weight: 5, opacity: 0.8 }}
          />
          <Marker
            position={[segment.start_coordinate.lat, segment.start_coordinate.lon]}
          >
            <Popup>
              <div>
                <strong>Сегмент {segment.segment_id}</strong><br />
                Покрытие: {segment.coverage_percentage}%<br />
                Кадров: {segment.frames_count}<br />
                Есть данные: {segment.has_data ? 'Да' : 'Нет'}
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      );
    }).filter(Boolean); // Убираем null элементы
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
                {legend.minPercentage}-{legend.maxPercentage}% - {legend.label}
              </Text>
            </View>
          ))}
        </ScrollView>
        {analysisData?.overall_stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Статистика:</Text>
            <Text style={styles.statsText}>
              Всего сегментов: {analysisData.overall_stats.total_segments}
            </Text>
            <Text style={styles.statsText}>
              С данными: {analysisData.overall_stats.segments_with_data}
            </Text>
            <Text style={styles.statsText}>
              Среднее покрытие: {analysisData.overall_stats.average_coverage.toFixed(1)}%
            </Text>
            <Text style={styles.statsText}>
              Общая дистанция: {(analysisData.overall_stats.total_distance_meters / 1000).toFixed(2)} км
            </Text>
            <Text style={styles.statsText}>
              Длина сегмента: {analysisData.overall_stats.segment_length_meters} м
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!analysisData) {
    return (
      <View style={styles.container}>
        <div style={webStyles.emptyState}>
          <h2>🗺️ Карта результатов анализа</h2>
          <p>Здесь будут отображены результаты анализа дорожной разметки</p>
          <p>Перейдите на вкладку "Анализ" для начала работы</p>
        </div>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <div style={webStyles.mapContainer}>
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {renderSegments()}
        </MapContainer>
      </div>
      {renderLegend()}
    </View>
  );
};

const webStyles = {
  mapContainer: {
    flex: 1,
    height: '100vh',
    width: '100%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    padding: '20px',
    textAlign: 'center' as const,
    backgroundColor: '#f8f9fa',
  },
  noDataMessage: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center' as const,
    zIndex: 1000,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    maxWidth: '80%',
    maxHeight: '80%',
    overflow: 'auto',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    minWidth: 250,
    maxHeight: 400,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  legendScroll: {
    maxHeight: 150,
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