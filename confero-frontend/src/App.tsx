
import './App.css'
import Login from './pages/Login';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Header from './components/Header';

function App() {

  return (
    <>
    <Routes>
      <Route path='/login' element={<Login/>}/>
      <Route path='/register' element={<Register/>}/>

      
      <Route path='/' element={<Home/>}/>
    


    </Routes>
    </>
  );
}

export default App
