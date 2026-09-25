import React, { useState, useEffect, useRef } from 'react';
import { Send, X, ShieldCheck, Paperclip } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';

const API_BASE_URL = "https://foodiee-backend-env.eba-5d9p6wzb.eu-north-1.elasticbeanstalk.com";

export default function OrderChatModal({ orderId, userMobile, userRole, recipientRole, orderStatus, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const stompClientRef = useRef(null);
  const messagesEndRef = useRef(null);


// ✅ మొబైల్ నంబర్ ముందున్న '+' సింబల్‌ని పూర్తిగా తొలగించి, URL ఎన్‌కోడ్ చేయడం
  const rawIdentifier = userMobile || localStorage.getItem('partnerMobile') || localStorage.getItem('userMobile') || '';
  const cleanIdentifier = encodeURIComponent(rawIdentifier.toString().trim());

 useEffect(() => {
    if (!rawIdentifier) {
      console.warn("Mobile number missing.");
      return;
    }

   const historyEndpoint = recipientRole === 'admin' 
      ? `${API_BASE_URL}/api/admin-chat/history/${cleanIdentifier}`
      : `${API_BASE_URL}/api/chat/history/${orderId || cleanIdentifier}`;

    fetch(historyEndpoint)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(err => console.error("Error fetching chat history", err));

    // 2. WebSocket లైవ్ సింక్ కనెక్షన్ (Strict Duplicate Check తో)
    const socket = new SockJS(`${API_BASE_URL}/ws-foodiee`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      onConnect: () => {
        const subscribeTopic = recipientRole === 'admin'
          ? `/topic/chat/admin-partner/${cleanIdentifier}`
          : `/topic/chat/${orderId || cleanIdentifier}`;

        stompClient.subscribe(subscribeTopic, (messageOutput) => {
          const receivedMessage = JSON.parse(messageOutput.body);
          
          setMessages(prev => {
            const exists = prev.some(m => 
              m.message === receivedMessage.message && 
              m.timestamp === receivedMessage.timestamp &&
              m.senderType === receivedMessage.senderType
            );
            if (exists) return prev;
            return [...prev, receivedMessage];
          });
        });
      }
    });

    stompClient.activate();
    stompClientRef.current = stompClient;

    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [orderId, userRole, recipientRole, cleanIdentifier]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({ name: file.name, url: reader.result, type: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!cleanIdentifier) {
      toast.error("మొబైల్ నంబర్ అందుబాటులో లేదు!");
      return;
    }
    if (!inputMessage.trim() && !selectedFile) return;

    let messageContent = inputMessage;
    if (selectedFile) {
      messageContent = `<div class="space-y-2"><p>${inputMessage}</p>${selectedFile.type.includes('image') ? `<img src="${selectedFile.url}" class="rounded-xl max-h-40 object-cover" />` : `<a href="${selectedFile.url}" download="${selectedFile.name}" class="text-xs underline text-amber-300">📎 ${selectedFile.name}</a>`}</div>`;
    }

    const timestamp = new Date().toISOString();

    if (recipientRole === 'admin') {
      const adminChatPayload = {
        identifier: String(cleanIdentifier),
        partnerMobile: String(cleanIdentifier),
        partnerName: localStorage.getItem('partnerName') || 'Partner / Merchant',
        senderType: userRole, 
        senderName: localStorage.getItem('partnerName') || 'User',
        message: messageContent,
        timestamp: new Date().toISOString()
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/admin-chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adminChatPayload)
        });

        if (res.ok) {
          setInputMessage('');
          setSelectedFile(null);
        } else {
          toast.error("మెసేజ్ పంపడం విఫలమైంది");
        }
      } catch (err) {
        toast.error("టెక్నికల్ ఎర్రర్ ఏర్పడింది");
      }
    
    } else {
      const chatPayload = {
        orderId: orderId,
        senderMobile: cleanIdentifier,
        senderName: userRole === 'customer' ? 'Customer' : userRole === 'partner' ? 'Delivery Partner' : 'Shop Owner',
        senderType: userRole,        
        recipientRole: recipientRole, 
        message: messageContent,
        timestamp: timestamp
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(chatPayload)
        });

        if (res.ok) {
          setInputMessage('');
          setSelectedFile(null);
        } else {
          toast.error("మెసేజ్ పంపడం విఫలమైంది");
        }
      } catch (err) {
        toast.error("టెక్నికల్ ఎర్రర్ ఏర్పడింది");
      }
    }
  };

  // ✅ WhatsApp Style Today, Yesterday & Previous Dates Grouping Logic
  const renderGroupedChatMessages = (messagesList) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toLocaleDateString();
    const yesterdayStr = yesterday.toLocaleDateString();
    
    const grouped = messagesList.reduce((acc, msg) => {
      if (!msg.timestamp) {
        if (!acc['Today']) acc['Today'] = [];
        acc['Today'].push(msg);
        return acc;
      }

      const msgDate = new Date(msg.timestamp);
      const msgDateStr = msgDate.toLocaleDateString();
      
      let dateKey = msgDateStr;
      if (msgDateStr === todayStr) {
        dateKey = 'Today';
      } else if (msgDateStr === yesterdayStr) {
        dateKey = 'Yesterday';
      } else {
        dateKey = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(msg);
      return acc;
    }, {});

    return Object.entries(grouped).map(([dateLabel, msgs], idx) => (
      <div key={idx} className="space-y-3">
        <div className="flex justify-center my-3">
          <span className="bg-[#182229] text-slate-300 text-[10px] font-bold px-3 py-1 rounded-full shadow-inner border border-slate-700/50 uppercase tracking-wider">
            {dateLabel}
          </span>
        </div>

        {msgs.map((msg, mIdx) => {
          const isMe = msg.senderType === userRole;
          return (
            <div key={mIdx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-0.5`}>
              <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs shadow-md relative ${
                isMe 
                  ? 'bg-[#005c4b] text-white rounded-br-none font-bold' 
                  : 'bg-[#202c33] text-white rounded-bl-none border border-slate-700/50'
              }`}>
                <span className={`block text-[9px] uppercase font-black mb-1 ${isMe ? 'text-emerald-300' : 'text-[#fc8019]'}`}>
                  {msg.senderName || msg.senderType}
                </span>
                <div className="text-xs font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.message }} />
                <span className="block text-[8px] text-slate-400 text-right mt-1">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b141a] border-2 border-[#00a884] w-full max-w-md h-[580px] rounded-[32px] flex flex-col shadow-2xl text-white relative font-sans overflow-hidden">
        
        <div className="p-4 bg-[#202c33] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00a884] text-white flex items-center justify-center font-black shadow">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Foodiee WhatsApp Support</h3>
              <p className="text-[10px] text-emerald-400 font-bold">● Online ({userRole})</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer p-1">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#111b21_1px,transparent_1px)] [background-size:16px_16px]">
          {orderStatus === 'DELIVERED' || orderStatus === 'COMPLETED' ? (
            <div className="text-center py-20 text-slate-400 text-xs font-bold">
              🔒 Order delivery ayindi. Chat session mugisindi.
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 text-slate-500 space-y-1">
              <p className="text-xs font-bold">Ikkada elanti messages levu.</p>
              <p className="text-[10px]">Matladadam prarambhinchandiki kinda type cheyandi.</p>
            </div>
          ) : (
            renderGroupedChatMessages(messages)
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedFile && (
          <div className="px-4 py-2 bg-[#202c33] border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-amber-400 truncate max-w-[250px]">📎 {selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="text-rose-400 font-bold cursor-pointer">Remove</button>
          </div>
        )}

        {orderStatus !== 'DELIVERED' && orderStatus !== 'COMPLETED' && (
          <form onSubmit={handleSendMessage} className="p-3 bg-[#202c33] border-t border-slate-800 flex items-center gap-2">
            <label className="text-slate-400 hover:text-white cursor-pointer p-2.5 rounded-xl bg-[#2a3942] border border-slate-700/50">
              <Paperclip size={16} />
              <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
            </label>
            
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Message type cheyandi..."
              className="flex-1 bg-[#2a3942] border border-slate-700/50 px-4 py-3 rounded-xl text-xs font-bold text-white outline-none focus:border-[#00a884] transition"
            />

            <button 
              type="submit" 
              className="bg-[#00a884] hover:bg-[#008f72] text-white px-4 py-3 rounded-xl font-black text-xs shadow cursor-pointer flex items-center gap-1 transition"
            >
              <Send size={14} /> Send
            </button>
          </form>
        )}

      </div>
    </div>
  );
}