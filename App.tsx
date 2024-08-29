import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Text, View } from 'react-native';
import ScanAssignScreen from './src/ScanAssignScreen';
import CheckTagsScreen from './src/CheckTagsScreen';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Assign Tags" component={ScanAssignScreen} />
        <Tab.Screen name="Check Tags" component={CheckTagsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;



// import React from 'react';
// import RFIDScanner from './src/RFIDScanner';

// const App: React.FC = () => {
//   return <RFIDScanner />;
// };

// export default App;

