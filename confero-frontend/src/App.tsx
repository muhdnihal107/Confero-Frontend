
import './App.css'
import Login from './pages/Login';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

function App() {

  return (
    <>
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route path='/register' element={<Register/>}/>
      <Route path='/profile' element={<Profile/>}></Route>
      
      <Route path='/' element={<Home/>}/>
    
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
    </Routes>
    </>
  );
}

export default App
