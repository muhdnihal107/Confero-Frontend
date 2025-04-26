import React, { useState } from 'react';
import { useAuthStore } from '../Store/authStore';
import { updateChatGroup } from '../api/chat';
import {  ChatGroup } from '../api/chat';
import { ProfileResponse } from '../api/auth';

interface GroupDetailsModalProps {
  group: ChatGroup;
  friends: ProfileResponse[];
  onClose: () => void;
  onGroupUpdated: () => void;
}

const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ group, friends, onClose, onGroupUpdated }) => {
  const { accessToken, user } = useAuthStore();
  const [groupName, setGroupName] = useState(group.name || '');
  const [participants, setParticipants] = useState<string[]>(group.participants);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAddParticipant = async (email: string) => {
    if (!accessToken || !user || participants.includes(email)) return;
    setIsUpdating(true);
    try {
      const updatedParticipants = [...participants, email];
      await updateChatGroup(group.id, { participants: updatedParticipants }, accessToken);
      setParticipants(updatedParticipants);
      onGroupUpdated();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add participant';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveParticipant = async (email: string) => {
    if (!accessToken || !user || email === user.email) return;
    setIsUpdating(true);
    try {
      const updatedParticipants = participants.filter((p) => p !== email);
      await updateChatGroup(group.id, { participants: updatedParticipants }, accessToken);
      setParticipants(updatedParticipants);
      onGroupUpdated();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove participant';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!accessToken || !user || !groupName.trim()) return;
    setIsUpdating(true);
    try {
      await updateChatGroup(group.id, { name: groupName }, accessToken);
      onGroupUpdated();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group name';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const getDisplayName = (email: string): string => email.split('@')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4">Group Details</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <div className="mb-4">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group Name"
            className="w-full p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleUpdateGroupName}
            disabled={isUpdating || !groupName.trim()}
            className="mt-2 px-4 py-2 bg-blue-500 rounded-lg text-white hover:bg-blue-600 disabled:opacity-50"
          >
            Update Name
          </button>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Participants</h3>
        <div className="max-h-60 overflow-y-auto mb-4">
          {participants.map((email) => (
            <div key={email} className="flex items-center justify-between p-2">
              <span className="text-white">{getDisplayName(email)}</span>
              {email !== user?.email && (
                <button
                  onClick={() => handleRemoveParticipant(email)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Add Friends</h3>
        <div className="max-h-60 overflow-y-auto mb-4">
          {friends
            .filter((f) => !participants.includes(f.email))
            .map((friend) => (
              <div key={friend.email} className="flex items-center justify-between p-2">
                <span className="text-white">{friend.username || getDisplayName(friend.email)}</span>
                <button
                  onClick={() => handleAddParticipant(friend.email)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Add
                </button>
              </div>
            ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 rounded-lg text-white hover:bg-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailsModal;