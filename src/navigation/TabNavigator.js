import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MiniPlayer from '../components/MiniPlayer';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        tabBar={() => null}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
      </Tab.Navigator>
      <MiniPlayer />
    </>
  );
};

export default TabNavigator;
