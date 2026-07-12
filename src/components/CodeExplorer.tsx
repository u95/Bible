import React, { useState } from 'react';
import { flutterFiles, FlutterFile } from '../data/flutterCode';
import { Folder, File, Copy, Check, Search, Download, Terminal, ChevronRight, ChevronDown } from 'lucide-react';

export default function CodeExplorer() {
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(flutterFiles[0]);
  const [copied, setCopied] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'lib': true,
    'lib/models': true,
    'lib/services': true,
    'lib/providers': true,
    'lib/screens': true,
    'lib/routes': true,
    'lib/widgets': true,
    'assets': true,
  });

  const handleCopy = (content: string, path: string) => {
    navigator.clipboard.writeText(content);
    setCopied(path);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const filteredFiles = flutterFiles.filter(file => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return file.path.toLowerCase().includes(query) || file.content.toLowerCase().includes(query);
  });

  // Group files into a tree representation
  const renderTreeItem = (path: string, isFolder: boolean, depth: number, folderPath?: string) => {
    const name = path.split('/').pop() || path;
    const isExpanded = folderPath ? expandedFolders[folderPath] : false;

    return (
      <div 
        key={path}
        className={`flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-slate-800 text-sm transition-colors`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder && folderPath) {
            toggleFolder(folderPath);
          } else {
            const file = flutterFiles.find(f => f.path === path);
            if (file) setSelectedFile(file);
          }
        }}
      >
        {isFolder ? (
          <>
            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            <Folder size={16} className="text-amber-400 fill-amber-400/20" />
            <span className="font-medium text-slate-300">{name}</span>
          </>
        ) : (
          <>
            <div className="w-[14px]" /> {/* Spacer to align with chevron */}
            <File size={16} className={`${selectedFile.path === path ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className={`${selectedFile.path === path ? 'text-blue-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}>{name}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[750px] shadow-2xl">
      {/* Tab Header / Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal size={18} className="text-blue-400" />
            Flutter Source Code Workspace
          </h2>
          <p className="text-xs text-slate-400">Complete, offline-first production architecture files</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search codebase..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-full sm:w-60 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Code File Tree */}
        <div className="w-64 border-r border-slate-800 bg-slate-900/50 overflow-y-auto p-3 flex flex-col gap-1 select-none">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Project Files</div>
          
          {renderTreeItem("pubspec.yaml", false, 0)}
          
          {renderTreeItem("assets", true, 0, "assets")}
          {expandedFolders["assets"] && (
            <>
              {renderTreeItem("assets/tamil_bible_sample.json", false, 1)}
            </>
          )}

          {renderTreeItem("lib", true, 0, "lib")}
          {expandedFolders["lib"] && (
            <>
              {renderTreeItem("lib/main.dart", false, 1)}

              {renderTreeItem("models", true, 1, "lib/models")}
              {expandedFolders["lib/models"] && (
                <>
                  {renderTreeItem("lib/models/bible_verse.dart", false, 2)}
                  {renderTreeItem("lib/models/bookmark.dart", false, 2)}
                  {renderTreeItem("lib/models/note.dart", false, 2)}
                </>
              )}

              {renderTreeItem("services", true, 1, "lib/services")}
              {expandedFolders["lib/services"] && (
                <>
                  {renderTreeItem("lib/services/database_service.dart", false, 2)}
                  {renderTreeItem("lib/services/bible_service.dart", false, 2)}
                </>
              )}

              {renderTreeItem("providers", true, 1, "lib/providers")}
              {expandedFolders["lib/providers"] && (
                <>
                  {renderTreeItem("lib/providers/bible_provider.dart", false, 2)}
                  {renderTreeItem("lib/providers/theme_provider.dart", false, 2)}
                </>
              )}

              {renderTreeItem("routes", true, 1, "lib/routes")}
              {expandedFolders["lib/routes"] && (
                <>
                  {renderTreeItem("lib/routes/app_router.dart", false, 2)}
                </>
              )}

              {renderTreeItem("screens", true, 1, "lib/screens")}
              {expandedFolders["lib/screens"] && (
                <>
                  {renderTreeItem("lib/screens/home_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/books_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/chapters_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/verse_reading_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/search_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/bookmarks_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/notes_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/settings_screen.dart", false, 2)}
                  {renderTreeItem("lib/screens/about_screen.dart", false, 2)}
                </>
              )}
            </>
          )}

          {/* Quick Command Guide */}
          <div className="mt-auto pt-4 border-t border-slate-800">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Build Instructions</div>
            <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 flex flex-col gap-1.5">
              <div>
                <span className="text-blue-400"># Fetch dependencies</span>
                <div className="text-slate-200">flutter pub get</div>
              </div>
              <div>
                <span className="text-blue-400"># Run the app</span>
                <div className="text-slate-200">flutter run</div>
              </div>
              <div>
                <span className="text-blue-400"># Build Release APK</span>
                <div className="text-slate-200">flutter build apk --release</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Code Editor view */}
        <div className="flex-1 flex flex-col bg-slate-950 min-w-0">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-xs">
            <div className="font-mono text-slate-300 flex items-center gap-1.5">
              <File size={12} className="text-blue-400" />
              {selectedFile.path}
            </div>
            <button
              onClick={() => handleCopy(selectedFile.content, selectedFile.path)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {copied === selectedFile.path ? (
                <>
                  <Check size={14} className="text-green-500" />
                  <span className="text-green-500 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy code</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed bg-slate-950">
            <pre className="whitespace-pre">{selectedFile.content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
