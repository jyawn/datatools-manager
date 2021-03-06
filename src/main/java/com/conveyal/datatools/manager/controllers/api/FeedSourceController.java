package com.conveyal.datatools.manager.controllers.api;

import com.conveyal.datatools.manager.DataManager;
import com.conveyal.datatools.manager.auth.Auth0UserProfile;
import com.conveyal.datatools.manager.jobs.FetchSingleFeedJob;
import com.conveyal.datatools.manager.jobs.NotifyUsersForSubscriptionJob;
import com.conveyal.datatools.manager.models.*;
import com.conveyal.datatools.manager.utils.json.JsonManager;
import com.conveyal.datatools.manager.utils.json.JsonUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import spark.Request;
import spark.Response;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.*;

import static com.conveyal.datatools.manager.auth.Auth0Users.getUserById;
import static spark.Spark.*;

/**
 * Created by demory on 3/21/16.
 */

public class FeedSourceController {

    public static JsonManager<FeedSource> json =
            new JsonManager<>(FeedSource.class, JsonViews.UserInterface.class);
    private static ObjectMapper mapper = new ObjectMapper();
    public static FeedSource getFeedSource(Request req, Response res) {
        String id = req.params("id");
        Boolean publicFilter = req.pathInfo().contains("public");
        FeedSource fs = FeedSource.get(id);
        if (fs == null) {
            halt(404, null);
        }
        if (publicFilter && !fs.isPublic) {
            halt(503);
        }
        return fs;
    }

    public static Collection<FeedSource> getAllFeedSources(Request req, Response res) {
        Collection<FeedSource> sources = new ArrayList<>();
        Auth0UserProfile requestingUser = req.attribute("user");
        System.out.println(requestingUser.getEmail());
        String projectId = req.queryParams("projectId");
        Boolean publicFilter = req.pathInfo().contains("public");
        String userId = req.queryParams("userId");

        if (projectId != null) {
            for (FeedSource source: FeedSource.getAll()) {
                if (
                    source != null && source.projectId != null && source.projectId.equals(projectId)
                    && requestingUser != null && (requestingUser.canManageFeed(source.projectId, source.id) || requestingUser.canViewFeed(source.projectId, source.id))
                ) {
                    // if requesting public sources and source is not public; skip source
                    if (publicFilter && !source.isPublic)
                        continue;
                    sources.add(source);
                }
            }
        }
        // request feed sources a specified user has permissions for
        else if (userId != null) {
            Auth0UserProfile user = getUserById(userId);
            if (user == null) return sources;

            for (FeedSource source: FeedSource.getAll()) {
                if (
                    source != null && source.projectId != null &&
                    (user.canManageFeed(source.projectId, source.id) || user.canViewFeed(source.projectId, source.id))
                ) {

                    sources.add(source);
                }
            }
        }
        // request feed sources that are public
        else {
            for (FeedSource source: FeedSource.getAll()) {
                // if user is logged in and cannot view feed; skip source
                if ((requestingUser != null && !requestingUser.canManageFeed(source.projectId, source.id) && !requestingUser.canViewFeed(source.projectId, source.id)))
                    continue;

                // if requesting public sources and source is not public; skip source
                if (publicFilter && !source.isPublic)
                    continue;
                sources.add(source);
            }
        }

        return sources;
    }

    public static FeedSource createFeedSource(Request req, Response res) throws IOException {
        FeedSource source;
        /*if (req.queryParams("type") != null){
            //FeedSource.FeedSourceType type = FeedSource.FeedSourceType.TRANSITLAND;
            source = new FeedSource("onestop-id");
            applyJsonToFeedSource(source, req.body());
            source.save();

            return source;
        }
        else {
            source = new FeedSource();

        }*/

        source = new FeedSource();

        applyJsonToFeedSource(source, req.body());
        source.save();

        for(String resourceType : DataManager.feedResources.keySet()) {
            DataManager.feedResources.get(resourceType).feedSourceCreated(source, req.headers("Authorization"));
        }

        return source;
    }

    public static FeedSource updateFeedSource(Request req, Response res) throws IOException {
        String id = req.params("id");
        FeedSource source = FeedSource.get(id);
        if (source == null) {
            halt(404);
        }

        applyJsonToFeedSource(source, req.body());
        source.save();

        // notify users after successful save
        NotifyUsersForSubscriptionJob notifyFeedJob = new NotifyUsersForSubscriptionJob("feed-updated", id, "Feed property updated for " + source.name);
        Thread notifyThread = new Thread(notifyFeedJob);
        notifyThread.start();

        NotifyUsersForSubscriptionJob notifyProjectJob = new NotifyUsersForSubscriptionJob("project-updated", source.projectId, "Project updated (feed source property for " + source.name + ")");
        Thread notifyProjectThread = new Thread(notifyProjectJob);
        notifyProjectThread.start();

        return source;
    }

    public static void applyJsonToFeedSource(FeedSource source, String json) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(json);
        Iterator<Map.Entry<String, JsonNode>> fieldsIter = node.fields();
        while (fieldsIter.hasNext()) {
            Map.Entry<String, JsonNode> entry = fieldsIter.next();

            if(entry.getKey().equals("projectId")) {
                System.out.println("setting fs project");
                source.setProject(Project.get(entry.getValue().asText()));
            }

            if(entry.getKey().equals("name")) {
                source.name = entry.getValue().asText();
            }

            if(entry.getKey().equals("url")) {
                String url = entry.getValue().asText();
                try {
                    source.url = new URL(url);

                    // reset the last fetched date so it can be fetched again
                    source.lastFetched = null;

                } catch (MalformedURLException e) {
                    halt(400, "URL '" + url + "' not valid.");
                }

            }

            if(entry.getKey().equals("retrievalMethod")) {
                source.retrievalMethod = FeedSource.FeedRetrievalMethod.FETCHED_AUTOMATICALLY.valueOf(entry.getValue().asText());
            }

            if(entry.getKey().equals("snapshotVersion")) {
                source.snapshotVersion = entry.getValue().asText();
            }

            if(entry.getKey().equals("isPublic")) {
                source.isPublic = entry.getValue().asBoolean();
            }

            if(entry.getKey().equals("deployable")) {
                source.deployable = entry.getValue().asBoolean();
            }

        }
    }

    public static FeedSource updateExternalFeedResource(Request req, Response res) throws IOException {
        String id = req.params("id");
        FeedSource source = FeedSource.get(id);
        String resourceType = req.queryParams("resourceType");
        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(req.body());
        Iterator<Map.Entry<String, JsonNode>> fieldsIter = node.fields();

        while (fieldsIter.hasNext()) {
            Map.Entry<String, JsonNode> entry = fieldsIter.next();
            ExternalFeedSourceProperty prop =
                    ExternalFeedSourceProperty.find(source, resourceType, entry.getKey());

            if (prop != null) {
                // update the property in our DB
                String previousValue = prop.value;
                prop.value = entry.getValue().asText();
                prop.save();

                // trigger an event on the external resource
                if(DataManager.feedResources.containsKey(resourceType)) {
                    DataManager.feedResources.get(resourceType).propertyUpdated(prop, previousValue, req.headers("Authorization"));
                }

            }

        }

        return source;
    }

    public static FeedSource deleteFeedSource(Request req, Response res) {
        String id = req.params("id");
        FeedSource source = FeedSource.get(id);

        if (source != null) {
            source.delete();
            return source;
        }
        else {
            halt(404);
            return null;
        }
    }

    /**
     * Refetch this feed
     * @throws JsonProcessingException
     */
    public static FeedVersion fetch (Request req, Response res) throws JsonProcessingException {
        Auth0UserProfile userProfile = req.attribute("user");
        FeedSource s = FeedSource.get(req.params("id"));

        System.out.println("fetching feed for source "+ s.name);
        // ways to have permission to do this:
        // 1) be an admin
        // 2) have access to this feed through project permissions
        // if all fail, the user cannot do this.

        if (!userProfile.canAdministerProject(s.projectId) && !userProfile.canManageFeed(s.projectId, s.id))
            halt(401);

        FetchSingleFeedJob job = new FetchSingleFeedJob(s, userProfile.getUser_id());
        job.run();
//        if (job.getStatus().error) {
//            halt(304);
//        }
        return job.result;
//        return true;
    }

//    /**
//     * The current status of a deployment, polled to update the progress dialog.
//     * @throws JsonProcessingException
//     */
//    public static Object fetchFeedStatus (Request req, Response res) throws JsonProcessingException {
//        // this is not access-controlled beyond requiring auth, which is fine
//        // there's no good way to know who should be able to see this.
//        String id = req.params("id");
//        fetchJobsByFeed.forEach((s, deployJob) -> System.out.println(s));
//        if (!fetchJobsByFeed.containsKey(id))
//            halt(404, "Feed source id '"+id+"' not found");
//
//        FetchSingleFeedJob j = fetchJobsByFeed.get(id);
//
//        if (j == null)
//            halt(404, "No active job for " + id + " found");
//
//        return j.getStatus();
//    }

    public static void register (String apiPrefix) {
        get(apiPrefix + "secure/feedsource/:id", FeedSourceController::getFeedSource, json::write);
        options(apiPrefix + "secure/feedsource", (q, s) -> "");
//        get(apiPrefix + "secure/feedsource/:id/status", FeedSourceController::fetchFeedStatus, json::write);
        get(apiPrefix + "secure/feedsource", FeedSourceController::getAllFeedSources, json::write);
        post(apiPrefix + "secure/feedsource", FeedSourceController::createFeedSource, json::write);
        put(apiPrefix + "secure/feedsource/:id", FeedSourceController::updateFeedSource, json::write);
        put(apiPrefix + "secure/feedsource/:id/updateExternal", FeedSourceController::updateExternalFeedResource, json::write);
        delete(apiPrefix + "secure/feedsource/:id", FeedSourceController::deleteFeedSource, json::write);
        post(apiPrefix + "secure/feedsource/:id/fetch", FeedSourceController::fetch, JsonUtil.objectMapper::writeValueAsString);

        // Public routes
        get(apiPrefix + "public/feedsource/:id", FeedSourceController::getFeedSource, json::write);
        get(apiPrefix + "public/feedsource", FeedSourceController::getAllFeedSources, json::write);
    }
}