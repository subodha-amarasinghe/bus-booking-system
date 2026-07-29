import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passenger Mobile</Text>
      <Text style={styles.subtitle}>Book seats and pay securely.</Text>
      <Link href="/login" style={styles.link}>
        Login
      </Link>
      <Link href="/seat-map" style={styles.link}>
        Seat map
      </Link>
      <Link href="/payment" style={styles.link}>
        Payment
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f7f9fb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#0b3d5c',
  },
  subtitle: {
    fontSize: 16,
    color: '#556',
    marginBottom: 24,
  },
  link: {
    fontSize: 18,
    color: '#0b5fff',
    marginBottom: 12,
  },
});
