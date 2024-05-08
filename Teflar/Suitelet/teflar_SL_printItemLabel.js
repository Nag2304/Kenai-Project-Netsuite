/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/
define(['N/ui/serverWidget', 'N/search'], function (ui, search) {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  const onRequest = (context) => {
    const strLoggerTitle = 'On Request';
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      //
      /* ---------------------------- GET METHOD Begin ---------------------------- */
      if (context.request.method === 'GET') {
        //
        /* --------------------------- Create Form - Begin -------------------------- */
        // Create form
        const form = ui.createForm({
          title: 'Print Item Labels Custom',
        });
        //
        /* ------------------------------ Fields Begin ------------------------------ */
        // Add item type select field
        const itemTypeField = form.addField({
          id: 'custpage_item_type',
          label: 'Sub-Item Of',
          type: ui.FieldType.SELECT,
        });
        // Add options to item type select field
        itemTypeField.addSelectOption({
          value: '',
          text: 'None',
        });
        populateItemType(itemTypeField);
        //
        // Add SELECT ITEM NUMBER free-form text field
        const itemNumberField = form.addField({
          id: 'custpage_item_number',
          label: 'ITEM CONTAINS',
          type: ui.FieldType.TEXT,
        });
        //
        /* ------------------------------ Fields End ------------------------------ */
        //
        /* ----------------------------- Sublist - Begin ---------------------------- */
        // Add sublist to display search results
        var sublist = form.addSublist({
          id: 'custpage_item_list',
          label: 'Items',
          type: ui.SublistType.LIST,
        });
        sublist.addField({
          id: 'custpage_print',
          label: 'Print',
          type: ui.FieldType.CHECKBOX,
        });
        sublist.addField({
          id: 'custpage_item_internalid',
          label: 'Internal ID',
          type: ui.FieldType.TEXT,
        });
        sublist.addField({
          id: 'custpage_item_name',
          label: 'Item Name',
          type: ui.FieldType.TEXT,
        });
        sublist.addField({
          id: 'custpage_upc_code',
          label: 'UPC Code',
          type: ui.FieldType.TEXT,
        });
        sublist.addField({
          id: 'custpage_display_name',
          label: 'Display Name',
          type: ui.FieldType.TEXT,
        });
        sublist.addField({
          id: 'custpage_gtin14',
          label: 'GTIN 14',
          type: ui.FieldType.TEXT,
        });
        // Add buttons to mark/unmark all items and print GTIN 12/14
        sublist.addMarkAllButtons();
        /* ------------------------------ Sublist - End ----------------------------- */
        //
        /* ----------------------------- Buttons - Begin ---------------------------- */
        form.addButton({
          id: 'custpage_print_gtin12',
          label: 'Print GTIN 12',
          functionName: 'printGTIN12',
        });
        form.addButton({
          id: 'custpage_print_gtin14',
          label: 'Print GTIN 14',
          functionName: 'printGTIN14',
        });
        form.addButton({
          id: 'custpage_apply_filters',
          label: 'Apply Filters',
          functionName: 'applyFilters',
        });
        /* ------------------------------ Buttons - End ----------------------------- */
        //
        /* ---------------------------- Create Form - End --------------------------- */
        //
        /* -------------------------- Client Script - Begin ------------------------- */
        form.clientScriptModulePath = './teflar_CS_printResults.js';
        /* -------------------------- Client Script - End ------------------------- */
        //
        /* ------------------------ Call the Search function - Begin ----------------------- */
        checkParameters(context.request, form);
        /* ------------------------- Call the Search function - End ------------------------ */
        //
        /* --------------------------- Write Form - Begin --------------------------- */
        // Return form to user
        context.response.writePage(form);
        /* --------------------------- Write Form - End --------------------------- */
        //
      }
      /* ---------------------------- GET METHOD End ---------------------------- */
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Exit--------------<|'
    );
  };
  /* ----------------------------- onRequest - End ---------------------------- */
  //
  /* ----------------------- Internal Functions - Begin ----------------------- */
  //
  /*  *********************** populateItemType - Begin  *********************** */
  /**
   *
   * @param {object} itemType
   */
  const populateItemType = (itemType) => {
    const strLoggerTitle = ' Populate Item Type ';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //

    try {
      const itemSearchObj = search.create({
        type: search.Type.ITEM,
        filters: [['matrix', 'is', 'T'], 'AND', ['isinactive', 'is', 'F']],
        columns: [
          search.createColumn({
            name: 'itemid',
            sort: search.Sort.ASC,
            label: 'Name',
          }),
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        ],
      });
      var searchResultCount = itemSearchObj.runPaged().count;
      log.debug('itemSearchObj result count', searchResultCount);
      // Run the search
      itemSearchObj.run().each((result) => {
        itemType.addSelectOption({
          value: result.getValue('internalid'),
          text: result.getValue('itemid'),
        });
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
  /*  *********************** populateItemType - End  *********************** */
  //
  /*  *********************** checkParameters - Begin *********************** */
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
          custpage_item_type: parameters['itemtype'],
          custpage_item_number: parameters['itemname'],
        };
        // Field IDS
        const fieldIds = Object.keys(filters);
        log.audit(strLoggerTitle + ' Field IDs Object Keys', fieldIds);

        fieldIds.forEach((fieldId) => {
          log.audit(strLoggerTitle + ' Field IDS Get Value', filters[fieldId]);
          form.getField(fieldId).defaultValue = filters[fieldId];
        });
        //
        log.audit(strLoggerTitle + ' Field IDS', fieldIds);

        // Columns
        const searchColumns = [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({
            name: 'itemid',
            sort: search.Sort.ASC,
            label: 'Name',
          }),
          search.createColumn({ name: 'displayname', label: 'Display Name' }),
          search.createColumn({ name: 'upccode', label: 'UPC Code' }),
          search.createColumn({ name: 'custitem5', label: 'GTIN 14' }),
        ];
        //

        // Filters
        const searchFilters = [];
        searchFilters.push(['matrixchild', 'is', 'T'], 'AND');
        log.audit(
          strLoggerTitle + ' Item Type ',
          filters['custpage_item_type']
        );
        if (filters['custpage_item_type'] !== 'None') {
          searchFilters.push([
            'name',
            'haskeywords',
            filters['custpage_item_type'],
          ]);
        } else if (filters['custpage_item_number'] != '') {
          searchFilters.push([
            'name',
            'contains',
            filters['custpage_item_number'],
          ]);
        }
        //

        // Load Items
        loadItems(form, searchFilters, searchColumns);
        //
      }
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
  /*  *********************** checkParameters - End  *********************** */
  //
  /*  *********************** loadItems - Begin  *********************** */
  const loadItems = (form, filters, columns) => {
    const strLoggerTitle = ' Load Items ';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      const sublist = form.getSublist('custpage_item_list');
      log.audit(strLoggerTitle + ' Search Filters', filters);
      // Create Search
      const itemSearchObj = search.create({
        type: search.Type.ITEM,
        filters: filters,
        columns: columns,
      });
      const searchResultCount = itemSearchObj.runPaged().count;
      log.audit('salesorderSearchObj result count', searchResultCount);
      //
      // Run the search
      let index = 0;
      itemSearchObj.run().each((result) => {
        const internalId = result.getValue('internalid');
        const itemId = result.getValue('itemid');
        const displayName = result.getValue('displayname');
        const upcCode = result.getValue('upccode');
        const gtin14 = result.getValue('custitem5');
        //
        if (internalId) {
          sublist.setSublistValue({
            id: 'custpage_item_internalid',
            line: index,
            value: internalId,
          });
        }
        if (itemId) {
          sublist.setSublistValue({
            id: 'custpage_item_name',
            line: index,
            value: itemId,
          });
        }
        if (displayName) {
          sublist.setSublistValue({
            id: 'custpage_display_name',
            line: index,
            value: displayName,
          });
        }
        if (upcCode) {
          sublist.setSublistValue({
            id: 'custpage_upc_code',
            line: index,
            value: upcCode,
          });
        }
        if (gtin14) {
          sublist.setSublistValue({
            id: 'custpage_gtin14',
            line: index,
            value: gtin14,
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
  /*  *********************** loadItems - End  *********************** */
  //
  /* ------------------------ Internal Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
