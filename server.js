const dotenv = require("dotenv");
dotenv.config(); // must be first so every module sees env vars

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const { cloudinary_js_config } = require("./config/cloudinary");

connectDB();
cloudinary_js_config();

const PORT = process.env.PORT || 5000;

// â”€â”€ HTTP server + Socket.IO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
      callback(allowed ? null : new Error(`CORS blocked: ${origin}`), allowed);
    },
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // Teacher joins their personal room to receive submission notifications
  socket.on("join_teacher_room", (teacherId) => {
    socket.join(`teacher:${teacherId}`);
  });

  socket.on("disconnect", () => {});
});

// Make io accessible in controllers via req.app.get('io')
app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

