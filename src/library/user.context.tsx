'use client'

import { createContext, useContext, useState } from "react";

interface IUserContext {
    collapseMenu: boolean;
    setCollapseMenu: (v: boolean) => void;
}

export const UserContext = createContext<IUserContext | null>(null);

export const UserContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [collapseMenu, setCollapseMenu] = useState(false);

    return (
        <UserContext.Provider value={{ collapseMenu, setCollapseMenu }}>
            {children}
        </UserContext.Provider>
    )
};

export const useUserContext = () => useContext(UserContext);