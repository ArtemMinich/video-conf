package com.example.videoconf.websocket;

import com.example.videoconf.service.RoomService;
import com.example.videoconf.service.SignalingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class SignalingWebSocketHandler extends TextWebSocketHandler {

    private final SignalingService signalingService;
    private final RoomService roomService;
    private final JwtDecoder jwtDecoder;
    private final ObjectMapper objectMapper;

    private final Map<String, String> sessionRoomMap = new ConcurrentHashMap<>();
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        log.info("WebSocket connected: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        log.info("WS message received: {}", message.getPayload().substring(0, Math.min(200, message.getPayload().length())));
        JsonNode json = objectMapper.readTree(message.getPayload());
        String type = json.has("type") ? json.get("type").asText() : "";

        switch (type) {
            case "join" -> handleJoin(session, json);
            case "offer", "answer", "ice-candidate" -> handleRelay(session, message.getPayload());
            case "leave" -> handleLeave(session);
            default -> sendError(session, "Unknown message type: " + type);
        }
    }

    private void handleJoin(WebSocketSession session, JsonNode json) throws IOException {
        String token = json.has("token") ? json.get("token").asText() : null;
        String roomId = json.has("roomId") ? json.get("roomId").asText() : null;

        if (token == null || roomId == null) {
            sendError(session, "Missing token or roomId");
            return;
        }

        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(token);
        } catch (Exception e) {
            log.error("JWT decode failed: {}", e.getMessage());
            sendError(session, "Invalid token: " + e.getMessage());
            return;
        }

        String username = jwt.getClaimAsString("preferred_username");
        String keycloakUserId = jwt.getSubject();

        try {
            roomService.joinRoom(roomId, username, keycloakUserId);
        } catch (RuntimeException e) {
            sendError(session, e.getMessage());
            return;
        }

        sessionRoomMap.put(session.getId(), roomId);
        sessionUserMap.put(session.getId(), username);

        signalingService.addSession(roomId, session);
        signalingService.notifyPeerJoined(roomId, session);

        log.info("User {} joined room {}", username, roomId);
    }

    private void handleRelay(WebSocketSession session, String message) {
        String roomId = sessionRoomMap.get(session.getId());
        if (roomId == null) {
            try {
                sendError(session, "Not in a room");
            } catch (IOException e) {
                log.error("Failed to send error", e);
            }
            return;
        }
        signalingService.relay(roomId, session, message);
    }

    private void handleLeave(WebSocketSession session) {
        String roomId = sessionRoomMap.remove(session.getId());
        String username = sessionUserMap.remove(session.getId());

        if (roomId != null) {
            signalingService.notifyPeerLeft(roomId, session);
            signalingService.removeSession(roomId, session);
            if (username != null) {
                roomService.leaveRoom(roomId, username);
            }
            log.info("User {} left room {}", username, roomId);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        handleLeave(session);
    }

    private void sendError(WebSocketSession session, String error) throws IOException {
        String msg = objectMapper.writeValueAsString(Map.of("type", "error", "error", error));
        if (session.isOpen()) {
            session.sendMessage(new TextMessage(msg));
        }
    }
}
