import "./App.css";
import {io} from "socket.io-client";
const socket = io("http://localhost:5001");
import { Routes, Route } from "react-router-dom";
import Home from "./components/home/home";
// import ChatPage from "./components/chat/index";
import { useState } from "react";
import {Provider} from 'react-redux'
import { store } from "./store/store";

function App() {
  const [isDark, setIsDark] = useState(true);
  return (
    <div className={`app ${isDark ? "dark" : "light"}`}>
      <Provider store={store}>
        <Routes>
          <Route path="/" element={<Home isDark={isDark} socket={socket}/>} />
        </Routes>
      </Provider>
    </div>
  );
}

export default App;
