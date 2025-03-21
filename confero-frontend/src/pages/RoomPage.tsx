// import { useEffect, useState } from "react";
// import { useRoomStore } from "../Store/RoomStore";
// import { useMutation } from "@tanstack/react-query";
// import { formatDistanceToNow } from "date-fns";

// const RoomPage: React.FC = () => {
//   const { publicRooms, fetchPublicRooms, joinRoom, isLoadingRooms, errorRooms } = useRoomStore();
//   const [selectedRoom, setSelectedRoom] = useState<PublicRoom | null>(null);

//   useEffect(() => {
//     fetchPublicRooms();
//   }, [fetchPublicRooms]);

//   const joinRoomMutation = useMutation({
//     mutationFn: (slug: string) => joinRoom(slug),
//     onSuccess: () => {
//       alert("Joined room successfully!");
//       fetchPublicRooms();
//     },
//     onError: (error: Error) => {
//       alert(`Failed to join room: ${error.message}`);
//     },
//   });

//   if (isLoadingRooms) return <p className="text-center text-white">Loading...</p>;
//   if (errorRooms) return <p className="text-center text-red-500">Error: {errorRooms}</p>;

//   return (
//     <div
//       className="flex min-h-screen bg-cover bg-center"
//       style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
//     >
//       <div className="w-1/3 p-6 overflow-y-auto">
//         <h2 className="text-3xl font-semibold text-gray-800 mb-6">Public Rooms</h2>
//         {publicRooms.length === 0 ? (
//           <p className="text-gray-600">No public rooms available.</p>
//         ) : (
//           publicRooms.map((room) => (
//             <div
//               key={room.id}
//               onClick={() => setSelectedRoom(room)}
//               className={`p-4 mb-4 rounded-lg cursor-pointer transition-colors ${
//                 selectedRoom?.id === room.id ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200"
//               }`}
//             >
//               <div className="flex items-center space-x-4">
//                 <div className="w-16 h-16 rounded-md overflow-hidden">
//                   {room.thumbnail ? (
//                     <img
//                       src={room.thumbnail}
//                       alt={room.name}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-full h-full bg-gray-300 flex items-center justify-center">
//                       <span className="text-gray-500 text-sm">No Image</span>
//                     </div>
//                   )}
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold">{room.name}</h3>
//                   <p className="text-gray-500 text-sm">
//                     Started {formatDistanceToNow(new Date(room.created_at))} ago
//                   </p>
//                 </div>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       <div className="w-2/3 p-6 bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg">
//         {selectedRoom ? (
//           <div>
//             <h2 className="text-3xl font-semibold text-gray-800 mb-4">{selectedRoom.name}</h2>
//             <p className="text-gray-600 mb-6">{selectedRoom.description || "No description available."}</p>
//             <h3 className="text-xl font-semibold text-gray-800 mb-2">Participants</h3>
//             {selectedRoom.participants.length === 0 ? (
//               <p className="text-gray-600">No participants yet.</p>
//             ) : (
//               <ul className="space-y-2 mb-6">
//                 {selectedRoom.participants.map((participant, index) => (
//                   <li key={index} className="text-gray-700">{participant}</li>
//                 ))}
//               </ul>
//             )}
//             <button
//               onClick={() => joinRoomMutation.mutate(selectedRoom.slug)}
//               disabled={joinRoomMutation.isPending}
//               className="bg-[#e93a3a] text-white px-6 py-3 rounded-md hover:bg-[#a12121]"
//             >
//               {joinRoomMutation.isPending ? "Joining..." : "Join Room"}
//             </button>
//           </div>
//         ) : (
//           <p className="text-gray-600 text-center">Select a room to view details.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RoomPage;