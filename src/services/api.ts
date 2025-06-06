import axios from 'axios';
import { AnalysisResponse } from '../types';

// Настройка базового URL (замените на ваш адрес)
const API_BASE_URL = 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 секунд для обработки видео
});

export interface AnalyzeVideoParams {
  videoFile: any; // файл
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  segmentLength: number;
}

export const analyzeVideo = async (params: AnalyzeVideoParams): Promise<AnalysisResponse> => {
  const formData = new FormData();
  
  formData.append('video', params.videoFile);
  formData.append('startLat', params.startLat.toString());
  formData.append('startLon', params.startLon.toString());
  formData.append('endLat', params.endLat.toString());
  formData.append('endLon', params.endLon.toString());
  formData.append('segmentLength', params.segmentLength.toString());

  const response = await api.post<AnalysisResponse>('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const checkHealth = async (): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>('/health');
  return response.data;
}; 