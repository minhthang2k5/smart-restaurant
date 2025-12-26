import React, { useState, useEffect } from "react";
import { Upload, X, Star } from "lucide-react";
import * as menuService from "../../../services/menuService";

export default function PhotoManager({ itemId, initialPhotos = [] }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const handleUpload = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const data = await menuService.uploadPhotos(itemId, Array.from(files));
      setPhotos([...photos, ...data.photos]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm("Delete this photo?")) return;

    try {
      await menuService.deletePhoto(itemId, photoId);
      setPhotos(photos.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete photo");
    }
  };

  const handleSetPrimary = async (photoId) => {
    try {
      await menuService.setPrimaryPhoto(itemId, photoId);
      setPhotos(
        photos.map((p) => ({
          ...p,
          is_primary: p.id === photoId,
        }))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set primary photo");
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="photo-upload"
          className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload Photos"}
        </label>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.url}
              alt="Menu item"
              className="w-full h-32 object-cover rounded-lg"
            />

            {/* Primary badge */}
            {photo.is_primary && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Star className="w-3 h-3" />
                Primary
              </div>
            )}

            {/* Actions */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              {!photo.is_primary && (
                <button
                  onClick={() => handleSetPrimary(photo.id)}
                  className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  title="Set as primary"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => handleDelete(photo.id)}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                title="Delete photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No photos uploaded yet
        </div>
      )}
    </div>
  );
}
