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
 * nagendrababu       10.03.2025       1.02      Updated retrieveItemId to include boxCount parameter
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
    try {
      const searchResult = JSON.parse(mapContext.value);
      log.debug(loggerTitle + ' After Parsing Results', searchResult);

      // Box type
      const boxType =
        searchResult.values[
          'custrecord_spkg_pack_material.CUSTRECORD_SPKG_ITEM_FULFILLMENT'
        ].text;

      // Package content data JSON string
      const packageContentRaw =
        searchResult.values[
          'custrecord_spkg_package_content.CUSTRECORD_SPKG_ITEM_FULFILLMENT'
        ];
      let boxQty = 0;

      if (packageContentRaw) {
        try {
          const parsed = JSON.parse(packageContentRaw);
          if (Array.isArray(parsed)) {
            boxQty = parsed.length; // ✅ number of boxes = array length
          }
        } catch (e) {
          log.error(loggerTitle + ' JSON parse error (packageContent)', {
            raw: packageContentRaw,
            e,
          });
        }
      }

      const values = {
        fulfillmentId: searchResult.id,
        boxType: boxType,
        boxQty: boxQty,
      };

      mapContext.write({ key: 'ALL_BOXES', value: values });
      log.debug(loggerTitle + ' Key & Value Pairs', ['ALL_BOXES', values]);
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
    log.audit(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
  };
  /* ----------------------------- Map Phase - End ---------------------------- */

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
    try {
      // Parse values from map phase safely
      const rows = reduceContext.values
        .map((v) => {
          try {
            return JSON.parse(v);
          } catch (e) {
            log.error(`${loggerTitle} JSON parse error`, { v, e });
            return null;
          }
        })
        .filter(Boolean);

      const boxTypeCounts = {};
      const itemFulfillmentIds = new Set();

      rows.forEach((entry) => {
        const fulfillmentId = entry && entry.fulfillmentId;
        const rawBoxType = entry && entry.boxType;
        const boxQty = entry && entry.boxQty;

        if (!fulfillmentId || !rawBoxType) {
          log.debug(`${loggerTitle} Skipping row without id/boxType`, entry);
          return;
        }

        const boxType = String(rawBoxType).trim();

        // ✅ accumulate actual box quantity
        boxTypeCounts[boxType] = (boxTypeCounts[boxType] || 0) + (boxQty || 0);

        // Track IF ids for update
        itemFulfillmentIds.add(fulfillmentId);
      });

      log.audit(`${loggerTitle} Box type counts (summed)`, boxTypeCounts);
      log.audit(
        `${loggerTitle} Item Fulfillment IDs`,
        Array.from(itemFulfillmentIds)
      );

      // ✅ Step 1: Create Inventory Adjustment
      const invAdjId = createInventoryAdjustment(boxTypeCounts);
      log.audit(loggerTitle, `Inventory Adjustment created: ${invAdjId}`);

      // ✅ Step 2: Update Item Fulfillments only if invAdjId is valid
      if (invAdjId && invAdjId > 0) {
        updateItemFulfillment(Array.from(itemFulfillmentIds), invAdjId);
        log.audit(
          loggerTitle,
          `Updated ${itemFulfillmentIds.size} Item Fulfillments with Inventory Adjustment ${invAdjId}`
        );
      } else {
        log.error(
          loggerTitle,
          'Inventory Adjustment creation failed. Skipping Item Fulfillment update.'
        );
      }
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }
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
      //Default Value as per Constants above
      invAdjstRecord.setValue({
        fieldId: 'department',
        value: PLASTIC_ODDITIES,
      });
      invAdjstRecord.setValue({ fieldId: 'account', value: '581' });
      invAdjstRecord.setValue({
        fieldId: 'externalid',
        value: generateExternalId(),
      });
      log.debug(
        loggerTitle,
        `Box Type Counts: ${JSON.stringify(boxTypeCounts)}`
      );

      for (const boxType in boxTypeCounts) {
        const boxCount = boxTypeCounts[boxType]; // ✅ rename for clarity
        const itemDetails = retrieveItemId(boxType, boxCount);
        if (!itemDetails.itemId) {
          log.error(loggerTitle, 'Missing Item ID for: ' + boxType);
          continue;
        }
        log.debug(loggerTitle, {
          boxCount,
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
          value: -boxCount,
        });
        log.emergency(
          loggerTitle,
          `For The Item ID ${itemDetails.itemId} the Quantity is set as ${boxCount}`
        );
        const subrecord = invAdjstRecord.getCurrentSublistSubrecord({
          sublistId: 'inventory',
          fieldId: 'inventorydetail',
        });

        try {
          subrecord.selectNewLine({ sublistId: 'inventoryassignment' });
          subrecord.setCurrentSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'quantity',
            value: -boxCount,
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
      log.audit(
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
   * Retrieves the item ID and the first inventory location where locationquantityonhand > 0 and boxCount <= quantityOnHand, sorted by location ID.
   * Prioritizes location '3' (NC01) if available; otherwise, gets the next available location.
   *
   * @param {String} itemText
   * @param {Number} boxCount
   * @returns {Object} { itemId: Number, inventorylocation: String }
   */
  const retrieveItemId = (itemText, boxCount) => {
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
            sort: search.Sort.ASC,
          }),
          search.createColumn({
            name: 'locationquantityonhand',
            label: 'Location On Hand',
          }),
        ],
      });
      const searchResultCount = itemSearchObj.runPaged().count;
      log.debug(loggerTitle, `Search Result Count: ${searchResultCount}`);

      const searchResults = itemSearchObj
        .run()
        .getRange({ start: 0, end: 1000 });
      if (searchResults.length > 0) {
        // First pass: NC-01 (TARGET_LOCATION) with qty > 1 and boxCount <= quantityOnHand
        for (let i = 0; i < searchResults.length; i++) {
          const resultRow = searchResults[i];
          const location = resultRow.getValue({ name: 'inventorylocation' });
          const quantityOnHand =
            parseFloat(
              resultRow.getValue({ name: 'locationquantityonhand' })
            ) || 0;

          if (
            location === TARGET_LOCATION &&
            quantityOnHand > 1 &&
            boxCount <= quantityOnHand
          ) {
            result.itemId = resultRow.getValue({ name: 'internalid' });
            result.inventorylocation = location;
            log.debug(
              loggerTitle,
              `Using NC-01 (Loc ${location}) Qty: ${quantityOnHand}, BoxCount: ${boxCount}`
            );
            break;
          }
        }

        // Second pass: Manufacturing Plant ('1') with qty > 1 and boxCount <= quantityOnHand
        if (!result.inventorylocation) {
          for (let i = 0; i < searchResults.length; i++) {
            const resultRow = searchResults[i];
            const location = resultRow.getValue({ name: 'inventorylocation' });
            const quantityOnHand =
              parseFloat(
                resultRow.getValue({ name: 'locationquantityonhand' })
              ) || 0;

            if (
              location === '1' &&
              quantityOnHand > 1 &&
              boxCount <= quantityOnHand
            ) {
              result.itemId = resultRow.getValue({ name: 'internalid' });
              result.inventorylocation = location;
              log.debug(
                loggerTitle,
                `Using Manufacturing Plant (Loc ${location}) Qty: ${quantityOnHand}, BoxCount: ${boxCount}`
              );
              break;
            }
          }
        }

        // Third pass: Fallback to first available with qty > 0 and boxCount <= quantityOnHand
        if (!result.inventorylocation) {
          for (let i = 0; i < searchResults.length; i++) {
            const resultRow = searchResults[i];
            const location = resultRow.getValue({ name: 'inventorylocation' });
            const quantityOnHand =
              parseFloat(
                resultRow.getValue({ name: 'locationquantityonhand' })
              ) || 0;

            if (quantityOnHand > 0 && boxCount <= quantityOnHand) {
              result.itemId = resultRow.getValue({ name: 'internalid' });
              result.inventorylocation = location;
              log.debug(
                loggerTitle,
                `Fallback location ${location} Qty: ${quantityOnHand}, BoxCount: ${boxCount}`
              );
              break;
            }
          }
        }

        if (!result.inventorylocation) {
          log.debug(
            loggerTitle,
            `No location found with sufficient stock for BoxCount: ${boxCount}`
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
   * Bulk-update Item Fulfillments after a successful Inventory Adjustment.
   *
   * @param {Array.<number|string>} ifIds     Array of Item Fulfillment internal IDs.
   * @param {number|string}         invAdjId  Internal ID of the created Inventory Adjustment.
   * @returns {number} Number of IF records successfully updated.
   */
  const updateItemFulfillment = (ifIds, invAdjId) => {
    const loggerTitle = 'Update Item Fulfillment (Bulk)';
    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' - Entry -------------------<|'
    );

    let updatedCount = 0;

    try {
      // Basic guards
      if (!Array.isArray(ifIds) || ifIds.length === 0) {
        log.debug(
          loggerTitle,
          'No Item Fulfillment IDs provided. Nothing to update.'
        );
        return 0;
      }
      if (!invAdjId || parseInt(invAdjId, 10) <= 0) {
        log.error(
          loggerTitle,
          'Invalid Inventory Adjustment ID; skipping IF updates.'
        );
        return 0;
      }

      // De-duplicate and normalize IDs
      const uniqueIds = Array.from(
        new Set(ifIds.map((v) => String(v).trim()).filter(Boolean))
      );
      log.debug(
        loggerTitle,
        `About to update ${uniqueIds.length} Item Fulfillments. InvAdjId=${invAdjId}`
      );

      // Update each IF; isolate errors per record
      uniqueIds.forEach((id) => {
        try {
          record.submitFields({
            type: 'itemfulfillment',
            id: id,
            values: {
              custbody_dct_box_adj: true,
            },
            options: { ignoreMandatoryFields: true },
          });
          updatedCount += 1;
          log.debug(
            loggerTitle,
            `Updated Item Fulfillment ${id} (Inventory Adjustment ${invAdjId}).`
          );
        } catch (e) {
          log.error(loggerTitle + ' - Update failed for IF ' + id, e);
        }
      });

      log.audit(
        loggerTitle,
        `Completed. Updated=${updatedCount}, Failed=${
          uniqueIds.length - updatedCount
        }, InvAdjId=${invAdjId}`
      );
    } catch (error) {
      log.error(loggerTitle + ' caught an exception', error);
    }

    log.audit(
      loggerTitle,
      '|>------------------- ' + loggerTitle + ' - Exit -------------------<|'
    );
    return updatedCount;
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
