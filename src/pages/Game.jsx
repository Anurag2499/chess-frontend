/* eslint-disable no-unused-vars */
import React, { useRef } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useNavigate } from 'react-router-dom';
import socket from '../utils/socket';
import { useSelector } from 'react-redux';
import Chat from './Chat';

const Game = () => {
  const navigate = useNavigate();
  const gameMode = useSelector((state) => state.game);
  console.log('Current game mode from Redux:', gameMode);

  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState({});
  const [player, setPlayer] = useState('white');

  const [status, setStatus] = useState('Waiting for opponent...');
  const [roomId, setRoomId] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState('');
  const [showInvalid, setShowInvalid] = useState(false);
  const [startChat, setStartChat] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState('');
  const [showCheck, setShowCheck] = useState(false);

  console.log('player color: ', playerColor);
  console.log('roomid', roomId);

  const checkGameStatus = () => {
    if (chessGame.isCheck() && !chessGame.isCheckmate()) {
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 2000);
    }
    if (chessGame.isCheckmate()) {
      setGameOver(true);
      setResult(
        chessGame.turn() === 'w'
          ? 'Black wins by Checkmate!'
          : 'White wins by Checkmate!',
      );
    } else if (chessGame.isDraw()) {
      setGameOver(true);
      setResult('Game Draw!');
    } else if (chessGame.isStalemate()) {
      setGameOver(true);
      setResult('Stalemate!');
    } else if (chessGame.isThreefoldRepetition()) {
      setGameOver(true);
      setResult('Draw by Threefold Repetition!');
    } else if (chessGame.isInsufficientMaterial()) {
      setGameOver(true);
      setResult('Draw by Insufficient Material!');
    }
  };

  useEffect(() => {
    socket.connect();
    socket.emit('joinGame');
    socket.on('waiting', () => {
      setStatus('Waiting for opponent...');
      setPlayerColor('white');
    });

    socket.on('startGame', ({ roomId }) => {
      setStatus('Game Started!');
      setRoomId(roomId);
      setIsStarted(true);
      setPlayerColor((prev) => (prev === '' ? 'black' : 'white'));
    });

    socket.on('opponentMove', ({ move }) => {
      console.log('move ', move);
      chessGame.move(move);
      setChessPosition(chessGame.fen()); // update the chessboard position
      checkGameStatus();
      setPlayer((prev) => (prev === 'white' ? 'black' : 'white')); // update the player turn based on the move received from the opponent
    });

    socket.on('opponentLeft', () => {
      alert('Opponent left the game');
      socket.disconnect();
      navigate('/'); // if using react-router
    });

    socket.on('receiveStartChat', () => {
      setStartChat(true);
    });

    return () => {
      socket.disconnect();
      socket.off('startGame');
      socket.off('opponentMove');
    };
  }, []);

  const handleBack = () => {
    // socket.emit('leaveGame');
    // console.log('Leaving game, disconnecting socket', socket.id);
    socket.disconnect();
    navigate('/');
  };

  const handleStartButton = () => {
    setStartChat(true);
    socket.emit('startChat', { roomId });
  };

  // get the move options for a square to show valid moves
  const getMoveOptions = ({ square }) => {
    // console.log('Getting move options for square:', square);
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
    // console.log('Square clicked:', square, 'Piece on square:', piece);
    //piece clicked to move
    if (
      (playerColor === 'white' && chessGame._turn === 'b') ||
      (playerColor === 'black' && chessGame._turn === 'w')
    )
      return;
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
      console.log('invalid move');
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
    setPlayer((prev) => (prev === 'white' ? 'black' : 'white')); // switch player turn
    socket.emit('makeMove', {
      roomId,
      move: {
        from: moveFrom,
        to: square,
        promotion: 'q',
      },
      player,
    });
    console.log('chessgame--', chessGame._turn);
    checkGameStatus();

    // clear moveFrom and optionSquares
    setMoveFrom('');
    setOptionSquares({});
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }) => {
    if (!targetSquare) return false;
    try {
      // console.log('Attempting move from', sourceSquare, 'to', targetSquare);
      // console.log('Move ---', chessGame.move());
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      setChessPosition(chessGame.fen()); // update the chessboard position
      setPlayer((prev) => (prev === 'white' ? 'black' : 'white')); // switch player turn
      console.log('chessgame--', chessGame._turn);
      // Send move to backend
      socket.emit('makeMove', {
        roomId,
        move: {
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        },
        player,
      });
      checkGameStatus();
      // clear moveFrom and optionSquares
      setMoveFrom('');
      setOptionSquares({});
      return true;
    } catch {
      console.log('Invalid move');

      setShowInvalid(true);
      setTimeout(() => setShowInvalid(false), 1000);

      return false;
    }
  };

  // allow white to only drag white pieces
  function canDragPieceWhite({ piece }) {
    return piece.pieceType[0] === 'w';
  }

  // allow black to only drag black pieces
  function canDragPieceBlack({ piece }) {
    return piece.pieceType[0] === 'b';
  }

  // set the chessboard options
  const chessboardOptions = {
    canDragPiece: gameOver
      ? () => false
      : playerColor === 'white'
        ? canDragPieceWhite
        : canDragPieceBlack,
    canClickPiece: gameOver
      ? () => false
      : playerColor === 'white'
        ? canDragPieceWhite
        : canDragPieceBlack,
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    id: 'click-or-drag-to-move',
  };

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center">
      {gameOver ? (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl text-center shadow-xl w-96">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Game Over</h2>
            <p className="text-lg mb-6 text-red-600 ">{result}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary mr-2"
            >
              Play Again
            </button>
            <button onClick={handleBack} className="btn btn-error">
              Exit
            </button>
          </div>
        </div>
      ) : isStarted == true ? (
        <div className="text-center">
          {showInvalid && (
            <div className="toast toast-top toast-center z-50">
              <div className="alert alert-error">
                <span>Invalid Move!</span>
              </div>
            </div>
          )}
          {showCheck && (
            <div className="toast toast-top toast-center z-50">
              <div className="alert alert-warning">
                <span>Check!</span>
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold text-success">{status}</h1>
          <h1 className="text-3xl font-bold text-emerald-200 mt-2">
            {player}'s turn, you are {playerColor}
          </h1>
          <div className="w-100 flex justify-center mt-6">
            <Chessboard options={chessboardOptions} />
          </div>
          <div>
            {!startChat ? (
              <button
                onClick={handleStartButton}
                className="btn btn-primary mt-6"
              >
                Start Chat
              </button>
            ) : (
              <div className="w-100">
                <Chat playerColor={playerColor} roomId={roomId} />
              </div>
            )}
          </div>

          <button onClick={handleBack} className="btn btn-error mt-6">
            Leave Game
          </button>
        </div>
      ) : (
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <h1 className="text-xl font-semibold m-3">{status}</h1>
            <div className="card-actions mt-6">
              <button
                onClick={handleBack}
                className="btn btn-outline btn-error"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
