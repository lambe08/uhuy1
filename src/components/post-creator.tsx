"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDropzone } from 'react-dropzone';
import { useAuth } from "@/hooks/useAuth";
import { isDemoMode } from "@/lib/supabase";

interface PostCreatorProps {
  workoutId?: string;
  onPostCreated?: (post: any) => void;
  onClose?: () => void;
}

export function PostCreator({ workoutId, onPostCreated, onClose }: PostCreatorProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('Please log in to create a post');
      return;
    }

    if (!content.trim() && !selectedFile) {
      setError('Please add content or media to your post');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      if (isDemoMode) {
        // Simulate successful post in demo mode
        setTimeout(() => {
          const mockPost = {
            id: 'demo-' + Date.now(),
            user_id: user.id,
            content,
            media_url: preview,
            media_type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'video') : null,
            workout_session_id: workoutId,
            likes_count: 0,
            comments_count: 0,
            created_at: new Date().toISOString(),
          };

          onPostCreated?.(mockPost);
          setContent('');
          setSelectedFile(null);
          setPreview(null);
          setUploading(false);
          onClose?.();
        }, 1500);
        return;
      }

      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('content', content);

      if (workoutId) {
        formData.append('workoutId', workoutId);
      }

      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      if (data.success) {
        onPostCreated?.(data.post);
        setContent('');
        setSelectedFile(null);
        setPreview(null);
        onClose?.();
      }

    } catch (error: any) {
      setError(error.message || 'Failed to create post');
      console.error('Post creation error:', error);
    }

    setUploading(false);
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Share Your Progress</CardTitle>
        <CardDescription>
          Share your workout results with the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Content */}
          <div>
            <textarea
              placeholder="How did your workout go? Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {content.length}/500 characters
            </div>
          </div>

          {/* Media Upload */}
          <div>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  <div className="text-4xl">📸</div>
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop your file here'
                      : 'Drag & drop a photo or video, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: JPEG, PNG, GIF, WebP, MP4, MOV (max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative border rounded-lg overflow-hidden">
                  {selectedFile.type.startsWith('image/') ? (
                    <img
                      src={preview!}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <video
                      src={preview!}
                      className="w-full h-48 object-cover"
                      controls
                    />
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeFile}
                  >
                    Remove
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{selectedFile.name}</span>
                  <Badge variant="outline">
                    {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Workout Link */}
          {workoutId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">💪</span>
                <span className="text-sm text-blue-700">
                  This post will be linked to your workout session
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Demo Mode Notice */}
          {isDemoMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                Demo mode: Posts will be simulated and not actually stored
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={uploading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={uploading || (!content.trim() && !selectedFile)}
              className="flex-1"
            >
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </div>
              ) : (
                'Share Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
