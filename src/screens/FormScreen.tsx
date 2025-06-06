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
import MapView, { Marker } from 'react-native-maps';
import * as DocumentPicker from 'expo-document-picker';
import { FormData, Coordinates, AnalysisResponse } from '../types';
import { analyzeVideo } from '../services/api';

interface FormScreenProps {
  onAnalysisComplete: (data: AnalysisResponse) => void;
}

const FormScreen: React.FC<FormScreenProps> = ({ onAnalysisComplete }) => {
  const [formData, setFormData] = useState<FormData>({
    segmentLength: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  const initialRegion = {
    latitude: 55.996508,
    longitude: 92.792385,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    
    if (!formData.startPoint) {
      setFormData({
        ...formData,
        startPoint: { latitude, longitude },
      });
    } else if (!formData.endPoint) {
      setFormData({
        ...formData,
        endPoint: { latitude, longitude },
      });
    } else {
      // Если обе точки уже выбраны, сбрасываем и начинаем заново
      setFormData({
        ...formData,
        startPoint: { latitude, longitude },
        endPoint: undefined,
      });
    }
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFormData({
          ...formData,
          videoFile: result.assets[0],
        });
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать файл');
    }
  };

  const handleSubmit = async () => {
    if (!formData.startPoint || !formData.endPoint) {
      Alert.alert('Ошибка', 'Выберите начальную и конечную точки на карте');
      return;
    }

    if (!formData.videoFile) {
      Alert.alert('Ошибка', 'Выберите видео файл');
      return;
    }

    if (!formData.segmentLength || formData.segmentLength <= 0) {
      Alert.alert('Ошибка', 'Введите корректную длину сегмента');
      return;
    }

    setIsLoading(true);

    try {
      const response = await analyzeVideo({
        videoFile: formData.videoFile,
        startLat: formData.startPoint.latitude,
        startLon: formData.startPoint.longitude,
        endLat: formData.endPoint.latitude,
        endLon: formData.endPoint.longitude,
        segmentLength: formData.segmentLength,
      });

      Alert.alert('Успех', 'Анализ завершен!', [
        {
          text: 'Перейти к карте',
          onPress: () => onAnalysisComplete(response),
        },
      ]);
    } catch (error) {
      console.error('Ошибка анализа:', error);
      Alert.alert('Ошибка', 'Не удалось выполнить анализ. Проверьте подключение к серверу.');
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
          Нажмите на карту для выбора начальной и конечной точек
        </Text>
        
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
          >
            {formData.startPoint && (
              <Marker
                coordinate={formData.startPoint}
                title="Начальная точка"
                pinColor="green"
              />
            )}
            {formData.endPoint && (
              <Marker
                coordinate={formData.endPoint}
                title="Конечная точка"
                pinColor="red"
              />
            )}
          </MapView>
        </View>

        <View style={styles.coordinatesInfo}>
          <Text style={styles.coordinateText}>
            Начальная точка: {
              formData.startPoint
                ? `${formData.startPoint.latitude.toFixed(6)}, ${formData.startPoint.longitude.toFixed(6)}`
                : 'Не выбрана'
            }
          </Text>
          <Text style={styles.coordinateText}>
            Конечная точка: {
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
    marginBottom: 10,
    fontStyle: 'italic',
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  map: {
    flex: 1,
  },
  coordinatesInfo: {
    marginBottom: 10,
  },
  coordinateText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 3,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    padding: 8,
    borderRadius: 5,
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