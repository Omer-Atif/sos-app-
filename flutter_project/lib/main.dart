import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Initialize the notification plugin
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  // Ensure Flutter is initialized before calling platform-specific code
  WidgetsFlutterBinding.ensureInitialized();

  // --- 1. NOTIFICATION INITIALIZATION ---
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');

  const InitializationSettings initializationSettings = InitializationSettings(
    android: initializationSettingsAndroid,
  );

  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  runApp(const GuardianApp());
}

// Global function to trigger system-level notifications
Future<void> showNotification(String title, String body) async {
  const AndroidNotificationDetails androidPlatformChannelSpecifics =
      AndroidNotificationDetails(
    'sos_channel_id',
    'Emergency Alerts',
    channelDescription: 'Notifications for SOS signal status',
    importance: Importance.max,
    priority: Priority.high,
  );
  
  const NotificationDetails platformChannelSpecifics =
      NotificationDetails(android: androidPlatformChannelSpecifics);
      
  await flutterLocalNotificationsPlugin.show(
    0, // Notification ID
    title,
    body,
    platformChannelSpecifics,
  );
}

class GuardianApp extends StatelessWidget {
  const GuardianApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Guardian SOS',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.red),
        useMaterial3: true,
      ),
      home: const LoginPage(),
    );
  }
}

// --- LOGIN PAGE SCREEN ---
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  bool _isWaiting = false;
  bool _isApproved = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _startApprovalProcess() async {
    if (_usernameController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter login credentials")),
      );
      return;
    }

    setState(() {
      _isWaiting = true;
    });

    // SIMULATION: Simulate an approval delay of 5 seconds
    Timer(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() {
          _isApproved = true;
        });
        
        // Auto-navigate to Home Page once approved
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomePage()),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("SOS Registration")),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (!_isWaiting) ...[
                const Icon(Icons.shield_outlined, size: 80, color: Colors.blueGrey),
                const SizedBox(height: 32),
                TextField(
                  controller: _usernameController,
                  decoration: const InputDecoration(
                    labelText: "Username",
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: "Password",
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _startApprovalProcess,
                    child: const Text("SIGN IN"),
                  ),
                ),
              ] else ...[
                const CircularProgressIndicator(),
                const SizedBox(height: 24),
                const Text("Verifying Identity...", style: TextStyle(fontSize: 18)),
                const SizedBox(height: 8),
                const Text("Waiting for administrator approval", style: TextStyle(color: Colors.grey)),
              ]
            ],
          ),
        ),
      ),
    );
  }
}

// --- HOME PAGE SCREEN ---
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  // --- ENHANCED SOS API INTEGRATION ---
  Future<void> sendSOS(BuildContext context) async {
    // 1. Generate dynamic timestamp perfectly formatted for the API
    final String timestamp = DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now());

    // 2. Construct URL dynamically with Priority and Alert signals
    final Uri uri = Uri.parse("https://smartrack.ddns.net/api/api_loc.php").replace(
      queryParameters: {
        'imei': '123456789054321',      // Device ID
        'dt': timestamp,                 // Dynamic Time
        'lat': '54.000000',
        'lng': '25.000000',
        'altitude': '100',
        'angle': '45',
        'speed': '0',
        'loc_valid': '1',
        'params': 'batp=100|',
        'event': 'sos',                  // SOS Event Type
        'alert': '1',                    // Explicit Notification Trigger
        'priority': 'high',              // High Priority Alert
      },
    );

    debugPrint("DISPATCHING SOS: ${uri.toString()}");

    try {
      final response = await http.get(uri).timeout(const Duration(seconds: 10));
      
      debugPrint("SERVER STATUS: ${response.statusCode}");

      if (response.statusCode == 200) {
        // SUCCESS Feedback
        await showNotification(
          "SOS Alert Sent", 
          "Your signal has been received by the control room."
        );
      } else {
        // SERVER REJECTION Feedback
        await showNotification(
          "SOS Broadcast Failed", 
          "The server returned an error (Code: ${response.statusCode})"
        );
      }
    } catch (e) {
      // NETWORK ERROR Feedback
      debugPrint("NETWORK ERROR: $e");
      await showNotification(
          "SOS Failed", 
          "Connection error. Please check your data/wifi."
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Guardian SOS Dashboard")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("SYSTEM STATUS: MONITORING", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 50),
            
            // --- SOS BUTTON ---
            GestureDetector(
              onTap: () => sendSOS(context),
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.red.withOpacity(0.3), blurRadius: 30, spreadRadius: 10),
                  ],
                  border: Border.all(color: Colors.white, width: 8),
                ),
                child: const Center(
                  child: Text(
                    "SOS",
                    style: TextStyle(color: Colors.white, fontSize: 50, fontWeight: FontWeight.black),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 50),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 40),
              child: Text(
                "TAP BUTTON IN EMERGENCY\nSignal is broadcasted to the control server immediately.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.blueGrey),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
