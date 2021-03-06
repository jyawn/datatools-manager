package com.conveyal.datatools.manager.models;

import com.conveyal.datatools.manager.persistence.DataStore;

import java.util.Collection;

/**
 * Created by demory on 3/30/16.
 */
public class ExternalFeedSourceProperty extends Model {
    private static final long serialVersionUID = 1L;

    private static DataStore<ExternalFeedSourceProperty> propertyStore = new DataStore<>("externalFeedSourceProperties");

    private FeedSource feedSource;

    public ExternalFeedSourceProperty(FeedSource feedSource, String resourceType, String name, String value) {
        this.id = feedSource.id + "_" + resourceType + "_" + name;
        this.feedSource = feedSource;
        this.resourceType = resourceType;
        this.name = name;
        this.value = value;
    }

    public String getFeedSourceId() {
        return feedSource.id;
    }

    public String resourceType;

    public String name;

    public String value;

    public void save () {
        save(true);
    }

    public void save (boolean commit) {
        if (commit)
            propertyStore.save(id, this);
        else
            propertyStore.saveWithoutCommit(id, this);
    }

    public static ExternalFeedSourceProperty find(FeedSource source, String resourceType, String name) {
        return propertyStore.getById(source.id + "_" +resourceType + "_" + name);
    }

    public static ExternalFeedSourceProperty updateOrCreate(FeedSource source, String resourceType, String name, String value) {
        ExternalFeedSourceProperty prop =
                ExternalFeedSourceProperty.find(source, resourceType, name);

        if(prop == null) {
            prop = new ExternalFeedSourceProperty(source, resourceType, name, value);
        }
        else prop.value = value;

        prop.save();

        return prop;
    }

    public static Collection<ExternalFeedSourceProperty> getAll () {
        return propertyStore.getAll();
    }

    public void delete() {
        propertyStore.delete(this.id);
    }

}
