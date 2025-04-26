import React, { useState } from 'react';
import { useAuthStore } from '../Store/authStore';
import { createChatGroup } from '../api/chat';
import { ProfileResponse } from '../api/auth';

interface CreateGroupModalProps {
  friends: ProfileResponse[];
  onClose: () => void;
  onGroupCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ friends, onClose, onGroupCreated }) => {
  const { accessToken, user } = useAuthStore();
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleFriendToggle = (email: string) => {
    setSelectedFriends((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleCreateGroup = async () => {
    if (!accessToken || !user || !groupName.trim() || selectedFriends.length < 2) {
      setError('Group name and at least two participants are required');
      return;
    }

    setIsCreating(true);
    try {
      const participants = [user.email, ...selectedFriends];
      await createChatGroup({ is_group_chat: true, participants }, accessToken);
      onGroupCreated();
      onClose();
    } catch (err) {
      setError('Failed to create group chat');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Create Group Chat</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
          className="w-full p-2 mb-4 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="max-h-60 overflow-y-auto mb-4">
          {friends.map((friend) => (
            <div key={friend.user_id} className="flex items-center p-2">
              <input
                type="checkbox"
                checked={selectedFriends.includes(friend.email)}
                onChange={() => handleFriendToggle(friend.email)}
                className="mr-2"
              />
              <span className="text-white">{friend.username || friend.email.split('@')[0]}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded-lg text-white hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;