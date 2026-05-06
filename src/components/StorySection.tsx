import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, where, limit, doc, getDoc } from 'firebase/firestore';
import { Plus, Camera, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StorySection({ user }: { user: any }) {
  const [stories, setStories] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeStory, setActiveStory] = useState<any>(null);

  useEffect(() => {
    const fetchConnectionsAndStories = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const connections = userSnap.exists() ? (userSnap.data().connections || []) : [];
      const authorIds = [...connections, user.uid];

      // Since 'in' query has a limit of 30, we might need to batch if many connections
      // For this app, we'll assume under 30 or just show first 30
      const limitedAuthorIds = authorIds.slice(0, 30);

      // Show stories from last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const q = query(
        collection(db, 'stories'), 
        where('authorId', 'in', limitedAuthorIds),
        where('createdAt', '>=', yesterday),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return unsubscribe;
    };

    fetchConnectionsAndStories();
  }, [user.uid]);

  const postStory = async () => {
    // Since I cannot actually upload files to a storage bucket here, 
    // I will use random high-quality images as "captured" photos
    setIsUploading(true);
    const randomImgs = [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      'https://images.unsplash.com/photo-1533738363-b7f9aef128ce',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e'
    ];
    const img = randomImgs[Math.floor(Math.random() * randomImgs.length)] + '?auto=format&fit=crop&w=800&q=80';

    try {
      await addDoc(collection(db, 'stories'), {
        authorId: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        imageUrl: img,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
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
            <img src={story.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
               <img src={story.authorPhoto} className="w-8 h-8 rounded-full border-2 border-white ring-2 ring-x-blue" />
               <span className="text-xs font-bold text-white shadow-sm truncate max-w-[80px]">{story.authorName}</span>
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
              <img src={activeStory.imageUrl} className="w-full h-full object-cover" />
              
              <div className="absolute top-0 inset-x-0 p-4 pt-8 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={activeStory.authorPhoto} className="w-10 h-10 rounded-full border-2 border-white" />
                  <div>
                    <p className="font-black text-sm">{activeStory.authorName}</p>
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
