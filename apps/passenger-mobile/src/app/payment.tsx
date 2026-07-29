import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';

/**
 * PaymentScreen stub — loads a payment URL in a WebView.
 * Pass `?url=` query param when navigating to this screen.
 */
export default function PaymentScreen() {
  const params = useLocalSearchParams<{ url?: string }>();
  const paymentUrl = useMemo(
    () =>
      (typeof params.url === 'string' && params.url) ||
      'https://example.com/payment-stub',
    [params.url]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Payment WebView (stub)</Text>
      <WebView source={{ uri: paymentUrl }} style={styles.webview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hint: {
    padding: 8,
    textAlign: 'center',
    color: '#556',
    backgroundColor: '#f0f4f8',
  },
  webview: { flex: 1 },
});
