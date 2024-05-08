/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

/*global define,log*/

define(['N/ui/serverWidget', 'N/search'], (ui, search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ---------------------------- onRequest - Begin --------------------------- */
  const onRequest = (context) => {
    const loggerTitle = ' On Request Function ';
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      //
      /* ---------------------------- GET METHOD - Begin ---------------------------- */
      if (context.request.method === 'GET') {
        //
        /* --------------------------- Create Form - Begin -------------------------- */
        // Create form
        const form = ui.createForm({
          title: 'Show New Packages',
        });
        // Create Sublist
        createSublist(form);
        /* --------------------------- Create Form - Begin -------------------------- */
        //
        /* ----------------------- Retrieve Parameters - Begin ---------------------- */
        const customerID = context.request.parameters.custparam_customer_name;
        log.debug(
          loggerTitle,
          ' Customer ID from another suitelet: ' + customerID
        );
        //
        const parameterArray =
          context.request.parameters.custparam_list_item_fulfillments;
        log.debug(loggerTitle + ' Parameters Array', parameterArray);
        /* ------------------------ Retrieve Parameters - End ----------------------- */
        //
        /* ----------------------------- Search - Begin ----------------------------- */
        populateSublist(form, parameterArray);
        /* ------------------------------ Search - End ------------------------------ */
        //
        /* -------------------------- Client Script - Begin ------------------------- */
        form.clientScriptModulePath = './littleWords_CS_printPackageResults.js';
        /* -------------------------- Client Script - End ------------------------- */
        //
        /* --------------------------- Write Form - Begin --------------------------- */
        // Return form to user
        context.response.writePage(form);
        /* --------------------------- Write Form - End --------------------------- */
        //
      }
      /* ---------------------------- GET METHOD - End ---------------------------- */
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
  /* ---------------------------- onRequest - End --------------------------- */
  //
  /* ---------------------------- Helper Functions - Begin --------------------------- */
  //
  /*  *********************** createSublist - Begin  *********************** */
  /**
   *
   * @param {object} form
   */
  const createSublist = (form) => {
    const loggerTitle = ' Create Sublist ';
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      //
      /* ----------------------------- Sublist - Begin ---------------------------- */
      // Add sublist to display search results
      const sublist = form.addSublist({
        id: 'custpage_package_list',
        label: 'Package List',
        type: ui.SublistType.LIST,
      });
      sublist.addField({
        id: 'custpage_package_internalid',
        label: 'Package InternalId',
        type: ui.FieldType.INTEGER,
      });
      sublist.addField({
        id: 'custpage_package_name',
        label: 'Package Name',
        type: ui.FieldType.TEXT,
      });
      sublist.addField({
        id: 'custpage_package_carton_index',
        label: 'Package Carton Index',
        type: ui.FieldType.INTEGER,
      });
      sublist.addField({
        id: 'custpage_package_weight',
        label: 'Package Weight',
        type: ui.FieldType.INTEGER,
      });
      sublist.addField({
        id: 'custpage_package_total_qty',
        label: 'Package Total Qty',
        type: ui.FieldType.INTEGER,
      });
      sublist.addField({
        id: 'custpage_package_item_fulfillment',
        label: 'Package Item Fulfillment',
        type: ui.FieldType.TEXT,
      });
      sublist.addField({
        id: 'custpage_package_length',
        label: 'Package Length',
        type: ui.FieldType.INTEGER,
      });
      sublist.addField({
        id: 'custpage_package_width',
        label: 'Package Width',
        type: ui.FieldType.INTEGER,
      });
      sublist.addField({
        id: 'custpage_package_height',
        label: 'Package Height',
        type: ui.FieldType.INTEGER,
      });
      /* ----------------------------- Sublist - End ---------------------------- */
      //
      log.debug(loggerTitle, 'Sublist created successfully');
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Exit--------------<|'
    );
  };
  /*  *********************** createSublist - End  *********************** */
  //
  /*  *********************** populateSublist - Begin  *********************** */
  /**
   * @param {object} form
   * @param {object} itemFulfillmentArray
   */
  const populateSublist = (form, itemFulfillmentArray) => {
    const loggerTitle = ' Populate Sublist ';
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Entry--------------<|'
    );
    //
    try {
      const sublist = form.getSublist('custpage_package_list');
      log.debug(loggerTitle, itemFulfillmentArray);
      //
      const inputArray = [
        ['isinactive', 'is', 'F'],
        'AND',
        ['custrecord_sps_pack_asn.custbody_lw_new_package_created', 'is', 'T'],
        'AND',
        ['custrecord_sps_pack_asn.internalid', 'anyof', itemFulfillmentArray],
      ];
      log.debug(loggerTitle + 'Array Filters Before', inputArray);
      const valuesString = inputArray[inputArray.length - 1][2];
      const individualValues = valuesString.split(',');
      // Remove the original array entry
      inputArray.splice(inputArray.length - 1, 1);
      // Append the individual values
      inputArray.push([
        'custrecord_sps_pack_asn.internalid',
        'anyof',
        ...individualValues,
      ]);
      log.debug(loggerTitle + 'Array Filters After', inputArray);
      //
      const packageRecordSearch = search.create({
        type: 'customrecord_sps_package',
        filters: inputArray,
        columns: [
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({
            name: 'name',
            sort: search.Sort.ASC,
            label: 'ID',
          }),
          search.createColumn({
            name: 'custrecord_sps_package_width',
            label: 'Width',
          }),
          search.createColumn({
            name: 'custrecord_sps_package_length',
            label: 'Length',
          }),
          search.createColumn({
            name: 'custrecord_sps_pk_weight',
            label: 'Total Weight',
          }),
          search.createColumn({
            name: 'custrecord_sps_pack_asn',
            label: 'Item Fulfillment',
          }),
          search.createColumn({
            name: 'custrecord_sps_package_qty',
            label: 'Total Qty',
          }),
          search.createColumn({
            name: 'custrecord_sps_package_carton_index',
            label: 'Carton Index',
          }),
          search.createColumn({
            name: 'custrecord_sps_package_height',
            label: 'Height',
          }),
        ],
      });
      // Package Search
      const searchResultCount = packageRecordSearch.runPaged().count;
      log.debug(loggerTitle, 'Search Result Count:' + searchResultCount);
      let index = 0;
      let previousInternalId;
      //
      packageRecordSearch.run().each(function (result) {
        const internalId = result.getValue('internalid');

        if (previousInternalId !== internalId) {
          log.debug(loggerTitle, 'Previous Internal ID Changed');
          //
          // InternalID
          if (internalId) {
            sublist.setSublistValue({
              id: 'custpage_package_internalid',
              line: index,
              value: internalId,
            });
          }
          //

          // ID
          const id = result.getValue('name');
          if (id) {
            sublist.setSublistValue({
              id: 'custpage_package_name',
              line: index,
              value: id,
            });
          }
          //

          // Carton Index
          const cartonIndex = result.getValue(
            'custrecord_sps_package_carton_index'
          );
          if (cartonIndex) {
            sublist.setSublistValue({
              id: 'custpage_package_carton_index',
              line: index,
              value: cartonIndex,
            });
          }
          //

          // Package Total Weight
          const packageTotalWeight = result.getValue(
            'custrecord_sps_pk_weight'
          );
          if (packageTotalWeight) {
            sublist.setSublistValue({
              id: 'custpage_package_total_qty',
              line: index,
              value: packageTotalWeight,
            });
          }
          //

          // Package Length
          const packageLength = result.getValue(
            'custrecord_sps_package_length'
          );
          if (packageLength) {
            sublist.setSublistValue({
              id: 'custpage_package_length',
              line: index,
              value: packageLength,
            });
          }

          //

          // Package Width
          const packageWidth = result.getValue('custrecord_sps_package_width');
          if (packageWidth) {
            sublist.setSublistValue({
              id: 'custpage_package_width',
              line: index,
              value: packageWidth,
            });
          }
          //

          // Package Height
          const packageHeight = result.getValue(
            'custrecord_sps_package_height'
          );
          if (packageHeight) {
            sublist.setSublistValue({
              id: 'custpage_package_height',
              line: index,
              value: packageHeight,
            });
          }
          //

          // Package Total Quantity
          const packageQuantity = result.getValue('custrecord_sps_package_qty');
          if (packageQuantity) {
            sublist.setSublistValue({
              id: 'custpage_package_total_qty',
              line: index,
              value: packageQuantity,
            });
          }

          // Item Fulfillment
          const itemFulfillment = result.getValue('custrecord_sps_pack_asn');
          if (itemFulfillment) {
            sublist.setSublistValue({
              id: 'custpage_package_item_fulfillment',
              line: index,
              value: itemFulfillment,
            });
          }

          //
          previousInternalId = internalId;
          index++;
        }

        return true;
      });
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>--------------' + loggerTitle + ' - Exit--------------<|'
    );
  };
  /*  *********************** populateSublist - End  *********************** */
  //
  /* ---------------------------- Helper Functions - End --------------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.onRequest = onRequest;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
