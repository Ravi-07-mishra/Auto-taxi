import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // For navigation

const HomePage = () => {
  const [isCardVisible, setIsCardVisible] = useState(false);

  const handleGetStartedClick = () => {
    setIsCardVisible(true);
  };

  return (
    <div
    className="bg-cover bg-center min-h-screen"
    style={{
      backgroundImage: 'url("homepage2.jpg")', // Replace with your image URL
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
      
      {/* Hero Section */}
      <section className="py-20 bg-transparent relative z-10">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-5xl font-extrabold drop-shadow-lg" style={{ color: '#2c1190' }}>
            Welcome to AutoDrive
          </h1>
          <p className="text-blue-100 mt-4 text-lg">
            Experience the future of taxi services. Safe, efficient, and cost-effective rides at your fingertips.
          </p>
          <a
            href="#"
            onClick={handleGetStartedClick}
            className=" text-white px-8 py-3 mt-6 inline-block font-semibold rounded-full shadow-lg hover:bg-blue-100 transition"
            style={{backgroundColor: '#370b69'}}
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Card Prompt */}
      {isCardVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-lg w-96">
            <div className="flex">
              {/* User Section */}
              <Link to="#user" className="w-1/2">
                <div
                  className="h-full bg-cover bg-center p-6 text-gray-500"
                  style={{
                    backgroundImage: 'url("user.jpg")', // Replace with user image
                  }}
                >
                  <h3 className="text-3xl font-bold">User</h3>
                  <p className="mt-2">Click to book your ride and get started with AutoDrive!</p>
                </div>
              </Link>

              {/* Driver Section */}
              <Link to="/driverpage" className="w-1/2">
                <div
                  className="h-full bg-cover bg-center p-6 text-gray-500"
                  style={{
                    backgroundImage: 'url("driver.jpg")', // Replace with driver image
                  }}
                >
                  <h3 className="text-3xl font-bold">Driver</h3>
                  <p className="mt-2">Click to join as a driver and start earning!</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
     {/* Features Section */}
     <section className="bg-transparent py-20">
  <div className="container mx-auto text-center px-4">
    <h2 className="text-4xl font-bold text-gray-800">Features</h2>
    <div className="flex flex-wrap mt-10 justify-center">
      {[{ title: 'Book Drives', description: 'Easily book your rides with just a few clicks.' },
        { title: 'Live Location Tracking', description: 'Track your ride in real-time for better convenience.' },
        { title: 'Real-Time Chat', description: 'Communicate with drivers and support instantly.' },
        { title: 'Cost-Efficient', description: 'Enjoy affordable rides and subscription plans.' }]
        .map((feature, index) => (
          <div key={index} className="w-full md:w-1/2 lg:w-1/3 p-6">
            <div
              className="bg-white bg-opacity-10 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm"
            >
             <h3 className="text-2xl font-bold text-white drop-shadow-md">
  {feature.title}
</h3>

              <p className="text-gray-600 mt-2">{feature.description}</p>
            </div>
          </div>
        ))}
    </div>
  </div>
</section>


      {/* Footer */}
      <footer className="bg-blue-600 py-6">
        <div className="container mx-auto text-center text-white text-sm">
          &copy; 2025 AutoDrive. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
