import { useEffect, useState } from 'react';
import socket from '../utils/socket';

const Chat = ({ playerColor, roomId }) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    {
      user: 'white',
      text: 'Hello from White!!',
    },
    {
      user: 'black',
      text: 'Hello from black!!',
    },
  ]);

  useEffect(() => {
    socket.on('receiveMessage', ({ user, text }) => {
      console.log('revice medsage', user, text);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          user,
          text,
        },
      ]);
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, []);

  const handleSendMessage = () => {
    socket.emit('sendMessage', {
      user: playerColor,
      text: inputValue,
      roomId,
    });
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-125 mx-auto mt-6">
      {/* Outer Container */}
      <div className="border-2 border-white rounded-2xl p-4 bg-base-200 shadow-lg">
        {/* Header */}
        <h2 className="text-xl font-bold text-center mb-4">
          💬 Chat - You are {playerColor}
        </h2>

        {/* Messages Box */}
        <div
          className="h-75 overflow-y-auto bg-base-100 
                 rounded-xl p-4 mb-4"
        >
          {messages.map((msg, idx) =>
            msg.user === 'white' ? (
              <div key={idx} className="chat chat-start">
                <div className="chat-bubble bg-amber-100 text-black">
                  W - {msg.text}
                </div>
              </div>
            ) : (
              <div key={idx} className="chat chat-end">
                <div className="chat-bubble bg-black text-white">
                  B - {msg.text}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Input + Button */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="input input-bordered flex-1"
          />

          <button className="btn btn-neutral" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
