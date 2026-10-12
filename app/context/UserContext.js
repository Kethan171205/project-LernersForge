// context/UserContext.js — stores the logged-in user across the whole app
import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

// Wrap the app with this so every screen can call useUser()
export function UserProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, email }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
