import os

filepath = r'c:\Users\openl\Desktop\yttv2\src\components\PlaylistsPage.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

import_idx = -1
for i, line in enumerate(lines):
    if line.startswith('import CardMenu from'):
        import_idx = i
        break

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "if (item.type === 'playlist') {" in line:
        start_idx = i
        break

for i in range(start_idx, len(lines)):
    line = lines[i]
    if "} else {" in line and "// Render folder card" in lines[i+1]:
        end_idx = i
        break

if start_idx == -1 or end_idx == -1:
    print("Failed to find start or end index:", start_idx, end_idx)
else:
    component_code = """                    if (item.type === 'playlist') {
                      const playlist = item.data;
                      const thumbData = playlistThumbnails[playlist.id];
                      const playlistImageKey = `playlist-${playlist.id}`;
                      const useFallback = imageLoadErrors.has(playlistImageKey);                      
                      const activeThumbnailUrl = thumbData ? (useFallback ? thumbData.standard : thumbData.max) : null;
                      const itemCount = playlistItemCounts[playlist.id] || 0;
                      const folders = playlistFolders[playlist.id] || [];
                      const initialPreviewVideos = playlistPreviewVideos[playlist.id] || [];

                      return (
                        <PlaylistCard
                          key={playlist.id}
                          playlist={playlist}
                          folders={folders}
                          activeThumbnailUrl={activeThumbnailUrl}
                          itemCount={itemCount}
                          initialPreviewVideos={initialPreviewVideos}
                          globalInfoToggle={globalInfoToggle}
                          folderMetadata={folderMetadata}
                          activeTabId={activeTabId}
                          tabs={tabs}
                          deletingPlaylistId={deletingPlaylistId}
                          expandedPlaylists={expandedPlaylists}
                          onVideoSelect={onVideoSelect}
                          togglePlaylistExpand={togglePlaylistExpand}
                          handleExportPlaylist={handleExportPlaylist}
                          removePlaylistFromTab={removePlaylistFromTab}
                          handleDeletePlaylist={handleDeletePlaylist}
                          addPlaylistToTab={addPlaylistToTab}
                          loadPlaylists={loadPlaylists}
                        />
                      );
"""
    lines = lines[:start_idx] + [component_code] + lines[end_idx:]
    lines.insert(import_idx, "import PlaylistCard from './PlaylistCard';\n")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully replaced.")
