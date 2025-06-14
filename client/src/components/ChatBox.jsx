import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import { Box, Typography, TextField, Button } from "@mui/material";

const socket = io(process.env.REACT_APP_API_BASE_URL); // Change to Render URL after deployment

const ChatBox = ({ selectedUser }) => {
  const { _id: loggedInUserId } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load chat history
    const getMessages = async () => {
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/messages/${loggedInUserId}/${selectedUser._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setChat(data);
    };

    getMessages();
  }, [selectedUser, loggedInUserId, token]);

  useEffect(() => {
    socket.emit("join", loggedInUserId);

    socket.on("getMessage", (newMsg) => {
      setChat((prev) => [...prev, newMsg]);
    });

    return () => {
      socket.off("getMessage");
    };
  }, [loggedInUserId]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const newMsg = {
      senderId: loggedInUserId,
      receiverId: selectedUser._id,
      message,
    };

    // Send to backend (MongoDB)
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newMsg),
    });
    const savedMsg = await res.json();

    // Emit via socket
    socket.emit("sendMessage", savedMsg);

    setChat((prev) => [...prev, savedMsg]);
    setMessage("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <Box
      border="1px solid #ccc"
      borderRadius="10px"
      p="1rem"
      maxWidth="500px"
      margin="auto"
    >
      <Typography variant="h5" gutterBottom>
        Chat with {selectedUser.firstName}
      </Typography>

      <Box height="300px" overflow="auto" mb="1rem">
        {chat.map((msg, i) => (
          <Box
            key={i}
            textAlign={msg.senderId === loggedInUserId ? "right" : "left"}
          >
            <Typography
              p="0.5rem 1rem"
              m="0.5rem 0"
              borderRadius="20px"
              display="inline-block"
              bgcolor={msg.senderId === loggedInUserId ? "#1976d2" : "#eee"}
              color={msg.senderId === loggedInUserId ? "#fff" : "#000"}
            >
              {msg.message}
            </Typography>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <Box display="flex" gap="0.5rem">
        <TextField
          fullWidth
          size="small"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <Button variant="contained" onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatBox;
