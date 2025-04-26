
import './App.css'
import Login from './pages//Auth/Login';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Auth/Register';
import Profile from './pages/Users/Profile';
import VerifyEmail from './pages/Auth/VerifyEmail';
import ResetPasswordForm from './pages/Auth/ResetPasswordForm';
import RequestPasswordResetForm from './components/RequestPasswordResetForm';
import Explore from './pages/Users/Explore';
import Rooms from './pages/VideoCall/Rooms';
import Notifications from './pages/Notifications';
import CreateRoom from './pages/VideoCall/CreateRoom';
import RoomDetail from './pages/VideoCall/RoomDetail';
import VideoCall from './pages/VideoCall/VideoCall';
import Chat from './pages/Chat/Chat';
import RoomCreate from './components/roomCreate';

function App() {

  return (
    <>
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/profile' element={<Profile/>}></Route>
      <Route path='/roomcreate' element={<RoomCreate/>}/>

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
