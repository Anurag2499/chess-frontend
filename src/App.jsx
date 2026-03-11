import { useEffect } from 'react';
import socket from './utils/socket';
import Home from './pages/Home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import appStore from './utils/appStore';
import Game from './pages/Game';
import Body from './component/Body';
import GameComputer from './pages/GameComputer';

function App() {
  // useEffect(() => {
  //   socket.on('connect', () => {
  //     console.log('Socket connection established:', socket.id);
  //   });
  // }, []);
  return (
    <Provider store={appStore}>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/" element={<Body />}>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/gamecomputer" element={<GameComputer />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
