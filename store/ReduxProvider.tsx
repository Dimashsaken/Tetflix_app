import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import LoadingAnimation from '../app/components/LoadingAnimation';

interface ReduxProviderProps {
  children: React.ReactNode;
}

const PersistGateLoadingComponent = () => (
  <View style={styles.loadingContainer}>
    <LoadingAnimation />
  </View>
);

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={<PersistGateLoadingComponent />} 
        persistor={persistor}
      >
        {children}
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#13111C',
  },
});

export default ReduxProvider;
