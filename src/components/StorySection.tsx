import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Camera, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StorySection({ user }: { user: any }) {
  const [stories, setStories] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeStory, setActiveStory] = useState<any>(null);

  const currentUserId = user.id || user.uid;
  const displayName = user.user_metadata?.full_name || user.display_name || 'Conector User';
  const photoURL = user.user_metadata?.avatar_url || user.photo_url || `https://ui-avatars.com/api/?name=${user.email}`;

  useEffect(() => {
    const fetchConnectionsAndStories = async () => {
      const { data: userSnap } = await supabase
        .from('users')
        .select('connections')
        .eq('id', currentUserId)
        .single();
      
      const connections = userSnap?.connections || [];
      const authorIds = [...connections, currentUserId];

      // Show stories from last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .in('author_id', authorIds)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });
      
      if (storiesData) {
        setStories(storiesData);
      }
    };

    fetchConnectionsAndStories();

    const storiesSub = supabase
      .channel('public:stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, fetchConnectionsAndStories)
      .subscribe();

    return () => {
      supabase.removeChannel(storiesSub);
    };
  }, [currentUserId]);

  const postStory = async () => {
    setIsUploading(true);
    const randomImgs = [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      'https://images.unsplash.com/photo-1533738363-b7f9aef128ce',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'
    ];
    const img = randomImgs[Math.floor(Math.random() * randomImgs.length)] + '?auto=format&fit=crop&w=800&q=80';

    try {
      const { error } = await supabase
        .from('stories')
        .insert({
          author_id: currentUserId,
          author_name: displayName,
          author_photo: photoURL,
          image_url: img,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      
      if (error) throw error;
    } catch (e) {
      console.error(e);
    }
    setIsUploading(false);
  };

  return (
    <div className="p-4">
      <div className="mb-8 flex items-center justify-between">
         <h2 className="text-2xl font-black tracking-tight">STORIES</h2>
         <button 
           onClick={postStory}
           disabled={isUploading}
           className="bg-white text-black font-black px-6 py-2 rounded-full flex items-center gap-2 hover:bg-gray-200"
         >
           {isUploading ? 'Posting...' : 'Post Story'}
           <Camera size={18} />
         </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* User's add story card */}
        <div 
          onClick={postStory}
          className="aspect-[9/16] bg-zinc-900 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer group hover:border-x-blue/50 transition-all"
        >
          <div className="p-4 bg-x-blue rounded-full mb-3 group-hover:scale-110 transition-transform">
             <Plus className="text-white" />
          </div>
          <span className="text-sm font-bold opacity-60">Add Story</span>
        </div>

        {stories.map(story => (
          <div 
            key={story.id} 
            onClick={() => setActiveStory(story)}
            className="aspect-[9/16] relative bg-zinc-900 rounded-3xl overflow-hidden cursor-pointer group border border-white/5"
          >
            <img src={story.image_url || story.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
               <img src={story.author_photo || story.authorPhoto} className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-x-blue" />
               <span className="text-xs font-bold text-white shadow-sm truncate max-w-[80px]">{story.author_name || story.authorName}</span>
            </div>
            <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
               <Play size={14} className="fill-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm aspect-[9/16] bg-zinc-900 rounded-[40px] overflow-hidden shadow-2xl">
              <img src={activeStory.image_url || activeStory.imageUrl} className="w-full h-full object-cover" />
              
              <div className="absolute top-0 inset-x-0 p-4 pt-8 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={activeStory.author_photo || activeStory.authorPhoto} className="w-10 h-10 rounded-full border-2 border-white" />
                  <div>
                    <p className="font-black text-sm">{activeStory.author_name || activeStory.authorName}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Story • 24h</p>
                  </div>
                </div>
                <button onClick={() => setActiveStory(null)} className="p-2 hover:bg-white/10 rounded-full text-white">
                  <X />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="absolute top-4 inset-x-4 flex gap-1 h-1">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '100%' }}
                   transition={{ duration: 5 }}
                   onAnimationComplete={() => setActiveStory(null)}
                   className="bg-white rounded-full" 
                 />
              </div>

              <div className="absolute bottom-8 inset-x-8">
                 <button className="w-full bg-white/10 backdrop-blur-md text-white font-bold py-3 rounded-full border border-white/20 hover:bg-white/20">
                    Reply to story...
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
