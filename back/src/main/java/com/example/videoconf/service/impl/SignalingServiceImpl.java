package com.example.videoconf.service.impl;

import com.example.videoconf.service.SignalingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
@Slf4j
public class SignalingServiceImpl implements SignalingService {

    private final ConcurrentHashMap<String, Set<WebSocketSession>> rooms = new ConcurrentHashMap<>();

    @Override
    public void addSession(String roomId, WebSocketSession session) {
        rooms.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
    }

    @Override
    public void removeSession(String roomId, WebSocketSession session) {
        Set<WebSocketSession> sessions = rooms.get(roomId);
        if (sessions != null) {
            sessions.remove(session);
            if (sessions.isEmpty()) {
                rooms.remove(roomId);
            }
        }
    }

    @Override
    public void relay(String roomId, WebSocketSession sender, String message) {
        Set<WebSocketSession> sessions = rooms.get(roomId);
        if (sessions == null) return;

        for (WebSocketSession session : sessions) {
            if (session != sender && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    log.error("Failed to relay message to session {}", session.getId(), e);
                }
            }
        }
    }

    @Override
    public void notifyPeerJoined(String roomId, WebSocketSession joiner) {
        Set<WebSocketSession> sessions = rooms.get(roomId);
        if (sessions == null) return;

        String message = "{\"type\":\"peer-joined\"}";
        for (WebSocketSession session : sessions) {
            if (session != joiner && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    log.error("Failed to notify peer-joined to session {}", session.getId(), e);
                }
            }
        }
    }

    @Override
    public void notifyPeerLeft(String roomId, WebSocketSession leaver) {
        Set<WebSocketSession> sessions = rooms.get(roomId);
        if (sessions == null) return;

        String message = "{\"type\":\"peer-left\"}";
        for (WebSocketSession session : sessions) {
            if (session != leaver && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    log.error("Failed to notify peer-left to session {}", session.getId(), e);
                }
            }
        }
    }

    @Override
    public void forceDisconnectAll(String roomId) {
        Set<WebSocketSession> sessions = rooms.remove(roomId);
        if (sessions == null) return;

        String message = "{\"type\":\"force-disconnect\"}";
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                    session.close();
                } catch (IOException e) {
                    log.error("Failed to force-disconnect session {}", session.getId(), e);
                }
            }
        }
    }
}
