package com.conveyal.datatools.manager.controllers.api;

import com.conveyal.datatools.manager.DataManager;

/**
 * Created by landon on 4/12/16.
 */
public class ServiceAlertsController {

    public static void register(String apiPrefix) {
        String extensionType = DataManager.config.get("modules").get("alerts").get("use_extension").asText();

        // set up as extension
        if (extensionType != null) {

        }
        // set up with service alerts controller routes
        else {

        }
    }
}
