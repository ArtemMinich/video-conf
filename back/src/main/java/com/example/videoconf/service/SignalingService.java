package com.example.videoconf.service;

import org.springframework.web.socket.WebSocketSession;

public interface SignalingService {

    void addSession(String roomId, WebSocketSession session);

    void removeSession(String roomId, WebSocketSession session);

    void relay(String roomId, WebSocketSession sender, String message);

    void notifyPeerJoined(String roomId, WebSocketSession joiner);

    void notifyPeerLeft(String roomId, WebSocketSession leaver);

    void forceDisconnectAll(String roomId);
}
