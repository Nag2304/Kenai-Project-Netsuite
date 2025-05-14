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
 *
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
  const department = '2'; // Plastic Oddites
  const today = new Date(); // Get today's date
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

    // Convert date to MM/DD/YYYY format
    const formattedDate = format.format({
      value: dateParam,
      type: format.Type.DATE,
    });
    log.debug(loggerTitle, 'Date Param: ' + formattedDate);

    let itemFulfillmentSearch = search.load({ id: '2026' });

    if (dateCriteria == 'ONORAFTER') {
      // Apply date filter dynamically
      itemFulfillmentSearch.filters.push(
        search.createFilter({
          name: 'trandate',
          operator: search.Operator.ONORAFTER,
          values: formattedDate,
        })
      );
    } else if (dateCriteria == 'ON') {
      // Apply date filter dynamically
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
      // Read & parse the data
      const searchResult = JSON.parse(mapContext.value);
      log.debug(loggerTitle + ' After Parsing Results', searchResult);
      //
      /* ---------------------- Form Key Value Pairs - Begin ---------------------- */
      const tranDate = searchResult.values['trandate'];
      const key = tranDate;
      const values = {};
      values.id = searchResult.id;
      values.boxType =
        searchResult.values[
          'custrecord_spkg_pack_material.CUSTRECORD_SPKG_ITEM_FULFILLMENT'
        ].text;
      // Write Key & Values
      mapContext.write({
        key: key,
        value: values,
      });
      log.debug(loggerTitle + ' Key & Value Pairs', [key, values]);
      //
      /* ---------------------- Form Key Value Pairs - End ---------------------- */
      //
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
      const boxTypeCounts = {};
      const itemFulfillmentIds = new Set();

      values.forEach((entry) => {
        const boxType = entry.boxType;
        boxTypeCounts[boxType] = (boxTypeCounts[boxType] || 0) + 1;
        itemFulfillmentIds.add(entry.id);
      });

      const invAdjId = createInventoryAdjustment(
        reduceContext.key,
        boxTypeCounts
      );
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
   * @param {String} item
   * @param {Number} quantity
   * @returns
   */
  const createInventoryAdjustment = (date, boxTypeCounts) => {
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

      for (const boxType in boxTypeCounts) {
        const quantity = boxTypeCounts[boxType];
        const itemId = retrieveItemId(boxType);
        if (!itemId) {
          log.error('Missing Item ID for', boxType);
          continue;
        }

        invAdjstRecord.selectNewLine({ sublistId: 'inventory' });
        invAdjstRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'item',
          value: itemId,
        });
        invAdjstRecord.setCurrentSublistValue({
          sublistId: 'inventory',
          fieldId: 'location',
          value: '1',
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
        subrecord.selectNewLine({ sublistId: 'inventoryassignment' });
        subrecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'issueinventorynumber',
          value: 2805,
        });
        subrecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'inventorystatus',
          value: 1,
        });
        subrecord.setCurrentSublistValue({
          sublistId: 'inventoryassignment',
          fieldId: 'quantity',
          value: -quantity,
        });
        subrecord.commitLine({
          sublistId: 'inventoryassignment',
        });

        subrecord.removeLine({
          sublistId: 'inventoryassignment',
          line: 1,
        });

        invAdjstRecord.commitLine({ sublistId: 'inventory' });
      }

      // Save the record
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
        'Searching for Posting Period',
        `Start: ${startDate}, End: ${endDate}`
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
   *
   * @param {String} itemText
   * @returns {Number} itemId
   */
  const retrieveItemId = (itemText) => {
    const loggerTitle = 'Retrieve Item ID';
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Entry-------------------<|'
    );
    //
    let itemId = 0;
    try {
      const itemSearchObj = search.create({
        type: 'item',
        filters: [['name', 'is', itemText]],
        columns: [
          search.createColumn({ name: 'itemid', label: 'Name' }),
          search.createColumn({ name: 'internalid', label: 'Internal ID' }),
        ],
      });
      const searchResultCount = itemSearchObj.runPaged().count;
      log.debug(loggerTitle, searchResultCount);
      //
      itemSearchObj.run().each((result) => {
        itemId = result.getValue({ name: 'internalid', label: 'Internal ID' });
        return true;
      });
      log.debug(loggerTitle, 'Item ID: ' + itemId);
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    //
    log.debug(
      loggerTitle,
      '|>-------------------' + loggerTitle + ' -Exit-------------------<|'
    );
    return itemId;
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
