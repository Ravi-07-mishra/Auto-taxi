import React from "react";

const UserHomes = () => {
  return (
    <div style={{ height: "100vh", position: "relative" }}>
    {/* Background Video */}
    <video
      autoPlay
      loop
      muted
      playsInline
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        zIndex: -1,
      }}
    >
      <source src="/HomePage.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

    {/* Content */}
    <div
      style={{
        position: "relative",
        zIndex: 1,
        color: "white",
        textAlign: "center",
        paddingTop: "20vh",
      }}
    >
      <h1>Background Video Test</h1>
      <p>If this works, the background video is playing.</p>
    </div>
  </div>
  );
};

export default UserHomes;
