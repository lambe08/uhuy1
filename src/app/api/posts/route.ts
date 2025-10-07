import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to generate unique filename
function generateFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
}

// Helper function to validate file type
function isValidFileType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime'];
  return allowedTypes.includes(file.type);
}

// Helper function to validate file size (max 10MB)
function isValidFileSize(file: File): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const content = formData.get('content') as string;
    const workoutId = formData.get('workoutId') as string;
    const file = formData.get('media') as File | null;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!content && !file) {
      return NextResponse.json({ error: 'Content or media required' }, { status: 400 });
    }

    let mediaUrl = null;
    let mediaType = null;

    // Handle file upload if present
    if (file) {
      // Validate file
      if (!isValidFileType(file)) {
        return NextResponse.json({
          error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, QuickTime'
        }, { status: 400 });
      }

      if (!isValidFileSize(file)) {
        return NextResponse.json({
          error: 'File too large. Maximum size: 10MB'
        }, { status: 400 });
      }

      // Generate unique filename
      const fileName = generateFileName(file.name, userId);

      // Convert file to buffer
      const buffer = await file.arrayBuffer();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json({
          error: 'Failed to upload media'
        }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      mediaUrl = publicUrl;
      mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    }

    // Create post in database
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: content || '',
        media_url: mediaUrl,
        media_type: mediaType,
        workout_session_id: workoutId || null,
      })
      .select('*')
      .single();

    if (postError) {
      console.error('Database error:', postError);
      return NextResponse.json({
        error: 'Failed to create post'
      }, { status: 500 });
    }

    return NextResponse.json({
      post: postData,
      success: true
    });

  } catch (error) {
    console.error('Post creation error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch posts with user profile information
    let query = supabase
      .from('posts')
      .select(`
        *,
        user_profiles!posts_user_id_fkey (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If userId is provided, fetch only that user's posts
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        error: 'Failed to fetch posts'
      }, { status: 500 });
    }

    return NextResponse.json({
      posts: posts || [],
      success: true
    });

  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json({
        error: 'Post ID and User ID required'
      }, { status: 400 });
    }

    // Get post to check ownership and get media URL
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({
        error: 'Post not found or access denied'
      }, { status: 404 });
    }

    // Delete media from storage if exists
    if (post.media_url) {
      try {
        const fileName = post.media_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('posts')
            .remove([`${userId}/${fileName}`]);
        }
      } catch (error) {
        console.error('Error deleting media:', error);
        // Continue with post deletion even if media deletion fails
      }
    }

    // Delete post from database
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({
        error: 'Failed to delete post'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
