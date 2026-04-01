package com.example.videoconf.service;

import com.example.videoconf.model.User;

import java.util.List;

public interface SecurityService {

    String getUsername();

    List<String> getRoles();

    User getCurrentUser();

    boolean isAdmin();
}
