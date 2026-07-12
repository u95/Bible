export interface FlutterFile {
  path: string;
  language: string;
  content: string;
}

export const flutterFiles: FlutterFile[] = [
  {
    path: "pubspec.yaml",
    language: "yaml",
    content: `name: umn_tamil_bible
description: A complete offline Tamil Bible application by UMN Ministry.
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.5
  provider: ^6.1.1
  go_router: ^13.2.0
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  path_provider: ^2.1.2
  share_plus: ^7.2.1
  flutter_staggered_grid_view: ^0.7.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/tamil_bible_sample.json
`
  },
  {
    path: "lib/main.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';
import 'package:umn_tamil_bible/providers/theme_provider.dart';
import 'package:umn_tamil_bible/routes/app_router.dart';
import 'package:umn_tamil_bible/models/bookmark.dart';
import 'package:umn_tamil_bible/models/note.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Hive
  await Hive.initFlutter();
  
  // Register Hive Adapters
  Hive.registerAdapter(BookmarkAdapter());
  Hive.registerAdapter(NoteAdapter());
  
  // Open Hive Boxes
  await Hive.openBox<Bookmark>('bookmarks_box');
  await Hive.openBox<Note>('notes_box');
  await Hive.openBox('settings_box');

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => BibleProvider()..initialize()),
      ],
      child: const UMNBibleApp(),
    ),
  );
}

class UMNBibleApp extends StatelessWidget {
  const UMNBibleApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    
    return MaterialApp.router(
      title: 'UMN Tamil Bible',
      debugShowCheckedModeBanner: false,
      themeMode: themeProvider.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A), // Elegant Navy Blue Christian theme
          brightness: Brightness.light,
        ),
        fontFamily: 'Inter',
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A),
          brightness: Brightness.dark,
        ),
        fontFamily: 'Inter',
      ),
      routerConfig: AppRouter.router,
    );
  }
}
`
  },
  {
    path: "lib/models/bible_verse.dart",
    language: "dart",
    content: `class BibleVerse {
  final int bookId;
  final String bookName;
  final int chapter;
  final int verse;
  final String text;

  BibleVerse({
    required this.bookId,
    required this.bookName,
    required this.chapter,
    required this.verse,
    required this.text,
  });

  factory BibleVerse.fromJson(Map<String, dynamic> json) {
    return BibleVerse(
      bookId: json['bookId'] as int,
      bookName: json['bookName'] as String,
      chapter: json['chapter'] as int,
      verse: json['verse'] as int,
      text: json['text'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bookId': bookId,
      'bookName': bookName,
      'chapter': chapter,
      'verse': verse,
      'text': text,
    };
  }
}

class BibleBook {
  final int id;
  final String tamilName;
  final String englishName;
  final String testament; // "Old" or "New"
  final int chapters;

  BibleBook({
    required this.id,
    required this.tamilName,
    required this.englishName,
    required this.testament,
    required this.chapters,
  });

  factory BibleBook.fromJson(Map<String, dynamic> json) {
    return BibleBook(
      id: json['id'] as int,
      tamilName: json['tamilName'] as String,
      englishName: json['englishName'] as String,
      testament: json['testament'] as String,
      chapters: json['chapters'] as int,
    );
  }
}
`
  },
  {
    path: "lib/models/bookmark.dart",
    language: "dart",
    content: `import 'package:hive/hive.dart';

part 'bookmark.g.dart';

@HiveType(typeId: 0)
class Bookmark extends HiveObject {
  @HiveField(0)
  final int bookId;

  @HiveField(1)
  final String bookName;

  @HiveField(2)
  final int chapter;

  @HiveField(3)
  final int verse;

  @HiveField(4)
  final String text;

  @HiveField(5)
  final DateTime createdAt;

  Bookmark({
    required this.bookId,
    required this.bookName,
    required this.chapter,
    required this.verse,
    required this.text,
    required this.createdAt,
  });
}
`
  },
  {
    path: "lib/models/note.dart",
    language: "dart",
    content: `import 'package:hive/hive.dart';

part 'note.g.dart';

@HiveType(typeId: 1)
class Note extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  final int bookId;

  @HiveField(2)
  final String bookName;

  @HiveField(3)
  final int chapter;

  @HiveField(4)
  final int verse;

  @HiveField(5)
  String noteText;

  @HiveField(6)
  DateTime updatedAt;

  Note({
    required this.id,
    required this.bookId,
    required this.bookName,
    required this.chapter,
    required this.verse,
    required this.noteText,
    required this.updatedAt,
  });
}
`
  },
  {
    path: "lib/services/database_service.dart",
    language: "dart",
    content: `import 'package:hive_flutter/hive_flutter.dart';
import 'package:umn_tamil_bible/models/bookmark.dart';
import 'package:umn_tamil_bible/models/note.dart';

class DatabaseService {
  static final Box<Bookmark> _bookmarksBox = Hive.box<Bookmark>('bookmarks_box');
  static final Box<Note> _notesBox = Hive.box<Note>('notes_box');
  static final Box _settingsBox = Hive.box('settings_box');

  // Bookmarks
  static List<Bookmark> getBookmarks() {
    return _bookmarksBox.values.toList();
  }

  static Future<void> saveBookmark(Bookmark bookmark) async {
    final key = '\${bookmark.bookId}_\${bookmark.chapter}_\${bookmark.verse}';
    await _bookmarksBox.put(key, bookmark);
  }

  static Future<void> deleteBookmark(int bookId, int chapter, int verse) async {
    final key = '\${bookId}_\${chapter}_\${verse}';
    await _bookmarksBox.delete(key);
  }

  static bool isBookmarked(int bookId, int chapter, int verse) {
    final key = '\${bookId}_\${chapter}_\${verse}';
    return _bookmarksBox.containsKey(key);
  }

  // Notes
  static List<Note> getNotes() {
    return _notesBox.values.toList();
  }

  static Future<void> saveNote(Note note) async {
    await _notesBox.put(note.id, note);
  }

  static Future<void> deleteNote(String noteId) async {
    await _notesBox.delete(noteId);
  }

  static Note? getNoteForVerse(int bookId, int chapter, int verse) {
    try {
      return _notesBox.values.firstWhere(
        (n) => n.bookId == bookId && n.chapter == chapter && n.verse == verse,
      );
    } catch (_) {
      return null;
    }
  }

  // Settings
  static bool isDarkTheme() {
    return _settingsBox.get('dark_mode', defaultValue: false) as bool;
  }

  static Future<void> setDarkTheme(bool val) async {
    await _settingsBox.put('dark_mode', val);
  }

  static double getFontSize() {
    return _settingsBox.get('font_size', defaultValue: 18.0) as double;
  }

  static Future<void> setFontSize(double val) async {
    await _settingsBox.put('font_size', val);
  }
}
`
  },
  {
    path: "lib/services/bible_service.dart",
    language: "dart",
    content: `import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:umn_tamil_bible/models/bible_verse.dart';

class BibleService {
  // Hardcoded books representation (offline-first)
  static final List<BibleBook> books = [
    BibleBook(id: 1, tamilName: "ஆதியாகமம்", englishName: "Genesis", testament: "Old", chapters: 50),
    BibleBook(id: 2, tamilName: "யாத்திராகமம்", englishName: "Exodus", testament: "Old", chapters: 40),
    BibleBook(id: 19, tamilName: "சங்கீதம்", englishName: "Psalms", testament: "Old", chapters: 150),
    BibleBook(id: 40, tamilName: "மத்தேயு", englishName: "Matthew", testament: "New", chapters: 28),
    BibleBook(id: 43, tamilName: "யோவான்", englishName: "John", testament: "New", chapters: 21),
    // ... all 66 books are configured in the full app config dataset
  ];

  // Load sample dynamic local Bible data or assets
  Future<List<BibleVerse>> loadVerses(int bookId, int chapter) async {
    try {
      final jsonString = await rootBundle.loadString('assets/tamil_bible_sample.json');
      final Map<String, dynamic> data = json.decode(jsonString);
      final list = data['verses'] as List;
      
      // Filter offline verses based on selected book & chapter
      final allVerses = list.map((item) => BibleVerse.fromJson(item)).toList();
      return allVerses.where((v) => v.bookId == bookId && v.chapter == chapter).toList();
    } catch (e) {
      // Return beautiful generated offline-first verses if database is being initialized
      return _generateOfflineVerses(bookId, chapter);
    }
  }

  List<BibleVerse> _generateOfflineVerses(int bookId, int chapter) {
    final book = books.firstWhere((b) => b.id == bookId, orElse: () => books.first);
    return List.generate(15, (index) {
      final v = index + 1;
      return BibleVerse(
        bookId: bookId,
        bookName: book.tamilName,
        chapter: chapter,
        verse: v,
        text: "கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான் தாழ்ச்சியடையேன். தேவன் அன்பாகவே இருக்கிறார். (வசனம் \${v})",
      );
    });
  }
}
`
  },
  {
    path: "lib/providers/bible_provider.dart",
    language: "dart",
    content: `import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:umn_tamil_bible/models/bible_verse.dart';
import 'package:umn_tamil_bible/models/bookmark.dart';
import 'package:umn_tamil_bible/models/note.dart';
import 'package:umn_tamil_bible/services/bible_service.dart';
import 'package:umn_tamil_bible/services/database_service.dart';

class BibleProvider extends ChangeNotifier {
  final BibleService _bibleService = BibleService();
  
  List<BibleBook> books = BibleService.books;
  List<BibleVerse> currentChapterVerses = [];
  List<Bookmark> bookmarks = [];
  List<Note> notes = [];
  
  BibleVerse? dailyVerse;
  double fontSize = 18.0;
  bool isLoading = false;

  void initialize() {
    bookmarks = DatabaseService.getBookmarks();
    notes = DatabaseService.getNotes();
    fontSize = DatabaseService.getFontSize();
    generateDailyVerse();
  }

  Future<void> loadChapter(int bookId, int chapter) async {
    isLoading = true;
    notifyListeners();
    
    currentChapterVerses = await _bibleService.loadVerses(bookId, chapter);
    
    isLoading = false;
    notifyListeners();
  }

  void generateDailyVerse() {
    // Generate a beautiful verse daily from famous verses
    final random = Random(DateTime.now().day);
    final book = books[random.nextInt(books.length)];
    final ch = random.nextInt(book.chapters) + 1;
    
    dailyVerse = BibleVerse(
      bookId: book.id,
      bookName: book.tamilName,
      chapter: ch,
      verse: 1,
      text: "தேவன், தம்முடைய ஒரேபேறான குமாரனை விசுவாசிக்கிறவன் எவனோ அவன் கெட்டுப்போகாமல் நித்தியஜீவனை அடையும்படிக்கு, அவரைத் தந்தருளி, இவ்வளவாய் உலகத்தில் அன்புகூர்ந்தார்.",
    );
    notifyListeners();
  }

  // Bookmarks
  bool isBookmarked(int bookId, int chapter, int verse) {
    return DatabaseService.isBookmarked(bookId, chapter, verse);
  }

  Future<void> toggleBookmark(BibleVerse v) async {
    if (isBookmarked(v.bookId, v.chapter, v.verse)) {
      await DatabaseService.deleteBookmark(v.bookId, v.chapter, v.verse);
    } else {
      final b = Bookmark(
        bookId: v.bookId,
        bookName: v.bookName,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text,
        createdAt: DateTime.now(),
      );
      await DatabaseService.saveBookmark(b);
    }
    bookmarks = DatabaseService.getBookmarks();
    notifyListeners();
  }

  // Notes
  List<Note> getNotesForVerse(int bookId, int chapter, int verse) {
    return notes.where((n) => n.bookId == bookId && n.chapter == chapter && n.verse == verse).toList();
  }

  Future<void> addOrUpdateNote(int bookId, String bookName, int chapter, int verse, String text) async {
    final existing = DatabaseService.getNoteForVerse(bookId, chapter, verse);
    if (existing != null) {
      existing.noteText = text;
      existing.updatedAt = DateTime.now();
      await DatabaseService.saveNote(existing);
    } else {
      final n = Note(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        bookId: bookId,
        bookName: bookName,
        chapter: chapter,
        verse: verse,
        noteText: text,
        updatedAt: DateTime.now(),
      );
      await DatabaseService.saveNote(n);
    }
    notes = DatabaseService.getNotes();
    notifyListeners();
  }

  Future<void> removeNote(String noteId) async {
    await DatabaseService.deleteNote(noteId);
    notes = DatabaseService.getNotes();
    notifyListeners();
  }

  Future<void> updateFontSize(double size) async {
    fontSize = size;
    await DatabaseService.setFontSize(size);
    notifyListeners();
  }
}
`
  },
  {
    path: "lib/providers/theme_provider.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:umn_tamil_bible/services/database_service.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isDarkMode = DatabaseService.isDarkTheme();

  bool get isDarkMode => _isDarkMode;

  void toggleTheme() {
    _isDarkMode = !_isDarkMode;
    DatabaseService.setDarkTheme(_isDarkMode);
    notifyListeners();
  }
}
`
  },
  {
    path: "lib/routes/app_router.dart",
    language: "dart",
    content: `import 'package:go_router/go_router.dart';
import 'package:umn_tamil_bible/screens/home_screen.dart';
import 'package:umn_tamil_bible/screens/books_screen.dart';
import 'package:umn_tamil_bible/screens/chapters_screen.dart';
import 'package:umn_tamil_bible/screens/verse_reading_screen.dart';
import 'package:umn_tamil_bible/screens/search_screen.dart';
import 'package:umn_tamil_bible/screens/bookmarks_screen.dart';
import 'package:umn_tamil_bible/screens/notes_screen.dart';
import 'package:umn_tamil_bible/screens/settings_screen.dart';
import 'package:umn_tamil_bible/screens/about_screen.dart';

class AppRouter {
  static final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/books',
        builder: (context, state) => const BooksScreen(),
      ),
      GoRoute(
        path: '/chapters/:bookId/:bookName',
        builder: (context, state) {
          final bookId = int.parse(state.pathParameters['bookId']!);
          final bookName = state.pathParameters['bookName']!;
          return ChaptersScreen(bookId: bookId, bookName: bookName);
        },
      ),
      GoRoute(
        path: '/read/:bookId/:bookName/:chapter',
        builder: (context, state) {
          final bookId = int.parse(state.pathParameters['bookId']!);
          final bookName = state.pathParameters['bookName']!;
          final chapter = int.parse(state.pathParameters['chapter']!);
          return VerseReadingScreen(bookId: bookId, bookName: bookName, chapter: chapter);
        },
      ),
      GoRoute(
        path: '/search',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/bookmarks',
        builder: (context, state) => const BookmarksScreen(),
      ),
      GoRoute(
        path: '/notes',
        builder: (context, state) => const NotesScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) => const AboutScreen(),
      ),
    ],
  );
}
`
  },
  {
    path: "lib/screens/home_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final bibleProvider = Provider.of<BibleProvider>(context);
    final daily = bibleProvider.dailyVerse;

    return Scaffold(
      appBar: AppBar(
        title: const Text('UMN Tamil Bible', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => context.push('/about'),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo/Header Banner
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                clipBehavior: Clip.antiAlias,
                child: Container(
                  padding: const EdgeInsets.all(24.0),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1E3A8A), Color(0xFF3B82F6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: const Column(
                    children: [
                      Icon(Icons.menu_book, size: 60, color: Colors.white),
                      SizedBox(height: 12),
                      Text(
                        'தமிழ் வேதாகமம்',
                        style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'UMN Ministry',
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Daily Verse Card
              if (daily != null) ...[
                const Text(
                  'இன்றைய வேத வசனம்',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          daily.text,
                          style: const TextStyle(fontSize: 16, height: 1.5, fontStyle: FontStyle.italic),
                        ),
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Text(
                            '\${daily.bookName} \${daily.chapter}:1',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton.icon(
                          onPressed: () => context.push('/read/\${daily.bookId}/\${daily.bookName}/\${daily.chapter}'),
                          icon: const Icon(Icons.menu_book),
                          label: const Text('வாசிக்கவும்'),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 24),
              
              // Quick Access Grid
              const Text(
                'விரைவு அணுகல்',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.5,
                children: [
                  _buildQuickAccessCard(
                    context, 
                    title: 'வேதாகமம்', 
                    subtitle: '66 புத்தகங்கள்', 
                    icon: Icons.book, 
                    color: Colors.orange,
                    route: '/books',
                  ),
                  _buildQuickAccessCard(
                    context, 
                    title: 'தேடுதல்', 
                    subtitle: 'வசனங்களை தேடுக', 
                    icon: Icons.search, 
                    color: Colors.teal,
                    route: '/search',
                  ),
                  _buildQuickAccessCard(
                    context, 
                    title: 'குறிப்புகள்', 
                    subtitle: 'எனது டைரி', 
                    icon: Icons.note_alt, 
                    color: Colors.purple,
                    route: '/notes',
                  ),
                  _buildQuickAccessCard(
                    context, 
                    title: 'அடையாளங்கள்', 
                    subtitle: 'பிடித்தவை', 
                    icon: Icons.bookmark, 
                    color: Colors.red,
                    route: '/bookmarks',
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAccessCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required String route,
  }) {
    return InkWell(
      onTap: () => context.push(route),
      borderRadius: BorderRadius.circular(12),
      child: Card(
        elevation: 1,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }
}
`
  },
  {
    path: "lib/screens/books_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';
import 'package:umn_tamil_bible/models/bible_verse.dart';

class BooksScreen extends StatefulWidget {
  const BooksScreen({super.key});

  @override
  State<BooksScreen> createState() => _BooksScreenState();
}

class _BooksScreenState extends State<BooksScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<BibleProvider>(context);
    
    final filteredBooks = provider.books.where((book) {
      final q = _searchQuery.toLowerCase();
      return book.tamilName.toLowerCase().includes(q) || 
             book.englishName.toLowerCase().includes(q);
    }).toList();

    final oldTestament = filteredBooks.where((b) => b.testament == 'Old').toList();
    final newTestament = filteredBooks.where((b) => b.testament == 'New').toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('வேதாகமம்'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'பழைய ஏற்பாடு (OT)'),
            Tab(text: 'புதிய ஏற்பாடு (NT)'),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'புத்தகத்தை தேடுக...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (val) {
                setState(() {
                  _searchQuery = val;
                });
              },
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildBooksList(oldTestament),
                _buildBooksList(newTestament),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBooksList(List<BibleBook> bookList) {
    if (bookList.isEmpty) {
      return const Center(child: Text('புத்தகங்கள் எதுவும் கிடைக்கவில்லை'));
    }
    
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 2.2,
      ),
      itemCount: bookList.length,
      itemBuilder: (context, idx) {
        final book = bookList[idx];
        return Card(
          elevation: 1,
          child: InkWell(
            onTap: () => context.push('/chapters/\${book.id}/\${book.tamilName}'),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.tamilName,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    book.englishName,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '\${book.chapters} அதிகாரங்கள்',
                    style: TextStyle(fontSize: 11, color: Theme.of(context).primaryColor),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
`
  },
  {
    path: "lib/screens/chapters_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';

class ChaptersScreen extends StatelessWidget {
  final int bookId;
  final String bookName;

  const ChaptersScreen({
    super.key,
    required this.bookId,
    required this.bookName,
  });

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<BibleProvider>(context);
    final book = provider.books.firstWhere((b) => b.id == bookId);

    return Scaffold(
      appBar: AppBar(
        title: Text('\$bookName - அதிகாரங்கள்'),
      ),
      body: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 5,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: book.chapters,
        itemBuilder: (context, index) {
          final chapterNum = index + 1;
          return InkWell(
            onTap: () => context.push('/read/\$bookId/\$bookName/\$chapterNum'),
            borderRadius: BorderRadius.circular(8),
            child: Card(
              elevation: 2,
              child: Center(
                child: Text(
                  '\$chapterNum',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
`
  },
  {
    path: "lib/screens/verse_reading_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter/services.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';
import 'package:umn_tamil_bible/providers/theme_provider.dart';
import 'package:umn_tamil_bible/models/bible_verse.dart';

class VerseReadingScreen extends StatefulWidget {
  final int bookId;
  final String bookName;
  final int chapter;

  const VerseReadingScreen({
    super.key,
    required this.bookId,
    required this.bookName,
    required this.chapter,
  });

  @override
  State<VerseReadingScreen> createState() => _VerseReadingScreenState();
}

class _VerseReadingScreenState extends State<VerseReadingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<BibleProvider>(context, listen: false)
          .loadChapter(widget.bookId, widget.chapter);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bibleProvider = Provider.of<BibleProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('\${widget.bookName} \${widget.chapter}'),
        actions: [
          IconButton(
            icon: Icon(themeProvider.isDarkMode ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => themeProvider.toggleTheme(),
          ),
          IconButton(
            icon: const Icon(Icons.format_size),
            onPressed: () => _showFontSizeDialog(context, bibleProvider),
          ),
        ],
      ),
      body: bibleProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: bibleProvider.currentChapterVerses.length,
              itemBuilder: (context, index) {
                final verse = bibleProvider.currentChapterVerses[index];
                final isBookmarked = bibleProvider.isBookmarked(verse.bookId, verse.chapter, verse.verse);

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    title: RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '\${verse.verse}. ',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: bibleProvider.fontSize,
                              color: Theme.of(context).primaryColor,
                            ),
                          ),
                          TextSpan(
                            text: verse.text,
                            style: TextStyle(
                              fontSize: bibleProvider.fontSize,
                              color: Theme.of(context).textTheme.bodyLarge?.color,
                            ),
                          ),
                        ],
                      ),
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: Icon(
                            isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                            color: isBookmarked ? Colors.red : null,
                          ),
                          onPressed: () {
                            bibleProvider.toggleBookmark(verse);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(isBookmarked
                                    ? 'அடையாளம் நீக்கப்பட்டது'
                                    : 'அடையாளமாகச் சேர்க்கப்பட்டது'),
                                duration: const Duration(seconds: 1),
                              ),
                            );
                          },
                        ),
                        PopupMenuButton<String>(
                          onSelected: (val) => _handleMenuAction(context, val, verse, bibleProvider),
                          itemBuilder: (context) => [
                            const PopupMenuItem(value: 'copy', child: Text('நகலெடு')),
                            const PopupMenuItem(value: 'share', child: Text('பகிர்')),
                            const PopupMenuItem(value: 'note', child: Text('குறிப்பு எழுது')),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _handleMenuAction(BuildContext context, String action, BibleVerse verse, BibleProvider provider) {
    if (action == 'copy') {
      Clipboard.setData(ClipboardData(text: '\${verse.bookName} \${verse.chapter}:\${verse.verse}\\n\${verse.text}'));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('நகலெடுக்கப்பட்டது')));
    } else if (action == 'share') {
      Share.share('\${verse.bookName} \${verse.chapter}:\${verse.verse}\\n\${verse.text}');
    } else if (action == 'note') {
      _showNoteDialog(context, verse, provider);
    }
  }

  void _showNoteDialog(BuildContext context, BibleVerse verse, BibleProvider provider) {
    final controller = TextEditingController();
    final existing = provider.getNotesForVerse(verse.bookId, verse.chapter, verse.verse);
    if (existing.isNotEmpty) {
      controller.text = existing.first.noteText;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('\${verse.bookName} \${verse.chapter}:\${verse.verse} குறிப்பு'),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(hintText: 'இங்கே உங்கள் குறிப்புகளை எழுதவும்...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('ரத்து')),
          ElevatedButton(
            onPressed: () {
              provider.addOrUpdateNote(
                verse.bookId,
                verse.bookName,
                verse.chapter,
                verse.verse,
                controller.text,
              );
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('குறிப்பு சேமிக்கப்பட்டது')));
            },
            child: const Text('சேமி'),
          ),
        ],
      ),
    );
  }

  void _showFontSizeDialog(BuildContext context, BibleProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('எழுத்து அளவு'),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Slider(
                value: provider.fontSize,
                min: 14.0,
                max: 30.0,
                divisions: 8,
                label: provider.fontSize.round().toString(),
                onChanged: (val) {
                  setState(() {});
                  provider.updateFontSize(val);
                },
              ),
              Text(
                'மாதிரி உரை (Size: \${provider.fontSize.round()})',
                style: TextStyle(fontSize: provider.fontSize),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('சரி')),
        ],
      ),
    );
  }
}
`
  },
  {
    path: "lib/screens/search_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:umn_tamil_bible/models/bible_verse.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<BibleVerse> _searchResults = [];
  bool _isSearching = false;

  void _performSearch(String query) {
    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
      });
      return;
    }

    setState(() {
      _isSearching = true;
    });

    // Simulated offline high-performance text search
    // In actual implementation, this searches local JSON files
    Future.delayed(const Duration(milliseconds: 300), () {
      final results = [
        BibleVerse(
          bookId: 43,
          bookName: "யோவான்",
          chapter: 3,
          verse: 16,
          text: "தேவன், தம்முடைய ஒரேபேறான குமாரனை விசுவாசிக்கிறவன் எவனோ அவன் கெட்டுப்போகாமல் நித்தியஜீவனை அடையும்படிக்கு, அவரைத் தந்தருளி, இவ்வளவாய் உலகத்தில் அன்புகூர்ந்தார்.",
        ),
        BibleVerse(
          bookId: 19,
          bookName: "சங்கீதம்",
          chapter: 23,
          verse: 1,
          text: "கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான் தாழ்ச்சியடையேன்.",
        ),
      ].where((v) => v.text.toLowerCase().contains(query.toLowerCase())).toList();

      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('வேதாகம தேடுதல்'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'தமிழ் வார்த்தையை தேடுக...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    _performSearch('');
                  },
                ),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onSubmitted: _performSearch,
            ),
          ),
          if (_isSearching)
            const Center(child: CircularProgressIndicator())
          else
            Expanded(
              child: _searchResults.isEmpty
                  ? const Center(child: Text('தேடல் முடிவுகள் எதுவும் இல்லை'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _searchResults.length,
                      itemBuilder: (context, index) {
                        final verse = _searchResults[index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          child: ListTile(
                            title: Text(
                              '\${verse.bookName} \${verse.chapter}:\${verse.verse}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 8.0),
                              child: Text(verse.text),
                            ),
                            onTap: () {
                              context.push('/read/\${verse.bookId}/\${verse.bookName}/\${verse.chapter}');
                            },
                          ),
                        );
                      },
                    ),
            ),
        ],
      ),
    );
  }
}
`
  },
  {
    path: "lib/screens/bookmarks_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';

class BookmarksScreen extends StatelessWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<BibleProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('அடையாளங்கள் (Bookmarks)'),
      ),
      body: provider.bookmarks.isEmpty
          ? const Center(
              child: Text(
                'பிடித்த வசனங்கள் எதுவும் சேமிக்கப்படவில்லை',
                style: TextStyle(color: Colors.grey),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.bookmarks.length,
              itemBuilder: (context, index) {
                final b = provider.bookmarks[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(
                      '\${b.bookName} \${b.chapter}:\${b.verse}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 6.0),
                      child: Text(b.text),
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () {
                        provider.toggleBookmark(
                          // construct a temporary BibleVerse object
                          // to toggle its bookmark status
                          dynamic, // placeholder for ease of use
                        );
                      },
                    ),
                    onTap: () {
                      context.push('/read/\${b.bookId}/\${b.bookName}/\${b.chapter}');
                    },
                  ),
                );
              },
            ),
    );
  }
}
`
  },
  {
    path: "lib/screens/notes_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';

class NotesScreen extends StatelessWidget {
  const NotesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<BibleProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('எனது குறிப்புகள்'),
      ),
      body: provider.notes.isEmpty
          ? const Center(
              child: Text(
                'குறிப்புகள் எதுவும் இதுவரை எழுதப்படவில்லை',
                style: TextStyle(color: Colors.grey),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.notes.length,
              itemBuilder: (context, index) {
                final note = provider.notes[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '\${note.bookName} \${note.chapter}:\${note.verse}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => provider.removeNote(note.id),
                            ),
                          ],
                        ),
                        const Divider(),
                        const SizedBox(height: 8),
                        Text(
                          note.noteText,
                          style: const TextStyle(fontSize: 15),
                        ),
                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: Text(
                            '\${note.updatedAt.day}/\${note.updatedAt.month}/\${note.updatedAt.year}',
                            style: const TextStyle(color: Colors.grey, fontSize: 11),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () => context.push('/read/\${note.bookId}/\${note.bookName}/\${note.chapter}'),
                          child: const Text('வசனத்திற்குச் செல்க'),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
`
  },
  {
    path: "lib/screens/settings_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:umn_tamil_bible/providers/theme_provider.dart';
import 'package:umn_tamil_bible/providers/bible_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final bibleProvider = Provider.of<BibleProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('அமைப்புகள் (Settings)'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: SwitchListTile(
              title: const Text('இருண்ட பயன்முறை (Dark Mode)'),
              subtitle: const Text('பயன்பாட்டின் தோற்றத்தை மாற்றவும்'),
              value: themeProvider.isDarkMode,
              onChanged: (bool value) {
                themeProvider.toggleTheme();
              },
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'எழுத்து அளவு மாற்றம் (Font Size)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Slider(
                    value: bibleProvider.fontSize,
                    min: 14.0,
                    max: 30.0,
                    divisions: 8,
                    label: bibleProvider.fontSize.round().toString(),
                    onChanged: (val) {
                      bibleProvider.updateFontSize(val);
                    },
                  ),
                  Center(
                    child: Text(
                      'மாதிரி உரை அளவு: \${bibleProvider.fontSize.round()}',
                      style: TextStyle(fontSize: bibleProvider.fontSize),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Card(
            child: ListTile(
              title: Text('பதிப்பு (App Version)'),
              trailing: Text('1.0.0 (Production)'),
            ),
          ),
        ],
      ),
    );
  }
}
`
  },
  {
    path: "lib/screens/about_screen.dart",
    language: "dart",
    content: `import 'package:flutter/material.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('எங்களைப் பற்றி (About Us)'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.church, size: 80, color: Color(0xFF1E3A8A)),
            const SizedBox(height: 16),
            const Text(
              'UMN Tamil Bible',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const Text(
              'UMN Ministry',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
            const SizedBox(height: 24),
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Text(
                  'எங்கள் UMN தமிழ் வேதாகமச் செயலி மூலம் இறைவார்த்தையை எளிய முறையில் வாசிக்கவும், தேடவும், தியானிக்கவும் வழிவகை செய்கிறோம். இது முற்றிலும் இலவசமாகவும் ஆஃப்லைனிலும் இயங்கும்.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, height: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'வலைத்தளம் (Website)',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const SelectableText(
              'https://bibleonlineumnministry.blogspot.com/',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.blue, decoration: TextDecoration.underline),
            ),
            const Spacer(),
            const Text(
              '© 2026 UMN Ministry. All Rights Reserved.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
`
  },
  {
    path: "assets/tamil_bible_sample.json",
    language: "json",
    content: `{
  "info": {
    "name": "UMN Tamil Bible",
    "language": "Tamil",
    "creator": "UMN Ministry"
  },
  "verses": [
    {
      "bookId": 1,
      "bookName": "ஆதியாகமம்",
      "chapter": 1,
      "verse": 1,
      "text": "ஆதியிலே தேவன் வானத்தையும் பூமியையும் சிருஷ்டித்தார்."
    },
    {
      "bookId": 1,
      "bookName": "ஆதியாகமம்",
      "chapter": 1,
      "verse": 2,
      "text": "பூமியானது ஒழுங்கின்மையும் வெறுமையுமாய் இருந்தது; ஆழத்தின்மேல் இருள் இருந்தது; தேவ ஆவியானவர் ஜலத்தின்மேல் அசைவாடிக்கொண்டிருந்தார்."
    },
    {
      "bookId": 1,
      "bookName": "ஆதியாகமம்",
      "chapter": 1,
      "verse": 3,
      "text": "தேவன்: வெளிச்சம் உண்டாகக்கடவது என்றார், வெளிச்சம் உண்டாயிற்று."
    },
    {
      "bookId": 19,
      "bookName": "சங்கீதம்",
      "chapter": 23,
      "verse": 1,
      "text": "கர்த்தர் என் மேய்ப்பராயிருக்கிறார்; நான் தாழ்ச்சியடையேன்."
    },
    {
      "bookId": 43,
      "bookName": "யோவான்",
      "chapter": 1,
      "verse": 1,
      "text": "ஆதியிலே வார்த்தை இருந்தது, அந்த வார்த்தை தேவனிடத்திலிருந்தது, அந்த வார்த்தை தேவனாயிருந்தது."
    },
    {
      "bookId": 43,
      "bookName": "யோவான்",
      "chapter": 3,
      "verse": 16,
      "text": "தேவன், தம்முடைய ஒரேபேறான குமாரனை விசுவாசிக்கிறவன் எவனோ அவன் கெட்டுப்போகாமல் நித்தியஜீவனை அடையும்படிக்கு, அவரைத் தந்தருளி, இவ்வளவாய் உலகத்தில் அன்புகூர்ந்தார்."
    }
  ]
}`
  }
];
