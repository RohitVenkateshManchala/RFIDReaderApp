import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Image} from 'react-native';
import ScanAssignScreen from './src/screens/ScanAssignScreen';
import CheckTagsScreen from './src/screens/CheckTagsScreen';
import ParametersScreen from './src/screens/ParametersScreen';
import {NativeBaseProvider} from 'native-base';

const Tab = createBottomTabNavigator();
// Import your images
const assignIcon = require('./src/images/assignTag.png');
const checkIcon = require('./src/images/checkTag.png');
const parametersIcon = require('./src/images/parameter.png');

const App: React.FC = () => {
  return (
    <NativeBaseProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused}) => {
              let iconName;

              if (route.name === 'Assign Tags') {
                iconName = assignIcon;
              } else if (route.name === 'Check Tags') {
                iconName = checkIcon;
              } else if (route.name === 'Parameters') {
                iconName = parametersIcon;
              }

              // Return the image as the icon
              return (
                <Image
                  source={iconName}
                  style={{
                    width: focused ? 30 : 25, // Slightly larger when focused
                    height: focused ? 30 : 25,
                    tintColor: focused ? 'tomato' : 'gray', // Optional tint color
                  }}
                />
              );
            },
            tabBarActiveTintColor: 'tomato',
            tabBarInactiveTintColor: 'gray',
          })}>
          <Tab.Screen
            name="Assign Tags"
            component={ScanAssignScreen}
            options={{headerShown: false}}
          />
          <Tab.Screen
            name="Check Tags"
            component={CheckTagsScreen}
            options={{headerShown: false}}
          />
          <Tab.Screen
            name="Parameters"
            component={ParametersScreen}
            options={{headerShown: false}}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
};

export default App;

// import React from 'react';
// import RFIDScanner from './src/RFIDScanner';

// const App: React.FC = () => {
//   return <RFIDScanner />;
// };

// export default App;
