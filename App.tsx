import React, { useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { AnalysisResponse } from './src/types';

// Платформо-зависимый импорт компонентов
const FormScreen = Platform.OS === 'web' 
  ? require('./src/screens/FormScreen.web').default 
  : require('./src/screens/FormScreen').default;

const MapScreen = Platform.OS === 'web' 
  ? require('./src/screens/MapScreen.web').default 
  : require('./src/screens/MapScreen').default;

const Tab = createBottomTabNavigator();

export default function App() {
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | undefined>();
  const navigationRef = useRef<any>(null);

  const handleAnalysisComplete = (data: AnalysisResponse) => {
    console.log('Analysis completed, data received:', data);
    setAnalysisData(data);
    
    // Автоматический переход на карту после получения данных
    if (navigationRef.current) {
      navigationRef.current.navigate('Map');
    }
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Form') {
              iconName = focused ? 'document-text' : 'document-text-outline';
            } else if (route.name === 'Map') {
              iconName = focused ? 'map' : 'map-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen
          name="Form"
          options={{
            title: 'Анализ',
            headerTitle: 'Анализ дорожной разметки',
          }}
        >
          {() => <FormScreen onAnalysisComplete={handleAnalysisComplete} />}
        </Tab.Screen>
        <Tab.Screen
          name="Map"
          options={{
            title: 'Карта',
            headerTitle: 'Результаты анализа',
          }}
        >
          {() => <MapScreen analysisData={analysisData} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
