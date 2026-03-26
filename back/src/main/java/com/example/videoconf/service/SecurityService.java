package com.example.videoconf.service;

import java.util.List;

public interface SecurityService {

    String getUsername();

    String getEmail();

    String getFirstName();

    String getLastName();

    List<String> getRoles();

    boolean isAdmin();
}
