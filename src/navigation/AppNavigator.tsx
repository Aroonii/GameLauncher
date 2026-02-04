import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameListScreen } from '../screens/GameListScreen';
import { GameViewScreen } from '../screens/GameViewScreen';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="GameList">
        <Stack.Screen 
          name="GameList" 
          component={GameListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GameView"
          component={GameViewScreen}
          options={{
            headerTintColor: '#007AFF',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};