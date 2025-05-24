/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

/**
 * File name: div_MR_createInvAdjstment.js
 * Script: DIV | MR Create Inventory Adjustment
 * Author           Date       Version               Remarks
 * nagendrababu 03.21.2025       1.00      Initial creation of the script
 */

/* -------------------------- Script Usage - Begin -------------------------- */

/* -------------------------- Script Usage - End -------------------------- */

/* global define,log*/

define(['N/search', 'N/record', 'N/runtime', 'N/format'], (
  search,
  record,
  runtime,
  format
) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const department = '2'; // Plastic Oddities
  const today = new Date(); // Get today's date
  const defaultInventoryStatus = '1'; // Replace with a valid inventory status ID from your NetSuite account
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Get Input Data - Begin ------------------------- */
  const getInputData = () => {
    const loggerTitle = 'Get Input Data';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    const scriptObj = runtime.getCurrentScript();
    const today = new Date();
    const dateCriteria = scriptObj
      .getParameter({
        name: 'custscript_div_date_criteria',
      })
      .toUpperCase();
    const dateParam =
      scriptObj.getParameter({ name: 'custscript_div_adj_date_param' }) ||
      today;
    const formattedDate = format.format({
      value: dateParam,
      type: format.Type.DATE,
    });
    log.debug(loggerTitle, 'Date Param: ' + formattedDate);

    let itemFulfillmentSearch = search.load({
      id: 'customsearch_div_mr_create_inv_adjst',
    });
    if (dateCriteria === 'ONORAFTER') {
      itemFulfillmentSearch.filters.push(
        search.createFilter({
          name: 'trandate',
          operator: search.Operator.ONORAFTER,
          values: formattedDate,
        })
      );
    } else if (dateCriteria === 'ON') {
      itemFulfillmentSearch.filters.push(
        search.createFilter({
          name: 'trandate',
          operator: search.Operator.ON,
          values: formattedDate,
        })
      );
    }

    log.debug(loggerTitle + ' If Search ', itemFulfillmentSearch);
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return itemFulfillmentSearch;
  };
  /* ------------------------- Get Input Data - End ------------------------- */
  //
  /* ---------------------------- Map Phase - Begin --------------------------- */
  /**
   *
   * @param {object} mapContext
   */
  const map = (mapContext) => {
    const loggerTitle = 'Map Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const searchResult = JSON.parse(mapContext.value);
      log.debug(loggerTitle + ' After Parsing Results', searchResult);
      const values = {
        id: searchResult.id,
        boxType:
          searchResult.values[
            'custrecord_spkg_pack_material.CUSTRECORD_SPKG_ITEM_FULFILLMENT'
          ].text,
      };
      mapContext.write({ key: 'ALL_BOXES', value: values });
      log.debug(loggerTitle + ' Key & Value Pairs', ['ALL_BOXES', values]);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ----------------------------- Map Phase - End ---------------------------- */
  //
  /* -------------------------- Reduce Phase - Begin -------------------------- */
  /**
   *
   * @param {object} reduceContext
   */
  const reduce = (reduceContext) => {
    const loggerTitle = 'Reduce Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const values = reduceContext.values.map(JSON.parse);
      log.debug(loggerTitle + ' Values', values);
      const boxTypeCounts = {};
      const itemFulfillmentIds = new Set();

      values.forEach((entry) => {
        const boxType = entry.boxType;
        boxTypeCounts[boxType] = (boxTypeCounts[boxType] || 0) + 1;
        itemFulfillmentIds.add(entry.id);
      });
      log.debug(loggerTitle + ' Box type counts', boxTypeCounts);

      const invAdjId = createInventoryAdjustment(boxTypeCounts);
      log.debug(loggerTitle, 'Inventory Adjustment ID: ' + invAdjId);

      if (invAdjId > 0) {
        itemFulfillmentIds.forEach((id) => {
          updateItemFulfillment(id);
        });
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* --------------------------- Reduce Phase - End --------------------------- */
  //
  /* ------------------------- Summarize Phase - Begin ------------------------ */
  /**
   *
   * @param {object} summarizeContext
   */
  const summarize = (summarizeContext) => {
    const loggerTitle = 'Summarize Phase';
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      log.audit(
        loggerTitle + ' Usage',
        'Summary Usage: ' + summarizeContext.usage
      );
      log.audit(
        loggerTitle + ' Concurrency',
        'Summary Concurrency: ' + summarizeContext.concurrency
      );
      log.audit(
        loggerTitle + ' Yields',
        'Summary Yields: ' + summarizeContext.yields
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ------------------------- Summarize Phase - End ------------------------ */
  //
  /* ----------------------- Helper Functions - Begin ----------------------- */
  //
  /* *********************** createInventoryAdjustment - Begin *********************** */
  /**
   *
   * @param {Object} boxTypeCounts
   * @returns
   */
  const createInventoryAdjustment = (boxTypeCounts) => {
    const loggerTitle = 'Create Inventory Adjustment';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let invAdjstRecordId = 0;
    try {
      const invAdjstRecord = record.create({
        type: record.Type.INVENTORY_ADJUSTMENT,
        isDynamic: true,
      });

      invAdjstRecord.setValue({ fieldId: 'subsidiary', value: '2' });
      invAdjstRecord.setValue({ fieldId: 'department', value: department });
      invAdjstRecord.setValue({ fieldId: 'account', value: '289' });
      invAdjstRecord.setValue({
        fieldId: 'externalid',
        value: generateExternalId(),
      });
      log.debug(
        loggerTitle,
        `Box Type Counts: ${JSON.stringify(boxTypeCounts)}`
      );

      for (const boxType in boxTypeCounts) {
        const quantity = boxTypeCounts[boxType];
        const itemDetails = retrieveItemId(boxType);
        if (!itemDetails.itemId) {
          log.error(loggerTitle, 'Missing Item ID for: ' + boxType);
          continue;
        }
        log.debug(loggerTitle, {
          quantity,
          itemId: itemDetails.itemId,
          inventorylocation: itemDetails.inventorylocation,
        });

        invAdjstRecord.selectNewLine({ sublistId: 'inventory' });
        invAdjstRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'item',
          value: itemDetails.itemId,
        });
        invAdjstRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'location',
          value: itemDetails.inventorylocation,
        });
        invAdjstRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'adjustqtyby',
          value: -quantity,
        });
        const subrecord = invAdjstRecord.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail',
        });

        try {
          subrecord.selectNewLine({ sublistId: 'inventoryassignment' });
          subrecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: -quantity,
          });
          subrecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'issueinventorynumber',
            value: '2025',
          });
          subrecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'inventorystatus',
            value: defaultInventoryStatus, // Use a valid inventory status ID
          });
          subrecord.commitLine({ sublistId: 'inventoryassignment' });
          log.debug(loggerTitle, ' Inventory Detail Record Set');
        } catch (error) {
          log.error(
            loggerTitle + ' caught with an exception for box type ' + boxType,
            error
          );
        }
        try {
          subrecord.removeLine({
            sublistId: 'inventoryassignment',
            line: 1,
          });
          log.debug(
            loggerTitle,
            ' Inventory Detail Record Removed Successfully'
          );
        } catch (error) {
          log.error(
            loggerTitle +
              ' caught with an exception for box type ' +
              boxType +
              ' When removing the line',
            error
          );
        }

        invAdjstRecord.commitLine({ sublistId: 'inventory' });
      }

      invAdjstRecordId = invAdjstRecord.save();
      log.debug(
        loggerTitle,
        'Inventory Adjustment Created with ID: ' + invAdjstRecordId
      );
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return invAdjstRecordId;
  };
  const generateExternalId = () => {
    const now = new Date();
    return (
      'INV_ADJ_' +
      now.getFullYear() +
      ('0' + (now.getMonth() + 1)).slice(-2) +
      ('0' + now.getDate()).slice(-2) +
      '_' +
      ('0' + now.getHours()).slice(-2) +
      ('0' + now.getMinutes()).slice(-2) +
      ('0' + now.getSeconds()).slice(-2)
    );
  };
  /* *********************** createInventoryAdjustment - End *********************** */
  //
  /* *********************** getPostingPeriodId - Begin *********************** */
  const getPostingPeriodId = () => {
    const loggerTitle = 'Get Posting PeriodId';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month

      log.debug(
        loggerTitle,
        `Searching for Posting Period, Start: ${startDate}, End: ${endDate}`
      );

      const searchResult = search
        .create({
          type: 'accountingperiod',
          filters: [
            ['startdate', 'on', formatDate(startDate)],
            'AND',
            ['enddate', 'on', formatDate(endDate)],
          ],
          columns: ['internalid'],
        })
        .run()
        .getRange({ start: 0, end: 1 });
      //
      log.debug(
        loggerTitle,
        '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
      );
      return searchResult.length > 0
        ? searchResult[0].getValue('internalid')
        : null;
    } catch (error) {
      log.error('Error retrieving Posting Period', error);
      return null;
    }
  };
  const formatDate = (date) => {
    const mm = date.getMonth() + 1; // Months are zero-based
    const dd = date.getDate();
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  /* *********************** getPostingPeriodId - End *********************** */
  //
  /* *********************** retrieveItemId - Begin *********************** */
  /**
   * Retrieves the item ID and the first inventory location where locationquantityonhand > 0, sorted by location ID.
   *
   * @param {String} itemText
   * @returns {Object} { itemId: Number, inventorylocation: String }
   */
  const retrieveItemId = (itemText) => {
    const loggerTitle = 'Retrieve Item ID';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let result = { itemId: 0, inventorylocation: null };
    try {
      const itemSearchObj = search.create({
        type: 'item',
        filters: [
          ['name', 'is', itemText],
          'AND',
          ['locationquantityonhand', 'greaterthan', 0],
        ],
        columns: [
          search.createColumn({ name: 'itemid', label: 'Name' }),
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
          search.createColumn({
            name: 'inventorylocation',
            label: 'Inventory Location',
            sort: search.Sort.ASC, // Sort by location internal ID in ascending order
          }),
          search.createColumn({
            name: 'locationquantityonhand',
            label: 'Location On Hand',
          }),
        ],
      });
      const searchResultCount = itemSearchObj.runPaged().count;
      log.debug(loggerTitle, `Search Result Count: ${searchResultCount}`);

      // Fetch only the first result
      const searchResults = itemSearchObj.run().getRange({ start: 0, end: 1 });
      if (searchResults.length > 0) {
        const resultRow = searchResults[0];
        const quantityOnHand = parseFloat(
          resultRow.getValue({
            name: 'locationquantityonhand',
            label: 'Location On Hand',
          })
        );
        if (quantityOnHand > 0) {
          result.itemId = resultRow.getValue({
            name: 'internalid',
            label: 'Internal ID',
          });
          result.inventorylocation = resultRow.getValue({
            name: 'inventorylocation',
            label: 'Inventory Location',
          });
          log.debug(
            loggerTitle,
            `First Item ID: ${result.itemId}, Inventory Location: ${result.inventorylocation}, Quantity: ${quantityOnHand}`
          );
        } else {
          log.debug(
            loggerTitle,
            `First result has no positive stock: ${quantityOnHand}`
          );
        }
      } else {
        log.debug(loggerTitle, 'No results found with positive stock');
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return result;
  };
  /* *********************** retrieveItemId - End *********************** */
  //
  /* *********************** updateItemFulfillment - Begin *********************** */
  /**
   *
   * @param {Number} ifId
   */
  const updateItemFulfillment = (ifId) => {
    const loggerTitle = 'Update Item Fulfillment';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    try {
      if (ifId > 0) {
        record.submitFields({
          type: 'itemfulfillment',
          id: ifId,
          values: {
            custbody_dct_box_adj: true,
          },
          options: {
            ignoreMandatoryFields: true,
          },
        });
        log.debug(
          loggerTitle,
          ' Item Fulfillment updated successfully: ' + ifId
        );
      }
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* *********************** updateItemFulfillment - End *********************** */
  //
  /* ----------------------- Helper Functions - End ----------------------- */
  //
  /* ----------------------------- Exports - Begin ---------------------------- */
  exports.getInputData = getInputData;
  exports.map = map;
  exports.reduce = reduce;
  exports.summarize = summarize;
  return exports;
  /* ------------------------------ Exports - End ----------------------------- */
});
