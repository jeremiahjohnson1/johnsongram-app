import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Box, Typography, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import Navbar from "../navbar";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

const ChatPage = () => {
  const { userId: receiverId } = useParams();
  const { _id: senderId } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!receiverId) return;
    try {
      const res = await fetch(`http://localhost:3001/messages/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [receiverId, token]);

   const sendMessage = async () => {
  if (!message.trim()) return;

  const newMessage = { senderId, receiverId, message };

  // Update UI immediately
  setMessages((prev) => [...prev, newMessage]);

  // Emit to receiver via socket
  socket.emit("sendMessage", newMessage);

  // Save to DB
  await fetch("http://localhost:3001/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newMessage),
  });

  setMessage("");
};


  useEffect(() => {
    if (!receiverId) return;
    fetchMessages();
    socket.emit("join", senderId);

    socket.off("getMessage");
    socket.on("recieveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("getMessage");
    };
  }, [receiverId, senderId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ This return statement must be below all hooks
  if (!receiverId) {
    return (
      <Box>
        <Navbar />
        <Typography variant="h5" align="center" mt={4}>
          Select a user to start chatting.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box
        display="flex"
        flexDirection="column"
        maxWidth="600px"
        margin="2rem auto"
        border="1px solid #ccc"
        borderRadius="8px"
        padding="1rem"
        height="80vh"
      >
        <Typography variant="h5" gutterBottom>
          Chat
        </Typography>

        <Box flexGrow={1} overflow="auto" mb={2}>
          {messages.map((msg, idx) => (
            <Box
              key={idx}
              display="flex"
              justifyContent={msg.senderId === senderId ? "flex-end" : "flex-start"}
              mb={1}
            >
              <Box
                bgcolor={msg.senderId === senderId ? "#1976d2" : "#e0e0e0"}
                color={msg.senderId === senderId ? "white" : "black"}
                px={2}
                py={1}
                borderRadius="16px"
                maxWidth="60%"
              >
                {msg.message}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <IconButton onClick={sendMessage} color="primary">
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatPage;
