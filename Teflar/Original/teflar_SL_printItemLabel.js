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
          label: 'Item Type',
          type: ui.FieldType.SELECT,
        });
        // Add options to item type select field
        itemTypeField.addSelectOption({
          value: 'All',
          text: 'All',
        });
        itemTypeField.addSelectOption({
          value: 'InvtPart',
          text: 'Inventory Item',
        });
        itemTypeField.addSelectOption({
          value: 'Group',
          text: 'Item Group',
        });
        itemTypeField.addSelectOption({
          value: 'Kit',
          text: 'Kit/Package',
        });
        itemTypeField.addSelectOption({
          value: 'Markup',
          text: 'Markup',
        });
        itemTypeField.addSelectOption({
          value: 'NonInvtPart',
          text: 'Non-inventory Item',
        });
        itemTypeField.addSelectOption({
          value: 'OthCharge',
          text: 'Other Charge',
        });
        itemTypeField.addSelectOption({
          value: 'Payment',
          text: 'Payment',
        });
        itemTypeField.addSelectOption({
          value: 'Service',
          text: 'Service',
        });
        itemTypeField.defaultValue = 'All';
        //
        // Add SELECT ITEM NUMBER free-form text field
        const selectItemNumberField = form.addField({
          id: 'custpage_select_item_number',
          label: 'SELECT ITEM NUMBER',
          type: ui.FieldType.TEXT,
        });
        //
        const batchSize = form.addField({
          id: 'custpage_batch_size',
          type: ui.FieldType.INTEGER,
          label: 'Batch Size',
        });
        batchSize.defaultValue = 100;
        /* ------------------------------ Fields End ------------------------------ */
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
        form.addSubmitButton({
          label: 'Submit',
        });
        /* ------------------------------ Buttons - End ----------------------------- */
        //
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
        // Add buttons to mark/unmark all items and print GTIN 12/14
        sublist.addMarkAllButtons();
        /* ------------------------------ Sublist - End ----------------------------- */
        //
        /* ---------------------------- Create Form - End --------------------------- */
        //
        /* -------------------------- Client Script - Begin ------------------------- */
        form.clientScriptModulePath = './teflar_CS_printResults.js';
        /* -------------------------- Client Script - End ------------------------- */
        //
        /* ------------------------ Call the Search function - Begin ----------------------- */
        retrieveItemSearchResults(context, form, sublist);
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
  /*  *********************** retrieveItemSearchResults - Begin  *********************** */
  /**
   * @param {object} context
   * @param {object} form
   * @param {object} sublist
   */
  const retrieveItemSearchResults = (context, form, sublist) => {
    const strLoggerTitle = ' Retrieve Item Search Results';
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Entry------------------<|'
    );
    //
    try {
      // Retrieve Paramters
      const parameters = context.request.parameters;
      log.debug(strLoggerTitle + 'Request Parameters', parameters);

      const itemType = form.getField('custpage_item_type').defaultValue;
      const batchSize = form.getField('custpage_batch_size').defaultValue;
      //
      log.debug(strLoggerTitle + 'Fields', {
        typeOfItem: itemType,
        resultSize: batchSize,
      });

      const filters = getFilters(itemType);
      //
      /* ----------------------- Create & Run Search - Begin ---------------------- */
      // Create saved search and run it
      const itemSearch = search.create({
        type: search.Type.ITEM,
        filters: filters,
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({
            name: 'itemid',
            sort: search.Sort.ASC,
            label: 'Name',
          }),
          search.createColumn({ name: 'displayname', label: 'Display Name' }),
          search.createColumn({ name: 'upccode', label: 'UPC Code' }),
        ],
      });
      //
      const searchResultCount = itemSearch.runPaged().count;
      log.debug(strLoggerTitle, 'Search Result Count:' + searchResultCount);
      //

      let index = 0;

      let current = 0;
      itemSearch.run().each(function (result) {
        const internalId = result.getValue('internalid');
        const itemId = result.getValue('itemid');
        const displayName = result.getValue('displayname');
        const upcCode = result.getValue('upccode');
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
        index++;
        current++;
        return current < batchSize;
      });
      /* ----------------------- Create & Run Search - End ---------------------- */
      //
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>------------------' + strLoggerTitle + '-Exit------------------<|'
    );
    //
  };
  /*  *********************** retrieveItemSearchResults - End  *********************** */
  //
  //
  /* *********************** getFilters - Begin *********************** */
  /**
   *
   * @param {string} itemType
   * @returns
   */
  function getFilters(itemType) {
    var strLoggerTitle = ' Get Filters';
    var filters = [];
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      if (itemType === 'All') {
        filters.push([
          'type',
          'anyof',
          'Assembly',
          'Description',
          'Discount',
          'GiftCert',
          'InvtPart',
          'Group',
          'Kit',
          'Markup',
          'NonInvtPart',
          'OthCharge',
          'Payment',
          'Service',
          'Subtotal',
        ]);
      } else if (itemType) {
        filters.push(['type', 'anyof', itemType]);
      }
    } catch (error) {
      log.error(strLoggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      strLoggerTitle,
      '|>--------------' + strLoggerTitle + ' - Exit--------------<|'
    );
    return filters;
  }
  /* *********************** getFilters - End *********************** */
  //
  /* ------------------------ Internal Functions - End ------------------------ */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
