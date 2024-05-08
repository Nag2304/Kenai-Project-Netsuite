/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
const CONFIG_FILE = 'Picking Ticket Config/Orders Printed (Do not delete).txt';
define([
  'N/ui/serverWidget',
  'N/log',
  'N/search',
  'N/record',
  'N/render',
  'N/file',
], function (serverWidget, log, search, record, render, file) {
  const exports = {};
  /* ---------------------------- On Request Begin ---------------------------- */
  function onRequest(context) {
    try {
      /* ---------------------------- GET METHOD Begin ---------------------------- */
      if (context.request.method === 'GET') {
        /* ---------------------------- Create Form Begin --------------------------- */
        var form = serverWidget.createForm({ title: 'Pick Release' });

        form.addButton({
          label: 'Apply filters',
          id: 'custpage_filter_button',
          functionName: 'applyFilters',
        });

        //
        /* -------------------------- Location field Begin -------------------------- */
        var locationField = form.addField({
          id: 'custpage_location',
          type: serverWidget.FieldType.SELECT,
          label: 'LOCATION',
          source: 'location',
        });
        locationField.defaultValue = 1;
        locationField.updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTROW,
        });
        locationField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.NORMAL,
        });
        /* --------------------------- Location field End --------------------------- */
        //
        /* ---------------------- Form Type Select Field Begin ---------------------- */
        var formType = form.addField({
          id: 'custpage_formtype',
          type: serverWidget.FieldType.SELECT,
          label: 'FORM',
        });
        formType.addSelectOption({
          value: 1,
          text: 'eComm Picking Ticket',
        });
        formType.addSelectOption({
          value: 2,
          text: 'Whole Sale Picking Ticket',
        });
        /* ----------------------- Form Type Select Field End ----------------------- */
        //
        /* ---------------------------- Item Field Begin ---------------------------- */
        var itemField = form.addField({
          id: 'custpage_item',
          type: serverWidget.FieldType.TEXT,
          label: 'item',
        });
        /* ----------------------------- Item Field End ----------------------------- */
        /* ---------------------------- Bin Ref Field Begin ---------------------------- */
        var binrefField = form.addField({
          id: 'custpage_binref',
          type: serverWidget.FieldType.TEXT,
          label: 'bin reference',
        });
        /* ----------------------------- Bin Ref Field End ----------------------------- */

        var fromDateField = form.addField({
          id: 'custpage_from_date',
          type: serverWidget.FieldType.DATE,
          label: 'FROM DATE',
        });

        var toDateField = form.addField({
          id: 'custpage_to_date',
          type: serverWidget.FieldType.DATE,
          label: 'TO DATE',
        });

        //
        /* ---------------------- Reprint Check Box Field Begin --------------------- */
        var reprintCheckbox = form.addField({
          id: 'custpage_reprint',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'ALLOW REPRINTING',
        });
        //   reprintCheckbox.layoutType = serverWidget.FieldLayoutType.STARTROW;
        reprintCheckbox.updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTCOL,
        });
        /* ----------------------- Reprint Check Box Field End ---------------------- */
        //
        /* ---------------------- Hold for Ship Check Box Begin --------------------- */
        var holdShipCheckbox = form.addField({
          id: 'custpage_holdship',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'HOLD SHIP',
        });
        /* ---------------------- Hold for Ship Check Box End --------------------- */
        //
        /* ---------------------- Include Gift Note Check Box Begin --------------------- */
        var giftNoteCheckbox = form.addField({
          id: 'custpage_includesgiftnote',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'INCLUDES GIFT NOTE',
        });
        /* ----------------------  Include Gift Note Check Box End --------------------- */
        //
        /* ---------------------- Include Stack Check Box Begin --------------------- */
        var stackCheckbox = form.addField({
          id: 'custpage_includesstack',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'INCLUDES STACK',
        });
        /* ---------------------- Include Stack Check Box End --------------------- */
        //
        /* ---------------------- Personalized Item Check Box Begin --------------------- */
        var personalizedItemCheckbox = form.addField({
          id: 'custpage_personalizeditem',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'PERSONALIZED ITEM',
        });
        /* ---------------------- Personalized Item Check Box End --------------------- */
        //
        //
        /* ---------------------- Process Batch Pick Check Box Begin --------------------- */
        var personalizedItemCheckbox = form.addField({
          id: 'custpage_processbatchpick',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'PROCESS BATCH PICK',
        });
        /* ---------------------- Process Batch Pick Check Box End --------------------- */
        //
        form.addField({
          id: 'custpage_single_line',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'One Line Orders',
        });
        /* ------------------------ Ship Via MultiSelect Begin ------------------------ */
        var shipViaMultiSelect = form.addField({
          id: 'custpage_shipvia',
          type: serverWidget.FieldType.MULTISELECT,
          label: 'SHIP VIA',
        });
        shipViaMultiSelect.addSelectOption({
          value: '',
          text: ' ',
        });
        var shipitemSearchObj = search.create({
          type: 'shipitem',
          filters: [],
          columns: [
            search.createColumn({
              name: 'itemid',
              sort: search.Sort.ASC,
              label: 'Name',
            }),
            search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          ],
        });
        var searchResultCount = shipitemSearchObj.runPaged().count;
        log.debug('shipitemSearchObj result count', searchResultCount);
        shipitemSearchObj.run().each(function (result) {
          shipViaMultiSelect.addSelectOption({
            value: result.getValue('internalid'),
            text: result.getValue('itemid'),
          });
          return true;
        });
        shipViaMultiSelect.updateBreakType({
          breakType: serverWidget.FieldBreakType.STARTCOL,
        });

        var channelType = form.addField({
          id: 'custpage_channel',
          type: serverWidget.FieldType.SELECT,
          label: 'SALES CHANNEL',
        });
        channelType.addSelectOption({
          value: 1,
          text: 'Ecommerce',
        });
        channelType.addSelectOption({
          value: 2,
          text: 'Wholesale',
        });

        var batchSize = form.addField({
          id: 'custpage_batch_size',
          type: serverWidget.FieldType.INTEGER,
          label: 'Batch Size',
        });
        batchSize.defaultValue = 100;

        var printOption = form.addField({
          id: 'custpage_print_options',
          type: serverWidget.FieldType.SELECT,
          label: 'PRINT OPTIONS',
        });
        printOption.addSelectOption({ value: 1, text: 'Not printed' });
        printOption.addSelectOption({ value: 2, text: 'Already printed' });
        printOption.addSelectOption({ value: 3, text: 'Both' });
        printOption.defaultValue = 1;

        var sourceNameOption = form.addField({
          id: 'custpage_source_name',
          type: serverWidget.FieldType.SELECT,
          label: 'SOURCE NAME',
        });
        sourceNameOption.addSelectOption({ value: 0, text: 'All' });
        sourceNameOption.addSelectOption({ value: 1, text: '1800Flowers' });
        sourceNameOption.addSelectOption({ value: 2, text: 'Etsy' });
        sourceNameOption.addSelectOption({ value: 3, text: 'Facebook' });
        sourceNameOption.addSelectOption({ value: 4, text: 'L + D Store' });
        sourceNameOption.defaultValue = 1;

        /* ------------------------ Ship Via Multi Select End ------------------------ */
        //
        /* ------------------------------ Sublist Begin ----------------------------- */
        var sublistSO = form.addSublist({
          id: 'custpage_sublist',
          type: serverWidget.SublistType.LIST,
          label: 'ORDERS',
        });
        var soId = sublistSO.addField({
          id: 'custpage_sublist_soid',
          type: serverWidget.FieldType.TEXT,
          label: 'SOID',
        });
        soId.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
        });
        sublistSO.addField({
          id: 'custpage_sublist_print',
          type: serverWidget.FieldType.CHECKBOX,
          label: 'PRINT',
        });
        sublistSO.addField({
          id: 'custpage_sublist_date',
          type: serverWidget.FieldType.TEXT,
          label: 'DATE',
        });
        sublistSO.addField({
          id: 'custpage_sublist_type',
          type: serverWidget.FieldType.TEXT,
          label: 'TYPE',
        });
        sublistSO.addField({
          id: 'custpage_sublist_sonumber',
          type: serverWidget.FieldType.TEXT,
          label: 'SO NUMBER',
        });
        sublistSO.addField({
          id: 'custpage_shopify_number',
          type: serverWidget.FieldType.TEXT,
          label: 'Shopify Order #',
        });
        sublistSO.addField({
          id: 'custpage_sublist_customer',
          type: serverWidget.FieldType.TEXT,
          label: 'CUSTOMER',
        });
        sublistSO.addField({
          id: 'custpage_sublist_shipto',
          type: serverWidget.FieldType.TEXT,
          label: 'SHIP TO',
        });
        sublistSO.addField({
          id: 'custpage_sublist_shipvia',
          type: serverWidget.FieldType.TEXT,
          label: 'SHIP VIA',
        });
        sublistSO.addField({
          id: 'custpage_sublist_source_name',
          type: serverWidget.FieldType.TEXT,
          label: 'SOURCE NAME',
        });
        sublistSO.addMarkAllButtons();
        /* ------------------------------- Sublist End ------------------------------ */
        //
        /* ------------------------------ Buttons Begin ----------------------------- */
        form.addSubmitButton({
          label: 'Submit',
        });
        /* ------------------------------- Buttons End ------------------------------ */
        //
        /* ----------------------------- Create Form End ---------------------------- */
        //
        /* --------------------- Client Script Connection Begin --------------------- */
        form.clientScriptModulePath =
          'SuiteScripts/pickRelease_cs_filter_v1.js';
        /* --------------------- Client Script Connection End --------------------- */
        //
        checkParameters(context.request, form);
        /* ---------------------------- Write Form Begin ---------------------------- */
        context.response.writePage(form);
        /* ----------------------------- Write Form End ----------------------------- */
      }
    } catch (err) {
      log.debug({ title: 'Form errored Out', details: err });
    }
  }

  function checkParameters(request, form) {
    var parameters = request.parameters;
    var hasFilters = parameters['filter'];
    var filters = {
      custpage_location: parameters['location'],
      custpage_formtype: parameters['form'],
      custpage_item: parameters['item'],
      custpage_binref: parameters['binref'],

      custpage_from_date: parameters['fromDate'],
      custpage_to_date: parameters['toDate'],

      custpage_reprint: getBoolean(parameters['reprinting']),
      custpage_holdship: getBoolean(parameters['holdship']),
      custpage_includesgiftnote: getBoolean(parameters['giftNote']),
      custpage_includesstack: getBoolean(parameters['stack']),
      custpage_personalizeditem: getBoolean(parameters['personalized']),
      custpage_processbatchpick: getBoolean(parameters['batch']),
      custpage_shipvia: parameters['ship'],
      custpage_channel: parameters['channel'],
      custpage_single_line: getBoolean(parameters['singleline']),

      custpage_batch_size: parameters['custpage_batch_size'],
      custpage_print_options: parameters['custpage_print_options'],
      custpage_source_name: parameters['custpage_source_name'],
    };

    if (hasFilters == 'T') {
      var fieldIds = Object.keys(filters);
      fieldIds.forEach(function (fieldId) {
        if (fieldId.indexOf('shipvia') > -1) {
          form.getField(fieldId).defaultValue = filters[fieldId].split(',');
        } else form.getField(fieldId).defaultValue = filters[fieldId];
      });
      var searchFilters = [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['mainline', 'is', 'F'],
        'AND',
        ['status', 'anyof', 'SalesOrd:D', 'SalesOrd:E', 'SalesOrd:B'] /*,
           "AND",
           ["item.matrixchild", "is", "T"]*/,
      ];
      pushFileFilters(searchFilters);
      if (filters['custpage_holdship'] == 'T') {
        searchFilters.push('AND');
        searchFilters.push([
          'custbody_ld_hold_for_shipment',
          'is',
          filters['custpage_holdship'],
        ]);
      }
      if (filters['custpage_includesgiftnote'] == 'T') {
        searchFilters.push('AND');
        searchFilters.push([
          'custbody_ld_incl_gift_note',
          'is',
          filters['custpage_includesgiftnote'],
        ]);
      }
      if (filters['custpage_includesstack'] == 'T') {
        searchFilters.push('AND');
        searchFilters.push([
          'custbody_ld_includes_stack',
          'is',
          filters['custpage_includesstack'],
        ]);
      }
      if (filters['custpage_personalizeditem'] == 'T') {
        searchFilters.push('AND');
        searchFilters.push([
          'custbody_ld_peronalized_item',
          'is',
          filters['custpage_personalizeditem'],
        ]);
      }
      if (filters['custpage_location'] != '') {
        searchFilters.push('AND');
        searchFilters.push(['location', 'anyof', filters['custpage_location']]);
      }
      if (filters['custpage_shipvia'] != '') {
        var shipArr = ['shipmethod', 'anyof'];
        var splitShip = filters['custpage_shipvia'].split(',');
        splitShip.forEach(function (shp) {
          shipArr.push(shp);
        });
        searchFilters.push('AND');
        searchFilters.push(shipArr);
      }
      if (filters['custpage_item'] != '') {
        searchFilters.push('AND');
        searchFilters.push(['item.name', 'contains', filters['custpage_item']]);
      }
      if (filters['custpage_binref'] != '') {
        // var binId = searchBinInternalId(filters["custpage_binref"]);
        // log.debug('binId',binId);
        if (filters['custpage_binref']) {
          searchFilters.push('AND');
          searchFilters.push([
            'formulatext: {custcol_ld_bin_reference}',
            'startswith',
            filters['custpage_binref'],
          ]);
        }
      } else {
        //searchFilters.push("AND");
        //searchFilters.push(["item.custitem_ld_bin_reference", "anyof", "@NONE@"]);
      }
      log.debug(
        'checkParameters',
        'filters["custpage_from_date"]: ' + filters['custpage_from_date']
      );
      log.debug(
        'checkParameters',
        'filters["custpage_to_date"]: ' + filters['custpage_to_date']
      );
      if (
        filters['custpage_from_date'] != null &&
        filters['custpage_from_date'].length > 0
      ) {
        searchFilters.push('AND');
        searchFilters.push([
          'trandate',
          'onorafter',
          filters['custpage_from_date'],
        ]);
      }
      if (
        filters['custpage_to_date'] != null &&
        filters['custpage_to_date'].length > 0
      ) {
        searchFilters.push('AND');
        searchFilters.push([
          'trandate',
          'onorbefore',
          filters['custpage_to_date'],
        ]);
      }

      if (filters['custpage_reprint'] == 'F') {
        searchFilters.push('AND');
        searchFilters.push(['custbody_printed_ticket', 'is', 'F']);
      }

      if (filters['custpage_channel'] != '') {
        searchFilters.push('AND');
        searchFilters.push([
          'cseg_slchnl',
          'anyof',
          filters['custpage_channel'],
        ]);
      }

      if (filters['custpage_print_options'] == 1) {
        // Not Printed
        searchFilters.push('AND');
        searchFilters.push(['custbody_printed_ticket', 'is', 'F']);
      } else if (filters['custpage_print_options'] == 2) {
        // Printed
        searchFilters.push('AND');
        searchFilters.push(['custbody_printed_ticket', 'is', 'T']);
      }

      log.debug(
        'checkParameters',
        'filters["custpage_source_name"]: ' + filters['custpage_source_name']
      );
      log.debug(
        'checkParameters',
        '(filters["custpage_source_name"] > 0): ' +
          (filters['custpage_source_name'] > 0)
      );
      if (filters['custpage_source_name'] > 0) {
        // Source Name
        searchFilters.push('AND');
        searchFilters.push([
          'custbody4',
          'anyof',
          filters['custpage_source_name'],
        ]);
      }

      log.debug('parameters', filters);
      log.debug('filters', searchFilters);
      loadOrders(
        searchFilters,
        form,
        filters['custpage_single_line'],
        filters['custpage_item'],
        filters['custpage_batch_size']
      );
    }
  }
  function pushFileFilters(searchFilters) {
    var fileObj = file.load(CONFIG_FILE);
    var contents = fileObj.getContents();

    if (contents != '' && contents != null) {
      if (
        contents.split('**\n')[1] != null &&
        contents.split('**\n')[1] != ''
      ) {
        var records = contents.split('**\n')[1].split(',');
        var filter = ['internalid', 'noneof'];
        records.forEach(function (record) {
          if (record != '' && record != null) {
            filter.push(record);
          }
        });
        if (filter.length > 2) {
          searchFilters.push('AND');
          searchFilters.push(filter);
        }
      }
    }
  }
  function loadOrders(filterArr, form, singleLine, itemName, batch_size) {
    var salesorderSearchObj = search.create({
      type: 'salesorder',
      filters: filterArr,
      columns: [
        search.createColumn({
          name: 'trandate',
          summary: 'GROUP',
          label: 'Date',
        }),
        search.createColumn({
          name: 'type',
          summary: 'GROUP',
          label: 'Type',
        }),
        search.createColumn({
          name: 'tranid',
          summary: 'GROUP',
          label: 'Document Number',
        }),
        search.createColumn({
          name: 'otherrefnum',
          summary: 'GROUP',
          label: 'otherrefnum',
        }),
        /*
           search.createColumn({
             name: "internalid",
             join: "customerMain",
             summary: "GROUP",
             label: "customer id"
           }),
           */
        search.createColumn({
          name: 'altname',
          join: 'customerMain',
          summary: 'GROUP',
          label: 'Name',
        }),
        search.createColumn({
          name: 'shipaddress',
          summary: 'GROUP',
          label: 'Shipping Address',
        }),
        search.createColumn({
          name: 'shipmethod',
          summary: 'GROUP',
          label: 'Ship Via',
        }),
        search.createColumn({
          name: 'custbody4',
          summary: 'GROUP',
          label: 'Source Name',
        }),
        search.createColumn({
          name: 'internalid',
          summary: 'GROUP',
          sort: search.Sort.ASC,
          label: 'Internal ID',
        }),
      ],
    });
    var searchResultCount = salesorderSearchObj.runPaged().count;
    log.debug('salesorderSearchObj result count', searchResultCount);
    var sublist = form.getSublist('custpage_sublist');
    var index = 0;
    var limit = searchResultCount;

    var current = 0;
    salesorderSearchObj.run().each(function (result) {
      var columns = salesorderSearchObj.columns;
      var specificItem = true;
      var orderId = result.getValue(columns[7]);

      if (itemName != '' && itemName != null) {
        specificItem = specificItemOrder(orderId, itemName);
      }

      if (
        ((singleLine == 'T' &&
          orderIsSingleLine(result.getValue(columns[7]))) ||
          singleLine == 'F') &&
        specificItem
      ) {
        sublist.setSublistValue({
          id: 'custpage_sublist_date',
          line: index,
          value: result.getValue(columns[0]),
        });
        sublist.setSublistValue({
          id: 'custpage_sublist_type',
          line: index,
          value: result.getValue(columns[1]),
        });
        sublist.setSublistValue({
          id: 'custpage_sublist_sonumber',
          line: index,
          value: result.getValue(columns[2]),
        });
        sublist.setSublistValue({
          id: 'custpage_shopify_number',
          line: index,
          value: result.getValue(columns[3]),
        });
        sublist.setSublistValue({
          id: 'custpage_sublist_customer',
          line: index,
          value: result.getValue(columns[4]),
        });
        sublist.setSublistValue({
          id: 'custpage_sublist_shipto',
          line: index,
          value: result.getValue(columns[5]),
        });
        sublist.setSublistValue({
          id: 'custpage_sublist_shipvia',
          line: index,
          value: result.getText(columns[6]),
        });
        sublist.setSublistValue({
          id: 'custpage_sublist_source_name',
          line: index,
          value: result.getText(columns[7]),
        });
        sublist.setSublistValue({
          id: 'custpage_sublist_soid',
          line: index,
          value: orderId,
        });
        index++;
      }
      current++;
      return current < batch_size;
    });
  }

  function searchBinInternalId(binnum) {
    var binId = -1;
    var binSearchObj = search.create({
      type: 'bin',
      filters: [['binnumber', 'is', binnum]],
      columns: [
        search.createColumn({
          name: 'binnumber',
          sort: search.Sort.ASC,
          label: 'Bin Number',
        }),
        search.createColumn({ name: 'location', label: 'Location' }),
        search.createColumn({ name: 'memo', label: 'Memo' }),
        search.createColumn({
          name: 'custrecord_rfs_is_default_receive',
          label: 'Is Default Receiving Bin',
        }),
        search.createColumn({
          name: 'custrecord_rfs_is_default_receive_manuf',
          label: 'Is Default Manufacturing Receiving Bin',
        }),
        search.createColumn({
          name: 'custrecord_rfs_do_not_allow_mixed_lots',
          label: 'Do Not Allow Mixed Lots',
        }),
      ],
    });
    var searchResultCount = binSearchObj.runPaged().count;
    log.debug('binSearchObj result count', searchResultCount);
    binSearchObj.run().each(function (result) {
      binId = result.id;
      return true;
    });
    return binId;
  }

  function specificItemOrder(orderId, itemName) {
    var salesorderSearchObj = search.create({
      type: 'salesorder',
      filters: [
        ['type', 'anyof', 'SalesOrd'],
        'AND',
        ['internalid', 'anyof', orderId],
        'AND',
        ['mainline', 'is', 'F'],
        'AND',
        ['item.name', 'contains', itemName] /*, 
           "AND", 
           ["item.matrixchild","is","T"]*/,
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
      ],
    });
    var searchResultCount = salesorderSearchObj.runPaged().count;
    return searchResultCount > 0;
  }
  function orderIsSingleLine(orderId) {
    var transactionSearchObj = search.create({
      type: 'transaction',
      filters: [
        ['mainline', 'is', 'F'] /*,
           "AND",
           ["item.matrixchild", "is", "T"]*/,
        'AND',
        ['internalid', 'anyof', orderId],
      ],
      columns: [
        search.createColumn({ name: 'internalid', label: 'Internal ID' }),
      ],
    });
    var searchResultCount = transactionSearchObj.runPaged().count;
    return searchResultCount < 2;
  }
  function getBoolean(parameter) {
    if (parameter == 'true' || parameter == 'false') {
      if (parameter == 'true') return 'T';
      return 'F';
    } else return parameter;
  }

  /* ----------------------------- on Request End ----------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
