import React, { createContext, useState } from "react";

const PoseContext = createContext(); 

function PoseContextProvider({ children }) {
    const [pose, selectPose] = useState('tree');
    return (
        <PoseContext.Provider value={{ pose, selectPose }}>
            {children}
        </PoseContext.Provider>
    );
}

export { PoseContext, PoseContextProvider };
