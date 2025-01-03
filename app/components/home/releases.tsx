/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../apiConfig';
import axios from 'axios';
import { Download, Music, Image, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Track {
  id: number;
  track_title: string;
  track_number?: number;
  featured_artists: string | null;
  producers: string | null;
  isrc_code: string | null;
  audio_file_path: string | null;
}

interface ReleaseData {
  id: number | string;
  track_title: string | null;
  release_title: string | null;
  primary_artist: string;
  featured_artists: string | null;
  producers: string | null;
  explicit_content: number;
  primary_genre: string;
  secondary_genre: string | null;
  release_date: string;
  album_art_url: string | null;
  platforms: string;
  lyrics: string | null;
  genres_moods: string | null;
  audio_file_path: string | null;
  upc_code: string;
  isrc_code: string | null;
  upload_type: string;
  status?: string; 
  tracks?: Track[];
}

interface GroupedReleaseData extends ReleaseData {
  isExpanded?: boolean;
  tracks: Track[];
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

const statusOptions: StatusOption[] = [
  { value: 'Delivered', label: 'Mark as Delivered', color: 'bg-green-600 hover:bg-green-700' },
  { value: 'Live', label: 'Mark as Live', color: 'bg-blue-600 hover:bg-blue-700' },
  { value: 'NeedDoc', label: 'Need Documentation', color: 'bg-yellow-600 hover:bg-yellow-700' }
];

const Releases = () => {
  const [singles, setSingles] = useState<ReleaseData[]>([]);
  // const [albums, setAlbums] = useState<ReleaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [albums, setAlbums] = useState<GroupedReleaseData[]>([]);

  const fetchData = async (endpoint: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await axios.get(`${BASE_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.data || response.data;
  };

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

        const [singlesData, albumsResponse] = await Promise.all([
          fetchData('/api/admin/singles'),
          fetchData('/api/admin/albums')
        ]);

        setSingles(singlesData);

        const albumsData = Array.isArray(albumsResponse.data) ? albumsResponse.data : albumsResponse;

        const uniqueAlbumsMap = new Map();
        
        albumsData.forEach((album: any) => {
          const key = `${album.release_title}-${album.primary_artist}`;
          if (!uniqueAlbumsMap.has(key)) {
            uniqueAlbumsMap.set(key, album);
          }
        });

  
        const processedAlbums = Array.from(uniqueAlbumsMap.values()).map(album => ({
          ...album,
          isExpanded: false,
          tracks: (album.tracks || []).sort((a: Track, b: Track) => 
            (a.track_number || 0) - (b.track_number || 0)
          )
        }));

        console.log('Deduplicated albums:', processedAlbums);
        setAlbums(processedAlbums);
      } catch (error) {
        console.error('Error fetching releases:', error);
        setError('Failed to load releases');
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  const toggleAlbumExpansion = (albumId: number | string) => {
    setAlbums(prevAlbums => 
      prevAlbums.map(album => 
        album.id === albumId 
          ? { ...album, isExpanded: !album.isExpanded }
          : album
      )
    );
  };

  const renderStatusDropdown = (release: ReleaseData) => (
    <div className="relative group">
      <button
        onClick={() => setActiveDropdown(activeDropdown === release.id.toString() ? null : release.id.toString())}
        disabled={updating === release.id}
        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none transition-colors duration-200 disabled:bg-gray-400 flex items-center gap-2"
      >
        {updating === release.id ? (
          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
        ) : (
          <>
            <AlertCircle size={16} />
            Update Status
          </>
        )}
      </button>
      {activeDropdown === release.id.toString() && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                handleUpdateStatus(release.id, option.value);
                setActiveDropdown(null);
              }}
              className={`w-full text-left px-4 py-2 text-sm text-white ${option.color} hover:opacity-90 first:rounded-t-md last:rounded-b-md`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
  
  const handleViewRelease = async (id: number | string, type: 'single' | 'album') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const endpoint = type === 'single' 
        ? `${BASE_URL}/api/admin/single/${id}`
        : `${BASE_URL}/api/admin/album/${id}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.data) {
        setSelectedRelease(response.data.data);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching release details:', error);
      setError('Failed to load release details. Please try again.');
    }
  };

  const handleUpdateStatus = async (id: number | string, newStatus: string) => {
    try {
      setUpdating(id);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
  
      await axios.put(
        `${BASE_URL}/api/admin/music/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
  
      setSingles(prevSingles => 
        prevSingles.map(release => 
          release.id === id ? { ...release, status: newStatus } : release
        )
      );
      
      setAlbums(prevAlbums => 
        prevAlbums.map(album => 
          album.id === id ? { ...album, status: newStatus } : album
        )
      );
  
      setError(null);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };
  
  const getStatusColor = (status: string | undefined | null) => {
    const normalizedStatus = (status || 'Pending').toLowerCase();
    switch (normalizedStatus) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'live':
        return 'bg-blue-100 text-blue-800';
      case 'needdoc':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  


  const handleDownload = async (url: string, filename: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');
  
      let actualUrl = url;
      try {
        const parsed = JSON.parse(url); 
        actualUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : url;
      } catch {
        actualUrl = url;
      }
  
      const fullUrl = actualUrl.startsWith('http') ? actualUrl : `${BASE_URL}${actualUrl}`;
  
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: unknown) {
      console.error('Error downloading file:', error);
      if (error instanceof Error) {
        setError(`Failed to download file: ${error.message}`);
      } else {
        setError('Failed to download file: An unknown error occurred');
      }
    }
  };
  

const renderTable = (data: ReleaseData[], type: 'single' | 'album') => {
    return (
      <div className="overflow-x-auto bg-white shadow-lg rounded-lg mt-6">
        <table className="min-w-full table-auto">
          <thead className="bg-red-600 text-white">
            <tr>
              <th className="px-6 py-3 text-left">
                {type === 'single' ? 'Track Title' : 'Release Title'}
              </th>
              <th className="px-6 py-3 text-left">Primary Artist</th>
              <th className="px-6 py-3 text-left">Release Date</th>
              <th className="px-6 py-3 text-left">Genre</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((release) => (
              <tr key={release.id} className="border-b hover:bg-red-50">
                <td className="px-6 py-4">{release.track_title || release.release_title || 'Untitled'}</td>
                <td className="px-6 py-4">{release.primary_artist}</td>
                <td className="px-6 py-4">{new Date(release.release_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">{release.primary_genre}</td>
                <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(release.status || 'Pending')}`}>
                {release.status || 'Pending'}
              </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleViewRelease(release.id, type)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none transition-colors duration-200"
                  >
                    View Details
                  </button>
                  {(!release.status || release.status.toLowerCase() !== 'live') && renderStatusDropdown(release)}
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAlbumsTable = (data: GroupedReleaseData[]) => (
    <div className="overflow-x-auto bg-white shadow-lg rounded-lg mt-6">
      <table className="min-w-full table-auto">
        <thead className="bg-red-600 text-white">
          <tr>
            <th className="w-8"></th>
            <th className="px-6 py-3 text-left">Release Title</th>
            <th className="px-6 py-3 text-left">Primary Artist</th>
            <th className="px-6 py-3 text-left">Release Date</th>
            <th className="px-6 py-3 text-left">Genre</th>
            <th className="px-6 py-3 text-left">Status</th>
            <th className="px-6 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((release) => (
            <React.Fragment key={release.id}>
              <tr className="border-b hover:bg-red-50">
                <td className="px-2">
                  <button 
                    onClick={() => toggleAlbumExpansion(release.id)}
                    className="p-1 hover:bg-red-100 rounded"
                  >
                    {release.isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 font-medium">{release.release_title || 'Untitled'}</td>
                <td className="px-6 py-4">{release.primary_artist}</td>
                <td className="px-6 py-4">{new Date(release.release_date).toLocaleDateString()}</td>
                <td className="px-6 py-4">{release.primary_genre}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(release.status)}`}>
                    {release.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewRelease(release.id, 'album')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      View Details
                    </button>
                    {(!release.status || release.status.toLowerCase() !== 'live') && renderStatusDropdown(release)}
                  </div>
                </td>
              </tr>
              {release.isExpanded && release.tracks.map((track, index) => (
                <tr key={`${release.id}-track-${track.id}`} className="bg-gray-50 border-b">
                  <td className="px-2"></td>
                  <td className="px-6 py-3 pl-12">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">{index + 1}.</span>
                      <span>{track.track_title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {track.featured_artists && (
                      <span className="text-gray-500">ft. {track.featured_artists}</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {track.producers && (
                      <span className="text-gray-500">Prod. {track.producers}</span>
                    )}
                  </td>
                  <td colSpan={3} className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {track.isrc_code && (
                        <span className="text-sm text-gray-500">ISRC: {track.isrc_code}</span>
                      )}
                      {track.audio_file_path && (
                        <button
                          onClick={() => {
                            const fileName = `${track.track_title || `track-${track.track_number}`}.wav`;
                            if (track.audio_file_path) {
                              handleDownload(track.audio_file_path, fileName);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );


  const renderReleaseDetails = (release: ReleaseData) => {
    if (!release) return null;

    const platforms = (() => {
      try {
        return typeof release.platforms === 'string' ? JSON.parse(release.platforms) : [];
      } catch {
        return [];
      }
    })();

    const audioFilePath = (() => {
      try {
        if (!release.audio_file_path) return null;
        const paths = JSON.parse(release.audio_file_path);
        return Array.isArray(paths) && paths.length > 0 ? paths[0] : null;
      } catch {
        return null;
      }
    })();

    const title = release.track_title || release.release_title || 'Untitled';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
          <button 
            onClick={() => setSelectedRelease(null)}
            className="absolute right-4 top-4 text-gray-500 hover:text-red-600"
          >
            <X size={24} />
          </button>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
                <p className="mt-2 text-gray-700">Primary Artist: {release.primary_artist}</p>
                {release.featured_artists && (
                  <p className="mt-2 text-gray-700">Featured Artists: {release.featured_artists}</p>
                )}
                <p className="mt-2 text-gray-700">Release Date: {new Date(release.release_date).toLocaleDateString()}</p>
                <p className="mt-2 text-gray-700">Primary Genre: {release.primary_genre}</p>
                {release.secondary_genre && (
                  <p className="mt-2 text-gray-700">Secondary Genre: {release.secondary_genre}</p>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-4">
                {release.album_art_url && (
                  <div className="relative group">
                    <img 
                      src={release.album_art_url} 
                      alt="Album Art" 
                      className="w-48 h-48 object-cover rounded-md shadow-lg"
                    />
                    <button
                      onClick={() => handleDownload(release.album_art_url!, `${title}-cover.png`)}
                      className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md flex items-center justify-center"
                    >
                      <Download className="text-white" size={24} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">Release Details</h3>
                <p className="mt-2 text-gray-700">UPC Code: {release.upc_code}</p>
                {release.isrc_code && (
                  <p className="mt-2 text-gray-700">ISRC Code: {release.isrc_code}</p>
                )}
                <p className="mt-2 text-gray-700">Release Type: {release.upload_type}</p>
                <p className="mt-2 text-gray-700">Explicit Content: {release.explicit_content ? 'Yes' : 'No'}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">Additional Information</h3>
                {platforms.length > 0 && (
                  <p className="mt-2 text-gray-700">Platforms: {platforms.join(', ')}</p>
                )}
                {release.genres_moods && (
                  <p className="mt-2 text-gray-700">Genres & Moods: {release.genres_moods}</p>
                )}
                {release.producers && (
                  <p className="mt-2 text-gray-700">Producers: {release.producers}</p>
                )}
              </div>
            </div>

            {release.lyrics && (
              <div className="mt-6 bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800">Lyrics</h3>
                <pre className="mt-2 whitespace-pre-wrap text-gray-700 font-sans">
                  {release.lyrics}
                </pre>
              </div>
            )}

            {audioFilePath && (
              <div className="mt-6 bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-800">Audio Preview</h3>
                  <button
                    onClick={() => handleDownload(audioFilePath, `${title}.wav`)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                  >
                    <Download size={18} />
                    Download Audio
                  </button>
                </div>
                <audio controls className="mt-4 w-full">
                  <source src={audioFilePath} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Music Releases</h1>
            
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-red-600 flex items-center gap-2">
                  <Music size={24} />
                  Singles
                </h2>
                {renderTable(singles, 'single')}
              </div>
              
              <div>
                <h2 className="text-2xl font-semibold text-red-600 flex items-center gap-2">
                  <Image size={24} />
                  Albums/EPs
                </h2>
                {renderAlbumsTable(albums)}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRelease && renderReleaseDetails(selectedRelease)}
    </div>
  );
};

export default Releases;