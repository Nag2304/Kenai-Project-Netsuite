/**
* SuiteScript 2.0 Utility Functions.js
* @NApiVersion 2.x
* @NModuleScope Public
*
* Script:
* Author           Date              Details
* SH             2019.11.18    CMP 03357500 - Added throwCrossScriptError to handle error handling for different script types
* Thridhara      2020.12.09    CMP 03847035 - Added isNotEmpty and forceParseFloat functions.
* Thridhara      2021.03.16    CMP 03735878 - Added isDeploymentRunning function.
* Thridhara      2021.10.22    CMP 04106408 - Added syncedWithSite function.
* nagendrababu   2022.06.30    CMP 04902698 - Added functions from common functions for the hmk_MR_expireAuthorizations.js
* nagendrababu   2022.10.17    CMP 05086064 - Added function (getItemRecordList,getSufficientLocation) from DWR Purchasing Server Side Scripts.js
* nagendrababu   2022.11.25    CMP 05198095 - Added function CheckForWarningShippingState used for SO approval.
* nagendrababu   2022.12.09    CMP 05192708 - Added functions related to regularStatusValidation,  quotableStatusValidation, &  readyStatusValidation.
* nagendrababu   2023.01.11    CMP 05192708 - Removed throw statement.
* nagendrababu   2023.01.30    CMP 05193120 - Added functions from DWR Common Item Functions createupc and getupccheckdigit
* Added getBooleanValue function
*/

/* global define,log */

define(['N/search', 'N/record', 'N/file', 'N/https', 'N/xml','N/runtime'], function (search, record, file, http, xml,runtime) {
    var paymentResult = {
        result: null,
        authCode: null,
        pnRef: null,
        errMsg: null,
        balance: null,
        errCode: null,
        corrId: null,
        request: null,
    };

    function isEmpty(obj) {
        return (
            obj === '' || obj === [] || obj === null || obj === 'undefined' || typeof obj === 'undefined'
        );
    }

    function isNotEmpty(val) {
        return !isEmpty(val);
    }

    function forceParseFloat(stValue) {
        return (isNaN(parseFloat(stValue)) ? 0.00 : parseFloat(stValue));
    }

    function getBooleanValue(stValue) {
        if ((stValue == '') || (stValue == null) || (stValue == undefined) || (stValue == 0)) {
            return false;
        }
        else if ((stValue == 'Y') || (stValue == 'T') || (stValue == 'true') || stValue) {
            return true;
        }
        return false;
    }

    function toTitleCase(str) {
        str = str.split(' ');
        for (var i = 0; i < str.length; i++) {
            if (str[i] !== str[i].toUpperCase()) {
                str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1).toLowerCase();
            }
        }
        return str.join(' ');
    }

    function getAllSearchResults(
        stRecordType,
        stSavedSearch,
        arrFilters,
        arrColumns
    ) {
        var arrResult = [];
        var searchResults;
        if (stSavedSearch) {
            searchResults = search.load({
                id: stSavedSearch,
                type: stRecordType
            });
            for (var i = 0; arrColumns != null && i < arrColumns.length; i++) {
                searchResults.columns.push(arrColumns[i]);
            }
            for (var i = 0; arrFilters != null && i < arrFilters.length; i++) {
                searchResults.filters.push(arrFilters[i]);
            }
        } else {
            searchResults = search.create({
                type: stRecordType,
                columns: arrColumns,
                filters: arrFilters
            });
        }

        var count = 1000;
        var init = true;
        var min = 0;
        var max = 1000;

        while (count === 1000 || init) {
            var resultSet = searchResults.run().getRange({
                start: min,
                end: max
            });

            arrResult = arrResult.concat(resultSet);
            min = max;
            max += 1000;

            init = false;
            count = resultSet.length;
        }

        return arrResult;
    }

    function sleep(milliseconds) {
        var start = new Date().getTime();
        var sum = 0;
        for (var i = 0; i < 1e9; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                log.debug('sleep', 'Sleep completed successfully.')
                break;
            }
            // calculate Pi
            var mult = (i % 2 === 0) ? 1 : -1; // -1^i
            sum += mult * (1 / (2 * i + 1));
        }
    }

    function containsObject(obj, list) {
        var i
        for (i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return true
            }
        }

        return false
    }

    /**
     *  Used to get the values and text from list record fields, specifically used to get values back from records that don't follow the typical text/id number format (i.e. Netsuite Native fields that use Country enum list)
     * @param {string} recordType Netsuite enum record type
     * @param {string} recordField Netsuite field to get the selections from
     * @param {string} recordValue If we are looking for a specific value on a record, filter by that name (optional)
     * @param {string} filterOperator Netsuite enum for operator to filer by (i.e. startswith, is) (optional)
     * @returns {Array}
     */
    function getSelectionsFromField(recordType, recordField, recordValue, filterOperator) {
        // loads record to get field selections, needs to be dynamic to use getSelectOptions method from field
        var recordObj = record.create({
            type: recordType,
            isDynamic: true
        })

        var objField = recordObj.getField({
            fieldId: recordField
        })

        // if there is a record value to filter by then return object with filter, otherwise return all selection values
        var options = recordValue ? objField.getSelectOptions({ filter: recordValue, operator: filterOperator }) : objField.getSelectOptions()

        return options

    }

    /**
     *  More robust version of default 2.0 search
     * @param {*} type An enumeration that holds the string values for search types supported in the N/search Module (i.e search.Type.CUSTOMER)
     * @param {*} savedSearchID (optional) This is the id of a saved search is a saved search is being used
     * @param {*} filters
     * @param {*} columns
     */
    function fullSearch(type, savedSearchID, filters, columns) {
        var totalResults = []
        var searchObj = null

        // checks if loading a saved search or creating a new search
        if (savedSearchID == null) {
            searchObj = search.create({
                type: type,
                columns: columns,
                filters: filters
            })
        } else {
            searchObj = search.load({
                type: type,
                id: savedSearchID
            })

            // if filters exist, add them to the search object
            if (filters) {
                searchObj.filters.push(filters)
            }

            columns = searchObj.columns
        }

        log.debug('searchObj:', searchObj)

        // Use 2.0 Paged Search functionality to handle more than 4000 results
        var pagedData = searchObj.runPaged()
        pagedData.pageRanges.forEach(function (pageRange) {
            // For each page of results
            var page = pagedData.fetch({
                index: pageRange.index
            })
            page.data.forEach(function (result) {
                var resultData = {
                    id: result.id,
                    type: result.recordType
                }
                columns.forEach(function (column) {
                    // Build getValue/getText object
                    var getObj = {
                        name: column.name
                    }
                    // If summary exists, add to object
                    if (column.summary) {
                        getObj.summary = column.summary
                    }

                    // If summary exists, add to object
                    if (column.join) {
                        getObj.join = column.join
                    }

                    // Get data for both value and text
                    var resultValue = result.getValue(getObj)
                    var resultText = result.getText(getObj)

                    // handling string true/false
                    if (resultValue === 'T') {
                        resultValue = true
                    } else if (resultValue === 'F') {
                        resultValue = false
                    }
                    if (typeof resultValue === 'string' && resultValue.indexOf('more..') > -1) {
                        resultValue = search.lookupFields({
                            type: type,
                            id: result.id,
                            columns: [column.name]
                        })[column.name]
                    }

                    resultData[column.name] = {
                        value: resultValue,
                        text: resultText
                    }
                })
                totalResults.push(resultData);
            })
        })
        return totalResults
    }

    /**
    * Provides a way of flattening nested child objects - only goes one level right now
    * @param {Object} itemObj Object that needs flattening
    * @param {Array} keysToFlatten Array of keys that need to be flattened
    * @returns {}
    */
    function flattenObjChildren(itemObj, keysToFlatten) {
        keysToFlatten.forEach(function (key) {
            for (var itemKey in itemObj[key]) {
                itemObj[itemKey] = itemObj[key][itemKey]
            }
        })

        return itemObj
    }

    /**
     * Netsuite returns lists and some fields in an object with a 'value' key and a 'text' key.
     * This function takes an array of these objects and a text string specifying the property to
     * return an array of.
     * @param {array} arrayKeyValuePairs - Array of objects that contain the keys 'value' and 'text'.
     * @param {string} propertyToUse - Property to use when creating an array.
     */
    function convertObjArrToPropArr(arrayKeyValuePairs, propertyToUse) {
        log.debug('convertObjArrToPropArr', 'start');
        // if the parameter is empty return empty array indicating there are no values.
        if (isEmpty(arrayKeyValuePairs)) return [];

        var propArray = [];
        //loop over array of objects and add the specified property to the propArray.
        for (var i = 0; i < arrayKeyValuePairs.length; i++) {
            var obj = arrayKeyValuePairs[i];
            propArray.push(obj[propertyToUse]);
        }

        log.debug('convertObjArrToPropArr propArray', JSON.stringify(propArray));

        return propArray;
    }

    /**
    * A function that throws an error or an alert message depending on the script type ('Client' -> Cient Script, 'User Event' -> User Event Script)
    * @param {String} errorString String to return in error message
    * @param {String} scripttype String of the type of script used ('Client -> Client Script, 'User Event' -> User Event Script)
    * @returns {}
    */
    function createErrorOrAlert(errorString, scriptType) {
        var isClientScript = scriptType === 'Client'
        if (isClientScript) {
            alert(errorString)
            return false
        } else {
            throw errorString
        }
    }

    function timeZoneOffset() {
        var jun = new Date(this.getFullYear(), 0, 1)
        var jul = new Date(this.getFullYear(), 6, 1)
        return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
    }
    // function to check if sync with site should be set to true based on if any item within the style has the syncwith site set to true
    function syncedWithSite(styleId, syncWithFieldId, siteName) {
        var syncWithSite = false;
        var siteSearchObj = search.create({
            type: "item",
            filters:
                [
                    ["custitem_dwr_item_style", "anyof", styleId],
                    "AND",
                    [syncWithFieldId, "is", "T"]
                ],
            columns:
                [
                    search.createColumn({
                        name: "internalid",
                        summary: "COUNT",
                        label: "Internal ID"
                    })
                ]
        });
        siteSearchObj.run().each(function (result) {
            var siteCount = result.getValue({
                name: "internalid",
                summary: "COUNT"
            });
            if (siteCount > 0) {
                syncWithSite = true;
            }
            return true;
        });
        return syncWithSite;
    }

    /**
     * Matches a search column to a name or label.
     * 
     * @param {array} options.columns - array of columns from a N/search object.
     * @param {string} options.name - name or label of a column that matches the name or label in N/search object.
     * @returns - column object.
     */
    function getColumn(options) {
        var columns = options.columns;
        var name = options.name
        var column = null;

        for (var i = 0; i < columns.length; i++) {
            if (columns[i].name == name) {
                column = columns[i];
                break;
            }
            else if (columns[i].label == name) {
                column = columns[i];
            }
        }

        return column;
    }

    /*
        Retrieves the CSV record based on the folder ID
        {params} int folderId internalid of the folder in Netsuite to search
        {returns} object of the csv record
        */
    function getCSVRecords(folderId) {
        var strLoggerTitle = 'getCSVRecords';
        var filters = new Array();
        var csvRecords = [];

        var folderInternalID = folderId;

        //search the CSV folder
        filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.IS,
            values: folderInternalID
        }));

        //return the file name and the file internal ID to be processed
        var columns = new Array();
        columns[0] = search.createColumn({
            name: 'name',
            join: 'file'
        });
        columns[1] = search.createColumn({
            name: 'internalid',
            join: 'file'
        });
        log.debug(strLoggerTitle, 'search folder')
        var results = getAllSearchResults('folder', null, filters, columns);

        //there should only be one file in the folder to process
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var fileName = results[i].getValue(columns[0]);
                var internalID = results[i].getValue(columns[1]);
                csvRecords = processCSV(fileName, internalID);
                log.debug(strLoggerTitle, 'results length' + results.length)

            }

        }
        return csvRecords;

    }

    /*
      Load the file from the File Cabinet folder
      {param} string fileName name of the file to be processed
      {param} int internalID internalid of the file to be processed
      */
    function processCSV(fileName, internalID) {

        var strLoggerTitle = "processCSV";
        log.debug(strLoggerTitle, 'Loading File: ' + fileName)
        //loads the file
        var fileObj = file.load({
            id: internalID
        });
        var content = fileObj.getContents();
        var lines = content.split("\n");
        log.debug(strLoggerTitle, 'lines length: ' + lines.length)


        var result = [];

        //gets the headers column names to be used as properties further down
        var headers = lines[0].split(",");

        for (var i = 1; i < lines.length; i++) {

            var obj = {};
            var currentline = lines[i].split(",");

            for (var j = 0; j < headers.length; j++) {
                //sets the values from the line and assigns the value to the property it is tied with
                obj[headers[j]] = currentline[j];
            }

            result.push(obj);

        }



        return result;

    }

    // this checks if the deployment is already running.
    function isDeploymentRunning(ssScriptId, deploymentId) {
        log.debug("Is Deployment Running? Deployment ID", deploymentId);
        // search for checking deployment instances.
        var scheduledscriptinstanceSearchObj = search.create({
            type: "scheduledscriptinstance",
            filters:
                [
                    ["status", "anyof", "PENDING", "PROCESSING", "RESTART", "RETRY"],
                    "AND",
                    ["script.scriptid", "is", ssScriptId],
                    "AND",
                    ["scriptdeployment.scriptid", "is", deploymentId]
                ],
            columns:
                [
                    search.createColumn({
                        name: "scriptid",
                        join: "scriptDeployment",
                        label: "Custom ID"
                    })
                ]
        });
        var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
        log.debug("scheduledscriptinstanceSearchObj result count", searchResultCount);
        log.debug("Is Deployment Running?", searchResultCount > 0);
        if (searchResultCount > 0) return true;
        return false;
    }

    var firstBy = (function () {

        function identity(v) { return v; }

        function ignoreCase(v) { return typeof (v) === "string" ? v.toLowerCase() : v; }

        function makeCompareFunction(f, opt) {
            opt = typeof (opt) === "number" ? { direction: opt } : opt || {};
            if (typeof (f) != "function") {
                var prop = f;
                // make unary function
                f = function (v1) { return !!v1[prop] ? v1[prop] : ""; }
            }
            if (f.length === 1) {
                // f is a unary function mapping a single item to its sort score
                var uf = f;
                var preprocess = opt.ignoreCase ? ignoreCase : identity;
                var cmp = opt.cmp || function (v1, v2) { return v1 < v2 ? -1 : v1 > v2 ? 1 : 0; }
                f = function (v1, v2) { return cmp(preprocess(uf(v1)), preprocess(uf(v2))); }
            }
            if (opt.direction === -1) return function (v1, v2) { return -f(v1, v2) };
            return f;
        }

        /* adds a secondary compare function to the target function (`this` context)
           which is applied in case the first one returns 0 (equal)
           returns a new compare function, which has a `thenBy` method as well */
        function tb(func, opt) {
            /* should get value false for the first call. This can be done by calling the 
            exported function, or the firstBy property on it (for es6 module compatibility)
            */
            var x = (typeof (this) == "function" && !this.firstBy) ? this : false;
            var y = makeCompareFunction(func, opt);
            var f = x ? function (a, b) {
                return x(a, b) || y(a, b);
            }
                : y;
            f.thenBy = tb;
            return f;
        }
        tb.firstBy = tb;
        return tb;
    })();



    /**
 *Gets the location of the Web based on the location entity.  Will only get value if isAea is true
  @param {bool} [required] isAea : if the source of the order is a Web order type
  @param {int} [required] location : internal id of the location
  @returns {int} location : internal id of the location whether the one passed in or the AEA web location
*/
    function getWebLocationforAea(isAea, location) {
        var strLoggerTitle = 'getWebLocationforAea';
        log.debug(strLoggerTitle, 'isAea:' + isAea + 'location:' + location);
        //if the source is a web order type, proceed with the logic
        if (isAea) {
            //grab the location entity from the location
            const locationEntity = search.lookupFields({
                type: search.Type.LOCATION,
                id: location,
                columns: ['custrecord_dwr_location_entity'],
            }).custrecord_dwr_location_entity[0].value;
            //search for the location entity in the AEA Mid Entity
            if (locationEntity) {
                const aeaMidLocation = search.create({
                    type: 'customrecord_dwr_aea_mid_entity',
                    filters: [['custrecord_dwr_loc_entity_aea', 'is', locationEntity]],
                    columns: [{ name: 'custrecord_dwr_location_mid_override' }],
                });

                const searchResultCount = aeaMidLocation.runPaged().count;
                //if there is a record found, then assign that location to the location to call out to the WEB MID
                if (searchResultCount) {
                    aeaMidLocation.run().each(function (result) {
                        location = result.getValue('custrecord_dwr_location_mid_override');
                        return true;
                    });
                }
            }
        }

        return location;
    }
    



    
    /** 
    * Gets the location for the MID based on the 
    * @param {object} [required] options pass in variable
                  sourceFromSO : source from Sales Order
                  location : internal id of the location
    * @returns {int} location : internal id of the location whether the one passed in or redirected location
    */
    function getLocationBasedOnSource(options) {
        log.debug(
            'getLocationBasedOnSource',
            'sourceFromSO: ' + options.sourceFromSO
        );
        log.debug(
            'getLocationBasedOnSource',
            'location: ' + options.location
        );
        try {
            if (options.sourceFromSO) {
                //search for the location entity in the AEA Mid Entity
                const aeaMidLocation = search.create({
                    type: 'customrecord_dwr_aea_mid_entity',
                    filters: [['custrecord_dwr_so_source', 'is', options.sourceFromSO]],
                    columns: [{ name: 'custrecord_dwr_location_mid_override' }],
                });
                const searchResultCount = aeaMidLocation.runPaged().count;
                //if there is a record found, then assign that location to the location to call out to the WEB MID
                if (searchResultCount) {
                    aeaMidLocation.run().each(function (result) {
                        options.location = result.getValue(
                            'custrecord_dwr_location_mid_override'
                        );
                        return true;
                    });
                }
            }
        } catch (err) {
            log.debug('System Error', err);
        }
        return options.location;
    }
    /*Creates a note for the record being passed in
     * {params} object options properties that need to be used in the 
     *  options.recordType - record internal id
     *  options.recId - internalid of the record itself
     *  options.title - the title of the note
     *  options.direction - the direction of the note 2 is outgoing, 1 is incoming
     *  options.note - the details of the user note to add
     */ 
    function createNote(options) {
        

        var strLoggerTitle = 'createNote';
        log.debug(strLoggerTitle, 'options ' + JSON.stringify(options));
        try {

            var noteRec = record.create({ type: record.Type.NOTE });
            noteRec.setValue({ fieldId: 'recordtype', value: options.recordType });
            noteRec.setValue({ fieldId: 'record', value: options.recId });
            noteRec.setValue({ fieldId: 'title', value: options.title });
            noteRec.setValue({ fieldId: 'direction', value: options.direction }); //Outgoing
            noteRec.setValue({ fieldId: 'note', value: options.note });
            noteRec.save();
        } catch (err) {
            log.error(
                strLoggerTitle,
                ' Writing Request Body failed' + err
            );

        }
    }

    function addOrderPaymentNotes(noteTitle, orderPmtID, request, response) {

        if (orderPmtID) {
            try {
                if (request != null) {

                    request = request.replace(/<urn:subscriptionID>\d{12}/, '<urn:subscriptionID>************');
                    request = request.replace(/<urn:accountNumber>\d{12}/, '<urn:accountNumber>************');
                    request = request.replace(/<urn:accountNumber>\d{12}/, '<urn:accountNumber>************');
                    //xmlDoc.documentElement.childNodes[0].childNodes[0].removeChild(xmlDoc.documentElement.childNodes[0].childNodes[0].childNodes[0])
                    //var parser = new DOMParser();
                    //var xmlDoc = parser.parseFromString(request, "text/xml");
                    //if (xmlDoc && xmlDoc.documentElement.childNodes && xmlDoc.documentElement.childNodes.length= xmlDoc.documentElement.childNodes[0])
                    //xmlDoc.documentElement.childNodes[0].childNodes[0].childNodes[1].textContent = xmlDoc.documentElement.childNodes[0].childNodes[0].childNodes[1].textContent.substring(320)
                    //request =    new XMLSerializer().serializeToString(xmlDoc.documentElement);

                    createNote({ recordType: 36, recId: orderPmtID, title: noteTitle, direction: 2, note: request });//Outgoing
                }

                if (response != null) {
                    createNote({ recordType: 36, recId: orderPmtID, title: noteTitle, direction: 1, note: response });//Incoming
                }
            } catch (ex) {

            }
        }
    }


    //
    /* ----------------- RunRequestURL - Begin ----------------- */
    /**
     *
     * @param {string} requestURL
     * @param {string} requestBody
     * @param {string} headerinfo
     * @param {string} action
     * @returns response object
     */
    function RunRequestURL(
        requestURL,
        requestBody,
        headerinfo,
        action
    ) {
        const strTitle = 'RunRequestURL';
        var retries = 2;
        var attemptsMade = 0;
        var isSuccess = false;
        var responseObject;
        var method;
        if (action === 'POST') {
            method = http.Method.POST;
        } else if (action === 'GET') {
            method = http.Method.GET;
        }
        while (attemptsMade < retries) {
            attemptsMade += 1;
            try {
                responseObject = http.request({
                    method: method,
                    url: requestURL,
                    body: requestBody,
                    headers: headerinfo,
                });
                isSuccess = true;
                retries = 0;
            } catch (err) {
                if (err.getDetails != undefined) {
                    log.error(
                        strTitle,
                        'Error with request retrying ' +
                        attemptsMade +
                        ' out of ' +
                        retries +
                        ' ' +
                        err.getCode() +
                        ':' +
                        err.getDetails()
                    );
                } else {
                    log.error(
                        strTitle,
                        'Error with request retrying ' +
                        attemptsMade +
                        ' out of ' +
                        retries +
                        ' ' +
                        err.toString()
                    );
                }
            }
        }
        if (!isSuccess) {
            responseObject = http.request({
                method: method,
                url: requestURL,
                body: requestBody,
                headers: headerinfo,
            });
        }
        return responseObject;
    }
    /* ------------------ RunRequestURL - End ------------------ */
    //

  



  

    //
    /* -------------------------- CMP 05086064 - Begin -------------------------- */
    /**
     * 
     * @param {object} poRec 
     * @returns {array} itemRecordList (array of objects)
     */
    function getItemRecordList(poRec) {
        var strLoggerTitle = 'getItemRecordList';
        log.debug(strLoggerTitle, '-------------<< Get Item Record List - Entry >>-------------');
        var itemRecordList = [];
        //
        // Retrieve PO Rec Line Count
        var itemIdArr = [];
        var itemLineCount = poRec.getLineCount({ sublistId: 'item' });
        for (var index = 0; index < itemLineCount; index++) {
            itemIdArr.push(poRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: index
            }));
        }
        //
        if (itemIdArr.length) {
            var filtersArr = [];
            filtersArr.push(search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: itemIdArr
            }));

            var columnsArr = [];
            columnsArr.push(search.createColumn({ name: 'custitem_dwr_other_gov_agency_docs' }));
            columnsArr.push(search.createColumn({ name: 'isdropshipitem' }));
            columnsArr.push(search.createColumn({ name: 'isspecialorderitem' }));
            columnsArr.push(search.createColumn({ name: 'custitem_dwr_sfdc_integration_status' }));

            var itemResults = getAllSearchResults('item', null, filtersArr, columnsArr);

            for (var index1 = 0; index1 < itemResults.length; index1++) {
                var itemRecordObj = {};
                itemRecordObj.itemId = itemResults[index1].id;
                itemRecordObj.otherGovAgencyDocs = itemResults[index1].getText('custitem_dwr_other_gov_agency_docs');
                itemRecordObj.isDropShipItem = itemResults[index1].getValue('isdropshipitem');
                itemRecordObj.isSpecialOrderItem = itemResults[index1].getValue('isspecialorderitem');
                itemRecordObj.sfdcIntegrationStatus = itemResults[index1].getValue('custitem_dwr_sfdc_integration_status');
                itemRecordList.push(itemRecordObj);
            }

            log.debug(strLoggerTitle + ' itemRecordList Array', itemRecordList);

        } else {
            log.debug(strLoggerTitle, ' ITEM ID ARRAY IS EMPTY');
        }

        //
        log.debug(strLoggerTitle, '-------------<< Get Item Record List - Exit >>-------------');
        return itemRecordList;
    }

    /**
     * 
     * @param {array} searchResults 
     * @param {number} lineQuantity 
     * @returns object
     */
    function getSufficientLocation(searchResults, lineQuantity) {
        var objReturn = {};
        objReturn.bSufficient = false;
        objReturn.sufficientLocation = null;

        for (var index = 0; index < searchResults.length; index++) {
            var result = searchResults[index];
            var inventorylocation = result.getValue('inventorylocation');
            var onhand = result.getValue('locationquantityonhand');
            var committed = result.getValue('locationquantitycommitted');
            //var available = result.getValue('locationquantityavailable');
            var available = onhand - committed;

            if ((available - lineQuantity) < 0) {
                continue;
            }
            objReturn.sufficientLocation = inventorylocation;
            objReturn.bSufficient = true;
            break;
        }
        return objReturn;

    }
    /**
     * @description Format a date that is passed in
     * @param date date object 
     * @returns date in a string format YYYY-MM-DDThh:mm:ss
     */
    function formatDate(date) {
        var month = frontPadZeroes(date.getMonth() + 1, 2);
        var hours = frontPadZeroes(date.getHours(), 2);
        var day = frontPadZeroes(date.getDate(), 2);
        var mins = frontPadZeroes(date.getMinutes(), 2);
        var secs = frontPadZeroes(date.getSeconds(), 2);

        return date.getFullYear().toString() + '-' + month + '-' + day + 'T' + hours + ':' + mins + ':' + secs;
    }
    /**
     * @description adds 0 in front of a value for formatting.  Used for minutes, days, months, hours
     * @param value value which is typically an integer
     * @param totalLength the total length required for the string
     * @returns string with the front pad zeroes if it is required
     */
    function frontPadZeroes(value, totalLength) {
        var valStr = value.toString();
        while (valStr.length < totalLength) {
            valStr = '0' + valStr;//prepend a 0 to the front of the value
        }
        return valStr;
    }

    /**
   * @description Gets the current date and send it back in format of MM/DD/YYYY
   * @returns string date with the format of MM/DD/YYYY
   */
    function getDate() {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!

        var yyyy = today.getFullYear();
        if (dd < 10) { dd = '0' + dd } if (mm < 10) { mm = '0' + mm } var today = mm + '/' + dd + '/' + yyyy;
        return today.toString();
    }

   /**
    * @description Evaluates the cybersource results returned from the calls to cybersource
    * @param doc XML document from the response from cybersource
    * @param orderPmt DWR Order payment record
    * @param isReauth boolean indicating if this is a reauthorization or not
    * @returns payResult object with the details of the result
    */
    function evalCyberSourceResult(doc, orderPmt, isReauth) { // MAtt To do
        var strLoggerTitle = 'evalCyberSourceResult';
        var payResult = paymentResult;
        var decisionNode = '/soap:Envelope/soap:Body/c:replyMessage/c:decision';
        var result = xml.XPath.select({
            node: doc,
            xpath: decisionNode
        });

        log.debug(strLoggerTitle, 'result: ' + result + 'result.length ' + result.length);
        var avsCode = xml.XPath.select({
            node: doc,
            xpath: '//c:avsCode'
        });
        var resultCode = '';
        for (var i = 0; i < result.length; i++) {
            log.debug(strLoggerTitle, 'result: ' + JSON.stringify(result[i]));
            var info = result[i].textContent;
            log.debug(strLoggerTitle, 'info: ' + JSON.stringify(info));
            resultCode = result[i].textContent;

        }

        if (avsCode) {
            var ret = avsInfo(avsCode);
            orderPmt.setValue({ fieldId: 'custrecord_dwr_ord_pmt_avszipmatch', value: ret.zipmatch });
            orderPmt.setValue({ fieldId: 'custrecord_dwr_ord_pmt_avsstreetmatch', value: ret.streetmatch });
        }
        log.debug(strLoggerTitle, 'resultCode: ' + resultCode);
        switch (resultCode)//if(result == 'ACCEPT')
        {
            case 'ACCEPT':
            case 'REVIEW':
                var authCodeXml = xml.XPath.select({
                    node: doc,
                    xpath: '//c:authorizationCode'
                });
                log.debug(strLoggerTitle, 'authCodeXml: ' + JSON.stringify(authCodeXml));

                for (var i = 0; i < authCodeXml.length; i++) {
                    payResult.authCode = authCodeXml[i].textContent;
                }
                log.debug(strLoggerTitle, 'payResult.authCode: ' + payResult.authCode);

                var pnRefXml = xml.XPath.select({
                    node: doc,
                    xpath: '//c:requestID'
                });
                log.debug(strLoggerTitle, 'pnRefXml: ' + JSON.stringify(pnRefXml));

                for (var i = 0; i < pnRefXml.length; i++) {
                    payResult.pnRef = pnRefXml[i].textContent;
                }


                log.debug(strLoggerTitle, 'payResult.pnRef: ' + payResult.pnRef);
                payResult.result = 'ACCEPT';
                payResult.errMsg = '';
                
                if (!isReauth && resultCode == 'REVIEW') {

                    payResult.result = 'REVIEW';
                    payResult.errMsg = getAfsMessage(doc);
                }
                break;
            case 'REJECT':
            case 'ERROR':
                var reasonCodeXml = xml.XPath.select({
                    node: doc,
                    xpath: '//c:reasonCode'
                });
                var reasonCode = 0;
                for (var i = 0; i < reasonCodeXml.length; i++) {


                    reasonCode = Number(reasonCodeXml[i].textContent);

                }



                log.debug(strLoggerTitle, 'reasonCode: ' + reasonCode);
                payResult.authCode = '';
                payResult.pnRef = '';
                payResult.errCode = reasonCode;
                payResult.errMsg = cyberSource_Reason(reasonCode);
                var missingFields = doc.getElementsByTagName("missingField");
                if (missingFields) {
                    for (var x = 0; x < missingFields.length; x++) {
                        payResult.errMsg += '<br/>Missing Field: ' + missingFields[x].childNodes[0].nodeValue;
                    }
                }
                payResult.result = 'REJECT';

                //if the reason is 150 or 151 and it is a reauthorization, we can try to reauthorize the order again.
                if ((reasonCode == 151 || reasonCode == 150) && isReauth) {
                    payResult.result = 'RETRY';

                }


                break;
            default:
                payResult.authCode = '';
                payResult.pnRef = '';
                payResult.result = 'REJECT';
                payResult.errMsg = 'UNEXPECTED RESPONSE';
        }
        log.debug(strLoggerTitle, 'payResult' + JSON.stringify(payResult));
        return payResult;
    }

    /**
  * @description Pulls the reason code when the status is in Review
  * @param doc XML document from the response from cybersource
  * @returns afsMessage string with all the details of the AFS information fromt he call
  */
    function getAfsMessage(doc) {
        var strLoggerTitle = 'getAfsMessage';
        var reasonCodeXml = xml.XPath.select({
            node: doc,
            xpath: '//c:reasonCode'
        });
        log.debug(strLoggerTitle, 'reasonCodeXml: ' + JSON.stringify(reasonCodeXml));
        var reasonCode;

        for (var i = 0; i < reasonCodeXml.length; i++) {
            reasonCode = reasonCodeXml[i].textContent;
        }
        log.debug(strLoggerTitle, 'reasonCode: ' + JSON.stringify(reasonCode));



        var hostSeverityXml = xml.XPath.select({
            node: doc,
            xpath: '//c:hostSeverity'
        });
        log.debug(strLoggerTitle, 'hostSeverityXml: ' + JSON.stringify(hostSeverityXml));
        var hostSeverity;

        for (var i = 0; i < hostSeverityXml.length; i++) {
            hostSeverity = hostSeverityXml[i].textContent;
        }
        log.debug(strLoggerTitle, 'hostSeverity: ' + JSON.stringify(hostSeverity));




        var afsResultXml = xml.XPath.select({
            node: doc,
            xpath: '//c:afsResult'
        });
        log.debug(strLoggerTitle, 'afsResultXml: ' + JSON.stringify(afsResultXml));
        var afsResult;

        for (var i = 0; i < afsResultXml.length; i++) {
            afsResult = afsResultXml[i].textContent;
        }
        log.debug(strLoggerTitle, 'afsResult: ' + JSON.stringify(afsResult));


        var afsFactorCodeXml = xml.XPath.select({
            node: doc,
            xpath: '//c:afsFactorCode'
        });
        log.debug(strLoggerTitle, 'afsFactorCodeXml: ' + JSON.stringify(afsFactorCodeXml));
        var afsFactorCode;

        for (var i = 0; i < afsFactorCodeXml.length; i++) {
            afsFactorCode = afsFactorCodeXml[i].textContent;
        }
        log.debug(strLoggerTitle, 'afsFactorCode: ' + JSON.stringify(afsFactorCode));


        var internetInfoCodeXml = xml.XPath.select({
            node: doc,
            xpath: '//c:internetInfoCode'
        });
        log.debug(strLoggerTitle, 'internetInfoCodeXml: ' + JSON.stringify(internetInfoCodeXml));
        var internetInfoCode;

        for (var i = 0; i < internetInfoCodeXml.length; i++) {
            internetInfoCode = internetInfoCodeXml[i].textContent;
        }
        log.debug(strLoggerTitle, 'internetInfoCode: ' + JSON.stringify(internetInfoCode));


        var suspiciousInfoCodeXml = xml.XPath.select({
            node: doc,
            xpath: '//c:suspiciousInfoCode'
        });
        log.debug(strLoggerTitle, 'suspiciousInfoCodeXml: ' + JSON.stringify(suspiciousInfoCodeXml));
        var suspiciousInfoCode;

        for (var i = 0; i < suspiciousInfoCodeXml.length; i++) {
            suspiciousInfoCode = suspiciousInfoCodeXml[i].textContent;
        }
        log.debug(strLoggerTitle, 'suspiciousInfoCode: ' + JSON.stringify(suspiciousInfoCode));



        var velocityInfoCodeXml = xml.XPath.select({
            node: doc,
            xpath: '//c:velocityInfoCode'
        });
        log.debug(strLoggerTitle, 'velocityInfoCodeXml: ' + JSON.stringify(velocityInfoCodeXml));
        var velocityInfoCode;

        for (var i = 0; i < velocityInfoCodeXml.length; i++) {
            velocityInfoCode = velocityInfoCodeXml[i].textContent;
        }
        log.debug(strLoggerTitle, 'velocityInfoCode: ' + JSON.stringify(velocityInfoCode));



        var afsMessage = '';

        afsMessage = cyberSource_Reason(reasonCode);
        afsMessage += '<br/> afsResult: ' + afsResult;
        afsMessage += '<br/> hostSeverity: ' + hostSeverity;
        afsMessage += '<br/> afsFactorCode: ' + afsFactorCode + ' (' + cyberSource_Reason(afsFactorCode) + ')';
        afsMessage += '<br/> internetInfoCode: ' + internetInfoCode + ' (' + cyberSource_Reason(internetInfoCode) + ')';
        afsMessage += '<br/> suspiciousInfoCode: ' + suspiciousInfoCode + ' (' + cyberSource_Reason(suspiciousInfoCode) + ')';
        afsMessage += '<br/> velocityInfoCodes: ';
        //var velCodesArray = nlapiSelectValue(doc, '//c:velocityInfoCode');
        if (velocityInfoCode) {
            var velCodes = velCodesArray.split('^');
            for (var x = 0; x < velCodes.length; x++) {
                afsMessage += '<br/>   ' + velCodes[x] + ' (' + cyberSource_Reason(velCodes[x]) + ')';
            }
        }
        return afsMessage;
    }

    /**
  * @description Extracts the cybersource reason from a custom record
  * @param code code that is numeric that is searched on
  * @returns reasonDetails string with the reason code details
  */
    function cyberSource_Reason(code) { //Matt TO DO
        var strLoggerTitle = 'cyberSource_Reason';
        log.debug(strLoggerTitle, 'cyberSource_Reason');
        var reasonDetails = 'Return Code not recognized (' + code + ')';
        var filters = new Array();
        if (code) {
            
            var filters = new Array();
            filters.push(search.createFilter({
                name: 'custrecord_dwr_cybersource_code',
                operator: search.Operator.IS,
                values: code.toString()

            }));

            var csRecord = getAllSearchResults('customrecord_dwr_cybersource_code', null, filters, ['custrecord_dwr_cybersource_description', 'custrecord_dwr_cybersource_action']);

            if (csRecord) {
                if (csRecord[0]) {
                    reasonDetails = csRecord[0].getValue('custrecord_dwr_cybersource_description')
                    if (csRecord[0].getValue('custrecord_dwr_cybersource_action')) reasonDetails += ' - ' + csRecord[0].getValue('custrecord_dwr_cybersource_action');
                }
            }
        }
        return reasonDetails;
    }
    /**
* @description Extracts the avs code details from a custom record
* @param code code that is numeric that is searched on
* @returns avsObj object with details for the AVS code passed in
*/
    function avsInfo(code) {
        var strLoggerTitle = 'avsInfo'
        log.debug(strLoggerTitle, 'START');
        var avsObj =
        {
            description: null,
            streetmatch: null,
            zipmatch: null
        };



        var filters = new Array();
        filters.push(search.createFilter({
            name: 'custrecord_dwr_avs_code',
            operator: search.Operator.IS,
            values: code.toString()

        }));

        var csRecord = getAllSearchResults('customrecord_dwr_avs_code', null, filters, ['custrecord_dwr_avs_description', 'custrecord_dwr_avs_streetmatch', 'custrecord_dwr_avs_zipmatch']);


        if (csRecord) {
            if (csRecord[0] == null) {
                avsObj.description = 'AVS Code not recognized (' + code + ')';
            }
            else {
                avsObj.description = csRecord[0].getValue('custrecord_dwr_avs_description');
                avsObj.streetmatch = csRecord[0].getText('custrecord_dwr_avs_streetmatch');
                avsObj.zipmatch = csRecord[0].getText('custrecord_dwr_avs_zipmatch');
            }
        }
        else {
            avsObj = 'AVS Code not recognized (' + code + ')';
        }

        log.debug(strLoggerTitle, 'end');
        return avsObj;
    }
    //
    /* -------------------------- CMP 05198095 - Begin -------------------------- */
    /**
 *
 * @param {string} code
 * @returns null
 */
    function getIdByCountry(code) {
        var strLoggerTitle = 'Get Item Warnings';
        log.audit(
            strLoggerTitle,
            '|>----------' + strLoggerTitle + '-Begin----------<|'
        );
        //
        try {
            log.debug(strLoggerTitle + ' Parameter passed', code);
            var arrcountry = getArrayCountry();
            var arrCountryLength = arrcountry.length;
            for (var index = 0; index < arrCountryLength; index++) {
                if (arrcountry[index][0] == code) {
                    log.debug(strLoggerTitle + ' ID Returned', arrcountry[index][1]);
                    return arrcountry[index][1];
                }
            }
        } catch (error) {
            log.error(strLoggerTitle + ' caught an exception', error);
        }
        //
        log.audit(
            strLoggerTitle,
            '|>----------' + strLoggerTitle + '-End----------<|'
        );
        return null;
    }

    /**
 *
 * @param {object} options - record object
 * @returns {object} collection of items
 */
    function getItemWarnings(options) {
        var strLoggerTitle = 'Get Item Warnings';
        var items = {};
        var itemIds = [];
        log.audit(
            strLoggerTitle,
            '|>----------' + strLoggerTitle + '-Begin----------<|'
        );
        //
        try {
            var order = options.order;

            var itemLineCount = order.getLineCount({
                sublistId: 'item',
            });

            for (var index = 0; index < itemLineCount; index++) {
                var itemId = order.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: index,
                });
                itemIds.push(itemId);
            }
            log.debug(strLoggerTitle + ' Item IDs from the Order', itemIds);
            if (itemIds.length < 1) return null;
            //
            /* ------------------------------ Search Begin ------------------------------ */
            var filter = ['internalid', 'ANYOF'].concat(itemIds);
            var columns = [
                'internalid',
                'custitem_dwr_contains_added_frs',
                'custitem_country_restriction',
            ];

            var itemSearchResults = getAllSearchResults('item', null, filter, columns);
            var itemSearchResultsLength = itemSearchResults.length;

            for (var index2 = 0; index2 < itemSearchResultsLength; index2++) {
                var id = itemSearchResults[index2].getValue({
                    name: 'internalid',
                });
                items[id] = {};
                items[id].custitem_country_restriction = itemSearchResults[
                    index2
                ].getValue({
                    name: 'custitem_country_restriction',
                });
                items[id].custitem_dwr_contains_added_frs = itemSearchResults[
                    index2
                ].getValue({
                    name: 'custitem_dwr_contains_added_frs',
                });
            }
            log.debug(strLoggerTitle + ' Item Search Results', items);
            /* ------------------------------- Search End ------------------------------- */
            //
        } catch (error) {
            log.error(strLoggerTitle + ' caught an exception', error);
        }
        //
        log.audit(
            strLoggerTitle,
            '|>----------' + strLoggerTitle + '-End----------<|'
        );

        return items;
    }

    /**
 *
 * @param {string} id
 * @returns null
 */
    function getCountryById(id) {
        var strLoggerTitle = 'GetCountryById';
        log.audit(
            strLoggerTitle,
            '|>----------' + strLoggerTitle + '-Begin----------<|'
        );
        //
        try {
            log.debug(strLoggerTitle + ' Parameter Passed', id);
            var arrcountry = getArrayCountry();
            var arrCountryLength = arrcountry.length;
            for (var index = 0; index < arrCountryLength; index++) {
                if (arrcountry[index][1] == id) {
                    log.debug(strLoggerTitle + ' Country Returned', arrcountry[index][0]);
                    return arrcountry[index][0];
                }
            }
        } catch (error) {
            log.error(strLoggerTitle + ' caught an exception', error);
        }
        //
        log.audit(
            strLoggerTitle,
            '|>----------' + strLoggerTitle + '-End----------<|'
        );
        return null;
    }

    /**
 *
 * @returns {array} - Array of Countries and Code.
 */
    function getArrayCountry() {
        var arrcountry = [];
        arrcountry[0] = new Array('AF', 3);
        arrcountry[1] = new Array('AX', 247);
        arrcountry[2] = new Array('AL', 6);
        arrcountry[3] = new Array('DZ', 62);
        arrcountry[4] = new Array('AS', 12);
        arrcountry[5] = new Array('AD', 1);
        arrcountry[6] = new Array('AO', 9);
        arrcountry[7] = new Array('AI', 5);
        arrcountry[8] = new Array('AQ', 10);
        arrcountry[9] = new Array('AG', 4);
        arrcountry[10] = new Array('AR', 11);
        arrcountry[11] = new Array('AM', 7);
        arrcountry[12] = new Array('AW', 15);
        arrcountry[13] = new Array('AU', 14);
        arrcountry[14] = new Array('AT', 13);
        arrcountry[15] = new Array('AZ', 16);
        arrcountry[16] = new Array('BS', 31);
        arrcountry[17] = new Array('BH', 23);
        arrcountry[18] = new Array('BD', 19);
        arrcountry[19] = new Array('BB', 18);
        arrcountry[20] = new Array('BY', 35);
        arrcountry[21] = new Array('BE', 20);
        arrcountry[22] = new Array('BZ', 36);
        arrcountry[23] = new Array('BJ', 25);
        arrcountry[24] = new Array('BM', 27);
        arrcountry[25] = new Array('BT', 32);
        arrcountry[26] = new Array('BO', 29);
        arrcountry[27] = new Array('BA', 27);
        arrcountry[28] = new Array('BW', 34);
        arrcountry[29] = new Array('BV', 33);
        arrcountry[30] = new Array('BR', 30);
        arrcountry[31] = new Array('IO', 106);
        arrcountry[32] = new Array('BN', 28);
        arrcountry[33] = new Array('BG', 22);
        arrcountry[34] = new Array('BF', 21);
        arrcountry[35] = new Array('BI', 24);
        arrcountry[36] = new Array('KH', 117);
        arrcountry[37] = new Array('CM', 46);
        arrcountry[38] = new Array('CA', 37);
        arrcountry[39] = new Array('IC', 249);
        arrcountry[40] = new Array('CV', 53);
        arrcountry[41] = new Array('KY', 124);
        arrcountry[42] = new Array('CF', 40);
        arrcountry[43] = new Array('EA', 248);
        arrcountry[44] = new Array('TD', 212);
        arrcountry[45] = new Array('CL', 45);
        arrcountry[46] = new Array('CN', 47);
        arrcountry[47] = new Array('CX', 54);
        arrcountry[48] = new Array('CC', 38);
        arrcountry[49] = new Array('CO', 48);
        arrcountry[50] = new Array('KM', 119);
        arrcountry[51] = new Array('CD', 39);
        arrcountry[52] = new Array('CG', 41);
        arrcountry[53] = new Array('CK', 44);
        arrcountry[54] = new Array('CR', 49);
        arrcountry[55] = new Array('CI', 43);
        arrcountry[56] = new Array('HR', 98);
        arrcountry[57] = new Array('CU', 52);
        arrcountry[58] = new Array('CY', 55);
        arrcountry[59] = new Array('CZ', 56);
        arrcountry[60] = new Array('DK', 59);
        arrcountry[61] = new Array('DJ', 58);
        arrcountry[62] = new Array('DM', 60);
        arrcountry[63] = new Array('DO', 61);
        arrcountry[64] = new Array('TP', 221);
        arrcountry[65] = new Array('EC', 63);
        arrcountry[66] = new Array('EG', 65);
        arrcountry[67] = new Array('SV', 208);
        arrcountry[68] = new Array('GQ', 88);
        arrcountry[69] = new Array('ER', 67);
        arrcountry[70] = new Array('EE', 64);
        arrcountry[71] = new Array('ET', 69);
        arrcountry[72] = new Array('FK', 72);
        arrcountry[73] = new Array('FO', 74);
        arrcountry[74] = new Array('FJ', 71);
        arrcountry[75] = new Array('FI', 70);
        arrcountry[76] = new Array('FR', 75);
        arrcountry[77] = new Array('GF', 80);
        arrcountry[78] = new Array('PF', 175);
        arrcountry[79] = new Array('TF', 213);
        arrcountry[80] = new Array('GA', 76);
        arrcountry[81] = new Array('GM', 85);
        arrcountry[82] = new Array('GE', 79);
        arrcountry[83] = new Array('DE', 57);
        arrcountry[84] = new Array('GH', 82);
        arrcountry[85] = new Array('GI', 83);
        arrcountry[86] = new Array('GR', 89);
        arrcountry[87] = new Array('GL', 84);
        arrcountry[88] = new Array('GD', 78);
        arrcountry[89] = new Array('GP', 87);
        arrcountry[90] = new Array('GU', 92);
        arrcountry[91] = new Array('GT', 91);
        arrcountry[92] = new Array('GG', 81);
        arrcountry[93] = new Array('GN', 86);
        arrcountry[94] = new Array('GW', 93);
        arrcountry[95] = new Array('GY', 94);
        arrcountry[96] = new Array('HT', 99);
        arrcountry[97] = new Array('HM', 96);
        arrcountry[98] = new Array('VA', 233);
        arrcountry[99] = new Array('HN', 97);
        arrcountry[100] = new Array('HK', 95);
        arrcountry[101] = new Array('HU', 100);
        arrcountry[102] = new Array('IS', 109);
        arrcountry[103] = new Array('IN', 105);
        arrcountry[104] = new Array('ID', 101);
        arrcountry[105] = new Array('IR', 108);
        arrcountry[106] = new Array('IQ', 107);
        arrcountry[107] = new Array('IE', 102);
        arrcountry[108] = new Array('IM', 104);
        arrcountry[109] = new Array('IL', 103);
        arrcountry[110] = new Array('IT', 110);
        arrcountry[111] = new Array('JM', 112);
        arrcountry[112] = new Array('JP', 114);
        arrcountry[113] = new Array('JE', 111);
        arrcountry[114] = new Array('JO', 113);
        arrcountry[115] = new Array('KZ', 125);
        arrcountry[116] = new Array('KE', 115);
        arrcountry[117] = new Array('KI', 118);
        arrcountry[118] = new Array('KP', 121);
        arrcountry[119] = new Array('KR', 122);
        arrcountry[120] = new Array('KW', 123);
        arrcountry[121] = new Array('KG', 116);
        arrcountry[122] = new Array('LA', 126);
        arrcountry[123] = new Array('LV', 135);
        arrcountry[124] = new Array('LB', 127);
        arrcountry[125] = new Array('LS', 132);
        arrcountry[126] = new Array('LR', 131);
        arrcountry[127] = new Array('LY', 136);
        arrcountry[128] = new Array('LI', 129);
        arrcountry[129] = new Array('LT', 133);
        arrcountry[130] = new Array('LU', 134);
        arrcountry[131] = new Array('MO', 148);
        arrcountry[132] = new Array('MK', 144);
        arrcountry[133] = new Array('MG', 142);
        arrcountry[134] = new Array('MW', 156);
        arrcountry[135] = new Array('MY', 158);
        arrcountry[136] = new Array('MV', 155);
        arrcountry[137] = new Array('ML', 145);
        arrcountry[138] = new Array('MT', 153);
        arrcountry[139] = new Array('MH', 143);
        arrcountry[140] = new Array('MQ', 150);
        arrcountry[141] = new Array('MR', 151);
        arrcountry[142] = new Array('MU', 154);
        arrcountry[143] = new Array('YT', 243);
        arrcountry[144] = new Array('MX', 157);
        arrcountry[145] = new Array('FM', 73);
        arrcountry[146] = new Array('MD', 139);
        arrcountry[147] = new Array('MC', 138);
        arrcountry[148] = new Array('MN', 147);
        arrcountry[149] = new Array('ME', 140);
        arrcountry[150] = new Array('MS', 152);
        arrcountry[151] = new Array('MA', 137);
        arrcountry[152] = new Array('MZ', 159);
        arrcountry[153] = new Array('MM', 146);
        arrcountry[154] = new Array('NA', 160);
        arrcountry[155] = new Array('NR', 169);
        arrcountry[156] = new Array('NP', 168);
        arrcountry[157] = new Array('NL', 166);
        arrcountry[158] = new Array('AN', 8);
        arrcountry[159] = new Array('NC', 161);
        arrcountry[160] = new Array('NZ', 171);
        arrcountry[161] = new Array('NI', 165);
        arrcountry[162] = new Array('NE', 162);
        arrcountry[163] = new Array('NG', 164);
        arrcountry[164] = new Array('NU', 170);
        arrcountry[165] = new Array('NF', 163);
        arrcountry[166] = new Array('MP', 149);
        arrcountry[167] = new Array('NO', 167);
        arrcountry[168] = new Array('OM', 172);
        arrcountry[169] = new Array('PK', 178);
        arrcountry[170] = new Array('PW', 185);
        arrcountry[171] = new Array('PS', 183);
        arrcountry[172] = new Array('PA', 173);
        arrcountry[173] = new Array('PG', 176);
        arrcountry[174] = new Array('PY', 186);
        arrcountry[175] = new Array('PE', 174);
        arrcountry[176] = new Array('PH', 177);
        arrcountry[177] = new Array('PN', 181);
        arrcountry[178] = new Array('PL', 179);
        arrcountry[179] = new Array('PT', 184);
        arrcountry[180] = new Array('PR', 182);
        arrcountry[181] = new Array('QA', 187);
        arrcountry[182] = new Array('RE', 188);
        arrcountry[183] = new Array('RO', 189);
        arrcountry[184] = new Array('RU', 190);
        arrcountry[185] = new Array('RW', 191);
        arrcountry[186] = new Array('BL', 26);
        arrcountry[187] = new Array('SH', 198);
        arrcountry[188] = new Array('KN', 120);
        arrcountry[189] = new Array('LC', 128);
        arrcountry[190] = new Array('MF', 141);
        arrcountry[191] = new Array('VC', 234);
        arrcountry[192] = new Array('WS', 241);
        arrcountry[193] = new Array('SM', 203);
        arrcountry[194] = new Array('ST', 207);
        arrcountry[195] = new Array('SA', 192);
        arrcountry[196] = new Array('SN', 204);
        arrcountry[197] = new Array('RS', 50);
        arrcountry[198] = new Array('CS', 51);
        arrcountry[199] = new Array('SC', 194);
        arrcountry[200] = new Array('SL', 202);
        arrcountry[201] = new Array('SG', 197);
        arrcountry[202] = new Array('SK', 201);
        arrcountry[203] = new Array('SI', 199);
        arrcountry[204] = new Array('SB', 193);
        arrcountry[205] = new Array('SO', 205);
        arrcountry[206] = new Array('ZA', 244);
        arrcountry[207] = new Array('GS', 90);
        arrcountry[208] = new Array('ES', 68);
        arrcountry[209] = new Array('LK', 130);
        arrcountry[210] = new Array('PM', 180);
        arrcountry[211] = new Array('SD', 195);
        arrcountry[212] = new Array('SR', 206);
        arrcountry[213] = new Array('SJ', 200);
        arrcountry[214] = new Array('SZ', 210);
        arrcountry[215] = new Array('SE', 196);
        arrcountry[216] = new Array('CH', 42);
        arrcountry[217] = new Array('SY', 209);
        arrcountry[218] = new Array('TW', 225);
        arrcountry[219] = new Array('TJ', 216);
        arrcountry[220] = new Array('TZ', 226);
        arrcountry[221] = new Array('TH', 215);
        arrcountry[222] = new Array('TG', 214);
        arrcountry[223] = new Array('TK', 217);
        arrcountry[224] = new Array('TO', 220);
        arrcountry[225] = new Array('TT', 223);
        arrcountry[226] = new Array('TN', 219);
        arrcountry[227] = new Array('TR', 222);
        arrcountry[228] = new Array('TM', 218);
        arrcountry[229] = new Array('TC', 211);
        arrcountry[230] = new Array('TV', 224);
        arrcountry[231] = new Array('UG', 228);
        arrcountry[232] = new Array('UA', 227);
        arrcountry[233] = new Array('AE', 2);
        arrcountry[234] = new Array('GB', 77);
        arrcountry[235] = new Array('US', 230);
        arrcountry[236] = new Array('UY', 231);
        arrcountry[237] = new Array('UM', 229);
        arrcountry[238] = new Array('UZ', 232);
        arrcountry[239] = new Array('VU', 239);
        arrcountry[240] = new Array('VE', 235);
        arrcountry[241] = new Array('VN', 238);
        arrcountry[242] = new Array('VG', 236);
        arrcountry[243] = new Array('VI', 237);
        arrcountry[244] = new Array('WF', 240);
        arrcountry[245] = new Array('EH', 66);
        arrcountry[246] = new Array('YE', 242);
        arrcountry[247] = new Array('ZM', 245);
        arrcountry[248] = new Array('ZW', 246);

        return arrcountry;
    }
    /** Checks all addresses in the order to see if there is a warning for products in the state
    *  If there are states, it will search and verify that no items have that product warning
    *
    * @param {object} [required] order : NS Order Object
    *
    * returns true if an item is found, false if nothing is found
    */

    function checkForWarningShippingState(order) {
        var strLogger = 'CheckForWarningShippingState';
        log.audit(strLogger, '|>----------' + strLogger + '-Begin----------<|');
        try {
            var bFloorSale = order.getValue('custbody_dwr_floor_sale');

            if (
                typeof bFloorSale !== 'undefined' &&
                bFloorSale != null &&
                bFloorSale != ''
            ) {
                // CMP 03436830 - floor sales don't get shipped and are not restricted by the check warning state
                log.debug(
                    strLogger,
                    'order= ' + order.id + ' is a floor sale and is excluded'
                );
                return false;
            }

            var addressStateList = {};
            var addressCountryList = {};
            var filterSearch = 0;
            var customerStates = {};
            //Retrieves all the records associated with the address book of the customer
            var addressCount = order.getLineCount({ sublistId: 'item' });

            // geting shipping address from line items
            log.debug(strLogger, 'addressCount= ' + addressCount);
            for (var i = 0; i < addressCount; i++) {
                var address = order.getSublistSubrecord({
                    sublistId: 'item',
                    fieldId: 'shippingaddress',
                    line: i,
                });
                if (typeof address !== 'undefined' && address != null) {
                    var state = address.getValue({ fieldId: 'state' });
                    var country = address.getValue({ fieldId: 'country' });
                    var addressID = order.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_dwr_shipto',
                        line: i,
                    });

                    log.debug(
                        strLogger,
                        'state: ' +
                        state +
                        ' || country: ' +
                        country +
                        ' || addressID: ' +
                        addressID
                    );

                    addressStateList[addressID] = state;
                    addressCountryList[addressID] = country;
                }
            }

            log.debug(
                strLogger,
                'addressCount= ' +
                addressCount +
                ' addressList ' +
                JSON.stringify(addressStateList)
            );
            //Loop through the entire address list of states shortnames to get the full name of the state
            // creating state filters for search
            var stateArrFilters = [];
            for (var itemid in addressStateList) {
                if (addressStateList[itemid] == null || addressStateList[itemid] == '') {
                    continue;
                }
                if (filterSearch != 0) {
                    stateArrFilters.push('or');
                }
                stateArrFilters.push(['shortname', 'is', addressStateList[itemid]]);

                filterSearch += 1;
            }

            // pulls up all states in the native netsuite object where the shortname(ex. NY, CT, NJ) matches the customer's state address
            var stateColumns = [];
            stateColumns.push(search.createColumn({ name: 'shortname' }));
            stateColumns.push(search.createColumn({ name: 'fullname' }));
            stateColumns.push(search.createColumn({ name: 'id' }));

            var countryColumns = [];

            // pulling and collecting customer state objects
            var customerFulLStateRecords = getAllSearchResults(
                'state',
                null,
                stateArrFilters,
                stateColumns
            ); //rs.getResults(0, 1000);
            if (customerFulLStateRecords) {
                //Populate records into a JS Object to reference later and search the custom record warning type
                log.debug(
                    strLogger,
                    'customerFulLStateRecords length = ' + customerFulLStateRecords.length
                );
                for (var i = 0; i < customerFulLStateRecords.length; i++) {
                    var stateDetails = {};
                    stateDetails.fullName =
                        customerFulLStateRecords[i].getValue('fullname');
                    stateDetails.shortName =
                        customerFulLStateRecords[i].getValue('shortname');
                    customerStates[customerFulLStateRecords[i].getValue('id')] =
                        stateDetails;
                }
            }

            //Searches the Item Warning State custom record to see if any of the addresses are in a warning state
            //This also retrieves the custom item record id to retrieve the value.  The expected field type as this time
            //is that it is a checkbox
            filterSearch = 0;
            stateArrFilters = [];
            for (var customerState in customerStates) {
                // log.debug(strLogger, 'address State ' + addressStateList[itemid]);
                if (
                    addressStateList[i] == null ||
                    customerState[i].fullName == null ||
                    customerState[i].fullName == ''
                ) {
                    continue;
                }
                if (filterSearch != 0) {
                    stateArrFilters.push('or');
                }
                stateArrFilters.push([
                    'custrecord_dwr_product_warning_type',
                    'fullname',
                    'is',
                    customerStates[i].fullName,
                ]);

                filterSearch += 1;
            }

            // creating country filters for search
            filterSearch = 0;
            var countryArrFilters = [];
            for (var addressID in addressCountryList) {
                var countryID = getIdByCountry(addressCountryList[addressID]); // library function added to get country codes and id's
                if (addressCountryList[addressID] == null || !countryID) {
                    continue;
                }
                log.debug(
                    strLogger,
                    strLogger,
                    'address Country ' +
                    addressCountryList[addressID] +
                    ' conutry id ' +
                    countryID
                );
                if (filterSearch != 0) {
                    countryArrFilters.push('or');
                }
                countryArrFilters.push([
                    'custrecord_dwr_item_warning_country',
                    'is',
                    countryID,
                ]);

                filterSearch += 1;
            }

            countryColumns = [];
            countryColumns.push(
                search.createColumn({ name: 'custrecord_dwr_item_warning_country' })
            );
            countryColumns.push(
                search.createColumn({
                    name: 'custrecord_dwr_cust_item_id',
                    join: 'custrecord_dwr_product_warning_type',
                })
            );
            // check if any of the countries in the line items exist in the Shipping Warning records.
            var warningCountries = getAllSearchResults(
                'customrecord_dwr_item_warning_state',
                null,
                countryArrFilters,
                countryColumns
            );

            stateColumns = [];
            stateColumns.push(
                search.createColumn({ name: 'custrecord_dwr_item_warning_state' })
            );
            stateColumns.push(
                search.createColumn({
                    name: 'custrecord_dwr_cust_item_id',
                    join: 'custrecord_dwr_product_warning_type',
                })
            );

            var warningStates = getAllSearchResults(
                'customrecord_dwr_item_warning_state',
                null,
                stateArrFilters,
                stateColumns
            );
            //nlapiLogExecution('DEBUG', strLogger, 'Warning countries count=' + warningCountries.length);
            if (
                (warningStates == null || warningStates.length == 0) &&
                (warningCountries == null || warningCountries.length == 0)
            ) {
                log.debug(strLogger, 'no warning countries or states for this customer');
                return false;
            }

            // search for item warnings associated with the order line items.
            var items = getItemWarnings({ order: order });

            //Loops through all items in the order and will see if the shipping state matches any in the warning States results
            var lineCount = order.getLineCount('item');
            log.debug(strLogger, 'lineCount= ' + lineCount);
            for (var i = 0; i < lineCount; i++) {
                var itemId = order.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i,
                });
                var shippingID = order.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_dwr_shipto',
                    line: i,
                });
                if (
                    typeof shippingID === 'undefined' ||
                    shippingID == null ||
                    shippingID == ''
                ) {
                    log.debug(
                        strLogger,
                        'custcol_dwr_shipto was empty looking at shipaddress'
                    );
                    shippingID = order.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'shipaddress',
                        line: i,
                    });
                }
                log.debug(strLogger, 'shippingID= ' + shippingID + ' itemId ' + itemId);
                // first we are checking for country and then state.
                if (!(warningCountries == null || warningCountries.length == 0)) {
                    for (var j = 0; j < warningCountries.length; j++) {
                        var countryID = warningCountries[j].getValue(
                            'custrecord_dwr_item_warning_country'
                        );
                        var countryCode = getCountryById(countryID);
                        if (
                            countryID &&
                            countryCode &&
                            addressCountryList[shippingID] == countryCode
                        ) {
                            log.debug(
                                strLogger,
                                'found country for restriction  ' + countryCode
                            );
                            var itemFields = items[itemId]['custitem_country_restriction'];
                            //if the warning state matches the state the item is being shipped to, look at the value of the field to confirm if it is set to true
                            if (itemFields == true) {
                                log.debug(
                                    strLogger,
                                    'itemId = ' +
                                    itemId +
                                    ' has a ban in this country ' +
                                    countryCode
                                );
                                return true;
                            }
                        }
                    }
                }

                if (!(warningStates == null || warningStates.length == 0)) {
                    for (var j = 0; j < warningStates.length; j++) {
                        var stateID = warningStates[j].getValue(
                            'custrecord_dwr_item_warning_state'
                        );
                        if (
                            customerStates[stateID] != null &&
                            customerStates[stateID].shortName != null &&
                            addressStateList[shippingID] == customerStates[stateID].shortName
                        ) {
                            log.debug(
                                strLogger,
                                'found state for restriction  ' +
                                customerStates[stateID].shortName
                            );
                            var itemFields = items[itemId]['custitem_dwr_contains_added_frs'];
                            //if the warning state matches the state the item is being shipped to, look at the value of the field to confirm if it is set to true
                            if (itemFields == true) {
                                log.debug(
                                    strLogger,
                                    'itemId = ' +
                                    itemId +
                                    ' has a ban in this state ' +
                                    customerStates[stateID].shortName
                                );
                                return true;
                            }
                        }
                    }
                }
            }
        } catch (error) {
            log.error(strLogger + ' caught with an exception', error);
        }
        log.audit(strLogger, '|>----------' + strLogger + '-End----------<|');
        return false;
    }

    /* -------------------------- CMP 05198095 - End -------------------------- */
    //

    /* -------------------------- CMP 05192708 - Begin -------------------------- */
    //
    /* -------------------- Field Check - Begin ------------------- */
    /**
     * 
     * @param {string} field
     * @param {string} message
     * @param {string} statusValue
     * @returns {string} message
     */
    function fieldCheck(field, message, statusValue) {
        if (!statusValue) {
            statusValue = 'Regular';
        }

        if (field.label) {

            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
                if (!message) {
                    message += 'The following fields have an invalid value and are required to set the status to "' + statusValue + '":\n';
                    message += '\n' + field.label;
                }

            } else {
                if (!message) {
                    message += 'The following fields have an invalid value and are required to set the status to "' + statusValue + '": ';
                    message += field.label + ',';
                }
            }

            return message;
        }
        
    }
    /* -------------------- Field Check - End ------------------- */
    //
    /* -------------------- Regular Status Validation - Begin ------------------- */
    /**
     * 
     * @param {object} context
     * @returns {string} message
     */
    function regularStatusValidation(context) {

        var strLoggerTitle = 'Regular Status Validation';
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Entry-------------<|');
        //
        var message = '';
        var itemNewRecord = context.newRecord;
            var reqBodyFields = ['custitem_dwr_list_price', 'custitem_dwr_discount_off_msrp', 'custitem_dwr_2nd_discount_off_msrp', 'cost', 'custitem_dwr_lc_landing_factor',
                'manufacturer', 'countryofmanufacture', 'vendorname', 'reordermultiple', 'custitem_dwr_material_information', 'custitem_dwr_production_time', 'custitem_dwr_transit_time'];


        var isParcel = itemNewRecord.getValue({ fieldId: 'custitem_dwr_parcel' });

            if (isParcel) {
                reqBodyFields.push('custitem_dwr_threshold_quantity');
            }

            var recordType = context.newRecord.type;

            if (recordType == 'inventoryitem') {
                reqBodyFields.push('custitem_dwr_inbound_carton_height_in', 'custitem_dwr_inbound_carton_depth_in', 'custitem_dwr_inbound_carton_width_in', 'custitem_dwr_inbound_carton_weight_lbs',
                    'custitem_dwr_incoterm_point', 'custitem_dwr_number_of_units_percarton', 'custitem_dwr_schedule_b', 'custitem_dwr_lc_duty_per', 'custitem_dwr_min_purchase_qty',
                    'custitem_dwr_harmonized_code', 'preferredlocation');
            }

            // CMP 02494453 - Make Kit Parent Vendor a required field on Kit Parents before changing Item Status to Regular
            if (recordType == 'kititem') {
                reqBodyFields.push('custitem_dwr_kit_parent_vendor', 'location');
            }

            for (var index = 0; index < reqBodyFields.length; index++) {
                //custitem_dwr_harmonized_code *IF* import
                var dwrImport = itemNewRecord.getValue({ fieldId: 'custitem_dwr_import' });

                if (reqBodyFields[index] != 'custitem_dwr_harmonized_code' || (reqBodyFields[index] == 'custitem_dwr_harmonized_code' && dwrImport)) {
                    var value = itemNewRecord.getValue({ fieldId: reqBodyFields[index] });
                    log.debug(strLoggerTitle, 'Value: ' + value);

                    if (value == '' || value == null) {
                        var field = itemNewRecord.getField({ fieldId: reqBodyFields[index] });
                        log.debug(strLoggerTitle, 'Field: ' + field);

                        if (field) {

                            message = fieldCheck(field, message);
                        }

                    }
                }
            }
           //CMP 04137409
        var pendingProp65 = itemNewRecord.getValue({ fieldId: 'custitem_dwr_pending_prop_65' });
            if (pendingProp65) {
                message += '\nThis item is still pending a Prop 65 warning.  If one has been entered, be sure to uncheck Pending Prop 65 under the Compliance Tab'; 
            }

             // CMP 02494453 - Check to ensure that all component items on a kit have an Item Status of Regular before the Kit Parent can have Item Status set to Regular

            if (recordType == 'kititem') {
                var numComponents = itemNewRecord.getLineCount({ sublistId: 'member' });

                if (numComponents == 0) {
                    message += '\n There must be components before setting Kit Item to Regular Status. ';
                } else {

                    var arrMembers = [];
                    for (var index1 = 0; index1 < numComponents; index1++) {
                        var memberId = itemNewRecord.getSublistValue({ sublistId: 'member', field: 'item', line: index1 });
                        arrMembers.push(memberId);
                    }

                    var arrFilters = [];
                    arrFilters.push(search.createFilter({
                        name: 'internalid',
                        operator: search.Operator.ANYOF,
                        values: arrMembers,
                    }));
                    arrFilters.push(search.createFilter({
                        name: 'custitem_dwr_item_status',
                        operator: search.Operator.NONEOF,
                        values: itemNewRecord.getValue({ fieldId: 'custitem_dwr_item_status' }),
                    }));

                    var kitMemberSearchResults;
                    try {
                        kitMemberSearchResults = getAllSearchResults('inventoryitem', null, arrFilters, null);
                    } catch (error) {
                        message += '\n There was an error validating that all components have an Item Status of Regular. Please try again.';
                        log.error(strLoggerTitle + ' caught with an exception', error);
                    }


                    if (kitMemberSearchResults) {
                        message += '\nAll kit components must have an Item Status of Regular before the Kit Parent Item Status can be set to regular.';
                    }

                }
            }

        var retail = itemNewRecord.getMatrixSublistValue({
                sublistId: 'price1',
                fieldId: 'price',
                column: 0,
                line: 0
            });

            if (!retail) {
                if (!message) {
                    message = 'You must specify a retail price to set the status to "Regular"';
                } else {
                    message += '\nRetail Price';
                }
            }

             //CMP 02796501 Require Expanded Plastics Field to be populated Yes/No
            if (recordType == 'inventoryitem') {
                var expandedPlastic = itemNewRecord.getValue({ fieldId: 'custitem_dwr_expand_plastic' });
                if (!expandedPlastic) {
                    message += '\nExpanded Plastics field must be populated before Item Status can be set to regular.';
                }
            }

            var intInboundCartonCubicFeet = 0;
        var intInboundCartonHeightInches = itemNewRecord.getValue({ fieldId: 'custitem_dwr_inbound_carton_height_in' });
        var intInboundCartonDepthInches = itemNewRecord.getValue({ fieldId: 'custitem_dwr_inbound_carton_depth_in' });
        var intInboundCartonWidthInches = itemNewRecord.getValue({ fieldId: 'custitem_dwr_inbound_carton_width_in' });

            if (intInboundCartonHeightInches && intInboundCartonDepthInches && intInboundCartonWidthInches) {
                intInboundCartonCubicFeet = (intInboundCartonHeightInches * intInboundCartonDepthInches * intInboundCartonWidthInches) / (12 * 12 * 12);
            }

        var intStyleId = itemNewRecord.getValue({ fieldId: 'custitem_dwr_item_style' });

            if (intInboundCartonCubicFeet && intStyleId) {
                var arrFilters = [];
                var arrColumns = [];

                arrFilters.push(search.createFilter({
                    name: 'internalidnumber',
                    operator: search.Operator.EQUALTO,
                    values: intStyleId,
                }));

                arrColumns.push(search.createColumn({ name: 'internalid' }));
                arrColumns.push(search.createColumn({ name: 'custrecord_dwr_min_cubic_feet', join: 'custrecord_dwr_style_class' }));
                arrColumns.push(search.createColumn({ name: 'custrecord_dwr_max_cubic_feet', join: 'custrecord_dwr_style_class' }));

               var results = getAllSearchResults('customrecord_dwr_style', null, arrFilters, arrColumns);

                if (results) {
                    var intMinVolume = results[0].getValue({ name: 'custrecord_dwr_min_cubic_feet', join: 'custrecord_dwr_style_class' });
                    var intMaxVolume = results[0].getValue({ name: 'custrecord_dwr_max_cubic_feet', join: 'custrecord_dwr_style_class' });

                    if ((intInboundCartonCubicFeet < intMinVolume) || (intInboundCartonCubicFeet > intMaxVolume)) {
                        var stVolumeExceeded = 'The inbound carton cubic footage must be within the range as defined by the style\'s class to set the status to "Regular" ' +
                            '\n\nCalculated Inbound Dimensions: ' + intInboundCartonCubicFeet + '\nClass Minimum Dimensions: ' + intMinVolume + '\nClass Maximum Dimensions: ' + intMaxVolume;

                        if (!message) {
                            message = stVolumeExceeded;
                        } else {
                            message += '\n\n' + stVolumeExceeded;
                        }
                    }
                }
            }
            //
            /* -------------------- Execution Context - Logic - Begin ------------------- */
            log.debug(strLoggerTitle + ' Context Type', runtime.executionContext);
            log.audit(strLoggerTitle + ' Message', message);

            
                if (message) {
                    //removes trailing comma...
                    message = message.replace(/,\s*$/, "");
                }
            
            /* -------------------- Execution Context - Logic - End ------------------- */
            //
        //
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Exit-------------<|');
   
        return message;
    }
    /* -------------------- Regular Status Validation - End ------------------- */
    //
    /* -------------------- Quotable Status Validation - Begin ------------------- */
    /**
     * 
     * @param {object} context
     * @returns {string} message
     */
    function quotableStatusValidation(context) {

        var strLoggerTitle = 'Quotable Status Validation';
        var itemNewRecord = context.newRecord;
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Entry-------------<|');
        //
            //check for contract customer type and quotable status
        var itemType = itemNewRecord.getValue({ fieldId: 'custitem_dwr_item_custom_type' });
        var itemStatus = itemNewRecord.getValue({ fieldId: 'custitem_dwr_item_status' });
        var itemStatusText = itemNewRecord.getValue({ fieldId: 'custitem_dwr_item_status' });
        var recordType = context.newRecord.type;

        log.debug(strLoggerTitle + 'quotableStatusValidation - start variableCheck', 'itemType: ' + itemType + '; itemStatus: ' + itemStatus + '; itemStatusText: ' + itemStatusText + '; recType: ' + recordType);

            var message = '';

            if (itemStatusText == 'Quotable') {
                if (itemType != 'Contract') {
                    message += '\n Only Contract SKUs are allowed to use the Quotable status';
                } else {
                    var reqBodyFields = ['displayname', 'custitem_dwr_list_price', 'custitem_dwr_discount_off_msrp'
                        , 'custitem_dwr_2nd_discount_off_msrp', 'cost', 'custitem_dwr_lc_landing_factor'
                        , 'custitem_dwr_lc_total', 'custitem_dwr_production_time', 'custitem_dwr_transit_time'];

                    if (recordType == 'inventoryitem') {
                        reqBodyFields.push('vendor', 'custitem_dwr_first_cost_in_usd', 'custitem_dwr_lc_duty_per');
                    }

                    if (recordType == 'kititem') {
                        reqBodyFields.push('custitem_dwr_kit_parent_vendor');
                    }

                    for (var index = 0; index < reqBodyFields.length; index++) {
                        var value = itemNewRecord.getValue({ fieldId: reqBodyFields[index] });

                        if (value == "" || value == null) {
                            var field = itemNewRecord.getField({ fieldId: reqBodyFields[index] });

                            if (field) {
                                log.debug(strLoggerTitle + 'quotableStatusValidation - valCheck', field.label + '=' + value);
                                message = fieldCheck(field, message);
                            }
                        }
                    }

                    if (recordType == 'kititem') {
                        var numComponents = itemNewRecord.getLineCount({ sublistId: 'member' });
                        log.debug(strLoggerTitle + 'quotableStatusValidation - kitItems Check', 'numComponents = ' + numComponents);

                        var arrMembers = [];
                        for (var index1 = 0; index1 < numComponents; index1++) {
                            var memberId = itemNewRecord.getSublistValue({ sublistId: 'member', field: 'item', line: index1 });
                            arrMembers.push(memberId);
                        }

                        var arrFilters = [];
                        arrFilters.push(search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.ANYOF,
                            values: arrMembers,
                        }));
                        arrFilters.push(search.createFilter({
                            name: 'custitem_dwr_item_status',
                            operator: search.Operator.NONEOF,
                            values: itemStatus
                        }));

                        var kitMemberSearchResults;
                        try {
                            kitMemberSearchResults = getAllSearchResults('inventoryitem', null, arrFilters, null);
                        } catch (error) {
                            message += '\n There was an error validating that all components have an Item Status of Quotable. Please try again.';
                            log.error(strLoggerTitle + ' caught an exception', error);
                        }

                        if (kitMemberSearchResults) {
                            message += '\nAll kit components must have an Item Status of Quotable before the Kit Parent Item Status can be set to Quotable.';
                        }

                    }

                    var retail = itemNewRecord.getMatrixSublistValue({
                        sublistId: 'price1',
                        fieldId: 'price',
                        column: 0,
                        line: 0
                    });

                    log.debug(strLoggerTitle + 'quotableStatusValidation - checking Price', 'retail = ' + retail);

                    if (!retail) {
                        if (!message) {
                            message = 'You must specify a retail price to set the status to "Quotable"';
                        } else {
                            message += '\nRetail Price';
                        }
                    }

                }

                /* -------------------- Execution Context - Logic - Begin ------------------- */
                //
                log.debug(strLoggerTitle + ' Context Type', runtime.executionContext);
                log.audit(strLoggerTitle + ' Message', message);
              
                    if (message) {
                        //removes trailing comma...
                        message = message.replace(/,\s*$/, "");
                    }
                
                //
                /* -------------------- Execution Context - Logic - End ------------------- */
            } 
        //
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Exit-------------<|');
     
       
        return message;
    }
    /* -------------------- Quotable Status Validation - End ------------------- */
    //
    /* -------------------- Ready Status Validation - Begin ------------------- */
    /**
     * 
     * @param {object} context
     * @returns {string}
     */
    function readyStatusValidation(context) {
        var strLoggerTitle = 'Quotable Status Validation';
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Entry-------------<|');
        //
        var message = '';
        var recordType = context.newRecord.type;
        var itemNewRecord = context.newRecord;
            if (recordType == 'inventoryitem') {
                //CMP 02796501 Require Expanded Plastics Field to be populated Yes/No
                var expandedplastic = itemNewRecord.getValue({ fieldId: 'custitem_dwr_expand_plastic' });
                var preferredLocation = itemNewRecord.getValue({ fieldId: 'preferredlocation' });

                if (!expandedplastic) {
                    message += '\n Expanded Plastics field must be populated before Item Status can be set to ready.';
                }

                if (!preferredLocation) {
                    message += '\n Preferred Location must be populated before Item Status can be set to ready.';
                }
            }

            if (recordType == 'kititem') {
                var location = itemNewRecord.getValue({ fieldId: 'location' });
                if (!location) {
                    message += '\n Location must be populated before Item Status can be set to ready.';
                }
            }

            /* -------------------- Execution Context - Logic - Begin ------------------- */
            //
             log.debug(strLoggerTitle + ' Context Type', runtime.executionContext);
             log.audit(strLoggerTitle + ' Message', message);
           
                 if (message) {
                     //removes trailing comma...
                     message = message.replace(/,\s*$/, "");
                 }
             
            //
            /* -------------------- Execution Context - Logic - End ------------------- */
        //
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Exit-------------<|');
        return message;
    }
    /* -------------------- Ready Status Validation - End ------------------- */
    //
    /* -------------------------- CMP 05192708 - End -------------------------- */
    //
    //
    /* -------------------------- CMP 05193120 - Begin -------------------------- */
    //
    /* --------------------------- create UPC - Begin --------------------------- */
    /**
     * 
     * @param {string} skuCode 
     * @param {object} context
     * @returns {string | object}
     */
    function createUPC(skuCode, context) {
        var strLoggerTitle = 'Create UPC';
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Entry-------------<|');
        //
        var returnValue;
        try {
            var skuCodeValue;
            if (!skuCode) {
                skuCodeValue = context.getValue({ fieldId: 'name' });
            } else {
                skuCodeValue = skuCode
            }

            log.debug(strLoggerTitle + ' Values', 'SKU CODE VALUE: ' + skuCodeValue + ' SKU CODE PARAMETER: ' + skuCode);

            if (skuCodeValue && Number(skuCodeValue)) {

                while (skuCodeValue.length < 11) {
                    skuCodeValue = '0' + skuCodeValue;
                }

                var checkDigit = getUPCCheckDigit(skuCodeValue);
                log.debug(strLoggerTitle + ' Check Digit Value', 'Check Digit: ' + checkDigit);

                var upc = skuCodeValue + checkDigit;
                log.debug(strLoggerTitle + ' UPC VALUE', 'UPC : ' + upc);

                returnValue = upc;

            } else {
                returnValue = null;
            }
            log.audit(strLoggerTitle, 'Return Value: ' + returnValue);
        } catch (error) {
            log.error(strLoggerTitle + ' caught an exception', error);
        }
        //
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Exit-------------<|');

        return returnValue;

    }
    /* --------------------------- create UPC - End --------------------------- */
    //
    /* ------------------------ getUPCCheckDigit - Begin ------------------------ */
    /**
     * 
     * @param {string} upc 
     * @returns {number}
     */
    function getUPCCheckDigit(upc) {
        var strLoggerTitle = 'Create UPC';
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Entry-------------<|');
        //
        var checkDigit;
        try {
            var chars = upc.toString().split('');
            var oddSum = 0.0;
            var evenSum = 0.0;
            for (var x = 0; x < chars.length; x++) {
                if ((x + 1) % 2 == 0) {
                    evenSum += parseFloat(chars[x]);
                }
                else {
                    oddSum += parseFloat(chars[x]);
                }
            }
            var modTen = ((oddSum * 3) + evenSum) % 10;
            if (modTen == 0) {
                checkDigit = modTen;
            }
            else {
                checkDigit = 10 - modTen;
            }
            log.audit(strLoggerTitle + ' Check Digit', checkDigit);
        } catch (error) {
            log.error(strLoggerTitle + ' caught an exception', error);
        }
        //
        log.audit(strLoggerTitle, '|>------------- ' + strLoggerTitle + ' -Exit-------------<|');
        return checkDigit;
    }
    /* ------------------------- getUPCCheckDigit - End ------------------------- */
    //
    /* --------------------------- CMP 05193120 - End --------------------------- */
    //
    return {
        isEmpty: isEmpty,
        isNotEmpty: isNotEmpty,
        forceParseFloat: forceParseFloat,
        getBooleanValue: getBooleanValue,
        getAllSearchResults: getAllSearchResults,
        containsObject: containsObject,
        getColumn: getColumn,
        getSelectionsFromField: getSelectionsFromField,
        fullSearch: fullSearch,
        toTitleCase: toTitleCase,
        flattenObjChildren: flattenObjChildren,
        convertObjArrToPropArr: convertObjArrToPropArr,
        createErrorOrAlert: createErrorOrAlert,
        syncedWithSite: syncedWithSite,
        isDeploymentRunning: isDeploymentRunning,
        sleep: sleep,
        getCSVRecords: getCSVRecords,
        firstBy: firstBy,
        CommonFunc_getWebLocationforAea: getWebLocationforAea, //eventually retire
        CommonFunc_getLocationBasedOnSource: getLocationBasedOnSource,//eventually retire
        Common_Functions_RunRequestURL: RunRequestURL,
        RunRequestURL: RunRequestURL,
        getLocationBasedOnSource: getLocationBasedOnSource,
        getWebLocationforAea: getWebLocationforAea,
        createNote: createNote,
        formatDate: formatDate,
        frontPadZeroes: frontPadZeroes,
        getDate: getDate,
        evalCyberSourceResult: evalCyberSourceResult,
        addOrderPaymentNotes: addOrderPaymentNotes,
        getItemRecordList: getItemRecordList, // CMP 05086064
        getSufficientLocation: getSufficientLocation,  // CMP 05086064
        checkForWarningShippingState: checkForWarningShippingState, // CMP 05198095 
        fieldCheck: fieldCheck,//CMP 05192708
        readyStatusValidation: readyStatusValidation, //CMP 05192708
        regularStatusValidation: regularStatusValidation, //CMP 05192708
        quotableStatusValidation: quotableStatusValidation, //CMP 05192708
        getUPCCheckDigit: getUPCCheckDigit, // CMP 05193120
        createUPC: createUPC // CMP 05193120
    }
})
