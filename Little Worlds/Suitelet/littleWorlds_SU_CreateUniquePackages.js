/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/
define([
  'N/ui/serverWidget',
  'N/search',
  'N/task',
  'N/file',
  'N/format',
  'N/redirect',
], function (ui, search, task, file, format, redirect) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  const onRequest = (context) => {
    const loggerTitle = 'On Request';
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      //
      /* ---------------------------- GET METHOD - Begin ---------------------------- */
      if (context.request.method === 'GET') {
        log.debug(
          loggerTitle,
          '  /* ---------------------------- GET METHOD - Begin ---------------------------- */'
        );
        //
        /* --------------------------- Create Form - Begin -------------------------- */
        // Create form
        const form = ui.createForm({
          title: 'Print Packages',
        });
        //
        /* ------------------------------ Fields - Begin ------------------------------ */
        // Add item type select field
        const customerField = form.addField({
          id: 'custpage_customer_list',
          label: 'Customer',
          type: ui.FieldType.SELECT,
        });
        // Add options to item type select field
        customerField.addSelectOption({
          value: '',
          text: 'None',
        });
        populateCustomerField(customerField);
        //
        /* ------------------------------ Fields - End ------------------------------ */
        //
        /* ----------------------------- Sublist - Begin ---------------------------- */
        // Add sublist to display search results
        const sublist = form.addSublist({
          id: 'custpage_itemfulfillment_list',
          label: 'Item Fulfillments',
          type: ui.SublistType.LIST,
        });
        sublist.addField({
          id: 'custpage_itemfulfillment_print',
          label: 'Print',
          type: ui.FieldType.CHECKBOX,
        });
        sublist.addField({
          id: 'custpage_itemfulfillment_internalid',
          label: 'Internal ID',
          type: ui.FieldType.TEXT,
        });
        sublist.addField({
          id: 'custpage_itemfulfillment_name',
          label: 'Document Number',
          type: ui.FieldType.TEXT,
        });
        sublist.addField({
          id: 'custpage_itemfulfillment_entityname',
          label: 'Entity Name',
          type: ui.FieldType.TEXT,
        });
        // Add buttons to mark/unmark all items and print GTIN 12/14
        sublist.addMarkAllButtons();
        /* ----------------------------- Sublist - End ---------------------------- */
        //
        /* ----------------------------- Buttons - Begin ---------------------------- */
        form.addButton({
          id: 'custpage_apply_filters',
          label: 'Apply Filters',
          functionName: 'applyFilters',
        });
        form.addSubmitButton({
          label: 'Submit',
        });
        form.addButton({
          id: 'custpage_reset_button',
          label: 'Clear Selection',
          functionName: 'resetFormValues',
        });
        /* ------------------------------ Buttons - End ----------------------------- */
        //
        /* --------------------------- Create Form - End -------------------------- */
        //
        /* -------------------------- Client Script - Begin ------------------------- */
        form.clientScriptModulePath = './littleWorlds_CS_printResults.js';
        /* -------------------------- Client Script - End ------------------------- */
        //
        /* ------------------------ Call the Search function - Begin ----------------------- */
        checkParameters(context.request, form);
        /* ------------------------- Call the Search function - End ------------------------ */
        //
        log.debug(
          loggerTitle,
          '  /* ---------------------------- GET METHOD - End ---------------------------- */'
        );
        /* --------------------------- Write Form - Begin --------------------------- */
        // Return form to user
        context.response.writePage(form);
        /* --------------------------- Write Form - End --------------------------- */
        //
      }
      /* ---------------------------- GET METHOD - End ---------------------------- */
      //
      /* ---------------------------- POST METHOD - Begin ---------------------------- */
      else if (context.request.method === 'POST') {
        log.debug(
          loggerTitle,
          '  /* ---------------------------- POST METHOD - Begin ---------------------------- */'
        );
        //
        const customerID = context.request.parameters['custpage_customer_list'];
        log.debug(loggerTitle, customerID);

        const content = [];
        const csvColumns = [];

        const doc = context.request;
        const sublistLength = doc.getLineCount('custpage_itemfulfillment_list');
        log.debug(loggerTitle, 'Sublist Length: ' + sublistLength);

        csvColumns.push('Item Fulfillment InternalID');

        // Loop Thru the results
        const temp = [];
        for (let index = 0; index < sublistLength; index++) {
          const isSelected = doc.getSublistValue(
            'custpage_itemfulfillment_list',
            'custpage_itemfulfillment_print',
            index
          );
          //
          if (isSelected === 'T') {
            log.debug(loggerTitle, 'Is Selected: ' + isSelected);
            const itemfulfillmentInternalId = doc.getSublistValue(
              'custpage_itemfulfillment_list',
              'custpage_itemfulfillment_internalid',
              index
            );
            temp.push([itemfulfillmentInternalId]);
          }
          //
        }
        let parameterArray = temp;

        if (temp.length > 0) {
          log.debug(loggerTitle + ' Temp File', temp);

          content.push(csvColumns.join(','));

          // Flatten the array and join with newline character
          content.push(temp.flat().join('\n'));
          log.debug(loggerTitle + ' Contents', content);

          // Get today's date and time
          const now = new Date();
          const formattedDateTime = format.format({
            value: now,
            type: format.Type.DATETIME,
          });

          // Create a CSV file
          const fileObj = file.create({
            name: `item_fulfillment_${formattedDateTime}.csv`,
            fileType: file.Type.CSV,
            contents: content.join('\n'),
            folder: 4039, // Set the folder ID
          });

          try {
            const fileId = fileObj.save();
            log.debug('File Created', `File ID: ${fileId}`);

            if (fileId) {
              // Call the Map Reduce Script
              let mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_lw_mr_create_uniquepackage',
                deploymentId: 'customdeploy_lw_mr_create_uniquepackage',
                params: { custscript_lw_fileid: fileId },
              });

              // Submit the map/reduce task
              let mrTaskId = mrTask.submit();
              // Update the authorId value with the internal ID of the user
              // who is the email sender. Update the recipientEmail value
              // with the email address of the recipient.
              let taskStatus = task.checkStatus(mrTaskId);
              if (taskStatus.status === 'FAILED') {
                log.audit(loggerTitle, ' TASK STATUS FAILED');
              } else {
                sleep(20000);
                // Call the suitelet only if the customer id and itemfulfillment array greater
                if (customerID && parameterArray.length) {
                  redirect.toSuitelet({
                    scriptId: 'customscript_lw_sl_show_packages',
                    deploymentId: 'customdeploy_lw_sl_show_packages',
                    parameters: {
                      custparam_customer_name: customerID,
                      custparam_list_item_fulfillments: parameterArray
                        .flat()
                        .join(','),
                    },
                  });
                }
                //
              }
            }
          } catch (e) {
            log.error(loggerTitle + 'Error Creating File', e.message);
          }
        }
        //
        log.debug(
          loggerTitle,
          '  /* ---------------------------- POST METHOD - End ---------------------------- */'
        );
      }
      /* ---------------------------- POST METHOD - End ---------------------------- */
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Exit--------------<|'
    );
  };
  /* ---------------------------- onRequest - End --------------------------- */
  //
  /* ---------------------------- Helper Functions - Begin --------------------------- */
  //
  /*  *********************** populateCustomerField - Begin  *********************** */
  const populateCustomerField = (customer) => {
    const loggerTitle = ' Populate Customer Field';
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Entry--------------<|'
    );
    //
    let arrResult = [];
    try {
      const customerSearchObj = search.create({
        type: 'customer',
        filters: [
          ['isinactive', 'is', 'F'],
          'AND',
          ['isperson', 'is', 'F'],
          'AND',
          ['custentity_lwp_print_labels', 'is', 'T'],
        ],
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({ name: 'altname', label: 'Name' }),
        ],
      });

      var searchResultCount = customerSearchObj.runPaged().count;
      log.debug(loggerTitle, 'Customer Search Obj Count: ' + searchResultCount);

      // Run the search
      let count = 1000;
      let init = true;
      let min = 0;
      let max = 1000;

      while (count === 1000 || init) {
        let resultSet = customerSearchObj.run().getRange({
          start: min,
          end: max,
        });

        arrResult = arrResult.concat(resultSet);
        min = max;
        max += 1000;

        init = false;
        count = resultSet.length;
      }

      const arrResultsLength = arrResult.length;
      log.debug(loggerTitle, ' Arr Results Length ' + arrResultsLength);
      //
      for (let index = 0; index < arrResultsLength; index++) {
        // log.debug(loggerTitle, {
        //   value: arrResult[index].getValue('internalid'),
        //   text: arrResult[index].getValue('altname'),
        // });
        customer.addSelectOption({
          value: arrResult[index].getValue('internalid'),
          text: arrResult[index].getValue('altname'),
        });
      }
      //
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Exit--------------<|'
    );
  };
  /*  *********************** populateCustomerField - End  *********************** */
  //
  /*  *********************** checkParameters - Begin *********************** */
  /**
   *
   * @param {Object} request
   * @param {Object} form
   */
  const checkParameters = (request, form) => {
    const strLoggerTitle = ' Check Parameters';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      const parameters = request.parameters;
      const hasFilters = parameters['filter'];
      //
      log.audit(strLoggerTitle + ' Has Filters', ' Has Filters: ' + hasFilters);
      if (hasFilters == 'T') {
        const filters = {
          custpage_customer_list: parameters['customerList'],
        };
        // Field IDS
        const fieldIds = Object.keys(filters);
        log.audit(strLoggerTitle + ' Field IDs Object Keys', fieldIds);
        //
        fieldIds.forEach((fieldId) => {
          log.audit(strLoggerTitle + ' Field IDS Get Value', filters[fieldId]);
          form.getField(fieldId).defaultValue = filters[fieldId];
        });
        //
        log.audit(strLoggerTitle + ' Field IDS', fieldIds);

        // Columns
        const searchColumns = [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({ name: 'tranid', label: 'Document Number' }),
          search.createColumn({ name: 'entity', label: 'Name' }),
        ];
        //

        // Filters
        const searchFilters = [];
        searchFilters.push(
          ['type', 'anyof', 'ItemShip'],
          'AND',
          ['status', 'anyof', 'ItemShip:A'],
          'AND',
          ['mainline', 'is', 'T'],
          'AND',
          ['custrecord_sps_pack_asn.idtext', 'isempty', ''],
          'AND',
          ['custrecord_sps_pack_asn.custrecord_sps_package_ucc', 'isempty', ''],
          'AND',
          ['custbody_lw_new_package_created', 'is', 'F'],
          'AND'
        );

        log.audit(
          strLoggerTitle + ' Customer ID ',
          filters['custpage_customer_list']
        );
        if (filters['custpage_customer_list'] !== 'None') {
          searchFilters.push([
            'name',
            'anyof',
            filters['custpage_customer_list'],
          ]);
        }
        //

        // Load Items
        loadItemFulfillments(form, searchFilters, searchColumns);
        //
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  };
  /*  *********************** checkParameters - End *********************** */
  //
  /*  *********************** loadItemFulfillments - Begin  *********************** */
  const loadItemFulfillments = (form, filters, columns) => {
    const strLoggerTitle = ' Load ItemFulfillments ';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      const sublist = form.getSublist('custpage_itemfulfillment_list');
      log.audit(strLoggerTitle + ' Search Filters', filters);
      // Create Search
      const itemfulfillmentSearchObj = search.create({
        type: 'itemfulfillment',
        filters: filters,
        columns: columns,
      });
      //
      // Run the search
      let index = 0;
      itemfulfillmentSearchObj.run().each((result) => {
        const internalId = result.getValue('internalid');
        const tranId = result.getValue('tranid');
        const entityName = result.getText('entity');

        if (internalId) {
          sublist.setSublistValue({
            id: 'custpage_itemfulfillment_internalid',
            line: index,
            value: internalId,
          });
        }

        if (tranId) {
          sublist.setSublistValue({
            id: 'custpage_itemfulfillment_name',
            line: index,
            value: tranId,
          });
        }

        if (entityName) {
          sublist.setSublistValue({
            id: 'custpage_itemfulfillment_entityname',
            line: index,
            value: entityName,
          });
        }

        index++;
        return true;
      });
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
  };
  /*  *********************** loadItemFulfillments - End  *********************** */
  //
  /*  *********************** Sleep - Begin  *********************** */
  /**
   *
   * @param {integer} milliseconds
   * @returns
   */
  const sleep = (milliseconds) => {
    const start = Date.now();
    while (true) {
      if (Date.now() - start >= milliseconds) {
        return;
      }
    }
  };
  /*  *********************** Sleep - End  *********************** */
  //
  /* ---------------------------- Helper Functions - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
