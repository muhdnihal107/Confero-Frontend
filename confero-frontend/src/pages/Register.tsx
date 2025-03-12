

const Register = () => {
  return (
    <div
      className="flex items-center justify-start min-h-screen px-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/src/assets/background.jpg')" }}
    >
      <div className="bg-[#b1b1b171] backdrop-blur-[10px] shadow-lg rounded-xl p-8 w-full max-w-md ml-20">
        <h2 className="text-4xl font-regular text-center text-gray-800">Register</h2>
        <form className="mt-4 space-y-4">
          <input
            type="fullname"
            placeholder="Full Name"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
         <input
            type="number"
            placeholder="Age"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
         <input
            type="phone_number"
            placeholder="Phone Number"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
         <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button className="w-full bg-[#e93a3a] text-white p-3 rounded-md hover:bg-[#a12121]">
            <p>Sign up</p>
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register