import React from 'react'
import axios from 'axios'

const fetchProfile = async () => {
    const responce = await axios.get('http://localhost:8000/api/auth/profile/');
        
}


const Profile = () => {
  return (
    <div>Profile</div>
  )
}

export default Profile