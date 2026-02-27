import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { gameMode } from '../utils/gameSlice';

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handlePlay = (mode) => {
    if (mode === 'friend') {
      dispatch(gameMode('friend'));
      navigate('/game');
    } else {
      dispatch(gameMode('computer'));
      navigate('/gamecomputer');
    }
  };
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-198 h-120 bg-base-100 shadow-xl">
        <figure className="px-2 pt-6">
          <img
            src="https://tse1.mm.bing.net/th/id/OIP.O7ouxj8SMMe9iM_yH5vofwHaGl?pid=ImgDet&w=182&h=162&c=7&dpr=1.3&o=7&rm=3&sres=1&pid=1.7"
            alt="Chess"
            className="rounded-xl w-60 h-60 object-cover"
          />
        </figure>

        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl">Realtime Chess</h2>
          <p>Challenge a random player online</p>

          <div className="card-actions mt-2">
            <button
              onClick={() => handlePlay('friend')}
              className="btn btn-primary w-40"
            >
              Play with Friend
            </button>
            <button
              onClick={() => handlePlay('computer')}
              className="btn btn-primary w-40"
            >
              Play with Computer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
