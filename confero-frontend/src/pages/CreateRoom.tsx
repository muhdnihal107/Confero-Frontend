// import { useState, useEffect } from "react";
// import { useAuthStore } from "../Store/authStore";
// import { useRoomStore } from "../Store/RoomStore";
// import { useMutation } from "@tanstack/react-query";
// import { useNavigate, useParams } from "react-router-dom";

// const CreateRoom: React.FC = () => {
//   const { slug } = useParams<{ slug: string }>();
// //  const { user, friends, fetchFriends } = useAuthStore();
//   const { createRoom, updateRoom, fetchRooms, rooms } = useRoomStore();
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     description: "",
//     visibility: "public" as "public" | "private",
//     invited_users: [] as string[],
//     thumbnail: null as File | null,
//   });

//   useEffect(() => {
//     fetchFriends();
//     fetchRooms();
//     if (slug) {
//       const room = rooms.find((r) => r.slug === slug);
//       if (room) {
//         setForm({
//           name: room.name,
//           description: room.description || "",
//           visibility: room.visibility,
//           invited_users: room.invited_users,
//           thumbnail: null,
//         });
//       }
//     }
//   }, [fetchFriends, fetchRooms, slug, rooms]);

//   const createRoomMutation = useMutation({
//     mutationFn: () => createRoom(form),
//     onSuccess: () => {
//       alert("Room created successfully!");
//       navigate("/rooms");
//     },
//     onError: (error: Error) => {
//       alert(`Failed to create room: ${error.message}`);
//     },
//   });

//   const updateRoomMutation = useMutation({
//     mutationFn: () => updateRoom(slug!, form),
//     onSuccess: () => {
//       alert("Room updated successfully!");
//       navigate("/rooms");
//     },
//     onError: (error: Error) => {
//       alert(`Failed to update room: ${error.message}`);
//     },
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (slug) {
//       updateRoomMutation.mutate();
//     } else {
//       createRoomMutation.mutate();
//     }
//   };

//   if (!user) {
//     navigate("/login");
//     return null;
//   }

//   return (
//     <div
//       className="flex items-center justify-center min-h-screen px-6 bg-cover bg-center"
//       style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
//     >
//       <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-2xl mx-auto">
//         <h2 className="text-4xl font-regular text-center text-gray-800">
//           {slug ? "Edit Room" : "Create Room"}
//         </h2>
//         <form onSubmit={handleSubmit} className="mt-4 space-y-4">
//           <input
//             type="text"
//             value={form.name}
//             onChange={(e) => setForm({ ...form, name: e.target.value })}
//             placeholder="Room Name"
//             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             required
//           />
//           <textarea
//             value={form.description}
//             onChange={(e) => setForm({ ...form, description: e.target.value })}
//             placeholder="Description"
//             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <select
//             value={form.visibility}
//             onChange={(e) => setForm({ ...form, visibility: e.target.value as "public" | "private" })}
//             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="public">Public</option>
//             <option value="private">Private</option>
//           </select>
//           <div>
//             <label className="block text-gray-700">Thumbnail:</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={(e) => {
//                 const file = e.target.files?.[0];
//                 if (file) setForm({ ...form, thumbnail: file });
//               }}
//               className="w-full p-3 border rounded-md"
//             />
//           </div>
//           <div>
//             <label className="block text-gray-700">Invite Friends:</label>
//             {friends.map((friend) => (
//               <div key={friend.id} className="flex items-center space-x-2">
//                 <input
//                   type="checkbox"
//                   checked={form.invited_users.includes(friend.friend)}
//                   onChange={(e) => {
//                     if (e.target.checked) {
//                       setForm({ ...form, invited_users: [...form.invited_users, friend.friend] });
//                     } else {
//                       setForm({
//                         ...form,
//                         invited_users: form.invited_users.filter((email) => email !== friend.friend),
//                       });
//                     }
//                   }}
//                 />
//                 <span>{friend.friend}</span>
//               </div>
//             ))}
//           </div>
//           <button
//             type="submit"
//             disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
//             className="w-full bg-[#e93a3a] text-white p-3 rounded-md hover:bg-[#a12121]"
//           >
//             {slug
//               ? updateRoomMutation.isPending
//                 ? "Updating..."
//                 : "Update Room"
//               : createRoomMutation.isPending
//               ? "Creating..."
//               : "Create Room"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default CreateRoom;