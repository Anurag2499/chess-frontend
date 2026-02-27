/* eslint-disable no-unused-vars */
import React, { useRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';
import socket from '../utils/socket';
import { useSelector } from 'react-redux';

const GameComputer = () => {
  const navigate = useNavigate();
  const gameMode = useSelector((state) => state.game);
  console.log('Current game mode from Redux:', gameMode);

  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [player, setPlayer] = useState('User');
  const [gameOver, setGameOver] = useState(false);
  const [showInvalid, setShowInvalid] = useState(false);

  const handleBack = () => {
    navigate('/');
  };

  // make a random "CPU" move
  function makeRandomMove() {
    // get all possible moves`
    const possibleMoves = chessGame.moves();

    // exit if the game is over
    if (chessGame.isGameOver()) {
      setGameOver(true);
      console.log('Game Over: ', chessGame.isGameOver());
      return;
    }

    // pick a random move
    const randomMove =
      possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    // make the move
    chessGame.move(randomMove);

    // update the position state
    setChessPosition(chessGame.fen());
    setPlayer((prev) => (prev === 'User' ? 'Computer' : 'User'));
  }

  // get the move options for a square to show valid moves
  const getMoveOptions = ({ square }) => {
    console.log('Getting move options for square:', square);
    // get the moves for the square
    const moves = chessGame.moves({
      square,
      verbose: true,
    });

    // if no moves, clear the option squares
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    // create a new object to store the option squares
    const newSquares = {};

    // loop through the moves and set the option squares
    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to) &&
          chessGame.get(move.to)?.color !== chessGame.get(square)?.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // larger circle for capturing
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
        // smaller circle for moving
        borderRadius: '50%',
      };
    }

    // set the square clicked to move from to yellow
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)',
    };

    // set the option squares
    setOptionSquares(newSquares);

    // return true to indicate that there are move options
    return true;
  };

  const onSquareClick = ({ square, piece }) => {
    console.log('Square clicked:', square, 'Piece on square:', piece);
    //piece clicked to move
    if (!moveFrom && piece) {
      // get the move options for the square
      const hasMoveOptions = getMoveOptions({ square });

      // if move options, set the moveFrom to the square
      if (hasMoveOptions) {
        setMoveFrom(square);
      }
      // return early
      return;
    }

    //square clicked to move to, check if valid move
    const moves = chessGame.moves({
      square: moveFrom,
      verbose: true,
    });
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);

    // not a valid move
    if (!foundMove) {
      // check if clicked on new piece
      const hasMoveOptions = getMoveOptions({ square });

      // if new piece, setMoveFrom, otherwise clear moveFrom
      setMoveFrom(hasMoveOptions ? square : '');

      // return early
      return;
    }
    //is normal move
    try {
      chessGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q',
      });
    } catch {
      // if invalid, setMoveFrom and getMoveOptions
      const hasMoveOptions = getMoveOptions({ square });

      // if new piece, setMoveFrom, otherwise clear moveFrom
      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      // return early
      return;
    }

    // update the position state
    setChessPosition(chessGame.fen());

    setPlayer((prev) => (prev === 'User' ? 'Computer' : 'User'));
    // make random cpu move after a short delay
    setTimeout(makeRandomMove, 300);

    // clear moveFrom and optionSquares
    setMoveFrom('');
    setOptionSquares({});
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }) => {
    if (!targetSquare) return false;
    try {
      console.log('Attempting move from', sourceSquare, 'to', targetSquare);
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      setChessPosition(chessGame.fen()); // update the chessboard position

      setPlayer((prev) => (prev === 'User' ? 'Computer' : 'User'));

      // clear moveFrom and optionSquares
      setMoveFrom('');
      setOptionSquares({});

      // make random cpu move after a short delay
      setTimeout(makeRandomMove, 500);

      return true;
    } catch {
      console.log('Invalid move');

      setShowInvalid(true);
      setTimeout(() => setShowInvalid(false), 1000);

      return false;
    }
  };

  // set the chessboard options
  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    id: 'click-or-drag-to-move',
  };

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center">
      <div className="text-center">
        <>
          {gameOver ? (
            <div className="text-3xl font-bold text-red-700 m-3">
              Game is Over
            </div>
          ) : (
            <>
              {showInvalid && (
                <div className="toast toast-top toast-center z-50">
                  <div className="alert alert-error">
                    <span>Invalid Move!</span>
                  </div>
                </div>
              )}
              <h1 className="text-3xl font-bold text-emerald-200 mt-2">
                This is {player}'s turn
              </h1>
              <div className="w-100 flex justify-center mt-6">
                <Chessboard options={chessboardOptions} />
              </div>
            </>
          )}
          <button onClick={handleBack} className="btn btn-error mt-6">
            Leave Game
          </button>
        </>
      </div>
    </div>
  );
};

export default GameComputer;
