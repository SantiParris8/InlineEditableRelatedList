public with sharing class GenericRelatedListController {
    @AuraEnabled(cacheable=true)
    public static List<sObject> getRelatedListRecords(String parentRecordId, String relationshipField, String childObjectApiName, List<String> fieldsToDisplay, String filter) {
        // Build the query string
        system.debug(parentRecordId + relationshipField + childObjectApiName + fieldsToDisplay);
        String queryString = 'SELECT id,';
        for (String field : fieldsToDisplay) {
            queryString += field + ', ';
        }
        queryString = queryString.substring(0, queryString.length() - 2);
        queryString += ' FROM ' + childObjectApiName + ' WHERE ' + relationshipField + ' = \'' + parentRecordId + '\'';
        if(filter != null && filter != ''){
            querystring += ' AND ' + filter;
        }
system.debug(queryString);
        // Execute the query
        return Database.query(queryString);
    }

    @AuraEnabled(cacheable=true)
    public static List<String> getPicklistValues(String childObjectApiName, String fieldApiName) {
        List<String> picklistValues = new List<String>();

        // Get the picklist field describe result
        Schema.DescribeFieldResult fieldResult = Schema.getGlobalDescribe().get(childObjectApiName).getDescribe().fields.getMap().get(fieldApiName).getDescribe();


            Schema.PicklistEntry[] entries = fieldResult.getPicklistValues();
            for (Schema.PicklistEntry entry : entries) {
                picklistValues.add(entry.getValue());
            }
        system.debug(picklistValues);

        return picklistValues;
    }

        @AuraEnabled(cacheable=true)
    public static Map<String, String> getFieldTypes(String objectApiName, String fields) {
    List<String> fieldNames = fields.split(',');    
    Map<String, String> fieldTypes = new Map<String, String>();
    String query = 'SELECT ' + fields + ' FROM ' + objectApiName + ' LIMIT 1';
    SObject record = Database.query(query);
    Schema.DescribeSObjectResult describeResult = record.getSObjectType().getDescribe();
    Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
    for (String fieldName : fieldNames) {
        Schema.DescribeFieldResult fieldResult = fieldMap.get(fieldName).getDescribe();
        fieldTypes.put(fieldName, String.valueOf(fieldResult.getType()));
    }
    System.debug(fieldTypes);
    return fieldTypes;
}


@AuraEnabled(cacheable=true)
public static Map<String, Object> getFieldTypesWithOptions(String objectApiName, String fields) {
    List<String> fieldNames = fields.split(',');    
    Map<String, Object> result = new Map<String, Object>();
    List<Object> fieldList = new List<Object>();
    String query = 'SELECT ' + fields + ' FROM ' + objectApiName + ' LIMIT 1';
    SObject record = Database.query(query);
    Schema.DescribeSObjectResult describeResult = record.getSObjectType().getDescribe();
    Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
    for (String fieldName : fieldNames) {
        Schema.DescribeFieldResult fieldResult = fieldMap.get(fieldName).getDescribe();
        Map<String, Object> fieldInfo = new Map<String, Object>();
        fieldInfo.put('fieldName', fieldName);
        fieldInfo.put('fieldLabel', fieldResult.getLabel());
        fieldInfo.put('fieldEditable', fieldResult.isUpdateable());
        fieldInfo.put('fieldType', String.valueOf(fieldResult.getType()));
        if (fieldResult.getType() == Schema.DisplayType.PICKLIST) {
            List<String> picklistValues = getPicklistValues(objectApiName, fieldName);
            fieldInfo.put('fieldOptions', picklistValues);
        }
        fieldList.add(fieldInfo);
    }
    result.put('fields', fieldList);
    system.debug('HEREEEE');
    System.debug(result);
    return result;
}


}