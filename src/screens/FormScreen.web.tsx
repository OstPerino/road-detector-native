import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { FormData, Coordinates, AnalysisResponse } from '../types';
import { analyzeVideo } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Исправляем иконки маркеров для Leaflet
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const StartIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const EndIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const BlueIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FormScreenProps {
  onAnalysisComplete: (data: AnalysisResponse) => void;
}

// Компонент для обработки кликов по карте
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const FormScreen: React.FC<FormScreenProps> = ({ onAnalysisComplete }) => {
  const [formData, setFormData] = useState<FormData>({
    segmentLength: 10,
  });
  const [isLoading, setIsLoading] = useState(false);

  const initialCenter: [number, number] = [55.996508, 92.792385];

  const handleMapClick = (lat: number, lng: number) => {
    console.log('Map clicked at:', lat, lng); // Для отладки
    
    if (!formData.startPoint) {
      setFormData({
        ...formData,
        startPoint: { latitude: lat, longitude: lng },
      });
      console.log('Set start point:', lat, lng);
    } else if (!formData.endPoint) {
      setFormData({
        ...formData,
        endPoint: { latitude: lat, longitude: lng },
      });
      console.log('Set end point:', lat, lng);
    } else {
      // Если обе точки уже выбраны, сбрасываем и начинаем заново
      setFormData({
        ...formData,
        startPoint: { latitude: lat, longitude: lng },
        endPoint: undefined,
      });
      console.log('Reset and set start point:', lat, lng);
    }
  };

  const pickVideo = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setFormData({
          ...formData,
          videoFile: file,
        });
      }
    };
    input.click();
  };

  const handleSubmit = async () => {
    if (!formData.startPoint || !formData.endPoint) {
      alert('Выберите начальную и конечную точки на карте');
      return;
    }

    if (!formData.videoFile) {
      alert('Выберите видео файл');
      return;
    }

    if (!formData.segmentLength || formData.segmentLength <= 0) {
      alert('Введите корректную длину сегмента');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Отправляем запрос с параметрами:', {
        startLat: formData.startPoint.latitude,
        startLon: formData.startPoint.longitude,
        endLat: formData.endPoint.latitude,
        endLon: formData.endPoint.longitude,
        segmentLength: formData.segmentLength,
        videoFileName: formData.videoFile.name,
        videoFileSize: formData.videoFile.size,
      });

      const response = await analyzeVideo({
        videoFile: formData.videoFile,
        startLat: formData.startPoint.latitude,
        startLon: formData.startPoint.longitude,
        endLat: formData.endPoint.latitude,
        endLon: formData.endPoint.longitude,
        segmentLength: formData.segmentLength,
      });

      console.log('Получен ответ от сервера:', response);
      console.log('Структура ответа:', JSON.stringify(response, null, 2));
      
      // Проверяем структуру ответа
      if (response.segments && Array.isArray(response.segments)) {
        console.log('Количество сегментов:', response.segments.length);
        if (response.segments.length > 0) {
          console.log('Первый сегмент:', response.segments[0]);
          console.log('Координаты первого сегмента:', response.segments[0].coordinates);
        }
      } else {
        console.warn('Неправильная структура segments в ответе');
      }

      if (response.overall_stats) {
        console.log('Общая статистика:', response.overall_stats);
      } else {
        console.warn('Отсутствует overall_stats в ответе');
      }

      alert('Анализ завершен! Переходим к карте...');
      onAnalysisComplete(response);
    } catch (error) {
      console.error('Ошибка анализа:', error);
      alert('Не удалось выполнить анализ. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearPoints = () => {
    setFormData({
      ...formData,
      startPoint: undefined,
      endPoint: undefined,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Выберите маршрут на карте</Text>
        <Text style={styles.hint}>
          Нажмите на карту для выбора начальной (зеленая) и конечной (красная) точек
        </Text>
        
        <div style={webStyles.mapContainer}>
          <MapContainer
            center={initialCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {formData.startPoint && (
              <Marker
                position={[formData.startPoint.latitude, formData.startPoint.longitude]}
                icon={StartIcon}
              />
            )}
            {formData.endPoint && (
              <Marker
                position={[formData.endPoint.latitude, formData.endPoint.longitude]}
                icon={EndIcon}
              />
            )}
          </MapContainer>
        </div>

        <View style={styles.coordinatesInfo}>
          <Text style={[styles.coordinateText, formData.startPoint && styles.coordinateActive]}>
            🟢 Начальная точка: {
              formData.startPoint
                ? `${formData.startPoint.latitude.toFixed(6)}, ${formData.startPoint.longitude.toFixed(6)}`
                : 'Не выбрана'
            }
          </Text>
          <Text style={[styles.coordinateText, formData.endPoint && styles.coordinateActive]}>
            🔴 Конечная точка: {
              formData.endPoint
                ? `${formData.endPoint.latitude.toFixed(6)}, ${formData.endPoint.longitude.toFixed(6)}`
                : 'Не выбрана'
            }
          </Text>
        </View>

        <TouchableOpacity style={styles.clearButton} onPress={clearPoints}>
          <Text style={styles.clearButtonText}>Очистить точки</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Длина сегмента (м)</Text>
        <TextInput
          style={styles.input}
          value={formData.segmentLength?.toString() || ''}
          onChangeText={(text) =>
            setFormData({ ...formData, segmentLength: parseInt(text) || 0 })
          }
          keyboardType="numeric"
          placeholder="Введите длину сегмента в метрах"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Видео файл</Text>
        <TouchableOpacity style={styles.videoButton} onPress={pickVideo}>
          <Text style={styles.videoButtonText}>
            {formData.videoFile ? formData.videoFile.name : 'Выбрать видео файл'}
          </Text>
        </TouchableOpacity>
        {formData.videoFile && (
          <Text style={styles.fileInfo}>
            Размер: {(formData.videoFile.size / 1024 / 1024).toFixed(2)} МБ
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Анализировать</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const webStyles = {
  mapContainer: {
    height: '300px',
    width: '100%',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '15px',
    border: '2px solid #007AFF',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  hint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  coordinatesInfo: {
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  coordinateText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 5,
    padding: 5,
    borderRadius: 4,
  },
  coordinateActive: {
    backgroundColor: '#e8f5e8',
    color: '#2d5a2d',
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  videoButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  videoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 6,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c7b7f',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FormScreen; 