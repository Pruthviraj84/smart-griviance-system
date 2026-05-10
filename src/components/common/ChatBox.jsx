import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ImageIcon, Loader2 } from 'lucide-react';
import { API_BASE, API_ENDPOINTS } from '../../utils/api';
import { getAuthHeaders } from '../../utils/auth';
import { useSocket } from '../../contexts/SocketContext';
import { joinComplaintRoom, leaveComplaintRoom } from '../../utils/socket';

export default function ChatBox({ complaintId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const bottomRef = useRef(null);
  const { on } = useSocket();

  const fetchMessages = useCallback(async () => {
    if (!complaintId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}${API_ENDPOINTS.GET_CHAT(complaintId)}`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Chat fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [complaintId]);

  useEffect(() => {
    if (complaintId) {
      joinComplaintRoom(complaintId);
      fetchMessages();
      return () => leaveComplaintRoom(complaintId);
    }
  }, [complaintId, fetchMessages]);

  useEffect(() => {
    const cleanupMsg = on('new-message', (message) => {
      if (message.complaintId === complaintId) {
        setMessages((prev) => [...prev, message]);
      }
    });
    const cleanupTyping = on('typing', ({ name, isTyping }) => {
      if (isTyping) setTypingUser(name);
      else setTypingUser(null);
    });
    return () => {
      cleanupMsg();
      cleanupTyping();
    };
  }, [on, complaintId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const sendMessage = async () => {
    if (!text.trim() && !selectedImage) return;
    setIsSending(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      if (selectedImage) formData.append('images', selectedImage);

      const res = await fetch(`${API_BASE}${API_ENDPOINTS.SEND_CHAT(complaintId)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      if (res.ok) {
        setText('');
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const isOwnMessage = (msg) => msg.senderId === currentUser?.id || msg.senderName === currentUser?.name;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg._id} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                isOwnMessage(msg)
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-slate-800 rounded-bl-md'
              }`}
            >
              {!isOwnMessage(msg) && (
                <p className="text-[10px] font-semibold opacity-70 mb-1">{msg.senderName}</p>
              )}
              <p className="leading-relaxed">{msg.text}</p>
              {msg.images?.map((img, i) => (
                <img key={i} src={img} alt="" className="mt-2 rounded-lg max-h-32 object-cover" />
              ))}
              <p className={`mt-1 text-[10px] ${isOwnMessage(msg) ? 'text-primary-100' : 'text-slate-500'}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {typingUser && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5 text-xs text-slate-500">
              {typingUser} is typing...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3">
        {selectedImage && (
          <div className="flex items-center gap-2 mb-2 rounded-lg bg-gray-50 px-3 py-2">
            <ImageIcon className="h-4 w-4 text-slate-500" />
            <span className="text-xs text-slate-600 truncate flex-1">{selectedImage.name}</span>
            <button onClick={() => setSelectedImage(null)} className="text-xs text-red-500 hover:text-red-600">
              Remove
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-gray-100 hover:text-slate-600 transition-colors">
            <ImageIcon className="h-5 w-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setSelectedImage(e.target.files[0])}
            />
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={isSending || (!text.trim() && !selectedImage)}
            className="rounded-xl bg-primary-600 p-2.5 text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
