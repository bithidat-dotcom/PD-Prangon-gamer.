import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Camera, Edit3, Phone, User as UserIcon, Mail, Info, Save, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import SettingsModal from './SettingsModal';

export default function UserProfile({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    bio: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setProfile(data);
        setFormData({
          displayName: data.displayName || '',
          phoneNumber: data.phoneNumber || '',
          bio: data.bio || ''
        });
      }
    };
    fetchProfile();
  }, [user.uid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
        updatedAt: serverTimestamp()
      });
      setProfile({ ...profile, ...formData });
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
    setSaving(false);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoURL' | 'bannerURL') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Please select an image smaller than 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setSaving(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 
          [field]: base64String,
          updatedAt: serverTimestamp()
        });
        setProfile((prev: any) => ({ ...prev, [field]: base64String }));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
      setSaving(false);
    };
    reader.readAsDataURL(file);
  };

  if (!profile) return <div className="p-8 text-center animate-pulse">Loading profile...</div>;

  return (
    <div className="w-full">
      {/* Banner Section */}
      <div className="h-48 bg-zinc-900 border-b border-white/5 relative group overflow-hidden">
         {profile.bannerURL ? (
           <img src={profile.bannerURL} className="w-full h-full object-cover" />
         ) : (
           <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 to-zinc-900 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
         )}
         <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
            <Camera size={24} className="text-white" />
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => handleMediaUpload(e, 'bannerURL')}
              disabled={saving}
            />
         </label>
      </div>

      <div className="px-8 -mt-20 relative">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="relative group">
            <img src={profile.photoURL} alt="" className="w-32 h-32 rounded-[32px] border-4 border-black bg-zinc-900 shadow-xl object-cover" />
            <label className="absolute inset-0 bg-black/40 rounded-[32px] opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all hover:bg-black/60">
               <Camera size={24} className="text-white" />
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 onChange={(e) => handleMediaUpload(e, 'photoURL')}
                 disabled={saving}
               />
            </label>
            {saving && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[32px]">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          <div className="flex-1 pb-2">
            <h1 className="text-3xl font-black">{profile.displayName}</h1>
            <p className="text-x-blue font-bold">@{profile.email.split('@')[0]}</p>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="md:hidden p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white text-black font-black px-8 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all outline-none"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 pb-24">
          <div className="space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-xs font-black text-x-gray uppercase tracking-[0.2em] mb-4">
                <Info size={14} className="text-x-blue" />
                About Me
              </h3>
              {isEditing ? (
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-[#16181c] border border-white/10 rounded-2xl p-4 outline-none focus:border-x-blue min-h-[120px] transition-colors font-medium text-white shadow-inner"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-lg text-zinc-300 leading-relaxed font-medium">
                  {profile.bio || "No bio yet. Tell the world who you are!"}
                </p>
              )}
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-xs font-black text-x-gray uppercase tracking-[0.2em] mb-4">
                <Shield size={14} className="text-x-blue" />
                Social Stats
              </h3>
              <div className="flex gap-8">
                 <div>
                   <p className="text-2xl font-black">{(profile.connections || []).length}</p>
                   <p className="text-x-gray text-xs font-bold uppercase tracking-widest">Connections</p>
                 </div>
              </div>
            </section>
          </div>

          <div className="bg-[#16181c] rounded-[32px] p-8 border border-white/5 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">Account Info</h3>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="hidden md:flex p-2 hover:bg-white/5 rounded-full transition-colors text-x-gray"
              >
                <Settings size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <ProfileInput 
                icon={<UserIcon />} 
                label="Full Name" 
                value={isEditing ? formData.displayName : profile.displayName} 
                editing={isEditing}
                onChange={(v: string) => setFormData({...formData, displayName: v})}
              />
              <ProfileInput 
                icon={<Phone />} 
                label="Number" 
                value={isEditing ? formData.phoneNumber : profile.phoneNumber || 'Not set'} 
                editing={isEditing}
                placeholder="+1 234 567 890"
                onChange={(v: string) => setFormData({...formData, phoneNumber: v})}
              />
              <ProfileInput 
                icon={<Mail />} 
                label="Email" 
                value={profile.email} 
                editing={false} 
              />
            </div>

            {isEditing && (
              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-x-blue text-white font-black py-4 rounded-2xl hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      <SettingsModal 
        user={user} 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onUnblock={() => {}} // User doesn't need to do anything specific here
      />
    </div>
  );
}

function ProfileInput({ icon, label, value, editing, onChange, placeholder }: any) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="p-3 bg-black/40 rounded-xl text-x-gray group-focus-within:text-x-blue transition-colors">
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div className="flex-1">
        <label className="block text-[10px] font-black text-x-gray uppercase tracking-widest mb-0.5">{label}</label>
        {editing ? (
          <input 
            type="text" 
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-b border-white/10 outline-none pb-1 focus:border-x-blue font-bold"
          />
        ) : (
          <p className="font-bold">{value}</p>
        )}
      </div>
    </div>
  );
}

function Shield({ size, className }: any) {
  return (
    <svg 
      width={size} 
      height={size} 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
