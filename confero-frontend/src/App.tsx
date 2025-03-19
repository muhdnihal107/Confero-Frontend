
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

    </Routes>
    </>
  );
}

export default App
