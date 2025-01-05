import { useContext } from "react";
import React from "react";
import { AuthContext } from "../Context/userContext";
export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used inside a AuthContextProvider"
    );
  }

  return context;
};
