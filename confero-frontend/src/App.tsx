
import './App.css'
import Login from './pages/Login';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import ResetPasswordForm from './pages/ResetPasswordForm';
import RequestPasswordResetForm from './components/RequestPasswordResetForm';
import Explore from './pages/Explore';
import Rooms from './pages/Rooms';
//import PublicRooms from './pages/PublicRooms';
import Notifications from './pages/Notifications';
import CreateRoom from './pages/CreateRoom';
// import VideoCall from './pages/VideoConference';
// import VideoConference from './pages/VideoConference';
import RoomDetail from './pages/RoomDetail';
import VideoCall from './pages/VideoCall';
import Chat from './pages/Chat';

function App() {

  return (
    <>
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/profile' element={<Profile/>}></Route>
      
      <Route path='/' element={<Home/>}/>
      <Route path='/request-password-reset' element={<RequestPasswordResetForm/>}/>
      <Route path="/reset-password/:token" element={<ResetPasswordForm />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/room" element={<Rooms />} />
      <Route path="/create-room" element={<CreateRoom />} />
      <Route path="/notification" element={<Notifications />} />
      <Route path="/room/:room_id" element={<RoomDetail />} />
      <Route path="/video-call/:room_id" element={<VideoCall />} />
      <Route path="/chat" element={<Chat />} />


    </Routes>
    </>
  );
}

export default App
