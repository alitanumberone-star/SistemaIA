import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';
import 'package:geolocator/geolocator.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const VelocimetroApp());
}

class VelocimetroApp extends StatelessWidget {
  const VelocimetroApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Velocimetro GPS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF00E5A0),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0B0F14),
        useMaterial3: true,
      ),
      home: const SpeedometerPage(),
    );
  }
}

enum GpsStatus { initializing, serviceDisabled, denied, deniedForever, active }

enum SpeedUnit {
  kmh('km/h', 3.6, 240),
  mph('mph', 2.236936, 150);

  const SpeedUnit(this.label, this.factor, this.max);
  final String label;
  final double factor; // desde m/s
  final double max;
}

class SpeedometerPage extends StatefulWidget {
  const SpeedometerPage({super.key});

  @override
  State<SpeedometerPage> createState() => _SpeedometerPageState();
}

class _SpeedometerPageState extends State<SpeedometerPage> {
  StreamSubscription<Position>? _sub;
  GpsStatus _status = GpsStatus.initializing;
  SpeedUnit _unit = SpeedUnit.kmh;

  double _speedMs = 0;
  double _maxMs = 0;
  double _distanceM = 0;
  double? _accuracy;
  Position? _last;
  final Stopwatch _watch = Stopwatch();
  double _movingSumMs = 0;
  int _movingSamples = 0;

  @override
  void initState() {
    super.initState();
    _start();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  Future<void> _start() async {
    await _sub?.cancel();
    setState(() => _status = GpsStatus.initializing);

    if (!await Geolocator.isLocationServiceEnabled()) {
      setState(() => _status = GpsStatus.serviceDisabled);
      return;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      setState(() => _status = GpsStatus.denied);
      return;
    }
    if (permission == LocationPermission.deniedForever) {
      setState(() => _status = GpsStatus.deniedForever);
      return;
    }

    final settings = AndroidSettings(
      accuracy: LocationAccuracy.bestForNavigation,
      distanceFilter: 0,
      intervalDuration: const Duration(seconds: 1),
      // Fuerza el GPS fisico (no el proveedor de red / Google Play Services).
      forceLocationManager: true,
    );

    _sub = Geolocator.getPositionStream(locationSettings: settings).listen(
      _onPosition,
      onError: (_) => setState(() => _status = GpsStatus.serviceDisabled),
    );
    setState(() => _status = GpsStatus.active);
  }

  void _onPosition(Position p) {
    final speed = p.speed.isNaN || p.speed < 0 ? 0.0 : p.speed;
    // Filtra ruido del GPS cuando el dispositivo esta quieto (< 1 km/h).
    final filtered = speed < 0.28 ? 0.0 : speed;

    if (!_watch.isRunning) _watch.start();

    if (_last != null && filtered > 0 && p.accuracy <= 30) {
      _distanceM += Geolocator.distanceBetween(
        _last!.latitude,
        _last!.longitude,
        p.latitude,
        p.longitude,
      );
    }
    if (filtered > 0) {
      _movingSumMs += filtered;
      _movingSamples++;
    }

    setState(() {
      _status = GpsStatus.active;
      _speedMs = filtered;
      _accuracy = p.accuracy;
      _maxMs = math.max(_maxMs, filtered);
      _last = p;
    });
  }

  void _reset() {
    setState(() {
      _maxMs = 0;
      _distanceM = 0;
      _movingSumMs = 0;
      _movingSamples = 0;
      _last = null;
      _watch
        ..stop()
        ..reset();
      if (_status == GpsStatus.active) _watch.start();
    });
  }

  String _fmtDuration(Duration d) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(d.inHours)}:${two(d.inMinutes % 60)}:${two(d.inSeconds % 60)}';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final speed = _speedMs * _unit.factor;
    final max = _maxMs * _unit.factor;
    final avg = _movingSamples == 0
        ? 0.0
        : (_movingSumMs / _movingSamples) * _unit.factor;
    final distance = _unit == SpeedUnit.kmh
        ? _distanceM / 1000
        : _distanceM / 1609.344;
    final distUnit = _unit == SpeedUnit.kmh ? 'km' : 'mi';

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Velocimetro GPS'),
        centerTitle: true,
        actions: [
          IconButton(
            tooltip: 'Reiniciar viaje',
            icon: const Icon(Icons.restart_alt),
            onPressed: _reset,
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              _StatusBanner(
                status: _status,
                accuracy: _accuracy,
                onRetry: _start,
                onSettings: _status == GpsStatus.deniedForever
                    ? Geolocator.openAppSettings
                    : Geolocator.openLocationSettings,
              ),
              Expanded(
                child: Center(
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(end: speed),
                      duration: const Duration(milliseconds: 600),
                      curve: Curves.easeOutCubic,
                      builder: (context, value, _) => CustomPaint(
                        painter: _GaugePainter(
                          value: value,
                          maxValue: _unit.max,
                          color: scheme.primary,
                        ),
                        child: Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                value.round().toString(),
                                style: const TextStyle(
                                  fontSize: 84,
                                  fontWeight: FontWeight.w700,
                                  height: 1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _unit.label,
                                style: TextStyle(
                                  fontSize: 20,
                                  color: Colors.white.withValues(alpha: 0.6),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Row(
                children: [
                  _StatTile(label: 'MAX', value: max.toStringAsFixed(0)),
                  const SizedBox(width: 10),
                  _StatTile(label: 'PROMEDIO', value: avg.toStringAsFixed(0)),
                  const SizedBox(width: 10),
                  _StatTile(
                    label: 'DISTANCIA ($distUnit)',
                    value: distance.toStringAsFixed(2),
                  ),
                  const SizedBox(width: 10),
                  _StatTile(label: 'TIEMPO', value: _fmtDuration(_watch.elapsed)),
                ],
              ),
              const SizedBox(height: 16),
              SegmentedButton<SpeedUnit>(
                segments: [
                  for (final u in SpeedUnit.values)
                    ButtonSegment(value: u, label: Text(u.label)),
                ],
                selected: {_unit},
                onSelectionChanged: (s) => setState(() => _unit = s.first),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBanner extends StatelessWidget {
  const _StatusBanner({
    required this.status,
    required this.accuracy,
    required this.onRetry,
    required this.onSettings,
  });

  final GpsStatus status;
  final double? accuracy;
  final VoidCallback onRetry;
  final Future<bool> Function() onSettings;

  @override
  Widget build(BuildContext context) {
    final (IconData icon, String text, Color color, bool action) = switch (status) {
      GpsStatus.initializing => (
        Icons.gps_not_fixed,
        'Buscando senal GPS...',
        Colors.amber,
        false,
      ),
      GpsStatus.serviceDisabled => (
        Icons.location_disabled,
        'GPS desactivado. Activalo para medir la velocidad.',
        Colors.redAccent,
        true,
      ),
      GpsStatus.denied => (
        Icons.location_off,
        'Permiso de ubicacion denegado.',
        Colors.redAccent,
        true,
      ),
      GpsStatus.deniedForever => (
        Icons.location_off,
        'Permiso denegado. Habilitalo en Ajustes.',
        Colors.redAccent,
        true,
      ),
      GpsStatus.active => (
        Icons.gps_fixed,
        accuracy == null
            ? 'Esperando primera lectura...'
            : 'GPS activo - precision ${accuracy!.toStringAsFixed(0)} m',
        Colors.greenAccent,
        false,
      ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
          if (action) ...[
            TextButton(
              onPressed: () => onSettings(),
              child: const Text('Ajustes'),
            ),
            TextButton(onPressed: onRetry, child: const Text('Reintentar')),
          ],
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            FittedBox(
              child: Text(
                value,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 4),
            FittedBox(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  letterSpacing: 0.5,
                  color: Colors.white.withValues(alpha: 0.55),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GaugePainter extends CustomPainter {
  _GaugePainter({
    required this.value,
    required this.maxValue,
    required this.color,
  });

  final double value;
  final double maxValue;
  final Color color;

  static const double _start = 3 * math.pi / 4; // 135 grados
  static const double _sweep = 3 * math.pi / 2; // 270 grados

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.shortestSide / 2 - 16;
    final rect = Rect.fromCircle(center: center, radius: radius);
    final fraction = (value / maxValue).clamp(0.0, 1.0);

    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 16
      ..strokeCap = StrokeCap.round
      ..color = Colors.white.withValues(alpha: 0.08);
    canvas.drawArc(rect, _start, _sweep, false, track);

    final progress = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 16
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        startAngle: _start,
        endAngle: _start + _sweep,
        colors: [color, Colors.amber, Colors.redAccent],
        transform: const GradientRotation(0),
      ).createShader(rect);
    if (fraction > 0) {
      canvas.drawArc(rect, _start, _sweep * fraction, false, progress);
    }

    // Marcas y numeros.
    const ticks = 8;
    final tickPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.35)
      ..strokeWidth = 2;
    for (var i = 0; i <= ticks; i++) {
      final angle = _start + _sweep * i / ticks;
      final dir = Offset(math.cos(angle), math.sin(angle));
      canvas.drawLine(
        center + dir * (radius - 30),
        center + dir * (radius - 22),
        tickPaint,
      );
      final tp = TextPainter(
        text: TextSpan(
          text: (maxValue * i / ticks).round().toString(),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 11,
          ),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, center + dir * (radius - 44) - tp.size.center(Offset.zero));
    }

    // Aguja.
    final needleAngle = _start + _sweep * fraction;
    final needleDir = Offset(math.cos(needleAngle), math.sin(needleAngle));
    canvas.drawLine(
      center + needleDir * (radius - 100),
      center + needleDir * (radius - 58),
      Paint()
        ..color = color
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_GaugePainter old) =>
      old.value != value || old.maxValue != maxValue || old.color != color;
}
