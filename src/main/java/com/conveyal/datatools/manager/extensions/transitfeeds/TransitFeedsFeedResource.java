package com.conveyal.datatools.manager.extensions.transitfeeds;

import com.conveyal.datatools.manager.DataManager;
import com.conveyal.datatools.manager.extensions.ExternalFeedResource;
import com.conveyal.datatools.manager.models.ExternalFeedSourceProperty;
import com.conveyal.datatools.manager.models.FeedSource;
import com.conveyal.datatools.manager.models.FeedVersion;
import com.conveyal.datatools.manager.models.Project;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

/**
 * Created by demory on 3/31/16.
 */
public class TransitFeedsFeedResource implements ExternalFeedResource {

    public static final Logger LOG = LoggerFactory.getLogger(TransitFeedsFeedResource.class);

    private String api, apiKey;

    public TransitFeedsFeedResource () {
        api = DataManager.config.get("extensions").get("transitfeeds").get("api").asText();
        apiKey = DataManager.config.get("extensions").get("transitfeeds").get("key").asText();
    }

    @Override
    public String getResourceType() {
        return "TRANSITFEEDS";
    }

    @Override
    public void importFeedsForProject(Project project, String authHeader) {
        LOG.info("Importing feeds from TransitFeeds");

        URL url;
        ObjectMapper mapper = new ObjectMapper();
        // multiple pages for transitfeeds because of 100 feed limit per page
        Boolean nextPage = true;
        int count = 1;

        do {
            try {
                url = new URL(api + "?key=" + apiKey + "&limit=100" + "&page=" + String.valueOf(count));
            } catch (MalformedURLException ex) {
                LOG.error("Could not construct URL for TransitFeeds API");
                return;
            }


            StringBuffer response = new StringBuffer();

            try {
                HttpURLConnection con = (HttpURLConnection) url.openConnection();

                // optional default is GET
                con.setRequestMethod("GET");

                //add request header
                con.setRequestProperty("User-Agent", "User-Agent");

                int responseCode = con.getResponseCode();
                System.out.println("\nSending 'GET' request to URL : " + url);
                System.out.println("Response Code : " + responseCode);

                BufferedReader in = new BufferedReader(
                        new InputStreamReader(con.getInputStream()));
                String inputLine;

                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
                in.close();
            } catch (IOException ex) {
                LOG.error("Could not read from Transit Feeds API");
                return;
            }

            String json = response.toString();
            JsonNode transitFeedNode = null;
            try {
                transitFeedNode = mapper.readTree(json);
            } catch (IOException ex) {
                LOG.error("Error parsing TransitFeeds JSON response");
                return;
            }

            for (JsonNode feed : transitFeedNode.get("results").get("feeds")) {

                // test that feed is in fact GTFS
                if (!feed.get("t").asText().contains("GTFS")){
                    continue;
                }

                // test that feed falls in bounding box (if box exists)
                if (project.north != null) {
                    Double lat = feed.get("l").get("lat").asDouble();
                    Double lng = feed.get("l").get("lng").asDouble();
                    if (lat < project.south || lat > project.north || lng < project.west || lng > project.east) {
                        continue;
                    }
                }

                FeedSource source = null;
                String tfId = feed.get("id").asText();

                // check if a feed already exists with this id
                for (FeedSource existingSource : project.getProjectFeedSources()) {
                    ExternalFeedSourceProperty idProp =
                            ExternalFeedSourceProperty.find(existingSource, this.getResourceType(), "id");
                    if (idProp != null && idProp.value.equals(tfId)) {
                        source = existingSource;
                    }
                }

                String feedName;
                feedName = feed.get("t").asText();

                if (source == null) source = new FeedSource(feedName);
                else source.name = feedName;

                source.retrievalMethod = FeedSource.FeedRetrievalMethod.FETCHED_AUTOMATICALLY;
                source.setName(feedName);
                System.out.println(source.name);

                try {
                    if (feed.get("u") != null) {
                        if (feed.get("u").get("d") != null) {
                            source.url = new URL(feed.get("u").get("d").asText());
                        } else if (feed.get("u").get("i") != null) {
                            source.url = new URL(feed.get("u").get("i").asText());
                        }
                    }
                } catch (MalformedURLException ex) {
                    LOG.error("Error constructing URLs from TransitFeeds API response");
                }

                source.setProject(project);
                source.save();

                // create/update the external props
                ExternalFeedSourceProperty.updateOrCreate(source, this.getResourceType(), "id", tfId);

            }
            if (transitFeedNode.get("results").get("page") == transitFeedNode.get("results").get("numPages")){
                LOG.info("finished last page of transitfeeds");
                nextPage = false;
            }
            count++;
        } while(nextPage);
    }

    @Override
    public void feedSourceCreated(FeedSource source, String authHeader) {

    }

    @Override
    public void propertyUpdated(ExternalFeedSourceProperty property, String previousValue, String authHeader) {

    }

    @Override
    public void feedVersionCreated(FeedVersion feedVersion, String authHeader) {

    }
}
