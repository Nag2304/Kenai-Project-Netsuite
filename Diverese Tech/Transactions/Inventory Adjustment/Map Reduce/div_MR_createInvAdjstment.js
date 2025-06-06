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
 * nagendrababu 06.03.2025       1.01      Fixed various scenarios.
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
  const PLASTIC_ODDITIES = '2'; // Plastic Oddities
  const today = new Date(); // Get today's date
  const DEFAULT_INVENTORY_STATUS = '1'; // Replace with a valid inventory status ID from your NetSuite account
  const LINE_NUMBER = 1;
  const TARGET_LOCATION = '3'; // New constant for the NC01 location
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
      invAdjstRecord.setValue({
        fieldId: 'department',
        value: PLASTIC_ODDITIES,
      });
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
          fieldId: 'department',
          value: PLASTIC_ODDITIES,
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
            value: DEFAULT_INVENTORY_STATUS, // Use a valid inventory status ID
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
            line: LINE_NUMBER,
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
  /* *********************** createInventoryAdjustment - End *********************** */
  //
  /* *********************** generateExternalId - Begin *********************** */
  /**
   *
   * @returns {String}
   */
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
  /* *********************** generateExternalId - End *********************** */
  //
  /* *********************** retrieveItemId - Begin *********************** */
  /**
   * Retrieves the item ID and the first inventory location where locationquantityonhand > 0, sorted by location ID.
   * Prioritizes location '3' (NC01) if available; otherwise, gets the next available location.
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

      // Fetch up to 1000 results to iterate through locations
      const searchResults = itemSearchObj
        .run()
        .getRange({ start: 0, end: 1000 });
      if (searchResults.length > 0) {
        // First pass: Look for location '3' (NC01)
        for (let i = 0; i < searchResults.length; i++) {
          const resultRow = searchResults[i];
          const location = resultRow.getValue({
            name: 'inventorylocation',
            label: 'Inventory Location',
          });
          const quantityOnHand = parseFloat(
            resultRow.getValue({
              name: 'locationquantityonhand',
              label: 'Location On Hand',
            })
          );

          if (location === TARGET_LOCATION) {
            result.itemId = resultRow.getValue({
              name: 'internalid',
              label: 'Internal ID',
            });
            result.inventorylocation = location;
            log.debug(
              loggerTitle,
              `Found Priority Location '3' (NC01) for Item: ${itemText}, Item ID: ${result.itemId}, Quantity: ${quantityOnHand}`
            );
            break;
          }
        }

        // Second pass: If location '3' wasn't found, select the first available location
        if (!result.inventorylocation) {
          const resultRow = searchResults[0]; // First result since all have positive stock
          result.itemId = resultRow.getValue({
            name: 'internalid',
            label: 'Internal ID',
          });
          result.inventorylocation = resultRow.getValue({
            name: 'inventorylocation',
            label: 'Inventory Location',
          });
          const quantityOnHand = parseFloat(
            resultRow.getValue({
              name: 'locationquantityonhand',
              label: 'Location On Hand',
            })
          );
          log.debug(
            loggerTitle,
            `Location '3' (NC01) not available; Selected Next Location: ${result.inventorylocation} for Item: ${itemText}, Item ID: ${result.itemId}, Quantity: ${quantityOnHand}`
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
